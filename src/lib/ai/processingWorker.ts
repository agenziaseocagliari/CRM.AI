/**
 * PROCESSING WORKER SERVICE
 * Processes pending knowledge sources
 * Extracts text and updates database
 */

import { supabase } from '@/lib/supabaseClient';
import { extractText, ExtractionResult } from './textExtraction';

export interface ProcessingJob {
  sourceId: string;
  sourceType: 'file' | 'url' | 'text';
  sourceUrl?: string;
  sourceName?: string;
  originalContent?: string;
  organizationId: string;
}

export interface ProcessingResult {
  success: boolean;
  sourceId: string;
  sourceName?: string;
  extractedText?: string;
  error?: string;
  metadata?: {
    wordCount?: number;
    fileType?: string;
    processingTime?: number;
  };
}

/**
 * Process a single knowledge source
 */
export async function processKnowledgeSource(
  job: ProcessingJob
): Promise<ProcessingResult> {
  const startTime = Date.now();
  console.log(`🔄 Processing source: ${job.sourceName || job.sourceId} (${job.sourceType})`);

  try {
    // Update status to processing
    await supabase
      .from('company_knowledge_sources')
      .update({
        processing_status: 'processing',
        last_processed_at: new Date().toISOString(),
      })
      .eq('id', job.sourceId);

    let extractionResult: ExtractionResult;

    // Handle based on source type
    if (job.sourceType === 'text') {
      // Text is already available (manual input)
      console.log('📝 Processing manual text input...');
      extractionResult = await extractText('text', job.originalContent || '');
      
    } else if (job.sourceType === 'url') {
      // Scrape URL
      console.log(`🌐 Processing URL: ${job.sourceUrl}`);
      extractionResult = await extractText('url', job.sourceUrl || '');
      
    } else if (job.sourceType === 'file') {
      // Download file from Supabase Storage
      console.log(`📁 Downloading file from storage: ${job.sourceUrl}`);
      
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('company-knowledge')
        .download(job.sourceUrl || '');

      if (downloadError) {
        throw new Error(`Storage download failed: ${downloadError.message}`);
      }

      if (!fileData) {
        throw new Error('File data is null');
      }

      // Convert blob to buffer
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Extract file extension from source_url (e.g., "org-id/filename.pdf")
      const fileExtension = job.sourceUrl?.split('.').pop()?.toLowerCase();
      const extension = fileExtension ? `.${fileExtension}` : undefined;

      console.log(`📄 Extracting text from file (${extension || 'unknown format'})...`);
      
      // Extract text
      extractionResult = await extractText('file', buffer, extension);
      
    } else {
      throw new Error(`Unknown source type: ${job.sourceType}`);
    }

    // Check extraction success
    if (!extractionResult.success) {
      throw new Error(extractionResult.error || 'Text extraction failed');
    }

    if (!extractionResult.text || extractionResult.text.length === 0) {
      throw new Error('Extracted text is empty');
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ Text extracted: ${extractionResult.text.length} chars in ${processingTime}ms`);

    // Update database with extracted text
    const { error: updateError } = await supabase
      .from('company_knowledge_sources')
      .update({
        extracted_text: extractionResult.text,
        processing_status: 'completed',
        last_processed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq('id', job.sourceId);

    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    console.log(`✅ Completed processing: ${job.sourceName || job.sourceId}`);

    return {
      success: true,
      sourceId: job.sourceId,
      sourceName: job.sourceName,
      extractedText: extractionResult.text,
      metadata: {
        wordCount: extractionResult.metadata?.wordCount,
        fileType: extractionResult.metadata?.fileType,
        processingTime,
      },
    };
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`❌ Failed processing ${job.sourceName || job.sourceId}:`, errorMessage);

    // Update status to failed
    await supabase
      .from('company_knowledge_sources')
      .update({
        processing_status: 'failed',
        error_message: errorMessage,
        last_processed_at: new Date().toISOString(),
      })
      .eq('id', job.sourceId);

    return {
      success: false,
      sourceId: job.sourceId,
      sourceName: job.sourceName,
      error: errorMessage,
      metadata: {
        processingTime,
      },
    };
  }
}

/**
 * Process all pending sources for an organization
 */
export async function processPendingSources(
  organizationId: string
): Promise<ProcessingResult[]> {
  console.log(`📋 Finding pending sources for organization: ${organizationId}`);

  try {
    // Get all pending sources
    const { data: sources, error } = await supabase
      .from('company_knowledge_sources')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('processing_status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching pending sources:', error);
      throw error;
    }

    if (!sources || sources.length === 0) {
      console.log('ℹ️ No pending sources found');
      return [];
    }

    console.log(`🔄 Processing ${sources.length} pending sources...`);

    // Process each source sequentially (avoid parallel issues)
    const results: ProcessingResult[] = [];

    for (const source of sources) {
      const job: ProcessingJob = {
        sourceId: source.id,
        sourceType: source.source_type,
        sourceUrl: source.source_url,
        sourceName: source.source_name,
        originalContent: source.original_content,
        organizationId: source.organization_id,
      };

      const result = await processKnowledgeSource(job);
      results.push(result);

      // Small delay between sources to avoid rate limits
      if (sources.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    console.log(`✅ Processing complete: ${successCount} succeeded, ${failCount} failed`);

    return results;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ processPendingSources error:', errorMessage);
    throw error;
  }
}

/**
 * Reprocess a single source (for retry/refresh)
 */
export async function reprocessSource(sourceId: string): Promise<ProcessingResult> {
  console.log(`🔄 Reprocessing source: ${sourceId}`);

  try {
    // Get source details
    const { data: source, error } = await supabase
      .from('company_knowledge_sources')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (error || !source) {
      throw new Error('Source not found');
    }

    const job: ProcessingJob = {
      sourceId: source.id,
      sourceType: source.source_type,
      sourceUrl: source.source_url,
      sourceName: source.source_name,
      originalContent: source.original_content,
      organizationId: source.organization_id,
    };

    return await processKnowledgeSource(job);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ reprocessSource error:', errorMessage);
    
    return {
      success: false,
      sourceId,
      error: errorMessage,
    };
  }
}
