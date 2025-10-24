/**
 * TEXT EXTRACTION SERVICE
 * Extracts text from various file formats and URLs
 * Supports: PDF, DOC/DOCX, TXT, URLs (web scraping)
 */

import mammoth from 'mammoth';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ExtractionResult {
  success: boolean;
  text?: string;
  error?: string;
  metadata?: {
    pages?: number;
    wordCount?: number;
    fileType?: string;
    url?: string;
    title?: string;
  };
}

/**
 * Extract text from PDF buffer
 */
export async function extractFromPDF(buffer: Buffer): Promise<ExtractionResult> {
  try {
    console.log('📄 Extracting text from PDF...');
    
    // pdf-parse module import (CommonJS/ESM compatibility)
    const pdfParseImport = await import('pdf-parse');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfParse = (pdfParseImport as any).default || pdfParseImport;
    
    const data = await pdfParse(buffer);

    const text = data.text.trim();
    console.log(`✅ PDF extracted: ${data.numpages} pages, ${text.length} characters`);

    return {
      success: true,
      text,
      metadata: {
        pages: data.numpages,
        wordCount: text.split(/\s+/).length,
        fileType: 'pdf',
      },
    };
  } catch (error: any) {
    console.error('❌ PDF extraction error:', error);
    return {
      success: false,
      error: error.message || 'Failed to extract PDF',
    };
  }
}

/**
 * Extract text from DOC/DOCX buffer
 */
export async function extractFromDOCX(buffer: Buffer): Promise<ExtractionResult> {
  try {
    console.log('📝 Extracting text from DOCX...');
    const result = await mammoth.extractRawText({ buffer });

    const text = result.value.trim();
    console.log(`✅ DOCX extracted: ${text.length} characters`);

    return {
      success: true,
      text,
      metadata: {
        wordCount: text.split(/\s+/).length,
        fileType: 'docx',
      },
    };
  } catch (error: any) {
    console.error('❌ DOCX extraction error:', error);
    return {
      success: false,
      error: error.message || 'Failed to extract DOCX',
    };
  }
}

/**
 * Extract text from plain text buffer
 */
export async function extractFromText(buffer: Buffer): Promise<ExtractionResult> {
  try {
    console.log('📝 Extracting plain text...');
    const text = buffer.toString('utf-8').trim();

    console.log(`✅ Text extracted: ${text.length} characters`);

    return {
      success: true,
      text,
      metadata: {
        wordCount: text.split(/\s+/).length,
        fileType: 'text',
      },
    };
  } catch (error: any) {
    console.error('❌ Text extraction error:', error);
    return {
      success: false,
      error: error.message || 'Failed to extract text',
    };
  }
}

/**
 * Scrape and extract text from URL
 */
export async function extractFromURL(url: string): Promise<ExtractionResult> {
  try {
    console.log(`🌐 Scraping URL: ${url}`);

    // Fetch HTML content
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CompanyKnowledgeBot/1.0)',
      },
      timeout: 15000, // 15 seconds
      maxRedirects: 5,
      validateStatus: (status) => status >= 200 && status < 400,
    });

    const html = response.data;

    // Parse with Cheerio
    const $ = cheerio.load(html);

    // Remove non-content elements
    $('script, style, nav, footer, iframe, noscript, header, aside, .navigation, .menu, .sidebar, .advertisement, .ad').remove();

    // Extract title
    const title = $('title').text().trim();

    // Extract meta description
    const description = $('meta[name="description"]').attr('content') || 
                        $('meta[property="og:description"]').attr('content') || '';

    // Try to find main content
    let content = '';

    // Try common main content selectors (in order of preference)
    const mainSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.main-content',
      '.content',
      '#content',
      '.post-content',
      '.entry-content',
      '.article-content',
    ];

    for (const selector of mainSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        const text = element.text().trim();
        if (text.length > 100) {
          content = text;
          console.log(`✅ Found content with selector: ${selector}`);
          break;
        }
      }
    }

    // Fallback: entire body
    if (!content) {
      console.log('⚠️ Using fallback: entire body content');
      content = $('body').text();
    }

    // Clean text
    const cleanedText = content
      .replace(/\s+/g, ' ') // Multiple spaces to single
      .replace(/\n+/g, '\n') // Multiple newlines to single
      .trim();

    // Combine metadata and content
    const parts: string[] = [];
    
    if (title) {
      parts.push(`# ${title}`);
      parts.push('');
    }
    
    if (description) {
      parts.push(`**Description:** ${description}`);
      parts.push('');
    }
    
    parts.push(cleanedText);

    const fullText = parts.join('\n');

    console.log(`✅ URL scraped: ${fullText.length} characters`);

    return {
      success: true,
      text: fullText,
      metadata: {
        wordCount: fullText.split(/\s+/).length,
        fileType: 'url',
        url,
        title,
      },
    };
  } catch (error: any) {
    console.error('❌ URL extraction error:', error);
    return {
      success: false,
      error: error.message || 'Failed to scrape URL',
    };
  }
}

/**
 * Main extraction dispatcher based on source type
 */
export async function extractText(
  sourceType: 'file' | 'url' | 'text',
  input: Buffer | string,
  fileExtension?: string
): Promise<ExtractionResult> {
  console.log(`🔍 Extracting text from ${sourceType}...`);

  // Handle URL
  if (sourceType === 'url') {
    return extractFromURL(input as string);
  }

  // Handle plain text (manual input)
  if (sourceType === 'text') {
    return {
      success: true,
      text: input as string,
      metadata: {
        wordCount: (input as string).split(/\s+/).length,
        fileType: 'text',
      },
    };
  }

  // Handle files
  const buffer = input as Buffer;

  // Detect file type from extension if provided
  if (fileExtension) {
    const ext = fileExtension.toLowerCase();
    
    if (ext === '.pdf') {
      return extractFromPDF(buffer);
    }
    
    if (ext === '.doc' || ext === '.docx') {
      return extractFromDOCX(buffer);
    }
    
    if (ext === '.txt') {
      return extractFromText(buffer);
    }
  }

  // Detect file type from magic numbers (first bytes)
  const header = buffer.slice(0, 4).toString('hex');

  // PDF: starts with %PDF (25504446)
  if (header.startsWith('25504446')) {
    return extractFromPDF(buffer);
  }

  // DOCX/DOC: ZIP archive (504B0304) - DOCX is a ZIP container
  if (header.startsWith('504b0304')) {
    return extractFromDOCX(buffer);
  }

  // DOC (older format): D0CF11E0 (Microsoft Compound File)
  if (header.startsWith('d0cf11e0')) {
    // Try DOCX parser (mammoth can handle some DOC files)
    try {
      const result = await extractFromDOCX(buffer);
      if (result.success) return result;
    } catch {
      console.log('⚠️ DOCX parser failed on DOC file, trying plain text...');
    }
  }

  // Fallback: treat as plain text
  console.log('⚠️ Unknown file format, treating as plain text');
  return extractFromText(buffer);
}
