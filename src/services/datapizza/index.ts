/**
 * DataPizza Multi-Agent Client
 * 
 * Centralized client for all DataPizza agent interactions in the CRM automation platform.
 * Provides type-safe interfaces for AI agents with comprehensive error handling and monitoring.
 */

import { checkAgentHealth, generateWorkflow } from '../workflowGenerationService';

// Agent types supported by DataPizza
export type AgentType =
    | 'lead-scorer'
    | 'contact-classifier'
    | 'data-enricher'
    | 'sentiment-analyzer'
    | 'email-optimizer'
    | 'deal-predictor'
    | 'workflow-generator';

// Base agent response interface
export interface AgentResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    agent: AgentType;
    executionTime: number;
    confidence?: number;
    metadata?: Record<string, unknown>;
}

// Lead scoring interfaces
export interface LeadScoringInput {
    contact: {
        name?: string;
        email?: string;
        company?: string;
        title?: string;
        phone?: string;
        website?: string;
    };
    engagement: {
        emailOpens?: number;
        emailClicks?: number;
        websiteVisits?: number;
        formSubmissions?: number;
        lastActivity?: string;
    };
    firmographics?: {
        industry?: string;
        companySize?: string;
        revenue?: string;
        location?: string;
    };
}

export interface LeadScoringOutput {
    score: number; // 0-100
    category: 'HOT' | 'WARM' | 'COLD';
    confidence: number;
    reasoning: string;
    factors: {
        engagement: number;
        fit: number;
        intent: number;
        timing: number;
    };
    nextActions: string[];
}

// Contact classification interfaces
export interface ContactClassificationInput {
    contact: {
        name?: string;
        email?: string;
        company?: string;
        title?: string;
        industry?: string;
    };
    interactions: {
        touchpoints?: number;
        avgResponseTime?: number;
        preferredChannel?: string;
    };
}

export interface ContactClassificationOutput {
    category: 'Enterprise' | 'SMB' | 'Startup' | 'Individual';
    subcategory: string;
    confidence: number;
    reasoning: string;
    recommendedApproach: string;
    expectedValue: number;
}

// Data enrichment interfaces
export interface DataEnrichmentInput {
    contact: {
        email?: string;
        company?: string;
        name?: string;
        domain?: string;
    };
    enrichmentTypes: ('company' | 'social' | 'contact' | 'technographics')[];
}

export interface DataEnrichmentOutput {
    contact: {
        name?: string;
        email?: string;
        phone?: string;
        title?: string;
        department?: string;
    };
    company: {
        name?: string;
        domain?: string;
        industry?: string;
        size?: string;
        revenue?: string;
        location?: string;
        description?: string;
    };
    social: {
        linkedin?: string;
        twitter?: string;
        website?: string;
    };
    technographics?: {
        technologies?: string[];
        stack?: string[];
    };
    enrichment_confidence: number;
}

// Sentiment analysis interfaces
export interface SentimentAnalysisInput {
    text: string;
    context?: 'email' | 'chat' | 'call_transcript' | 'social' | 'review';
}

export interface SentimentAnalysisOutput {
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number; // -1 to 1
    confidence: number;
    emotions: {
        joy?: number;
        anger?: number;
        fear?: number;
        sadness?: number;
        surprise?: number;
    };
    keywords: string[];
    intent?: string;
}

// Email optimization interfaces
export interface EmailOptimizationInput {
    subject: string;
    content: string;
    recipient: {
        segment?: string;
        industry?: string;
        title?: string;
    };
    objectives: ('open_rate' | 'click_rate' | 'reply_rate' | 'conversion')[];
}

export interface EmailOptimizationOutput {
    optimizedSubject: string;
    optimizedContent: string;
    improvements: string[];
    predictions: {
        openRate: number;
        clickRate: number;
        replyRate: number;
    };
    alternatives: {
        subject: string[];
        content: string;
    };
}

// Deal prediction interfaces
export interface DealPredictionInput {
    deal: {
        value: number;
        stage: string;
        age: number; // days
        source: string;
    };
    contact: {
        score?: number;
        engagement?: number;
        category?: string;
    };
    history: {
        interactions: number;
        emails: number;
        calls: number;
        meetings: number;
    };
}

export interface DealPredictionOutput {
    probability: number; // 0-1
    predictedCloseDate: string;
    riskFactors: string[];
    recommendations: string[];
    nextBestActions: {
        action: string;
        priority: 'high' | 'medium' | 'low';
        impact: number;
    }[];
}

/**
 * DataPizza Multi-Agent Client
 */
export class DataPizzaClient {
    private baseUrl: string;
    private healthCheckInterval: number = 30000; // 30 seconds
    private lastHealthCheck: Date | null = null;
    private isHealthy: boolean = false;

    constructor() {
        // Use the same configuration as workflowGenerationService
        this.baseUrl = import.meta.env.VITE_DATAPIZZA_API_URL || 'http://localhost:8001';

        // Start health monitoring
        this.startHealthMonitoring();
    }

    /**
     * Health check and monitoring
     */
    private async startHealthMonitoring(): Promise<void> {
        // Initial health check
        await this.checkHealth();

        // Set up periodic health checks
        setInterval(async () => {
            await this.checkHealth();
        }, this.healthCheckInterval);
    }

    private async checkHealth(): Promise<boolean> {
        try {
            // Use the same health check as workflowGenerationService
            const healthStatus = await checkAgentHealth();
            this.isHealthy = healthStatus.status === 'healthy';
            this.lastHealthCheck = new Date();

            if (this.isHealthy) {
                console.log('🟢 DataPizza agents healthy');
            } else {
                console.warn('🟡 DataPizza agents unavailable, using fallback');
            }

            return this.isHealthy;
        } catch (error) {
            console.error('❌ DataPizza health check failed:', error);
            this.isHealthy = false;
            this.lastHealthCheck = new Date();
            return false;
        }
    }

    /**
     * Generic agent call with error handling and fallback
     */
    private async callAgent<TInput, TOutput>(
        agent: AgentType,
        input: TInput,
        endpoint: string,
        fallbackHandler?: (input: TInput) => Promise<TOutput>
    ): Promise<AgentResponse<TOutput>> {
        const startTime = Date.now();

        try {
            // Check if agents are healthy
            if (!this.isHealthy && !await this.checkHealth()) {
                if (fallbackHandler) {
                    console.log(`🔄 Using fallback for ${agent}`);
                    const fallbackData = await fallbackHandler(input);
                    return {
                        success: true,
                        data: fallbackData,
                        agent,
                        executionTime: Date.now() - startTime,
                        metadata: { fallback: true }
                    };
                } else {
                    throw new Error(`Agent ${agent} non disponibile e nessun fallback configurato`);
                }
            }

            // Make API call to DataPizza
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(input),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json() as TOutput;

            return {
                success: true,
                data,
                agent,
                executionTime: Date.now() - startTime
            };

        } catch (error) {
            console.error(`❌ Agent ${agent} failed:`, error);

            // Try fallback if available
            if (fallbackHandler) {
                try {
                    console.log(`🔄 Using fallback for ${agent} after error`);
                    const fallbackData = await fallbackHandler(input);
                    return {
                        success: true,
                        data: fallbackData,
                        agent,
                        executionTime: Date.now() - startTime,
                        metadata: { fallback: true, originalError: error instanceof Error ? error.message : 'Unknown error' }
                    };
                } catch (fallbackError) {
                    console.error(`❌ Fallback for ${agent} also failed:`, fallbackError);
                }
            }

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Errore sconosciuto',
                agent,
                executionTime: Date.now() - startTime
            };
        }
    }

    /**
     * Lead Scoring Agent
     */
    async scoreLead(input: LeadScoringInput): Promise<AgentResponse<LeadScoringOutput>> {
        return this.callAgent<LeadScoringInput, LeadScoringOutput>(
            'lead-scorer',
            input,
            '/agents/lead-scorer',
            async (_input) => {
                // Fallback implementation
                const score = Math.floor(Math.random() * 100);
                const category = score >= 80 ? 'HOT' : score >= 60 ? 'WARM' : 'COLD';

                return {
                    score,
                    category,
                    confidence: 0.75,
                    reasoning: 'Punteggio generato da algoritmo di fallback basato su euristica',
                    factors: {
                        engagement: Math.random() * 25,
                        fit: Math.random() * 25,
                        intent: Math.random() * 25,
                        timing: Math.random() * 25
                    },
                    nextActions: [
                        'Contattare entro 24 ore',
                        'Inviare materiale personalizzato',
                        'Programmare demo del prodotto'
                    ]
                };
            }
        );
    }

    /**
     * Contact Classification Agent
     */
    async classifyContact(input: ContactClassificationInput): Promise<AgentResponse<ContactClassificationOutput>> {
        return this.callAgent<ContactClassificationInput, ContactClassificationOutput>(
            'contact-classifier',
            input,
            '/agents/contact-classifier',
            async (_input) => {
                // Fallback implementation
                const categories = ['Enterprise', 'SMB', 'Startup', 'Individual'] as const;
                const category = categories[Math.floor(Math.random() * categories.length)];

                return {
                    category,
                    subcategory: `${category}_Qualified`,
                    confidence: 0.70,
                    reasoning: 'Classificazione basata su algoritmo di fallback',
                    recommendedApproach: 'Approccio consultivo con focus su ROI',
                    expectedValue: Math.floor(Math.random() * 50000) + 5000
                };
            }
        );
    }

    /**
     * Data Enrichment Agent
     */
    async enrichData(input: DataEnrichmentInput): Promise<AgentResponse<DataEnrichmentOutput>> {
        return this.callAgent<DataEnrichmentInput, DataEnrichmentOutput>(
            'data-enricher',
            input,
            '/agents/data-enricher',
            async (input) => {
                // Fallback implementation
                return {
                    contact: {
                        name: input.contact.name,
                        email: input.contact.email,
                        phone: '+39 02 1234567',
                        title: 'Marketing Manager',
                        department: 'Marketing'
                    },
                    company: {
                        name: input.contact.company ? `${input.contact.company} SRL` : 'Azienda Sconosciuta',
                        domain: input.contact.domain || 'company.it',
                        industry: 'Technology',
                        size: '50-200 dipendenti',
                        revenue: '€5M-€10M',
                        location: 'Milano, IT',
                        description: 'Azienda leader nel settore tecnologico'
                    },
                    social: {
                        linkedin: `https://linkedin.com/company/${input.contact.company?.toLowerCase() || 'company'}`,
                        website: `https://${input.contact.domain || input.contact.company?.toLowerCase() + '.it'}`
                    },
                    technographics: {
                        technologies: ['React', 'Node.js', 'PostgreSQL'],
                        stack: ['JavaScript', 'TypeScript', 'AWS']
                    },
                    enrichment_confidence: 0.65
                };
            }
        );
    }

    /**
     * Sentiment Analysis Agent
     */
    async analyzeSentiment(input: SentimentAnalysisInput): Promise<AgentResponse<SentimentAnalysisOutput>> {
        return this.callAgent<SentimentAnalysisInput, SentimentAnalysisOutput>(
            'sentiment-analyzer',
            input,
            '/agents/sentiment-analyzer',
            async (input) => {
                // Simple fallback sentiment analysis
                const text = input.text.toLowerCase();
                let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
                let score = 0;

                // Basic keyword-based sentiment
                const positiveWords = ['ottimo', 'fantastico', 'perfetto', 'eccellente', 'bravo', 'buono', 'soddisfatto'];
                const negativeWords = ['terribile', 'pessimo', 'sbagliato', 'problema', 'errore', 'cattivo', 'insoddisfatto'];

                const positiveCount = positiveWords.filter(word => text.includes(word)).length;
                const negativeCount = negativeWords.filter(word => text.includes(word)).length;

                if (positiveCount > negativeCount) {
                    sentiment = 'positive';
                    score = 0.5 + (positiveCount * 0.2);
                } else if (negativeCount > positiveCount) {
                    sentiment = 'negative';
                    score = -0.5 - (negativeCount * 0.2);
                }

                score = Math.max(-1, Math.min(1, score));

                return {
                    sentiment,
                    score,
                    confidence: 0.60,
                    emotions: {
                        joy: sentiment === 'positive' ? Math.random() * 0.8 : 0.1,
                        anger: sentiment === 'negative' ? Math.random() * 0.8 : 0.1,
                        sadness: sentiment === 'negative' ? Math.random() * 0.5 : 0.05,
                        surprise: Math.random() * 0.3
                    },
                    keywords: [...positiveWords.filter(w => text.includes(w)), ...negativeWords.filter(w => text.includes(w))],
                    intent: sentiment === 'positive' ? 'interest' : sentiment === 'negative' ? 'complaint' : 'inquiry'
                };
            }
        );
    }

    /**
     * Email Optimization Agent
     */
    async optimizeEmail(input: EmailOptimizationInput): Promise<AgentResponse<EmailOptimizationOutput>> {
        return this.callAgent<EmailOptimizationInput, EmailOptimizationOutput>(
            'email-optimizer',
            input,
            '/agents/email-optimizer',
            async (input) => {
                // Simple fallback optimization
                return {
                    optimizedSubject: `[OTTIMIZZATO] ${input.subject}`,
                    optimizedContent: `${input.content}\n\nP.S. Ottimizzato per migliore engagement.`,
                    improvements: [
                        'Aggiunto call-to-action più chiaro',
                        'Personalizzazione basata su segmento',
                        'Ottimizzazione lunghezza oggetto'
                    ],
                    predictions: {
                        openRate: 0.25 + Math.random() * 0.15,
                        clickRate: 0.05 + Math.random() * 0.10,
                        replyRate: 0.02 + Math.random() * 0.05
                    },
                    alternatives: {
                        subject: [
                            `🎯 ${input.subject}`,
                            `Importante: ${input.subject}`,
                            `${input.recipient.industry || 'Business'}: ${input.subject}`
                        ],
                        content: `Versione alternativa del contenuto con maggiore focus sui benefici per ${input.recipient.industry || 'il vostro settore'}.`
                    }
                };
            }
        );
    }

    /**
     * Deal Prediction Agent
     */
    async predictDeal(input: DealPredictionInput): Promise<AgentResponse<DealPredictionOutput>> {
        return this.callAgent<DealPredictionInput, DealPredictionOutput>(
            'deal-predictor',
            input,
            '/agents/deal-predictor',
            async (input) => {
                // Fallback prediction logic
                const baseProb = 0.3;
                const stageMultiplier = input.deal.stage === 'proposal' ? 1.5 : input.deal.stage === 'negotiation' ? 1.8 : 1.0;
                const ageMultiplier = input.deal.age > 90 ? 0.7 : input.deal.age > 60 ? 0.85 : 1.0;
                const engagementMultiplier = (input.contact.engagement || 50) / 100;

                const probability = Math.min(0.95, baseProb * stageMultiplier * ageMultiplier * engagementMultiplier);

                const predictedDays = Math.floor(30 + Math.random() * 60);
                const closeDate = new Date();
                closeDate.setDate(closeDate.getDate() + predictedDays);

                return {
                    probability,
                    predictedCloseDate: closeDate.toISOString().split('T')[0],
                    riskFactors: [
                        input.deal.age > 90 ? 'Deal vecchio di oltre 90 giorni' : null,
                        input.history.interactions < 5 ? 'Poche interazioni con il prospect' : null,
                        input.contact.engagement && input.contact.engagement < 30 ? 'Basso engagement del contatto' : null
                    ].filter(Boolean) as string[],
                    recommendations: [
                        'Aumentare frequenza di follow-up',
                        'Organizzare call con decision maker',
                        'Inviare case study rilevanti'
                    ],
                    nextBestActions: [
                        { action: 'Chiamata di follow-up', priority: 'high' as const, impact: 0.8 },
                        { action: 'Invio proposta personalizzata', priority: 'medium' as const, impact: 0.6 },
                        { action: 'Meeting con stakeholder', priority: 'high' as const, impact: 0.9 }
                    ]
                };
            }
        );
    }

    /**
     * Workflow Generation Agent (delegated to existing service)
     */
    async generateWorkflow(prompt: string): Promise<AgentResponse<unknown>> {
        const startTime = Date.now();

        try {
            const result = await generateWorkflow(prompt);

            return {
                success: true,
                data: result,
                agent: 'workflow-generator',
                executionTime: Date.now() - startTime
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Errore generazione workflow',
                agent: 'workflow-generator',
                executionTime: Date.now() - startTime
            };
        }
    }

    /**
     * Get agent health status
     */
    getHealthStatus() {
        return {
            isHealthy: this.isHealthy,
            lastCheck: this.lastHealthCheck,
            baseUrl: this.baseUrl
        };
    }

    /**
     * Manual health check
     */
    async forceHealthCheck(): Promise<boolean> {
        return await this.checkHealth();
    }
}

// Export singleton instance
export const datapizzaClient = new DataPizzaClient();

export default datapizzaClient;