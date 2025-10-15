/**
 * Comprehensive Node Library for Enterprise Automation Builder
 * Defines 50+ enterprise-grade node types across all categories
 */

export interface NodeDefinition {
    id: string;
    type: 'trigger' | 'action';
    category: string;
    label: string;
    description?: string;
    icon: string;
    color: string;
    config?: Array<{
        key: string;
        label: string;
        type: 'text' | 'textarea' | 'number' | 'select' | 'date' | 'checkbox';
        required?: boolean;
        placeholder?: string;
        options?: string[];
    }>;
}

export const NODE_LIBRARY: NodeDefinition[] = [
    // ========== TRIGGERS (15) ==========
    {
        id: 'trigger-form-submit',
        type: 'trigger',
        category: 'Forms',
        label: 'Invio Modulo',
        description: 'Si attiva quando un modulo viene inviato',
        icon: '📝',
        color: '#3B82F6',
        config: [
            { key: 'formId', label: 'ID Modulo', type: 'select', required: true }
        ]
    },
    {
        id: 'trigger-contact-created',
        type: 'trigger',
        category: 'CRM',
        label: 'Contatto Creato',
        description: 'Si attiva quando viene creato un nuovo contatto',
        icon: '👤',
        color: '#10B981'
    },
    {
        id: 'trigger-deal-won',
        type: 'trigger',
        category: 'CRM',
        label: 'Affare Vinto',
        description: 'Si attiva quando un affare viene chiuso positivamente',
        icon: '🎉',
        color: '#F59E0B'
    },
    {
        id: 'trigger-deal-lost',
        type: 'trigger',
        category: 'CRM',
        label: 'Affare Perso',
        description: 'Si attiva quando un affare viene perso',
        icon: '❌',
        color: '#EF4444'
    },
    {
        id: 'trigger-email-received',
        type: 'trigger',
        category: 'Email',
        label: 'Email Ricevuta',
        description: 'Si attiva quando viene ricevuta una email',
        icon: '📧',
        color: '#8B5CF6'
    },
    {
        id: 'trigger-task-completed',
        type: 'trigger',
        category: 'Tasks',
        label: 'Attività Completata',
        description: 'Si attiva quando viene completata un\'attività',
        icon: '✅',
        color: '#14B8A6'
    },
    {
        id: 'trigger-schedule-time',
        type: 'trigger',
        category: 'Time',
        label: 'Orario Programmato',
        description: 'Si attiva ad orari programmati (cron)',
        icon: '⏰',
        color: '#6366F1',
        config: [
            { key: 'schedule', label: 'Pianificazione', type: 'text', placeholder: '0 9 * * *' }
        ]
    },
    {
        id: 'trigger-webhook',
        type: 'trigger',
        category: 'Integrations',
        label: 'Webhook Ricevuto',
        description: 'Si attiva quando viene ricevuto un webhook',
        icon: '🔗',
        color: '#EC4899'
    },
    {
        id: 'trigger-contact-updated',
        type: 'trigger',
        category: 'CRM',
        label: 'Contatto Aggiornato',
        description: 'Si attiva quando un contatto viene modificato',
        icon: '✏️',
        color: '#10B981'
    },
    {
        id: 'trigger-deal-stage-change',
        type: 'trigger',
        category: 'CRM',
        label: 'Cambio Fase Affare',
        description: 'Si attiva quando cambia la fase di un affare',
        icon: '🔄',
        color: '#F59E0B'
    },
    {
        id: 'trigger-tag-added',
        type: 'trigger',
        category: 'CRM',
        label: 'Tag Aggiunto',
        description: 'Si attiva quando viene aggiunto un tag',
        icon: '🏷️',
        color: '#10B981'
    },
    {
        id: 'trigger-file-uploaded',
        type: 'trigger',
        category: 'Files',
        label: 'File Caricato',
        description: 'Si attiva quando viene caricato un file',
        icon: '📎',
        color: '#6366F1'
    },
    {
        id: 'trigger-payment-received',
        type: 'trigger',
        category: 'Payments',
        label: 'Pagamento Ricevuto',
        description: 'Si attiva quando viene ricevuto un pagamento',
        icon: '💳',
        color: '#10B981'
    },
    {
        id: 'trigger-subscription-created',
        type: 'trigger',
        category: 'Subscriptions',
        label: 'Abbonamento Creato',
        description: 'Si attiva quando viene creato un abbonamento',
        icon: '🔔',
        color: '#8B5CF6'
    },
    {
        id: 'trigger-manual',
        type: 'trigger',
        category: 'Manual',
        label: 'Trigger Manuale',
        description: 'Trigger attivato manualmente',
        icon: '👆',
        color: '#6B7280'
    },

    // ========== AI ACTIONS (7) ==========
    {
        id: 'action-ai-score',
        type: 'action',
        category: 'AI',
        label: 'Punteggio AI',
        description: 'Calcola il punteggio AI per un lead',
        icon: '🤖',
        color: '#EC4899',
        config: [
            { key: 'scoreType', label: 'Tipo Punteggio', type: 'select', options: ['lead_quality', 'conversion_probability', 'churn_risk'] }
        ]
    },
    {
        id: 'action-ai-classify',
        type: 'action',
        category: 'AI',
        label: 'Classifica AI',
        description: 'Classifica automaticamente lead o contatti',
        icon: '🎯',
        color: '#EC4899'
    },
    {
        id: 'action-ai-enrich',
        type: 'action',
        category: 'AI',
        label: 'Arricchimento AI',
        description: 'Arricchisce i dati del contatto con AI',
        icon: '✨',
        color: '#EC4899'
    },
    {
        id: 'action-ai-sentiment',
        type: 'action',
        category: 'AI',
        label: 'Analisi Sentiment',
        description: 'Analizza il sentiment di testi o email',
        icon: '😊',
        color: '#EC4899'
    },
    {
        id: 'action-ai-email-optimize',
        type: 'action',
        category: 'AI',
        label: 'Ottimizza Email',
        description: 'Ottimizza il contenuto email con AI',
        icon: '📧',
        color: '#EC4899'
    },
    {
        id: 'action-ai-predict-deal',
        type: 'action',
        category: 'AI',
        label: 'Predici Chiusura',
        description: 'Predice la probabilità di chiusura affare',
        icon: '🔮',
        color: '#EC4899'
    },
    {
        id: 'action-ai-summarize',
        type: 'action',
        category: 'AI',
        label: 'Riassunto AI',
        description: 'Genera riassunto AI di contenuti',
        icon: '📝',
        color: '#EC4899'
    },

    // ========== CRM ACTIONS (8) ==========
    {
        id: 'action-create-contact',
        type: 'action',
        category: 'CRM',
        label: 'Crea Contatto',
        description: 'Crea un nuovo contatto nel CRM',
        icon: '👤',
        color: '#10B981',
        config: [
            { key: 'name', label: 'Nome', type: 'text', required: true },
            { key: 'email', label: 'Email', type: 'text', required: true },
            { key: 'phone', label: 'Telefono', type: 'text' }
        ]
    },
    {
        id: 'action-update-contact',
        type: 'action',
        category: 'CRM',
        label: 'Aggiorna Contatto',
        description: 'Aggiorna i dati di un contatto esistente',
        icon: '✏️',
        color: '#10B981'
    },
    {
        id: 'action-create-deal',
        type: 'action',
        category: 'CRM',
        label: 'Crea Affare',
        description: 'Crea un nuovo affare/opportunità',
        icon: '💼',
        color: '#F59E0B',
        config: [
            { key: 'title', label: 'Titolo', type: 'text', required: true },
            { key: 'value', label: 'Valore', type: 'number', required: true },
            { key: 'stage', label: 'Fase', type: 'select', options: ['prospect', 'qualified', 'proposal', 'negotiation'] }
        ]
    },
    {
        id: 'action-update-deal',
        type: 'action',
        category: 'CRM',
        label: 'Aggiorna Affare',
        description: 'Aggiorna lo stato di un affare',
        icon: '🔄',
        color: '#F59E0B'
    },
    {
        id: 'action-add-tag',
        type: 'action',
        category: 'CRM',
        label: 'Aggiungi Tag',
        description: 'Aggiunge un tag a contatto o affare',
        icon: '🏷️',
        color: '#10B981',
        config: [
            { key: 'tag', label: 'Tag', type: 'text', required: true }
        ]
    },
    {
        id: 'action-remove-tag',
        type: 'action',
        category: 'CRM',
        label: 'Rimuovi Tag',
        description: 'Rimuove un tag da contatto o affare',
        icon: '🗑️',
        color: '#EF4444'
    },
    {
        id: 'action-assign-user',
        type: 'action',
        category: 'CRM',
        label: 'Assegna Utente',
        description: 'Assegna un utente a contatto o affare',
        icon: '👥',
        color: '#6366F1'
    },
    {
        id: 'action-create-task',
        type: 'action',
        category: 'CRM',
        label: 'Crea Attività',
        description: 'Crea una nuova attività nel CRM',
        icon: '📋',
        color: '#8B5CF6',
        config: [
            { key: 'title', label: 'Titolo', type: 'text', required: true },
            { key: 'description', label: 'Descrizione', type: 'textarea' },
            { key: 'dueDate', label: 'Scadenza', type: 'date' }
        ]
    },

    // ========== EMAIL ACTIONS (3) ==========
    {
        id: 'action-send-email',
        type: 'action',
        category: 'Email',
        label: 'Invia Email',
        description: 'Invia una email personalizzata',
        icon: '✉️',
        color: '#3B82F6',
        config: [
            { key: 'to', label: 'Destinatario', type: 'text', required: true },
            { key: 'subject', label: 'Oggetto', type: 'text', required: true },
            { key: 'body', label: 'Corpo', type: 'textarea', required: true }
        ]
    },
    {
        id: 'action-send-template',
        type: 'action',
        category: 'Email',
        label: 'Invia Template',
        description: 'Invia un template email predefinito',
        icon: '📧',
        color: '#3B82F6',
        config: [
            { key: 'templateId', label: 'Template', type: 'select', required: true }
        ]
    },
    {
        id: 'action-schedule-email',
        type: 'action',
        category: 'Email',
        label: 'Email Programmata',
        description: 'Programma l\'invio di una email',
        icon: '⏰',
        color: '#3B82F6',
        config: [
            { key: 'sendAt', label: 'Invia Alle', type: 'date', required: true }
        ]
    },

    // ========== NOTIFICATIONS (3) ==========
    {
        id: 'action-send-notification',
        type: 'action',
        category: 'Notifications',
        label: 'Invia Notifica',
        description: 'Invia notifica interna al team',
        icon: '🔔',
        color: '#F59E0B',
        config: [
            { key: 'message', label: 'Messaggio', type: 'text', required: true },
            { key: 'priority', label: 'Priorità', type: 'select', options: ['low', 'normal', 'high', 'urgent'] }
        ]
    },
    {
        id: 'action-slack-message',
        type: 'action',
        category: 'Notifications',
        label: 'Messaggio Slack',
        description: 'Invia messaggio su Slack',
        icon: '💬',
        color: '#8B5CF6',
        config: [
            { key: 'channel', label: 'Canale', type: 'text', required: true },
            { key: 'message', label: 'Messaggio', type: 'textarea', required: true }
        ]
    },
    {
        id: 'action-sms',
        type: 'action',
        category: 'Notifications',
        label: 'Invia SMS',
        description: 'Invia messaggio SMS',
        icon: '📱',
        color: '#10B981',
        config: [
            { key: 'phone', label: 'Numero', type: 'text', required: true },
            { key: 'message', label: 'Messaggio', type: 'textarea', required: true }
        ]
    },

    // ========== INTEGRATIONS (5) ==========
    {
        id: 'action-webhook-call',
        type: 'action',
        category: 'Integrations',
        label: 'Chiama Webhook',
        description: 'Esegue chiamata HTTP a webhook esterno',
        icon: '🌐',
        color: '#14B8A6',
        config: [
            { key: 'url', label: 'URL', type: 'text', required: true },
            { key: 'method', label: 'Metodo', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE'], required: true },
            { key: 'headers', label: 'Headers', type: 'textarea' },
            { key: 'body', label: 'Body', type: 'textarea' }
        ]
    },
    {
        id: 'action-api-request',
        type: 'action',
        category: 'Integrations',
        label: 'Richiesta API',
        description: 'Esegue richiesta API generica',
        icon: '🔌',
        color: '#14B8A6'
    },
    {
        id: 'action-database-query',
        type: 'action',
        category: 'Integrations',
        label: 'Query Database',
        description: 'Esegue query su database esterno',
        icon: '🗄️',
        color: '#6366F1',
        config: [
            { key: 'query', label: 'Query SQL', type: 'textarea', required: true }
        ]
    },
    {
        id: 'action-google-sheets',
        type: 'action',
        category: 'Integrations',
        label: 'Google Sheets',
        description: 'Interagisce con Google Sheets',
        icon: '📊',
        color: '#10B981',
        config: [
            { key: 'spreadsheetId', label: 'ID Foglio', type: 'text', required: true },
            { key: 'action', label: 'Azione', type: 'select', options: ['read', 'write', 'append'] }
        ]
    },
    {
        id: 'action-zapier',
        type: 'action',
        category: 'Integrations',
        label: 'Zapier Action',
        description: 'Trigger Zapier webhook',
        icon: '⚡',
        color: '#FF4F00'
    },

    // ========== LOGIC & CONTROL (9) ==========
    {
        id: 'action-condition-if',
        type: 'action',
        category: 'Logic',
        label: 'Se/Allora/Altrimenti',
        description: 'Condizione logica con branch alternativi',
        icon: '🔀',
        color: '#F59E0B',
        config: [
            { key: 'condition', label: 'Condizione', type: 'text', required: true, placeholder: 'score > 80' },
            { key: 'operator', label: 'Operatore', type: 'select', options: ['>', '<', '>=', '<=', '==', '!=', 'contains'] }
        ]
    },
    {
        id: 'action-switch',
        type: 'action',
        category: 'Logic',
        label: 'Switch Multiplo',
        description: 'Switch con condizioni multiple',
        icon: '🎛️',
        color: '#F59E0B'
    },
    {
        id: 'action-loop-foreach',
        type: 'action',
        category: 'Logic',
        label: 'Per Ogni Elemento',
        description: 'Ciclo per ogni elemento in una lista',
        icon: '🔁',
        color: '#8B5CF6',
        config: [
            { key: 'collection', label: 'Collezione', type: 'text', required: true }
        ]
    },
    {
        id: 'action-wait',
        type: 'action',
        category: 'Logic',
        label: 'Attendi',
        description: 'Pausa l\'esecuzione per un tempo determinato',
        icon: '⏸️',
        color: '#6366F1',
        config: [
            { key: 'duration', label: 'Durata (min)', type: 'number', required: true },
            { key: 'unit', label: 'Unità', type: 'select', options: ['seconds', 'minutes', 'hours', 'days'] }
        ]
    },
    {
        id: 'action-wait-until',
        type: 'action',
        category: 'Logic',
        label: 'Attendi Fino A',
        description: 'Attende fino a una condizione specifica',
        icon: '⏰',
        color: '#6366F1',
        config: [
            { key: 'condition', label: 'Condizione', type: 'text', required: true }
        ]
    },
    {
        id: 'action-filter',
        type: 'action',
        category: 'Logic',
        label: 'Filtra Dati',
        description: 'Filtra dati in base a criteri',
        icon: '🔍',
        color: '#10B981',
        config: [
            { key: 'criteria', label: 'Criteri', type: 'text', required: true }
        ]
    },
    {
        id: 'action-transform',
        type: 'action',
        category: 'Logic',
        label: 'Trasforma Dati',
        description: 'Trasforma formato o struttura dati',
        icon: '🔄',
        color: '#8B5CF6'
    },
    {
        id: 'action-merge',
        type: 'action',
        category: 'Logic',
        label: 'Unisci Dati',
        description: 'Combina dati da fonti multiple',
        icon: '🔗',
        color: '#10B981'
    },
    {
        id: 'action-split',
        type: 'action',
        category: 'Logic',
        label: 'Dividi Dati',
        description: 'Divide dati in parti separate',
        icon: '✂️',
        color: '#EF4444'
    },

    // ========== DATA & FILES (3) ==========
    {
        id: 'action-csv-export',
        type: 'action',
        category: 'Data',
        label: 'Esporta CSV',
        description: 'Esporta dati in formato CSV',
        icon: '📄',
        color: '#6366F1'
    },
    {
        id: 'action-pdf-generate',
        type: 'action',
        category: 'Data',
        label: 'Genera PDF',
        description: 'Genera documento PDF',
        icon: '📄',
        color: '#EF4444'
    },
    {
        id: 'action-data-backup',
        type: 'action',
        category: 'Data',
        label: 'Backup Dati',
        description: 'Crea backup dei dati',
        icon: '💾',
        color: '#6B7280'
    }
];

/**
 * Get node definition by ID
 */
export function getNodeDefinition(id: string): NodeDefinition | undefined {
    return NODE_LIBRARY.find(node => node.id === id);
}

/**
 * Get nodes by category
 */
export function getNodesByCategory(category: string): NodeDefinition[] {
    return NODE_LIBRARY.filter(node => node.category === category);
}

/**
 * Get all available categories
 */
export function getCategories(): string[] {
    return [...new Set(NODE_LIBRARY.map(node => node.category))];
}

/**
 * Get nodes by type (trigger or action)
 */
export function getNodesByType(type: 'trigger' | 'action'): NodeDefinition[] {
    return NODE_LIBRARY.filter(node => node.type === type);
}

/**
 * Search nodes by query
 */
export function searchNodes(query: string): NodeDefinition[] {
    const lowerQuery = query.toLowerCase();
    return NODE_LIBRARY.filter(node =>
        node.label.toLowerCase().includes(lowerQuery) ||
        node.description?.toLowerCase().includes(lowerQuery) ||
        node.category.toLowerCase().includes(lowerQuery)
    );
}