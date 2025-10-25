import { useAuth } from '@/contexts/AuthContext';
import {
    Brain,
    CheckCircle,
    Database,
    FileText,
    Link as LinkIcon,
    RefreshCw,
    Upload,
    Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { ProfileTab, SourcesTab } from './CompanyKnowledge/SourcesAndProfile';
import { FileUploadSection, TextInputSection, URLInputSection } from './CompanyKnowledge/UploadSections';

// =====================================================
// TYPES
// =====================================================

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

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function CompanyKnowledge() {
  const { organizationId } = useAuth();
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Active tab
  const [activeTab, setActiveTab] = useState<'upload' | 'sources' | 'profile'>('upload');
  
  const loadSources = async () => {
    if (!organizationId) return;
    
    try {
      const { data, error } = await supabase
        .from('company_knowledge_sources')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSources(data || []);
    } catch (error) {
      console.error('Error loading sources:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const loadProfile = async () => {
    if (!organizationId) return;
    
    try {
      const { data, error } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();
      
      if (error) {
        console.error('Error loading profile:', error);
        return;
      }
      setCompanyProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };
  
  useEffect(() => {
    if (organizationId) {
      loadSources();
      loadProfile();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  // =====================================================
  // TRIGGER TEXT EXTRACTION PROCESSING
  // =====================================================
  const triggerProcessing = async () => {
    console.log('🔵 [FRONTEND] ========== triggerProcessing START ==========');
    console.log('🔵 [FRONTEND] organizationId:', organizationId);
    console.log('🔵 [FRONTEND] companyProfile:', companyProfile);
    
    if (!organizationId) {
      console.error('❌ [FRONTEND] Missing organizationId!');
      console.error('❌ [FRONTEND] companyProfile object:', companyProfile);
      alert('❌ Errore: Organization ID mancante');
      return;
    }

    console.log('🔵 [FRONTEND] setProcessing(true)');
    setProcessing(true);
    
    try {
      console.log('� [FRONTEND] Preparing API call...');
      const url = '/api/process-knowledge-sources';
      const body = { organizationId };
      
      console.log('🔵 [FRONTEND] URL:', url);
      console.log('🔵 [FRONTEND] Body:', JSON.stringify(body, null, 2));
      
      console.log('🔵 [FRONTEND] Calling fetch...');
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      console.log('🔵 [FRONTEND] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [FRONTEND] Response NOT OK:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      console.log('🔵 [FRONTEND] Parsing JSON response...');
      const data = await response.json();
      console.log('🔵 [FRONTEND] Response data:', data);

      if (data.success) {
        const message = `✅ Processing completato!\n\n` +
          `Processati: ${data.processed}\n` +
          `Successi: ${data.succeeded}\n` +
          `Falliti: ${data.failed}\n` +
          `Caratteri totali: ${data.totalCharacters?.toLocaleString() || 0}`;
        
        console.log('🔵 [FRONTEND] Success! Message:', message);
        alert(message);
        
        // Reload sources to see updated status
        console.log('🔵 [FRONTEND] Reloading sources...');
        await loadSources();
        console.log('🔵 [FRONTEND] Sources reloaded');
      } else {
        console.error('❌ [FRONTEND] Processing failed:', data);
        alert(`❌ Errore durante il processing:\n${data.message || data.error}`);
      }
    } catch (error) {
      console.error('💥 [FRONTEND] ========== CATCH ERROR ==========');
      console.error('💥 [FRONTEND] Error type:', typeof error);
      console.error('💥 [FRONTEND] Error:', error);
      console.error('💥 [FRONTEND] Error message:', error instanceof Error ? error.message : 'Unknown');
      console.error('💥 [FRONTEND] Error stack:', error instanceof Error ? error.stack : 'N/A');
      alert('❌ Errore durante il processing. Controlla la console per dettagli.');
    } finally {
      console.log('🔵 [FRONTEND] setProcessing(false)');
      setProcessing(false);
      console.log('🔵 [FRONTEND] ========== triggerProcessing END ==========');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
          <Brain className="w-8 h-8 mr-3 text-indigo-600" />
          Base di Conoscenza Aziendale
        </h1>
        <p className="text-gray-600">
          Carica documenti, siti web e informazioni sulla tua agenzia. 
          Gli AI agents useranno queste informazioni per personalizzare 
          ogni interazione con i tuoi clienti.
        </p>
      </div>
      
      {/* Stats Cards */}
      <StatsCards sources={sources} profile={companyProfile} />
      
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <TabButton
              active={activeTab === 'upload'}
              onClick={() => setActiveTab('upload')}
              icon={<Upload className="w-5 h-5" />}
              label="Carica Contenuti"
            />
            <TabButton
              active={activeTab === 'sources'}
              onClick={() => setActiveTab('sources')}
              icon={<FileText className="w-5 h-5" />}
              label={`Fonti (${sources.length})`}
            />
            <TabButton
              active={activeTab === 'profile'}
              onClick={() => setActiveTab('profile')}
              icon={<CheckCircle className="w-5 h-5" />}
              label="Profilo Aziendale"
            />
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'upload' && (
            <UploadTab 
              organizationId={organizationId}
              onUploadComplete={loadSources}
              onTriggerProcessing={triggerProcessing}
              processing={processing}
            />
          )}
          
          {activeTab === 'sources' && (
            <SourcesTab 
              sources={sources}
              onDelete={loadSources}
              onRefresh={loadSources}
            />
          )}
          
          {activeTab === 'profile' && (
            <ProfileTab 
              profile={companyProfile}
              onRefresh={loadProfile}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// STATS CARDS COMPONENT
// =====================================================

function StatsCards({ sources, profile }: { sources: KnowledgeSource[], profile: CompanyProfile | null }) {
  const stats = [
    {
      label: 'Fonti Totali',
      value: sources.length,
      icon: <Database className="w-6 h-6" />,
      color: 'bg-blue-500'
    },
    {
      label: 'File Caricati',
      value: sources.filter(s => s.source_type === 'file').length,
      icon: <Upload className="w-6 h-6" />,
      color: 'bg-green-500'
    },
    {
      label: 'URL Aggiunti',
      value: sources.filter(s => s.source_type === 'url').length,
      icon: <LinkIcon className="w-6 h-6" />,
      color: 'bg-purple-500'
    },
    {
      label: 'Profilo Generato',
      value: profile ? 'Sì' : 'No',
      icon: <Zap className="w-6 h-6" />,
      color: profile ? 'bg-indigo-500' : 'bg-gray-400'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`${stat.color} p-3 rounded-lg text-white`}>
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// =====================================================
// TAB BUTTON COMPONENT
// =====================================================

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
        ${active 
          ? 'border-indigo-500 text-indigo-600' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// =====================================================
// UPLOAD TAB COMPONENT
// =====================================================

interface UploadTabProps {
  organizationId: string | null;
  onUploadComplete: () => void;
  onTriggerProcessing: () => void;
  processing: boolean;
}

function UploadTab({ organizationId, onUploadComplete, onTriggerProcessing, processing }: UploadTabProps) {
  const [uploadType, setUploadType] = useState<'file' | 'url' | 'text'>('file');
  const [uploading, setUploading] = useState(false);
  
  // File upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // URL input state
  const [urlInput, setUrlInput] = useState('');
  const [urlType, setUrlType] = useState<'website' | 'facebook' | 'linkedin'>('website');
  
  // Text input state
  const [textInput, setTextInput] = useState('');
  const [textTitle, setTextTitle] = useState('');
  
  const handleFileUpload = async () => {
    if (selectedFiles.length === 0 || !organizationId) return;
    
    setUploading(true);
    try {
      for (const file of selectedFiles) {
        // 1. Upload to storage
        const filePath = `${organizationId}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('company-knowledge')
          .upload(filePath, file);
        
        if (uploadError) throw uploadError;
        
        // 2. Create database record
        const { error: dbError } = await supabase
          .from('company_knowledge_sources')
          .insert({
            organization_id: organizationId,
            source_type: 'file',
            source_name: file.name,
            source_url: filePath,
            file_size: file.size,
            file_type: file.type,
            processing_status: 'pending',
          });
        
        if (dbError) throw dbError;
      }
      
      alert('✅ File caricati con successo!');
      setSelectedFiles([]);
      onUploadComplete();
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Errore durante il caricamento: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };
  
  const handleUrlSubmit = async () => {
    if (!urlInput.trim() || !organizationId) return;
    
    setUploading(true);
    try {
      const { error } = await supabase
        .from('company_knowledge_sources')
        .insert({
          organization_id: organizationId,
          source_type: 'url',
          source_name: `${urlType}: ${urlInput}`,
          source_url: urlInput,
          processing_status: 'pending',
        });
      
      if (error) throw error;
      
      alert('✅ URL aggiunto con successo!');
      setUrlInput('');
      onUploadComplete();
    } catch (error) {
      console.error('URL error:', error);
      alert('❌ Errore durante l\'aggiunta URL: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };
  
  const handleTextSubmit = async () => {
    if (!textInput.trim() || !textTitle.trim() || !organizationId) {
      alert('⚠️ Inserisci sia il titolo che il testo');
      return;
    }
    
    setUploading(true);
    try {
      const { error } = await supabase
        .from('company_knowledge_sources')
        .insert({
          organization_id: organizationId,
          source_type: 'text',
          source_name: textTitle,
          original_content: textInput,
          extracted_text: textInput,
          processing_status: 'completed', // Text is already processed
        });
      
      if (error) throw error;
      
      alert('✅ Testo salvato con successo!');
      setTextInput('');
      setTextTitle('');
      onUploadComplete();
    } catch (error) {
      console.error('Text error:', error);
      alert('❌ Errore durante il salvataggio: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Upload Type Selector */}
      <div className="flex space-x-4 border-b pb-4">
        <TypeButton
          active={uploadType === 'file'}
          onClick={() => setUploadType('file')}
          icon={<Upload className="w-5 h-5" />}
          label="Carica File"
        />
        <TypeButton
          active={uploadType === 'url'}
          onClick={() => setUploadType('url')}
          icon={<LinkIcon className="w-5 h-5" />}
          label="Aggiungi URL"
        />
        <TypeButton
          active={uploadType === 'text'}
          onClick={() => setUploadType('text')}
          icon={<FileText className="w-5 h-5" />}
          label="Testo Manuale"
        />
      </div>

      {/* Processing Trigger Button */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-indigo-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-indigo-600" />
              Estrazione Automatica Testo
            </h3>
            <p className="text-sm text-gray-600">
              Processa le fonti in stato "pending" per estrarre automaticamente il testo 
              da file (PDF, DOC), URL e documenti. Il testo estratto verrà utilizzato 
              per generare il profilo aziendale con AI.
            </p>
          </div>
          <button
            onClick={() => {
              console.log('🔵 [FRONTEND] Button clicked!');
              console.log('🔵 [FRONTEND] processing state:', processing);
              onTriggerProcessing();
            }}
            disabled={processing}
            className={`
              ml-6 flex items-center space-x-2 px-6 py-3 rounded-lg font-medium text-white
              ${processing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg'
              }
            `}
          >
            <Brain className={`w-5 h-5 ${processing ? 'animate-spin' : ''}`} />
            <span>{processing ? 'Processing...' : 'Processa Fonti'}</span>
          </button>
        </div>
      </div>
      
      {/* File Upload Section */}
      {uploadType === 'file' && (
        <FileUploadSection
          selectedFiles={selectedFiles}
          onFilesChange={setSelectedFiles}
          onUpload={handleFileUpload}
          uploading={uploading}
        />
      )}
      
      {/* URL Input Section */}
      {uploadType === 'url' && (
        <URLInputSection
          urlInput={urlInput}
          urlType={urlType}
          onUrlChange={setUrlInput}
          onTypeChange={setUrlType}
          onSubmit={handleUrlSubmit}
          uploading={uploading}
        />
      )}
      
      {/* Text Input Section */}
      {uploadType === 'text' && (
        <TextInputSection
          title={textTitle}
          text={textInput}
          onTitleChange={setTextTitle}
          onTextChange={setTextInput}
          onSubmit={handleTextSubmit}
          uploading={uploading}
        />
      )}
    </div>
  );
}

// =====================================================
// TYPE BUTTON COMPONENT
// =====================================================

interface TypeButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TypeButton({ active, onClick, icon, label }: TypeButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm
        ${active 
          ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-500' 
          : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// Continue in next file...
