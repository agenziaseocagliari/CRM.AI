/**
 * Centralized Italian route definitions for Guardian AI CRM
 * All user-facing URLs are in Italian for SEO optimization
 * Database/code remains in English per international standards
 */

export const ROUTES = {
    // ==========================================
    // INSURANCE VERTICAL
    // ==========================================
    insurance: {
        base: '/assicurazioni',
        dashboard: '/assicurazioni/dashboard',

        // Polizze (Policies)
        policies: '/assicurazioni/polizze',
        newPolicy: '/assicurazioni/polizze/nuova',
        editPolicy: (id: string) => `/assicurazioni/polizze/${id}/modifica`,
        policyDetail: (id: string) => `/assicurazioni/polizze/${id}`,
        // Legacy naming for backward compatibility
        policiesNew: '/assicurazioni/polizze/nuova',
        policiesDetail: (id: string) => `/assicurazioni/polizze/${id}`,
        policiesEdit: (id: string) => `/assicurazioni/polizze/${id}/modifica`,

        // Sinistri (Claims)
        claims: '/assicurazioni/sinistri',
        claimsNew: '/assicurazioni/sinistri/nuovo',
        claimsDetail: (id: string) => `/assicurazioni/sinistri/${id}`,

        // Provvigioni (Commissions)
        commissions: '/assicurazioni/provvigioni',

        // Scadenzario (Renewals)
        renewals: '/assicurazioni/scadenzario',

        // Clienti (Clients)
        clients: '/assicurazioni/clienti',
        clientsNew: '/assicurazioni/clienti/nuovo',
        clientsDetail: (id: string) => `/assicurazioni/clienti/${id}`,

        // Calendario (Calendar)
        calendar: '/assicurazioni/calendario',

        // Automazioni (Automations)
        automations: '/assicurazioni/automazioni',

        // Report
        reports: '/assicurazioni/report',
    },

    // ==========================================
    // STANDARD CRM
    // ==========================================

    // Dashboard (universal term)
    dashboard: '/dashboard',

    // Contatti (Contacts)
    contacts: '/contatti',
    contactsNew: '/contatti/nuovo',
    contactsDetail: (id: string | number) => `/contatti/${id}`,
    contactsEdit: (id: string | number) => `/contatti/${id}/modifica`,

    // Opportunità (Pipeline/Opportunities)
    opportunities: '/opportunita',
    opportunitiesNew: '/opportunita/nuova',
    opportunitiesDetail: (id: string) => `/opportunita/${id}`,
    opportunitiesEdit: (id: string) => `/opportunita/${id}/modifica`,

    // Calendario (Calendar)
    calendar: '/calendario',
    calendarNew: '/calendario/nuovo-evento',

    // Eventi (Events)
    events: '/eventi',
    eventsNew: '/eventi/nuovo',
    eventsDetail: (id: string) => `/eventi/${id}`,

    // Moduli (Forms)
    forms: '/moduli',
    formsNew: '/moduli/nuovo',
    formsDetail: (id: string) => `/moduli/${id}`,
    formsEdit: (id: string) => `/moduli/${id}/modifica`,

    // Automazioni (Automations)
    automations: '/automazioni',
    automationsNew: '/automazioni/nuova',
    automationsDetail: (id: string) => `/automazioni/${id}`,

    // Report
    reports: '/report',

    // WhatsApp (brand name - keep as is)
    whatsapp: '/whatsapp',

    // Email Marketing (keep compound English)
    emailMarketing: '/email-marketing',

    // Agenti AI (AI Agents)
    aiAgents: '/agenti-ai',

    // Store (universal)
    store: '/store',

    // Prezzi (Pricing)
    pricing: '/prezzi',

    // ==========================================
    // AUTH & SETTINGS
    // ==========================================
    login: '/accedi',
    signup: '/registrati',
    logout: '/esci',
    settings: '/impostazioni',
    profile: '/profilo',
    organizations: '/organizzazioni',

    // ==========================================
    // LANDING PAGES
    // ==========================================
    home: '/',
    insuranceLanding: '/assicurazioni',
} as const;

/**
 * Legacy English routes → Italian redirects
 * Maintains backward compatibility
 */
export const LEGACY_REDIRECTS: Record<string, string> = {
    // Insurance routes
    '/insurance': '/assicurazioni',
    '/insurance/dashboard': '/assicurazioni/dashboard',
    '/insurance/policies': '/assicurazioni/polizze',
    '/insurance/policies/new': '/assicurazioni/polizze/nuova',
    '/insurance/claims': '/assicurazioni/sinistri',
    '/insurance/commissions': '/assicurazioni/provvigioni',
    '/insurance/renewals': '/assicurazioni/scadenzario',
    '/insurance/contacts': '/assicurazioni/clienti',
    '/insurance/calendar': '/assicurazioni/calendario',
    '/insurance/automations': '/assicurazioni/automazioni',
    '/insurance/reports': '/assicurazioni/report',

    // Standard CRM routes
    '/contacts': '/contatti',
    '/contacts/new': '/contatti/nuovo',
    '/pipeline': '/opportunita',
    '/calendar': '/calendario',
    '/events': '/eventi',
    '/forms': '/moduli',
    '/automations': '/automazioni',
    '/reports': '/report',
    '/ai-agents': '/agenti-ai',

    // Auth routes
    '/login': '/accedi',
    '/signup': '/registrati',
    '/settings': '/impostazioni',
    '/profile': '/profilo',
    '/organizations': '/organizzazioni',
};

/**
 * SEO-friendly Italian page titles
 */
export const PAGE_TITLES = {
    insurance: {
        dashboard: 'Dashboard Assicurazioni',
        policies: 'Gestione Polizze',
        policiesNew: 'Nuova Polizza',
        policiesDetail: 'Dettaglio Polizza',
        claims: 'Gestione Sinistri',
        commissions: 'Provvigioni',
        renewals: 'Scadenzario Polizze',
        clients: 'Clienti Assicurativi',
    },
    contacts: 'Gestione Contatti',
    opportunities: 'Pipeline Opportunità',
    calendar: 'Calendario Eventi',
    forms: 'Moduli e Form',
    automations: 'Automazioni Marketing',
    reports: 'Report e Analytics',
};