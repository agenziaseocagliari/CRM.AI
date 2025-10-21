/**
 * DocumentGallery Component
 * Display and manage uploaded documents with grid/list view
 * 
 * Features:
 * - Grid and list view modes
 * - Image lightbox preview with zoom/pan
 * - PDF viewer (opens in new tab)
 * - Download documents
 * - Delete documents
 * - Search and filter
 * - Sort by date/name/size
 * 
 * @component
 * @created October 21, 2025
 * @updated October 21, 2025 - Added yet-another-react-lightbox integration
 */

import React, { useState, useEffect } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { storageService, DocumentMetadata } from '@/services/storageService';

interface DocumentGalleryProps {
  organizationId: string;
  category?: string;
  entityType?: string;
  entityId?: string;
  viewMode?: 'grid' | 'list';
  onDocumentClick?: (doc: DocumentMetadata) => void;
  onDocumentDelete?: (docId: string) => void;
  showActions?: boolean;
}

export default function DocumentGallery({
  organizationId,
  category,
  entityType,
  entityId,
  viewMode: initialViewMode = 'grid',
  onDocumentClick,
  onDocumentDelete,
  showActions = true
}: DocumentGalleryProps) {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Signed URLs for private bucket images
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    loadDocuments();
  }, [organizationId, category, entityType, entityId]);

  // Load signed URLs for images when documents change
  useEffect(() => {
    async function loadSignedUrls() {
      const urls: Record<string, string> = {};
      
      const imageDocuments = documents.filter(d => d.file_type === 'image');
      
      for (const doc of imageDocuments) {
        try {
          // Import supabase client
          const { supabase } = await import('@/lib/supabaseClient');
          
          // Generate signed URL for private bucket (1 hour expiry)
          const { data, error } = await supabase.storage
            .from(doc.storage_bucket)
            .createSignedUrl(doc.storage_path, 3600);
          
          if (data?.signedUrl && !error) {
            urls[doc.id] = data.signedUrl;
          } else {
            // Fallback to public_url if signed URL fails
            console.warn('[GALLERY] Signed URL failed for', doc.id, error);
            if (doc.public_url) {
              urls[doc.id] = doc.public_url;
            }
          }
        } catch (error) {
          console.error('[GALLERY] Error generating signed URL:', error);
          // Fallback to public_url
          if (doc.public_url) {
            urls[doc.id] = doc.public_url;
          }
        }
      }
      
      setImageUrls(urls);
    }
    
    if (documents.length > 0) {
      loadSignedUrls();
    }
  }, [documents]);

  const loadDocuments = async () => {
    setLoading(true);
    const docs = await storageService.getDocuments({
      organizationId,
      category,
      entityType,
      entityId
    });
    setDocuments(docs);
    setLoading(false);
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm('Sei sicuro di voler eliminare questo documento?')) {
      return;
    }

    const success = await storageService.deleteDocument(docId);
    if (success) {
      setDocuments(prev => prev.filter(d => d.id !== docId));
      if (onDocumentDelete) {
        onDocumentDelete(docId);
      }
    } else {
      alert('Errore durante eliminazione documento');
    }
  };

  const handleDownload = (doc: DocumentMetadata) => {
    if (doc.public_url) {
      window.open(doc.public_url, '_blank');
    }
  };

  const handleImageClick = (docId: string) => {
    console.log('🔍 [LIGHTBOX] Click detected, docId:', docId);
    const imageDocuments = documents.filter(d => d.file_type === 'image');
    console.log('🔍 [LIGHTBOX] Total image documents:', imageDocuments.length);
    console.log('🔍 [LIGHTBOX] Image documents:', imageDocuments.map(d => ({ id: d.id, filename: d.original_filename })));
    
    const index = imageDocuments.findIndex(d => d.id === docId);
    console.log('🔍 [LIGHTBOX] Found index:', index);
    
    if (index === -1) {
      console.error('❌ [LIGHTBOX] Document not found in imageDocuments!');
      console.error('❌ [LIGHTBOX] Looking for:', docId);
      console.error('❌ [LIGHTBOX] Available IDs:', imageDocuments.map(d => d.id));
      return;
    }
    
    setCurrentImageIndex(index);
    console.log('🔍 [LIGHTBOX] Setting index to:', index);
    setLightboxOpen(true);
    console.log('🔍 [LIGHTBOX] lightboxOpen set to TRUE');
  };

  const handlePreview = (doc: DocumentMetadata) => {
    if (doc.file_type === 'image') {
      // Always try to open lightbox for images (signed URL or public URL)
      handleImageClick(doc.id);
    } else if (doc.file_type === 'pdf' && doc.public_url) {
      window.open(doc.public_url, '_blank');
    } else if (onDocumentClick) {
      onDocumentClick(doc);
    }
  };
  
  // Prepare lightbox slides with signed URLs
  const imageDocuments = documents.filter(d => d.file_type === 'image');
  const lightboxSlides = imageDocuments.map(doc => ({
    src: imageUrls[doc.id] || doc.public_url || '',
    alt: doc.original_filename,
    title: doc.description || doc.original_filename
  }));

  // Filter and sort documents
  const filteredDocuments = documents
    .filter(doc => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        doc.filename.toLowerCase().includes(search) ||
        doc.original_filename.toLowerCase().includes(search) ||
        doc.description?.toLowerCase().includes(search) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(search))
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.original_filename.localeCompare(b.original_filename);
        case 'size':
          return b.file_size - a.file_size;
        case 'date':
        default:
          return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
      }
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-6xl mb-4">📂</div>
        <p className="text-gray-600 text-lg font-medium">Nessun documento caricato</p>
        <p className="text-gray-500 text-sm mt-1">
          I documenti caricati appariranno qui
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cerca documenti..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date">Per Data</option>
            <option value="name">Per Nome</option>
            <option value="size">Per Dimensione</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              📊 Griglia
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm border-l border-gray-300 ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              📝 Lista
            </button>
          </div>
        </div>
      </div>

      {/* Document Count */}
      <div className="text-sm text-gray-600">
        {filteredDocuments.length} documento{filteredDocuments.length !== 1 ? 'i' : ''}
        {searchTerm && ` (filtrato da ${documents.length})`}
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Preview */}
              <div 
                className="aspect-video bg-gray-100 flex items-center justify-center relative group cursor-pointer"
                onClick={() => {
                  console.log('🖱️ [GALLERY] Card clicked, docId:', doc.id, 'type:', doc.file_type);
                  handlePreview(doc);
                }}
              >
                {doc.file_type === 'image' && (imageUrls[doc.id] || doc.public_url) ? (
                  <>
                    <img
                      src={imageUrls[doc.id] || doc.public_url || ''}
                      alt={doc.original_filename}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('🖱️ [IMG] Direct image click, docId:', doc.id);
                        handleImageClick(doc.id);
                      }}
                    />
                    {/* Hover overlay - pointer-events-none allows clicks to pass through */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center pointer-events-none">
                      <span className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        🔍 Clicca per ingrandire
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-6xl">
                    {storageService.getFileIcon(doc.file_type)}
                  </div>
                )}
                
                {/* File Type Badge */}
                <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-0.5 rounded">
                  {doc.file_type.toUpperCase()}
                </div>
              </div>

              {/* Info */}
              <div className="p-3 space-y-2">
                <h4 className="font-medium text-sm text-gray-900 truncate" title={doc.original_filename}>
                  {doc.original_filename}
                </h4>
                
                {doc.description && (
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {doc.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{storageService.formatFileSize(doc.file_size)}</span>
                  <span>{new Date(doc.uploaded_at).toLocaleDateString('it-IT')}</span>
                </div>

                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {doc.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{doc.tags.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Actions */}
                {showActions && (
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(doc);
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                      📥 Download
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc.id);
                      }}
                      className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Nome File
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Dimensione
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                  Data
                </th>
                {showActions && (
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">
                    Azioni
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDocuments.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handlePreview(doc)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {storageService.getFileIcon(doc.file_type)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {doc.original_filename}
                        </p>
                        {doc.description && (
                          <p className="text-xs text-gray-500 truncate">
                            {doc.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                      {doc.file_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {storageService.formatFileSize(doc.file_size)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(doc.uploaded_at).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  {showActions && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(doc);
                          }}
                          className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                          📥 Download
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(doc.id);
                          }}
                          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lightbox Modal */}
      <Lightbox
        open={lightboxOpen}
        close={() => setLightboxOpen(false)}
        slides={lightboxSlides}
        index={currentImageIndex}
      />
    </div>
  );
}
