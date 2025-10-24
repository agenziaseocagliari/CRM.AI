/**
 * API ENDPOINT: Process Knowledge Sources
 * Vercel Serverless Function
 * Triggers text extraction for pending sources
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
  'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
};

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
    const { organizationId, sourceId } = req.body;

    // Validate input
    if (!organizationId && !sourceId) {
      return res.status(400).json({ 
        error: 'Bad request',
        message: 'Either organizationId or sourceId is required'
      });
    }

    console.log(`📋 Processing request:`, { organizationId, sourceId });

    // Dynamic import to avoid Edge runtime issues
    const { processPendingSources, reprocessSource } = await import('../../src/lib/ai/processingWorker');

    let results;

    if (sourceId) {
      // Process single source
      console.log(`🔄 Processing single source: ${sourceId}`);
      const result = await reprocessSource(sourceId);
      results = [result];
    } else {
      // Process all pending sources for organization
      console.log(`🔄 Processing all pending sources for org: ${organizationId}`);
      results = await processPendingSources(organizationId);
    }

    // Calculate statistics
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    const totalChars = results
      .filter(r => r.success && r.extractedText)
      .reduce((sum, r) => sum + (r.extractedText?.length || 0), 0);

    console.log(`✅ Processing complete: ${successCount} succeeded, ${failCount} failed`);

    return res.status(200).json({
      success: true,
      processed: results.length,
      succeeded: successCount,
      failed: failCount,
      totalCharacters: totalChars,
      results: results.map(r => ({
        sourceId: r.sourceId,
        sourceName: r.sourceName,
        success: r.success,
        error: r.error,
        wordCount: r.metadata?.wordCount,
        fileType: r.metadata?.fileType,
        processingTime: r.metadata?.processingTime,
      })),
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ API error:', errorMessage);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: errorMessage,
    });
  }
}
