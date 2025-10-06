// Enhanced Knowledge Base System - Guardian AI CRM
// Sistema avanzato per la gestione centralizzata della conoscenza organizzativa

interface KnowledgeBase {
  // Core Knowledge Management
  documents: KnowledgeDocument[];
  categories: KnowledgeCategory[];
  tags: string[];
  
  // Search & Retrieval
  search(query: string, organizationId: string): Promise<KnowledgeMatch[]>;
  getRecommendations(context: string, userId: string): Promise<KnowledgeDocument[]>;
  
  // Learning & Adaptation
  recordInteraction(documentId: string, interaction: UserInteraction): Promise<void>;
  updateRelevanceScores(): Promise<void>;
}

interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  
  // AI Enhancement
  aiSummary?: string;
  keyInsights: string[];
  relatedTopics: string[];
  
  // Usage Analytics
  viewCount: number;
  usefulness: number; // 0-10 based on user feedback
  lastUsed: Date;
}

interface KnowledgeCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  color: string;
  icon: string;
}

interface KnowledgeMatch {
  id: string;
  title: string;
  content: string;
  relevanceScore: number;
  category: string;
  snippet: string; // Highlighted excerpt
  reason: string; // Why this is relevant
}

interface UserInteraction {
  type: 'view' | 'useful' | 'not_useful' | 'share' | 'edit';
  timestamp: Date;
  context?: string;
  feedback?: string;
}

class EnhancedKnowledgeBaseSystem implements KnowledgeBase {
  documents: KnowledgeDocument[] = [];
  categories: KnowledgeCategory[] = [];
  tags: string[] = [];

  constructor() {
    this.initializeDefaultCategories();
    this.initializeDefaultDocuments();
  }

  private initializeDefaultCategories(): void {
    this.categories = [
      {
        id: 'sales-process',
        name: 'Processo di Vendita',
        description: 'Metodologie e best practice per il processo commerciale',
        color: 'blue',
        icon: '📈'
      },
      {
        id: 'customer-service',
        name: 'Servizio Clienti',
        description: 'Procedure e script per il supporto clienti',
        color: 'green',
        icon: '🎧'
      },
      {
        id: 'marketing',
        name: 'Marketing & Comunicazione',
        description: 'Strategie di marketing e template di comunicazione',
        color: 'purple',
        icon: '📢'
      },
      {
        id: 'technical',
        name: 'Documentazione Tecnica',
        description: 'Guide tecniche e procedure operative',
        color: 'orange',
        icon: '⚙️'
      },
      {
        id: 'compliance',
        name: 'Compliance & Normative',
        description: 'Regolamenti, policy aziendali e compliance',
        color: 'red',
        icon: '⚖️'
      },
      {
        id: 'training',
        name: 'Formazione',
        description: 'Materiali formativi e onboarding',
        color: 'yellow',
        icon: '🎓'
      }
    ];
  }

  private initializeDefaultDocuments(): void {
    const sampleDocuments: Omit<KnowledgeDocument, 'id' | 'createdAt' | 'updatedAt' | 'viewCount' | 'lastUsed'>[] = [
      {
        title: 'Processo di Qualificazione Lead BANT',
        content: `
        Il metodo BANT è un framework per qualificare i lead:
        
        **BUDGET**: Il prospect ha il budget necessario?
        - Domande da fare: "Quale budget avete allocato per questa soluzione?"
        - Red flags: Evitano di parlare di budget, budget irrealistico
        
        **AUTHORITY**: Sta parlando con il decision maker?
        - Domande: "Chi altro è coinvolto in questa decisione?"
        - Identificare tutti gli stakeholder
        
        **NEED**: C'è un bisogno reale e urgente?
        - Pain points specifici
        - Conseguenze del non agire
        
        **TIMELINE**: Quando vogliono implementare?
        - Urgenza reale vs desiderio generico
        - Milestone e deadline specifici
        
        **Score BANT**: Assegna 1-10 per ogni categoria. Lead qualificato se media > 7.
        `,
        category: 'sales-process',
        tags: ['lead-qualification', 'sales', 'bant', 'processo'],
        organizationId: 'demo-org',
        createdBy: 'system',
        version: 1,
        aiSummary: 'Framework BANT per qualificare lead attraverso Budget, Authority, Need, Timeline',
        keyInsights: [
          'Lead qualificato se score medio BANT > 7',
          'Identificare tutti gli stakeholder coinvolti',
          'Urgenza reale vs desiderio generico'
        ],
        relatedTopics: ['lead-scoring', 'sales-process', 'qualification'],
        usefulness: 9.2
      },
      {
        title: 'Template Email di Follow-up Post Demo',
        content: `
        **Subject**: Grazie per il tempo dedicato oggi - [Nome Azienda]
        
        Ciao [Nome],
        
        È stato un piacere presentarvi Guardian AI CRM oggi. Come discusso, riassumo i punti chiave:
        
        ✅ **I vostri obiettivi**:
        - [Obiettivo 1 specificato dal cliente]
        - [Obiettivo 2 specificato dal cliente]
        
        ✅ **Come Guardian AI può aiutarvi**:
        - [Beneficio specifico 1]
        - [Beneficio specifico 2]
        - ROI stimato: [percentuale]%
        
        📎 **Next Steps**:
        1. Invio proposta personalizzata entro [data]
        2. Trial gratuito di 30 giorni
        3. Meeting con il vostro team IT per integrazione
        
        Domande o dubbi? Sono a disposizione.
        
        Best regards,
        [Nome] | Guardian AI CRM
        `,
        category: 'sales-process',
        tags: ['email-template', 'follow-up', 'demo', 'sales'],
        organizationId: 'demo-org',
        createdBy: 'system',
        version: 1,
        aiSummary: 'Template email strutturato per follow-up post-demo con recap e next steps',
        keyInsights: [
          'Personalizzare sempre con obiettivi specifici del cliente',
          'Includere ROI stimato quando possibile',
          'Next steps chiari e timeline definite'
        ],
        relatedTopics: ['email-marketing', 'sales-follow-up', 'demo-process'],
        usefulness: 8.7
      },
      {
        title: 'Gestione Obiezioni WhatsApp Business',
        content: `
        **Obiezione**: "Non abbiamo tempo per un'altra piattaforma"
        **Risposta**: Capisco perfettamente. Guardian AI è progettato per farvi RISPARMIARE tempo, non consumarne. I nostri clienti recuperano in media 15 ore/settimana grazie all'automazione. Vi mostro come in 5 minuti? 📱
        
        **Obiezione**: "Costa troppo"
        **Risposta**: Comprendo la preoccupazione per i costi. Vi faccio una domanda: quanto vi costa perdere un lead qualificato? I nostri clienti aumentano le conversioni del 40% in media. Il ROI si vede già dal primo mese 📈
        
        **Obiezione**: "Già usiamo [competitor]"
        **Risposta**: Ottimo! Significa che capite il valore della digitalizzazione. Guardian AI si integra con [competitor] e aggiunge l'AI che manca. Posso mostrarvi le differenze in 10 minuti? 🤝
        
        **Best Practice**:
        - Usare emoji per rendere più friendly
        - Risposta rapida entro 1 ora
        - Sempre fare una domanda di follow-up
        - Proporre demo breve e specifica
        `,
        category: 'customer-service',
        tags: ['obiezioni', 'whatsapp', 'sales', 'customer-service'],
        organizationId: 'demo-org',
        createdBy: 'system',
        version: 1,
        aiSummary: 'Script per gestire obiezioni comuni via WhatsApp con approccio consultivo',
        keyInsights: [
          'Sempre quantificare i benefici con numeri specifici',
          'Rispondere con domande per mantenere la conversazione attiva',
          'Emoji appropriati aumentano engagement del 25%'
        ],
        relatedTopics: ['objection-handling', 'whatsapp-marketing', 'sales-scripts'],
        usefulness: 9.1
      },
      {
        title: 'GDPR Compliance per CRM',
        content: `
        **Principi Base GDPR per CRM**:
        
        1. **Consenso Esplicito**
           - Checkbox separati per ogni tipo di comunicazione
           - Linguaggio chiaro e comprensibile
           - Facilità di revoca consenso
        
        2. **Minimizzazione Dati**
           - Raccogliere solo dati necessari
           - Retention policy definita
           - Cancellazione automatica dopo scadenza
        
        3. **Diritti dell'Interessato**
           - Diritto di accesso (SAR - Subject Access Request)
           - Diritto di portabilità
           - Diritto di cancellazione ("Right to be forgotten")
           - Diritto di rettifica
        
        4. **Data Breach Management**
           - Notifica entro 72h all'autorità
           - Notifica immediata se alto rischio
           - Log dettagliati degli accessi
        
        **Checklist Operativa**:
        ✅ Privacy Policy aggiornata
        ✅ Cookie Banner conforme
        ✅ Procedure per SAR
        ✅ Backup sicuri e crittografati
        ✅ Training team su GDPR
        ✅ DPO nominato (se necessario)
        `,
        category: 'compliance',
        tags: ['gdpr', 'privacy', 'compliance', 'data-protection'],
        organizationId: 'demo-org',
        createdBy: 'system',
        version: 1,
        aiSummary: 'Guida completa per compliance GDPR nel CRM con checklist operativa',
        keyInsights: [
          'Notifica data breach entro 72h è obbligatoria',
          'Consenso deve essere granulare per ogni tipo di comunicazione',
          'Retention policy automatica riduce rischi compliance'
        ],
        relatedTopics: ['data-protection', 'privacy-policy', 'cookie-compliance'],
        usefulness: 9.5
      }
    ];

    this.documents = sampleDocuments.map((doc, index) => ({
      ...doc,
      id: `doc-${index + 1}`,
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // Random date in last 90 days
      updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
      viewCount: Math.floor(Math.random() * 100) + 10,
      lastUsed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date in last 7 days
    }));

    // Extract unique tags
    this.tags = [...new Set(this.documents.flatMap(doc => doc.tags))];
  }

  async search(query: string, organizationId: string): Promise<KnowledgeMatch[]> {
    const queryLower = query.toLowerCase();
    const matches: KnowledgeMatch[] = [];

    for (const doc of this.documents) {
      if (doc.organizationId !== organizationId) continue;

      let relevanceScore = 0;
      const reasons: string[] = [];

      // Title matching (highest weight)
      if (doc.title.toLowerCase().includes(queryLower)) {
        relevanceScore += 10;
        reasons.push('Title match');
      }

      // Content matching
      const contentMatches = (doc.content.toLowerCase().match(new RegExp(queryLower, 'g')) || []).length;
      if (contentMatches > 0) {
        relevanceScore += contentMatches * 2;
        reasons.push(`${contentMatches} content matches`);
      }

      // Tag matching
      const tagMatches = doc.tags.filter(tag => tag.toLowerCase().includes(queryLower)).length;
      if (tagMatches > 0) {
        relevanceScore += tagMatches * 5;
        reasons.push(`${tagMatches} tag matches`);
      }

      // AI Summary matching
      if (doc.aiSummary && doc.aiSummary.toLowerCase().includes(queryLower)) {
        relevanceScore += 7;
        reasons.push('AI summary match');
      }

      // Key insights matching
      const insightMatches = doc.keyInsights.filter(insight => 
        insight.toLowerCase().includes(queryLower)
      ).length;
      if (insightMatches > 0) {
        relevanceScore += insightMatches * 4;
        reasons.push(`${insightMatches} insight matches`);
      }

      if (relevanceScore > 0) {
        // Create snippet
        const sentences = doc.content.split(/[.!?]+/);
        const matchingSentence = sentences.find(sentence => 
          sentence.toLowerCase().includes(queryLower)
        );
        
        const snippet = matchingSentence 
          ? this.highlightText(matchingSentence.trim(), query)
          : doc.content.substring(0, 150) + '...';

        matches.push({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          relevanceScore,
          category: doc.category,
          snippet,
          reason: reasons.join(', ')
        });
      }
    }

    // Sort by relevance score (descending) and return top 10
    return matches
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);
  }

  async getRecommendations(context: string, _userId: string): Promise<KnowledgeDocument[]> {
    // Simple context-based recommendations
    const contextLower = context.toLowerCase();
    const recommendations: { doc: KnowledgeDocument; score: number }[] = [];

    for (const doc of this.documents) {
      let score = 0;

      // Context matching
      if (doc.content.toLowerCase().includes(contextLower)) {
        score += 5;
      }

      // Popularity (usage-based)
      score += doc.viewCount * 0.1;

      // Usefulness rating
      score += doc.usefulness;

      // Recency boost
      const daysSinceUpdated = (Date.now() - doc.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 10 - daysSinceUpdated);

      if (score > 0) {
        recommendations.push({ doc, score });
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(r => r.doc);
  }

  async recordInteraction(documentId: string, interaction: UserInteraction): Promise<void> {
    const doc = this.documents.find(d => d.id === documentId);
    if (!doc) return;

    // Update view count and last used
    if (interaction.type === 'view') {
      doc.viewCount++;
      doc.lastUsed = new Date();
    }

    // Update usefulness rating
    if (interaction.type === 'useful') {
      doc.usefulness = Math.min(10, doc.usefulness + 0.1);
    } else if (interaction.type === 'not_useful') {
      doc.usefulness = Math.max(0, doc.usefulness - 0.2);
    }

    console.log(`Knowledge interaction recorded: ${interaction.type} for ${doc.title}`);
  }

  async updateRelevanceScores(): Promise<void> {
    // This would be more sophisticated in a real implementation
    // For now, just log that we're updating
    console.log('Updating knowledge base relevance scores...');
  }

  private highlightText(text: string, query: string): string {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '**$1**');
  }

  // Utility methods for the Knowledge Base UI
  getDocumentsByCategory(categoryId: string): KnowledgeDocument[] {
    return this.documents.filter(doc => doc.category === categoryId);
  }

  getMostUseful(limit: number = 5): KnowledgeDocument[] {
    return [...this.documents]
      .sort((a, b) => b.usefulness - a.usefulness)
      .slice(0, limit);
  }

  getRecentlyUpdated(limit: number = 5): KnowledgeDocument[] {
    return [...this.documents]
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  }

  getTrendingTopics(): string[] {
    // Simple trending calculation based on recent usage
    const tagUsage: Record<string, number> = {};
    
    this.documents
      .filter(doc => {
        const daysSinceLastUsed = (Date.now() - doc.lastUsed.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceLastUsed <= 7; // Used in last week
      })
      .forEach(doc => {
        doc.tags.forEach(tag => {
          tagUsage[tag] = (tagUsage[tag] || 0) + doc.viewCount;
        });
      });

    return Object.entries(tagUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag);
  }
}

// Enhanced Knowledge Base Manager with organization support
export class KnowledgeBaseManager {
  private organizations: Map<string, EnhancedKnowledgeBaseSystem> = new Map();

  getOrganizationKB(organizationId: string): EnhancedKnowledgeBaseSystem {
    if (!this.organizations.has(organizationId)) {
      this.organizations.set(organizationId, new EnhancedKnowledgeBaseSystem());
    }
    const kb = this.organizations.get(organizationId);
    if (!kb) {
      throw new Error(`Knowledge base not found for organization: ${organizationId}`);
    }
    return kb;
  }

  async searchAcrossOrganization(query: string, organizationId: string): Promise<KnowledgeMatch[]> {
    const kb = this.getOrganizationKB(organizationId);
    return kb.search(query, organizationId);
  }

  async getContextualRecommendations(context: string, organizationId: string, userId: string): Promise<KnowledgeDocument[]> {
    const kb = this.getOrganizationKB(organizationId);
    return kb.getRecommendations(context, userId);
  }
}

// Global Knowledge Base System
export const enhancedKnowledgeBaseSystem = {
  manager: new KnowledgeBaseManager(),
  
  // Legacy compatibility
  getManager: (organizationId: string) => 
    new KnowledgeBaseManager().getOrganizationKB(organizationId),
    
  // Direct search method for backward compatibility
  searchKnowledge: async (query: string, organizationId: string): Promise<KnowledgeMatch[]> => {
    const manager = new KnowledgeBaseManager();
    return manager.searchAcrossOrganization(query, organizationId);
  }
};

export default enhancedKnowledgeBaseSystem;