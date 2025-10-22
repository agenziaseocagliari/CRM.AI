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
        dashboard: '/dashboard/assicurazioni/dashboard',

        // Polizze (Policies)
        policies: '/dashboard/assicurazioni/polizze',
        newPolicy: '/dashboard/assicurazioni/polizze/nuova',
        editPolicy: (id: string) => `/dashboard/assicurazioni/polizze/${id}/modifica`,
        policyDetail: (id: string) => `/dashboard/assicurazioni/polizze/${id}`,
        // Legacy naming for backward compatibility
        policiesNew: '/dashboard/assicurazioni/polizze/nuova',
        policiesDetail: (id: string) => `/dashboard/assicurazioni/polizze/${id}`,
        policiesEdit: (id: string) => `/dashboard/assicurazioni/polizze/${id}/modifica`,

        // Sinistri (Claims)
        claims: '/dashboard/assicurazioni/sinistri',
        claimsNew: '/dashboard/assicurazioni/sinistri/nuovo',
        claimsDetail: (id: string) => `/dashboard/assicurazioni/sinistri/${id}`,
        claimsEdit: (id: string) => `/dashboard/assicurazioni/sinistri/${id}/modifica`,

        // Provvigioni (Commissions)
        commissions: '/dashboard/assicurazioni/provvigioni',
        commissionsNew: '/dashboard/assicurazioni/provvigioni/nuovo',
        commissionsDetail: (id: string) => `/dashboard/assicurazioni/provvigioni/${id}`,
        commissionsEdit: (id: string) => `/dashboard/assicurazioni/provvigioni/${id}/modifica`,
        commissionsReports: '/dashboard/assicurazioni/provvigioni/report',

        // Scadenzario (Renewals)
        renewals: '/dashboard/assicurazioni/scadenzario',

        // Documenti (Documents)
        documents: '/dashboard/assicurazioni/documenti',

        // Valutazione Rischio (Risk Assessment)
        riskAssessment: '/dashboard/assicurazioni/valutazione-rischio',
        riskAssessmentNew: (contactId?: string) => contactId
            ? `/dashboard/assicurazioni/valutazione-rischio/${contactId}`
            : '/dashboard/assicurazioni/valutazione-rischio',
        riskAssessmentView: (profileId: string) => `/dashboard/assicurazioni/valutazione-rischio/view/${profileId}`,

        // Clienti (Clients)
        clients: '/dashboard/assicurazioni/clienti',
        clientsNew: '/dashboard/assicurazioni/clienti/nuovo',
        clientsDetail: (id: string) => `/dashboard/assicurazioni/clienti/${id}`,

        // Calendario (Calendar)
        calendar: '/dashboard/assicurazioni/calendario',

        // Automazioni (Automations)
        automations: '/dashboard/assicurazioni/automazioni',

        // Report
        reports: '/dashboard/assicurazioni/report',
    },

    // ==========================================
    // STANDARD CRM
    // ==========================================

    // Dashboard (universal term)
    dashboard: '/dashboard',

    // Contatti (Contacts)
    contacts: '/dashboard/contatti',
    contactsNew: '/dashboard/contatti/nuovo',
    contactsDetail: (id: string | number) => `/dashboard/contatti/${id}`,
    contactsEdit: (id: string | number) => `/dashboard/contatti/${id}/modifica`,

    // Opportunità (Pipeline/Opportunities)
    opportunities: '/dashboard/opportunita',
    opportunitiesNew: '/dashboard/opportunita/nuova',
    opportunitiesDetail: (id: string) => `/dashboard/opportunita/${id}`,
    opportunitiesEdit: (id: string) => `/dashboard/opportunita/${id}/modifica`,

    // Calendario (Calendar)
    calendar: '/dashboard/calendario',
    calendarNew: '/dashboard/calendario/nuovo-evento',

    // Eventi (Events)
    events: '/dashboard/eventi',
    eventsNew: '/dashboard/eventi/nuovo',
    eventsDetail: (id: string) => `/dashboard/eventi/${id}`,

    // Moduli (Forms)
    forms: '/dashboard/moduli',
    formsNew: '/dashboard/moduli/nuovo',
    formsDetail: (id: string) => `/dashboard/moduli/${id}`,
    formsEdit: (id: string) => `/dashboard/moduli/${id}/modifica`,

    // Automazioni (Automations)
    automations: '/dashboard/automazioni',
    automationsNew: '/dashboard/automazioni/nuova',
    automationsDetail: (id: string) => `/dashboard/automazioni/${id}`,

    // Report
    reports: '/dashboard/report',

    // WhatsApp (brand name - keep as is)
    whatsapp: '/dashboard/whatsapp',

    // Email Marketing (keep compound English)
    emailMarketing: '/dashboard/email-marketing',

    // Agenti AI (AI Agents)
    aiAgents: '/dashboard/agenti-ai',

    // Store (universal)
    store: '/dashboard/store',

    // Prezzi (Pricing)
    pricing: '/prezzi',

    // ==========================================
    // AUTH & SETTINGS
    // ==========================================
    login: '/accedi',
    signup: '/registrati',
    logout: '/esci',
    settings: '/dashboard/impostazioni',
    profile: '/dashboard/profilo',
    organizations: '/dashboard/organizzazioni',

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