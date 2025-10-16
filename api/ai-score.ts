import type { VercelRequest, VercelResponse } from '@vercel/node';

interface Contact {
    id?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    company?: string;
    job_title?: string;
    source?: string;
    notes?: string;
    last_seen?: string;
    updated_at?: string;
    interactions_count?: number;
    [key: string]: unknown; // For additional dynamic fields
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { contactId, contact } = req.body;

        if (!contactId || !contact) {
            return res.status(400).json({ error: 'Contact ID and contact data are required' });
        }

        // AI Score calculation algorithm
        // This is a sophisticated scoring system that analyzes multiple factors
        let score = 0;
        const factors = [];

        // 1. Email engagement score (0-25 points)
        const emailScore = calculateEmailEngagement(contact);
        score += emailScore;
        factors.push({ name: 'Email Engagement', score: emailScore, maxScore: 25 });

        // 2. Company fit score (0-30 points)
        const companyScore = calculateCompanyFit(contact);
        score += companyScore;
        factors.push({ name: 'Company Fit', score: companyScore, maxScore: 30 });

        // 3. Intent signals score (0-25 points)
        const intentScore = calculateIntentSignals(contact);
        score += intentScore;
        factors.push({ name: 'Intent Signals', score: intentScore, maxScore: 25 });

        // 4. Contact completeness score (0-20 points)
        const completenessScore = calculateDataCompleteness(contact);
        score += completenessScore;
        factors.push({ name: 'Data Completeness', score: completenessScore, maxScore: 20 });

        // Normalize to 0-100 scale
        const finalScore = Math.min(100, Math.round(score));

        const result = {
            score: finalScore,
            grade: getScoreGrade(finalScore),
            factors,
            recommendation: getRecommendation(finalScore),
            timestamp: new Date().toISOString()
        };

        return res.status(200).json(result);

    } catch (error) {
        console.error('Error calculating AI score:', error);
        return res.status(500).json({
            error: 'Failed to calculate AI score',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

function calculateEmailEngagement(contact: Contact): number {
    let score = 0;

    // Has email
    if (contact.email) score += 5;

    // Email domain quality
    if (contact.email) {
        const domain = contact.email.split('@')[1];
        if (domain) {
            // Corporate domains get higher scores
            if (!['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(domain.toLowerCase())) {
                score += 10;
            } else {
                score += 3;
            }
        }
    }

    // Recent activity (simulated based on last_seen or updated_at)
    if (contact.last_seen || contact.updated_at) {
        const dateStr = contact.last_seen || contact.updated_at;
        if (dateStr) {
            const lastActivity = new Date(dateStr);
            const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);

            if (daysSinceActivity <= 7) score += 10;
            else if (daysSinceActivity <= 30) score += 5;
            else if (daysSinceActivity <= 90) score += 2;
        }
    }

    return Math.min(25, score);
}

function calculateCompanyFit(contact: Contact): number {
    let score = 0;

    // Has company information
    if (contact.company) score += 10;

    // Job title indicates decision maker
    if (contact.job_title) {
        const title = contact.job_title.toLowerCase();
        if (title.includes('ceo') || title.includes('founder') || title.includes('owner')) {
            score += 15;
        } else if (title.includes('director') || title.includes('manager') || title.includes('head')) {
            score += 10;
        } else if (title.includes('vp') || title.includes('vice president')) {
            score += 12;
        } else {
            score += 5;
        }
    }

    // Has phone number (easier to reach)
    if (contact.phone) score += 5;

    return Math.min(30, score);
}

function calculateIntentSignals(contact: Contact): number {
    let score = 0;

    // Multiple contact attempts or interactions
    if (contact.interactions_count) {
        score += Math.min(15, contact.interactions_count * 3);
    }

    // Source quality
    if (contact.source) {
        const source = contact.source.toLowerCase();
        if (source.includes('referral') || source.includes('demo')) {
            score += 10;
        } else if (source.includes('website') || source.includes('organic')) {
            score += 7;
        } else if (source.includes('social')) {
            score += 5;
        }
    }

    return Math.min(25, score);
}

function calculateDataCompleteness(contact: Contact): number {
    let score = 0;
    const requiredFields = ['first_name', 'last_name', 'email', 'company', 'job_title', 'phone'];

    for (const field of requiredFields) {
        if (contact[field] && contact[field].toString().trim() !== '') {
            score += 3;
        }
    }

    // Bonus for additional information
    if (contact.notes && contact.notes.length > 10) score += 2;

    return Math.min(20, score);
}

function getScoreGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B+';
    if (score >= 60) return 'B';
    if (score >= 50) return 'C+';
    if (score >= 40) return 'C';
    if (score >= 30) return 'D';
    return 'F';
}

function getRecommendation(score: number): string {
    if (score >= 80) {
        return 'High priority lead - immediate follow-up recommended';
    } else if (score >= 60) {
        return 'Good prospect - schedule follow-up within 24-48 hours';
    } else if (score >= 40) {
        return 'Moderate potential - nurture with targeted content';
    } else {
        return 'Low priority - add to drip campaign for future engagement';
    }
}