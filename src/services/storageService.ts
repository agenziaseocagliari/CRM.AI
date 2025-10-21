/**
 * Storage Service for Insurance Document Management
 * Handles file uploads, downloads, and deletions with Supabase Storage
 * 
 * Features:
 * - Multi-bucket support (policy, claim, contact, general)
 * - File validation (type, size)
 * - Automatic metadata tracking
 * - Organization-based folder structure
 * - Full-text search support
 * 
 * @module storageService
 * @created October 21, 2025
 */

import { supabase } from '@/lib/supabaseClient';

// Storage bucket configuration
const BUCKETS = {
  POLICY: 'insurance-policy-documents',
  CLAIM: 'insurance-claim-documents',
  CONTACT: 'insurance-contact-documents',
  GENERAL: 'insurance-general-attachments'
} as const;

// File type mappings
const ACCEPTED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadOptions {
  organizationId: string;
  category: 'policy' | 'claim' | 'contact' | 'general';
  entityType?: string;
  entityId?: string;
  documentType?: string;
  description?: string;
  tags?: string[];
}

export interface UploadResult {
  success: boolean;
  documentId?: string;
  publicUrl?: string;
  error?: string;
  fileName?: string;
}

export interface DocumentMetadata {
  id: string;
  filename: string;
  original_filename: string;
  file_type: string;
  mime_type: string;
  file_size: number;
  storage_bucket: string;
  storage_path: string;
  public_url: string | null;
  document_category: string;
  document_type: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  description: string | null;
  tags: string[];
  uploaded_by: string;
  uploaded_at: string;
  updated_at: string;
  is_archived: boolean;
}

export const storageService = {
  /**
   * Upload a file to Supabase Storage
   * @param file - File object to upload
   * @param options - Upload configuration
   * @returns Upload result with document ID and public URL
   */
  async uploadDocument(
    file: File,
    options: UploadOptions
  ): Promise<UploadResult> {
    try {
      console.log('📤 [UPLOAD] Starting upload:', file.name);

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return {
          success: false,
          error: `File troppo grande. Massimo ${MAX_FILE_SIZE / 1024 / 1024}MB consentiti.`
        };
      }

      // Validate file type
      const allAcceptedTypes = [
        ...ACCEPTED_FILE_TYPES.images,
        ...ACCEPTED_FILE_TYPES.documents
      ];
      if (!allAcceptedTypes.includes(file.type)) {
        return {
          success: false,
          error: 'Tipo di file non supportato. Usare immagini (JPG, PNG) o documenti (PDF, Word, Excel).'
        };
      }

      // Determine bucket
      const bucketKey = options.category.toUpperCase() as keyof typeof BUCKETS;
      const bucket = BUCKETS[bucketKey];

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = file.name
        .replace(/[^a-z0-9.-]/gi, '_')
        .toLowerCase();
      const filename = `${timestamp}_${sanitizedName}`;
      const storagePath = `${options.organizationId}/${filename}`;

      console.log('📁 [UPLOAD] Bucket:', bucket);
      console.log('📁 [UPLOAD] Path:', storagePath);

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('❌ [UPLOAD ERROR]', uploadError);
        throw new Error(`Upload fallito: ${uploadError.message}`);
      }

      console.log('✅ [UPLOAD] File caricato:', uploadData.path);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(storagePath);

      console.log('🔗 [UPLOAD] Public URL:', urlData.publicUrl);

      // Get current user for uploaded_by field
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error('❌ [AUTH ERROR] Cannot get current user:', userError);
        throw new Error('Utente non autenticato');
      }

      console.log('👤 [UPLOAD] Current user ID:', user.id);
      console.log('🏢 [UPLOAD] Organization ID:', options.organizationId);

      // Save metadata to database
      const { data: docData, error: dbError } = await supabase
        .from('insurance_documents')
        .insert({
          organization_id: options.organizationId,
          filename: filename,
          original_filename: file.name,
          file_type: this.getFileType(file.type),
          mime_type: file.type,
          file_size: file.size,
          storage_bucket: bucket,
          storage_path: storagePath,
          public_url: urlData.publicUrl,
          document_category: options.category,
          document_type: options.documentType,
          related_entity_type: options.entityType,
          related_entity_id: options.entityId,
          description: options.description,
          tags: options.tags || [],
          uploaded_by: user.id  // ← FIX: Add uploaded_by field
        })
        .select()
        .single();

      if (dbError) {
        console.error('❌ [DATABASE ERROR]', dbError);
        // Try to cleanup uploaded file
        await supabase.storage.from(bucket).remove([storagePath]);
        throw new Error(`Errore database: ${dbError.message}`);
      }

      console.log('✅ [UPLOAD] Metadata salvata, ID:', docData.id);

      return {
        success: true,
        documentId: docData.id,
        publicUrl: urlData.publicUrl,
        fileName: filename
      };

    } catch (error: any) {
      console.error('❌ [UPLOAD] Upload failed:', error);
      return {
        success: false,
        error: error.message || 'Errore sconosciuto durante upload'
      };
    }
  },

  /**
   * Get file type category from MIME type
   */
  getFileType(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
    return 'other';
  },

  /**
   * Get file icon based on type
   */
  getFileIcon(fileType: string): string {
    switch (fileType) {
      case 'image': return '📷';
      case 'pdf': return '📄';
      case 'document': return '📝';
      case 'spreadsheet': return '📊';
      default: return '📎';
    }
  },

  /**
   * Delete a document (storage + database)
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      console.log('🗑️ [DELETE] Deleting document:', documentId);

      // Get document metadata
      const { data: doc, error: fetchError } = await supabase
        .from('insurance_documents')
        .select('storage_bucket, storage_path')
        .eq('id', documentId)
        .single();

      if (fetchError || !doc) {
        console.error('❌ [DELETE] Document not found');
        return false;
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(doc.storage_bucket)
        .remove([doc.storage_path]);

      if (storageError) {
        console.error('❌ [DELETE] Storage error:', storageError);
        // Continue anyway to delete from database
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('insurance_documents')
        .delete()
        .eq('id', documentId);

      if (dbError) {
        console.error('❌ [DELETE] Database error:', dbError);
        return false;
      }

      console.log('✅ [DELETE] Document deleted successfully');
      return true;

    } catch (error) {
      console.error('❌ [DELETE] Delete failed:', error);
      return false;
    }
  },

  /**
   * Archive a document (soft delete)
   */
  async archiveDocument(documentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('insurance_documents')
        .update({ is_archived: true })
        .eq('id', documentId);

      return !error;
    } catch (error) {
      console.error('Archive error:', error);
      return false;
    }
  },

  /**
   * Get documents for an entity
   */
  async getDocuments(options: {
    organizationId: string;
    category?: string;
    entityType?: string;
    entityId?: string;
    limit?: number;
  }): Promise<DocumentMetadata[]> {
    try {
      let query = supabase
        .from('insurance_documents')
        .select('*')
        .eq('organization_id', options.organizationId)
        .eq('is_archived', false)
        .order('uploaded_at', { ascending: false });

      if (options.category) {
        query = query.eq('document_category', options.category);
      }

      if (options.entityType) {
        query = query.eq('related_entity_type', options.entityType);
      }

      if (options.entityId) {
        query = query.eq('related_entity_id', options.entityId);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ [GET DOCUMENTS] Error:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('❌ [GET DOCUMENTS] Failed:', error);
      return [];
    }
  },

  /**
   * Search documents by text
   */
  async searchDocuments(
    organizationId: string,
    searchTerm: string
  ): Promise<DocumentMetadata[]> {
    try {
      const { data, error } = await supabase
        .from('insurance_documents')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_archived', false)
        .textSearch('search_vector', searchTerm, {
          type: 'websearch',
          config: 'italian'
        })
        .order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Search error:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  },

  /**
   * Update document metadata
   */
  async updateDocument(
    documentId: string,
    updates: {
      description?: string;
      tags?: string[];
      document_type?: string;
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('insurance_documents')
        .update(updates)
        .eq('id', documentId);

      return !error;
    } catch (error) {
      console.error('Update error:', error);
      return false;
    }
  },

  /**
   * Get storage statistics for organization
   */
  async getStorageStats(organizationId: string) {
    try {
      const { data, error } = await supabase
        .from('insurance_documents')
        .select('document_category, file_size')
        .eq('organization_id', organizationId)
        .eq('is_archived', false);

      if (error || !data) return null;

      const stats = {
        totalDocuments: data.length,
        totalSize: data.reduce((sum, doc) => sum + doc.file_size, 0),
        byCategory: {} as Record<string, { count: number; size: number }>
      };

      data.forEach(doc => {
        if (!stats.byCategory[doc.document_category]) {
          stats.byCategory[doc.document_category] = { count: 0, size: 0 };
        }
        stats.byCategory[doc.document_category].count++;
        stats.byCategory[doc.document_category].size += doc.file_size;
      });

      return stats;

    } catch (error) {
      console.error('Stats error:', error);
      return null;
    }
  },

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  },

  /**
   * Validate file before upload
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File troppo grande (max ${this.formatFileSize(MAX_FILE_SIZE)})`
      };
    }

    // Check type
    const allAcceptedTypes = [
      ...ACCEPTED_FILE_TYPES.images,
      ...ACCEPTED_FILE_TYPES.documents
    ];
    if (!allAcceptedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Tipo file non supportato'
      };
    }

    return { valid: true };
  }
};
