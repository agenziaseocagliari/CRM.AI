/**
 * DataPizza Agent Client
 * TypeScript client for DataPizza Python services with fallback system
 */

interface ContactData {
    name: string
    email: string
    company?: string
    phone?: string
    organization_id?: string
}

interface ScoringResult {
    score: number
    category: 'hot' | 'warm' | 'cold'
    reasoning: string
    confidence: number
    agent_used: string
    breakdown: {
        email_quality: number
        company_fit: number
        engagement: number
        qualification: number
    }
    tools_available: string[]
    processing_time_ms: number
    model_used?: string
    timestamp: string
}

interface HealthStatus {
    status: string
    service: string
    version: string
    timestamp: string
    datapizza_available: boolean
    fallback_available: boolean
}

interface AnalysisResult extends ScoringResult {
    analysis_type: string
    recommendations: string[]
}

class DataPizzaClient {
    private baseUrl: string
    private timeout: number

    constructor() {
        // Use environment variable in production, localhost for development
        this.baseUrl = import.meta.env.VITE_DATAPIZZA_API_URL || 'http://localhost:8001'
        this.timeout = 30000 // 30 second timeout
    }

    /**
     * Score a lead using DataPizza AI agent
     */
    async scoreLead(contactData: ContactData): Promise<ScoringResult> {
        try {
            console.log(`🤖 DataPizza scoring: ${contactData.name}`)

            const response = await fetch(`${this.baseUrl}/score-lead`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contactData),
                signal: AbortSignal.timeout(this.timeout)
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`DataPizza API error (${response.status}): ${errorText}`)
            }

            const result = await response.json() as ScoringResult

            console.log(`✅ DataPizza scoring complete: ${result.score}/100 (${result.category})`)
            console.log(`🔧 Agent used: ${result.agent_used}`)

            return result

        } catch (error) {
            console.error('❌ DataPizza scoring failed:', error)

            // Re-throw with more context
            if (error instanceof Error) {
                throw new Error(`DataPizza scoring failed: ${error.message}`)
            }
            throw error
        }
    }

    /**
     * Perform extended contact analysis
     */
    async analyzeContact(contactData: ContactData): Promise<AnalysisResult> {
        try {
            console.log(`🔍 DataPizza analyzing: ${contactData.name}`)

            const response = await fetch(`${this.baseUrl}/analyze-contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contactData),
                signal: AbortSignal.timeout(this.timeout)
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`DataPizza API error (${response.status}): ${errorText}`)
            }

            const result = await response.json() as AnalysisResult

            console.log(`✅ DataPizza analysis complete: ${result.analysis_type}`)

            return result

        } catch (error) {
            console.error('❌ DataPizza analysis failed:', error)

            if (error instanceof Error) {
                throw new Error(`DataPizza analysis failed: ${error.message}`)
            }
            throw error
        }
    }

    /**
     * Check if DataPizza service is healthy and available
     */
    async healthCheck(): Promise<HealthStatus> {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000) // Quick health check
            })

            if (!response.ok) {
                throw new Error(`Health check failed: ${response.status}`)
            }

            const health = await response.json() as HealthStatus

            console.log(`💚 DataPizza health: ${health.status}`)
            return health

        } catch (error) {
            console.warn('⚠️ DataPizza health check failed:', error)

            // Return degraded status
            return {
                status: 'unavailable',
                service: 'datapizza-agents',
                version: 'unknown',
                timestamp: new Date().toISOString(),
                datapizza_available: false,
                fallback_available: true
            }
        }
    }

    /**
     * Check if DataPizza service is available (simple boolean check)
     */
    async isAvailable(): Promise<boolean> {
        try {
            const health = await this.healthCheck()
            return health.status === 'healthy'
        } catch {
            return false
        }
    }

    /**
     * Get agent status and capabilities
     */
    async getAgentStatus(): Promise<{
        agents: string[]
        models: string[]
        tools: string[]
        status: string
    }> {
        try {
            const response = await fetch(`${this.baseUrl}/agents/status`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            })

            if (!response.ok) {
                throw new Error(`Agent status check failed: ${response.status}`)
            }

            return await response.json()

        } catch (error) {
            console.warn('⚠️ Agent status check failed:', error)

            return {
                agents: ['fallback_algorithm'],
                models: ['basic_scoring'],
                tools: [],
                status: 'fallback'
            }
        }
    }

    /**
     * Test connection with a simple ping
     */
    async ping(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/`, {
                method: 'GET',
                signal: AbortSignal.timeout(3000)
            })

            return response.ok
        } catch {
            return false
        }
    }

    /**
     * Get service information
     */
    getServiceInfo(): {
        baseUrl: string
        timeout: number
        configured: boolean
    } {
        return {
            baseUrl: this.baseUrl,
            timeout: this.timeout,
            configured: this.baseUrl !== 'http://localhost:8001' // True if custom URL set
        }
    }
}

// Create singleton instance
export const dataPizzaClient = new DataPizzaClient()

// Export for advanced usage
export { DataPizzaClient }
export type { AnalysisResult, ContactData, HealthStatus, ScoringResult }

// Default export
export default dataPizzaClient