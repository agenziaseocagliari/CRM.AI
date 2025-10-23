// =====================================================
// SOURCES TAB COMPONENT
// =====================================================

import {
    AlertCircle, CheckCircle, Clock,
    Eye,
    FileText, LinkIcon,
    RefreshCw,
    Trash2,
    XCircle
} from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';

interface KnowledgeSource {
  id: string;
  source_type: 'file' | 'url' | 'text';
  source_name: string;
  source_url?: string;
  file_size?: number;
  file_type?: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
  extracted_text?: string;
  original_content?: string;
}

interface SourcesTabProps {
  sources: KnowledgeSource[];
  onDelete: () => void;
  onRefresh: () => void;
}

export function SourcesTab({ sources, onDelete, onRefresh }: SourcesTabProps) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [previewSource, setPreviewSource] = useState<KnowledgeSource | null>(null);

  const handleDelete = async (sourceId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa fonte?')) return;

    setDeleting(sourceId);
    try {
      const { error } = await supabase
        .from('company_knowledge_sources')
        .delete()
        .eq('id', sourceId);

      if (error) throw error;

      alert('✅ Fonte eliminata con successo!');
      onDelete();
    } catch (error) {
      console.error('Delete error:', error);
      alert('❌ Errore durante l\'eliminazione');
    } finally {
      setDeleting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" />, label: 'In Attesa' },
      processing: { color: 'bg-blue-100 text-blue-800', icon: <RefreshCw className="w-4 h-4 animate-spin" />, label: 'Elaborazione' },
      completed: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" />, label: 'Completato' },
      failed: { color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" />, label: 'Errore' },
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;

    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.icon}
        <span>{badge.label}</span>
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      file: <FileText className="w-5 h-5 text-blue-500" />,
      url: <LinkIcon className="w-5 h-5 text-green-500" />,
      text: <FileText className="w-5 h-5 text-purple-500" />,
    };
    return icons[type as keyof typeof icons] || icons.file;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (sources.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nessuna fonte caricata
        </h3>
        <p className="text-gray-500">
          Inizia caricando file, URL o testo nella tab "Carica Contenuti"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          {sources.length} {sources.length === 1 ? 'Fonte' : 'Fonti'} Caricata
        </h3>
        <button
          onClick={onRefresh}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Aggiorna</span>
        </button>
      </div>

      {/* Sources List */}
      <div className="space-y-3">
        {sources.map((source) => (
          <div
            key={source.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {/* Icon */}
                <div className="mt-1">
                  {getTypeIcon(source.source_type)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {source.source_name}
                    </h4>
                    {getStatusBadge(source.processing_status)}
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="capitalize">{source.source_type}</span>
                    {source.file_size && (
                      <span>{formatFileSize(source.file_size)}</span>
                    )}
                    <span>{formatDate(source.created_at)}</span>
                  </div>

                  {source.error_message && (
                    <div className="mt-2 flex items-start space-x-2 text-xs text-red-600 bg-red-50 rounded p-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{source.error_message}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 ml-4">
                {source.processing_status === 'completed' && (
                  <button
                    onClick={() => setPreviewSource(source)}
                    className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                    title="Anteprima"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(source.id)}
                  disabled={deleting === source.id}
                  className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  title="Elimina"
                >
                  {deleting === source.id ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {previewSource && (
        <PreviewModal
          source={previewSource}
          onClose={() => setPreviewSource(null)}
        />
      )}
    </div>
  );
}

// =====================================================
// PREVIEW MODAL COMPONENT
// =====================================================

function PreviewModal({ source, onClose }: { source: KnowledgeSource; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-indigo-600 px-6 py-4">
            <h3 className="text-lg font-medium text-white">
              Anteprima: {source.source_name}
            </h3>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-4 max-h-96 overflow-y-auto">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                {source.extracted_text || source.original_content || 'Contenuto non disponibile'}
              </pre>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// PROFILE TAB COMPONENT
// =====================================================

interface CompanyProfile {
  company_name?: string;
  specializations?: string[];
  tone_of_voice?: string;
  values?: string[];
  target_clients?: string;
  unique_selling_points?: string[];
  ai_generated_summary?: string;
  sources_used: number;
  last_updated?: string;
  generated_at?: string;
}

interface ProfileTabProps {
  profile: CompanyProfile | null;
  onRefresh: () => void;
}

export function ProfileTab({ profile, onRefresh }: ProfileTabProps) {
  if (!profile) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Profilo Aziendale Non Generato
        </h3>
        <p className="text-gray-500 mb-6">
          Carica almeno 3 fonti per generare automaticamente il profilo aziendale
        </p>
        <button
          onClick={onRefresh}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
        >
          Genera Profilo
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {profile.company_name || 'Profilo Aziendale'}
          </h3>
          <p className="text-sm text-gray-500">
            Generato da {profile.sources_used} fonti • 
            Ultimo aggiornamento: {profile.last_updated ? formatDate(profile.last_updated) : '-'}
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Rigenera</span>
        </button>
      </div>

      {/* AI Summary */}
      {profile.ai_generated_summary && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-6">
          <h4 className="text-sm font-medium text-indigo-900 mb-2">
            📝 Descrizione AI-Generated
          </h4>
          <p className="text-gray-700 leading-relaxed">
            {profile.ai_generated_summary}
          </p>
        </div>
      )}

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Specializations */}
        {profile.specializations && profile.specializations.length > 0 && (
          <ProfileCard
            title="Specializzazioni"
            icon="🎯"
            items={profile.specializations}
          />
        )}

        {/* Values */}
        {profile.values && profile.values.length > 0 && (
          <ProfileCard
            title="Valori Aziendali"
            icon="💎"
            items={profile.values}
          />
        )}

        {/* USPs */}
        {profile.unique_selling_points && profile.unique_selling_points.length > 0 && (
          <ProfileCard
            title="Punti di Forza"
            icon="⭐"
            items={profile.unique_selling_points}
          />
        )}

        {/* Tone of Voice */}
        {profile.tone_of_voice && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              🗣️ Tone of Voice
            </h4>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
              {profile.tone_of_voice}
            </span>
          </div>
        )}

        {/* Target Clients */}
        {profile.target_clients && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 md:col-span-2">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              👥 Clienti Target
            </h4>
            <p className="text-gray-700">
              {profile.target_clients}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// PROFILE CARD COMPONENT
// =====================================================

function ProfileCard({ title, icon, items }: { title: string; icon: string; items: string[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h4 className="text-sm font-medium text-gray-900 mb-3">
        {icon} {title}
      </h4>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start">
            <span className="text-indigo-500 mr-2">•</span>
            <span className="text-gray-700 text-sm">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Helper function
function formatDate(date: string) {
  return new Date(date).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
