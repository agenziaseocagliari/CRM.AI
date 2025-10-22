import { Download, FileText, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  document_category: string;
  created_at: string;
}

interface DocumentStats {
  total: number;
  byCategory: Record<string, number>;
  byType: Record<string, number>;
  totalSize: number;
  recentUploads: Document[];
}

interface Filters {
  category: string;
  fileType: string;
  dateRange: string;
  searchQuery: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

interface FiltersPanelProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

interface DocumentsGridProps {
  organizationId: string | null;
  filters: Filters;
}

// Helper function
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// StatCard Component
function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'border-blue-500 text-blue-600',
    green: 'border-green-500 text-green-600',
    purple: 'border-purple-500 text-purple-600',
    orange: 'border-orange-500 text-orange-600'
  };

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border-l-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-gray-400">
          {icon}
        </div>
      </div>
    </div>
  );
}

// StatisticsGrid Component
function StatisticsGrid({ stats, loading }: { stats: DocumentStats; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-gray-100 animate-pulse h-32 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Documenti Totali"
        value={stats.total}
        icon={<FileText className="w-8 h-8" />}
        color="blue"
      />
      <StatCard
        title="Spazio Utilizzato"
        value={formatBytes(stats.totalSize)}
        icon={<FileText className="w-8 h-8" />}
        color="green"
      />
      <StatCard
        title="Polizze"
        value={stats.byCategory.policy || 0}
        icon={<FileText className="w-8 h-8" />}
        color="purple"
      />
      <StatCard
        title="Sinistri"
        value={stats.byCategory.claim || 0}
        icon={<FileText className="w-8 h-8" />}
        color="orange"
      />
    </div>
  );
}

// FiltersPanel Component
function FiltersPanel({ filters, onChange }: FiltersPanelProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cerca documenti..."
            value={filters.searchQuery}
            onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <select
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Tutte le categorie</option>
          <option value="policy">📋 Polizze</option>
          <option value="claim">📸 Sinistri</option>
          <option value="contact">👤 Contatti</option>
          <option value="commission">💰 Provvigioni</option>
        </select>
        
        {/* File Type Filter */}
        <select
          value={filters.fileType}
          onChange={(e) => onChange({ ...filters, fileType: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Tutti i tipi</option>
          <option value="image">🖼️ Immagini</option>
          <option value="pdf">📄 PDF</option>
          <option value="document">📝 Documenti</option>
          <option value="spreadsheet">📊 Fogli di calcolo</option>
        </select>
        
        {/* Date Range */}
        <select
          value={filters.dateRange}
          onChange={(e) => onChange({ ...filters, dateRange: e.target.value })}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Tutte le date</option>
          <option value="today">Oggi</option>
          <option value="week">Ultima settimana</option>
          <option value="month">Ultimo mese</option>
          <option value="year">Ultimo anno</option>
        </select>
      </div>
    </div>
  );
}

// DocumentsGrid Component
function DocumentsGrid({ organizationId, filters }: DocumentsGridProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;

    const loadFilteredDocuments = async () => {
    if (!organizationId) return;

    setLoading(true);
    try {
      let query = supabase
        .from('insurance_documents')
        .select('*')
        .eq('organization_id', organizationId);

      // Apply category filter
      if (filters.category !== 'all') {
        query = query.eq('document_category', filters.category);
      }

      // Apply file type filter
      if (filters.fileType !== 'all') {
        query = query.eq('file_type', filters.fileType);
      }

      // Apply date range filter
      if (filters.dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;

        switch (filters.dateRange) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case 'year':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
          default:
            startDate = new Date(0);
        }

        query = query.gte('created_at', startDate.toISOString());
      }

      // Apply search query
      if (filters.searchQuery) {
        query = query.or(
          `file_name.ilike.%${filters.searchQuery}%,` +
          `description.ilike.%${filters.searchQuery}%`
        );
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
    };

    loadFilteredDocuments();
  }, [organizationId, filters]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {documents.length} Documenti
        </h2>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            disabled={documents.length === 0}
          >
            <Download className="w-4 h-4 inline mr-2" />
            Scarica Tutti
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-500">Caricamento documenti...</p>
        </div>
      ) : documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map(doc => (
            <DocumentCard key={doc.id} document={doc} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg mb-2">Nessun documento trovato</p>
          <p className="text-gray-400 text-sm">
            Prova a modificare i filtri o carica nuovi documenti
          </p>
        </div>
      )}
    </div>
  );
}

// Simple document card component
function DocumentCard({ document }: { document: Document }) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'policy':
        return '📋';
      case 'claim':
        return '📸';
      case 'contact':
        return '👤';
      case 'commission':
        return '💰';
      default:
        return '📄';
    }
  };

  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">
          {getCategoryIcon(document.document_category)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate" title={document.file_name}>
            {document.file_name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {document.document_category} • {formatBytes(document.file_size)}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(document.created_at).toLocaleDateString('it-IT', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

// Main DocumentsModule Component
export default function DocumentsModule() {
  const { organizationId } = useAuth();
  const [stats, setStats] = useState<DocumentStats>({
    total: 0,
    byCategory: {},
    byType: {},
    totalSize: 0,
    recentUploads: []
  });
  const [filters, setFilters] = useState({
    category: 'all',
    fileType: 'all',
    dateRange: 'all',
    searchQuery: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;

    const loadStatistics = async () => {
      try {
        const { data, error } = await supabase
          .from('insurance_documents')
          .select('*')
          .eq('organization_id', organizationId);
        
        if (error) throw error;
        
        // Calculate statistics
        const byCategory = data.reduce((acc: Record<string, number>, doc: Document) => {
          acc[doc.document_category] = (acc[doc.document_category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const byType = data.reduce((acc: Record<string, number>, doc: Document) => {
          acc[doc.file_type] = (acc[doc.file_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const totalSize = data.reduce((sum: number, doc: Document) => sum + (doc.file_size || 0), 0);
        
        const recent = [...data]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        
        setStats({
          total: data.length,
          byCategory,
          byType,
          totalSize,
          recentUploads: recent as Document[]
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading statistics:', error);
        setLoading(false);
      }
    };

    loadStatistics();
  }, [organizationId]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📂 Gestione Documenti
        </h1>
        <p className="text-gray-600">
          Vista centralizzata di tutti i documenti dell'organizzazione
        </p>
      </div>
      
      {/* Statistics Dashboard */}
      <StatisticsGrid stats={stats} loading={loading} />
      
      {/* Filters */}
      <FiltersPanel filters={filters} onChange={setFilters} />
      
      {/* Documents Grid */}
      <DocumentsGrid 
        organizationId={organizationId} 
        filters={filters}
      />
    </div>
  );
}
