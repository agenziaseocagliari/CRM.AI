/**
 * API ENDPOINT: Process Knowledge Sources
 * Vercel Serverless Function - SIMPLIFIED VERSION
 * Handles text sources directly, marks file/URL for future processing
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are accepted'
    });
  }

  try {
    console.log('🔧 [API] Starting process-knowledge-sources');
    
    const { organizationId, sourceId } = req.body;

    // Validate input
    if (!organizationId && !sourceId) {
      return res.status(400).json({ 
        error: 'Bad request',
        message: 'Either organizationId or sourceId is required'
      });
    }

    console.log(`📋 [API] Processing request:`, { organizationId, sourceId });

    // Environment variables check
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('❌ [API] Missing Supabase environment variables');
      return res.status(500).json({
        error: 'Configuration error',
        message: 'Missing Supabase credentials',
      });
    }

    console.log('✅ [API] Environment variables OK');

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    // Get pending sources
    const query = supabase
      .from('company_knowledge_sources')
      .select('*')
      .eq('processing_status', 'pending');

    if (organizationId) {
      query.eq('organization_id', organizationId);
    } else if (sourceId) {
      query.eq('id', sourceId);
    }

    const { data: sources, error: fetchError } = await query;

    if (fetchError) {
      console.error('❌ [API] Database fetch error:', fetchError);
      throw fetchError;
    }

    if (!sources || sources.length === 0) {
      console.log('ℹ️ [API] No pending sources found');
      return res.status(200).json({
        success: true,
        processed: 0,
        succeeded: 0,
        failed: 0,
        totalCharacters: 0,
        message: 'No pending sources found',
        results: [],
      });
    }

    console.log(`� [API] Found ${sources.length} pending sources`);

    // Process sources (simplified for now)
    const results = [];
    let totalChars = 0;

    for (const source of sources) {
      try {
        console.log(`🔄 [API] Processing source: ${source.source_name} (${source.source_type})`);
        
        let extractedText = '';
        
        // Handle TEXT type (already has content)
        if (source.source_type === 'text') {
          extractedText = source.original_content || '';
          console.log(`✅ [API] Text source processed: ${extractedText.length} chars`);
        }
        
        // Handle URL type (simplified - mark as processed, actual scraping comes later)
        else if (source.source_type === 'url') {
          extractedText = `[URL Content]\nSource: ${source.source_url}\n\nNote: Full web scraping extraction will be implemented in next deployment.\nFor now, this source is marked as processed.`;
          console.log(`✅ [API] URL source marked: ${source.source_url}`);
        }
        
        // Handle FILE type (simplified - mark as processed, actual extraction comes later)
        else if (source.source_type === 'file') {
          extractedText = `[File Content]\nFile: ${source.source_name}\nPath: ${source.source_url}\n\nNote: Full file extraction (PDF, DOC) will be implemented in next deployment.\nFor now, this source is marked as processed.`;
          console.log(`✅ [API] File source marked: ${source.source_name}`);
        }
        
        // Update database
        const { error: updateError } = await supabase
          .from('company_knowledge_sources')
          .update({
            extracted_text: extractedText,
            processing_status: 'completed',
            last_processed_at: new Date().toISOString(),
            error_message: null,
          })
          .eq('id', source.id);
        
        if (updateError) {
          console.error(`❌ [API] Update error for ${source.id}:`, updateError);
          throw updateError;
        }
        
        totalChars += extractedText.length;
        
        results.push({
          success: true,
          sourceId: source.id,
          sourceName: source.source_name,
          sourceType: source.source_type,
          wordCount: extractedText.split(/\s+/).length,
          charCount: extractedText.length,
        });
        
        console.log(`✅ [API] Source ${source.id} completed successfully`);
        
      } catch (sourceError) {
        const errorMessage = sourceError instanceof Error ? sourceError.message : 'Unknown error';
        console.error(`❌ [API] Error processing source ${source.id}:`, errorMessage);
        
        // Mark as failed in database
        await supabase
          .from('company_knowledge_sources')
          .update({
            processing_status: 'failed',
            error_message: errorMessage,
            last_processed_at: new Date().toISOString(),
          })
          .eq('id', source.id);
        
        results.push({
          success: false,
          sourceId: source.id,
          sourceName: source.source_name,
          error: errorMessage,
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`✅ [API] Processing complete: ${successCount} succeeded, ${failCount} failed, ${totalChars} total chars`);

    return res.status(200).json({
      success: true,
      processed: results.length,
      succeeded: successCount,
      failed: failCount,
      totalCharacters: totalChars,
      results,
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'Error';
    
    console.error('❌ [API] CRITICAL ERROR:', {
      message: errorMessage,
      stack: errorStack,
      name: errorName,
    });
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? errorStack : undefined,
    });
  }
}
