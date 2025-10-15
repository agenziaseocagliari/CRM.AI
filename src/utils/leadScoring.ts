/**
 * Enhanced Lead Scoring Service
 * Integrates DataPizza AI agents with existing CRM scoring system
 */

import { invokeSupabaseFunction } from '../lib/api';
import dataPizzaClient, { type ContactData } from '../services/datapizzaClient';
import type { Contact } from '../types';

export interface LeadScoringResponse {
    score: number;
    category: 'hot' | 'warm' | 'cold';
    reasoning: string;
    confidence?: number;
    breakdown?: {
        email_quality: number;
        company_fit: number;
        engagement: number;
        qualification: number;
    };
    agent_used: string;
    processing_time_ms: number;
    timestamp: string;
}

export interface ScoringOptions {
    useDataPizza?: boolean;
    fallbackToEdgeFunction?: boolean;
    organizationId?: string;
    prompt?: string;
}

/**
 * Calculate lead score using DataPizza AI agent with fallback system
 */
export async function calculateLeadScore(
    contactData: Contact | ContactData,
    options: ScoringOptions = {}
): Promise<LeadScoringResponse> {
    const {
        useDataPizza = true,
        fallbackToEdgeFunction = true,
        organizationId,
        prompt
    } = options;

    // Normalize contact data for DataPizza
    const normalizedContact: ContactData = {
        name: contactData.name || '',
        email: contactData.email || '',
        company: contactData.company || undefined,
        phone: contactData.phone || undefined,
        organization_id: organizationId || (contactData as Contact).organization_id || undefined
    };

    console.log(`🎯 Lead scoring for: ${normalizedContact.name}`);

    // Try DataPizza first if enabled
    if (useDataPizza) {
        try {
            console.log('🤖 Attempting DataPizza AI scoring...');

            const dataPizzaResult = await dataPizzaClient.scoreLead(normalizedContact);

            console.log('✅ DataPizza scoring successful:', dataPizzaResult);

            // Convert DataPizza format to our expected format
            return {
                score: dataPizzaResult.score,
                category: dataPizzaResult.category,
                reasoning: dataPizzaResult.reasoning,
                confidence: dataPizzaResult.confidence,
                breakdown: dataPizzaResult.breakdown,
                agent_used: `datapizza_${dataPizzaResult.agent_used}`,
                processing_time_ms: dataPizzaResult.processing_time_ms,
                timestamp: dataPizzaResult.timestamp
            };

        } catch (error) {
            console.warn('⚠️ DataPizza scoring failed:', error);

            // Don't throw error, continue to fallback
            if (!fallbackToEdgeFunction) {
                throw new Error(`DataPizza scoring failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }

    // Fallback to existing Supabase Edge Function
    if (fallbackToEdgeFunction) {
        try {
            console.log('🔄 Using fallback Edge Function scoring...');

            const edgeFunctionResult = await invokeSupabaseFunction('score-contact-lead', {
                contact: normalizedContact,
                organization_id: organizationId,
                scoring_criteria: prompt || 'Score this lead based on quality and conversion potential'
            }) as { score?: number; category?: string; reasoning?: string };

            console.log('✅ Edge Function scoring successful');

            // Convert Edge Function format to our expected format
            return {
                score: edgeFunctionResult?.score || 50,
                category: mapCategoryFromEdgeFunction(edgeFunctionResult?.category || 'Medium'),
                reasoning: edgeFunctionResult?.reasoning || 'Lead scored using existing AI system',
                confidence: 0.8, // Default confidence for edge function
                agent_used: 'supabase_edge_function',
                processing_time_ms: 0, // Edge function doesn't provide timing
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Edge Function scoring also failed:', error);

            // Final fallback to basic algorithm
            return calculateBasicScore(normalizedContact);
        }
    }

    // If no fallback enabled, return basic score
    return calculateBasicScore(normalizedContact);
}

/**
 * Update contact with new AI score in database
 */
export async function updateContactScore(
    contactId: string,
    scoringResult: LeadScoringResponse,
    organizationId?: string
): Promise<boolean> {
    try {
        console.log(`💾 Updating contact ${contactId} with score: ${scoringResult.score}`);

        // Import Supabase client dynamically
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY
        );

        const updateData: Partial<Contact> = {
            lead_score: scoringResult.score,
            lead_score_reasoning: scoringResult.reasoning,
            // Add DataPizza-specific metadata if available
            ...(scoringResult.breakdown && {
                // Store breakdown as JSON in existing fields or add new fields
            })
        };

        let query = supabase
            .from('contacts')
            .update(updateData)
            .eq('id', contactId);

        // Add organization scoping if provided
        if (organizationId) {
            query = query.eq('organization_id', organizationId);
        }

        const { error } = await query;

        if (error) {
            console.error('❌ Database update failed:', error);
            return false;
        }

        console.log('✅ Contact score updated successfully');
        return true;

    } catch (error) {
        console.error('❌ Failed to update contact score:', error);
        return false;
    }
}

/**
 * Batch score multiple contacts
 */
export async function batchScoreContacts(
    contacts: Contact[],
    options: ScoringOptions = {},
    onProgress?: (current: number, total: number) => void
): Promise<LeadScoringResponse[]> {
    const results: LeadScoringResponse[] = [];

    console.log(`📊 Batch scoring ${contacts.length} contacts...`);

    for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i];

        try {
            onProgress?.(i + 1, contacts.length);

            const result = await calculateLeadScore(contact, options);
            results.push(result);

            // Update contact in database
            if (contact.id) {
                await updateContactScore(String(contact.id), result, options.organizationId);
            }      // Small delay to prevent rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
            console.error(`❌ Failed to score contact ${contact.name}:`, error);

            // Add fallback result
            results.push(calculateBasicScore(contact));
        }
    }

    console.log('✅ Batch scoring complete');
    return results;
}

/**
 * Map Edge Function category format to DataPizza format
 */
function mapCategoryFromEdgeFunction(edgeCategory: string): 'hot' | 'warm' | 'cold' {
    const category = edgeCategory.toLowerCase();

    if (category.includes('high') || category.includes('hot')) {
        return 'hot';
    } else if (category.includes('medium') || category.includes('warm')) {
        return 'warm';
    } else {
        return 'cold';
    }
}

/**
 * Basic fallback scoring algorithm
 */
function calculateBasicScore(contact: ContactData): LeadScoringResponse {
    let score = 0;
    const breakdown = { email_quality: 0, company_fit: 0, engagement: 0, qualification: 0 };

    // Email scoring
    if (contact.email && contact.email.includes('@')) {
        const domain = contact.email.split('@')[1].toLowerCase();
        if (['gmail.com', 'yahoo.com', 'hotmail.com'].includes(domain)) {
            breakdown.email_quality = 10; // Personal email
        } else {
            breakdown.email_quality = 18; // Business email
        }
    }

    // Company scoring
    if (contact.company && contact.company.trim() !== '') {
        breakdown.company_fit = 20;
    } else {
        breakdown.company_fit = 5;
    }

    // Basic engagement (placeholder)
    breakdown.engagement = 15;
    breakdown.qualification = 10;

    score = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    const category: 'hot' | 'warm' | 'cold' = score >= 70 ? 'hot' : score >= 40 ? 'warm' : 'cold';

    return {
        score,
        category,
        reasoning: 'Basic fallback scoring based on email domain and company information. Limited analysis available.',
        confidence: 0.6,
        breakdown,
        agent_used: 'fallback_basic_algorithm',
        processing_time_ms: 0,
        timestamp: new Date().toISOString()
    };
}

/**
 * Check DataPizza service availability
 */
export async function checkDataPizzaAvailability(): Promise<boolean> {
    try {
        return await dataPizzaClient.isAvailable();
    } catch {
        return false;
    }
}

/**
 * Get scoring service status
 */
export async function getScoringServiceStatus(): Promise<{
    datapizza: boolean;
    edgeFunction: boolean;
    fallback: boolean;
}> {
    const datapizzaAvailable = await checkDataPizzaAvailability();

    return {
        datapizza: datapizzaAvailable,
        edgeFunction: true, // Assume edge function is available
        fallback: true      // Basic algorithm is always available
    };
}