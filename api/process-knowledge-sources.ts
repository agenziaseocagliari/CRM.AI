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
  console.log('🔍 [API] ========== START REQUEST ==========');
  console.log('🔍 [API] Method:', req.method);
  console.log('🔍 [API] Body:', JSON.stringify(req.body, null, 2));
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log('🔍 [API] OPTIONS request - returning 200');
    return res.status(200).json({ success: true });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    console.log('❌ [API] Invalid method:', req.method);
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST requests are accepted'
    });
  }

  try {
    const { organizationId, sourceId } = req.body;
    console.log('🔍 [API] Extracted from body:', { organizationId, sourceId });    console.log('🔍 [API] Extracted from body:', { organizationId, sourceId });

    // Validate input
    if (!organizationId && !sourceId) {
      console.error('❌ [API] Missing both organizationId and sourceId');
      return res.status(400).json({
        error: 'Bad request',
        message: 'Either organizationId or sourceId is required'
      });
    }

    console.log(`✅ [API] Validation passed - organizationId: ${organizationId || 'N/A'}`);

    // Environment variables check
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('🔍 [API] Environment check:', {
      hasUrl: !!SUPABASE_URL,
      hasKey: !!SUPABASE_KEY
    });

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('❌ [API] Missing Supabase environment variables');
      return res.status(500).json({
        error: 'Configuration error',
        message: 'Missing Supabase credentials',
      });
    }

    console.log('✅ [API] Environment variables OK - creating Supabase client...');

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ [API] Supabase client created');

    // Get pending sources
    console.log('🔍 [API] Building query for pending sources...');
    const query = supabase
      .from('company_knowledge_sources')
      .select('*')
      .eq('processing_status', 'pending');

    if (organizationId) {
      console.log('🔍 [API] Adding organizationId filter:', organizationId);
      query.eq('organization_id', organizationId);
    } else if (sourceId) {
      console.log('🔍 [API] Adding sourceId filter:', sourceId);
      query.eq('id', sourceId);
    }

    console.log('🔍 [API] Executing query...');
    const { data: sources, error: fetchError } = await query;

    console.log('🔍 [API] Query result:', {
      sourcesFound: sources?.length || 0,
      hasError: !!fetchError
    });

    if (sources && sources.length > 0) {
      console.log('🔍 [API] Sources:', sources.map(s => ({
        id: s.id,
        name: s.source_name,
        type: s.source_type
      })));
    }

    if (fetchError) {
      console.error('❌ [API] Database fetch error:', fetchError);
      throw fetchError;
    }

    if (!sources || sources.length === 0) {
      console.log('⚠️ [API] No pending sources found - returning early');
      console.log('⚠️ [API] Debug info:', {
        queriedOrganizationId: organizationId,
        queriedSourceId: sourceId
      });
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

    console.log(`🎯 [API] Found ${sources.length} pending sources - starting processing`);

    // Process sources (simplified for now)
    const results = [];
    let totalChars = 0;

    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      console.log(`\n🔄 [API] Processing ${i + 1}/${sources.length}: ${source.source_name} (${source.source_type})`);
      
      try {
        let extractedText = '';

        // Handle TEXT type (already has content)
        if (source.source_type === 'text') {
          console.log('📝 [API] Type: TEXT');
          extractedText = source.original_content || '';
          console.log(`✅ [API] Text processed: ${extractedText.length} chars`);
        }

        // Handle URL type (simplified - mark as processed, actual scraping comes later)
        else if (source.source_type === 'url') {
          console.log('🌐 [API] Type: URL -', source.source_url);
          extractedText = `[URL Content]\nSource: ${source.source_url}\n\nNote: Full web scraping extraction will be implemented in next deployment.\nFor now, this source is marked as processed.`;
          console.log(`✅ [API] URL marked: ${extractedText.length} chars`);
        }

        // Handle FILE type (simplified - mark as processed, actual extraction comes later)
        else if (source.source_type === 'file') {
          console.log('📄 [API] Type: FILE -', source.source_name);
          extractedText = `[File Content]\nFile: ${source.source_name}\nPath: ${source.source_url}\n\nNote: Full file extraction (PDF, DOC) will be implemented in next deployment.\nFor now, this source is marked as processed.`;
          console.log(`✅ [API] File marked: ${extractedText.length} chars`);
        }

        console.log(`💾 [API] Updating database for ${source.id}...`);
        
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
          console.error(`❌ [API] Update error:`, JSON.stringify(updateError));
          throw updateError;
        }

        console.log(`✅ [API] Database updated for ${source.id}`);

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

    console.log('\n🎉 [API] ========== COMPLETE ==========');
    console.log(`🎉 [API] Processed: ${results.length}`);
    console.log(`🎉 [API] Succeeded: ${successCount}`);
    console.log(`🎉 [API] Failed: ${failCount}`);
    console.log(`🎉 [API] Total chars: ${totalChars}`);

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
