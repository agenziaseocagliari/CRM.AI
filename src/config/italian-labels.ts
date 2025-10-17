/**
 * Italian Localization Constants
 * Complete UI text translations for Guardian AI CRM
 * Database/code remains in English per international standards
 */

export const ITALIAN_LABELS = {
  // ==========================================
  // NAVIGATION & MENU
  // ==========================================
  navigation: {
    dashboard: 'Dashboard',
    contacts: 'Contatti',
    opportunities: 'Opportunità',
    calendar: 'Calendario',
    events: 'Eventi',
    forms: 'Moduli',
    automations: 'Automazioni',
    reports: 'Report',
    whatsapp: 'WhatsApp',
    emailMarketing: 'Email Marketing',
    aiAgents: 'Agenti AI',
    settings: 'Impostazioni',
    profile: 'Profilo',
    organizations: 'Organizzazioni',
    logout: 'Esci',
  },

  // ==========================================
  // INSURANCE VERTICAL
  // ==========================================
  insurance: {
    title: 'Assicurazioni',
    dashboard: 'Dashboard Assicurazioni',
    policies: 'Polizze',
    policiesNew: 'Nuova Polizza',
    policiesManagement: 'Gestione Polizze',
    claims: 'Sinistri',
    claimsNew: 'Nuovo Sinistro',
    claimsManagement: 'Gestione Sinistri',
    commissions: 'Provvigioni',
    commissionsCalculation: 'Calcolo Provvigioni',
    renewals: 'Scadenzario',
    renewalsManagement: 'Gestione Scadenze',
    clients: 'Clienti',
    clientsNew: 'Nuovo Cliente',
    
    // Policy types
    policyTypes: {
      auto: 'Auto',
      home: 'Casa',
      life: 'Vita',
      health: 'Salute',
      business: 'Azienda',
      travel: 'Viaggio',
    },
    
    // Policy status
    policyStatus: {
      active: 'Attiva',
      expired: 'Scaduta',
      cancelled: 'Annullata',
      pending: 'In Attesa',
      suspended: 'Sospesa',
    },
    
    // Claims status
    claimsStatus: {
      open: 'Aperto',
      inProgress: 'In Lavorazione',
      closed: 'Chiuso',
      rejected: 'Respinto',
      approved: 'Approvato',
    }
  },

  // ==========================================
  // COMMON ACTIONS
  // ==========================================
  actions: {
    save: 'Salva',
    cancel: 'Annulla',
    delete: 'Elimina',
    edit: 'Modifica',
    view: 'Visualizza',
    create: 'Crea',
    update: 'Aggiorna',
    search: 'Cerca',
    filter: 'Filtra',
    export: 'Esporta',
    import: 'Importa',
    add: 'Aggiungi',
    remove: 'Rimuovi',
    confirm: 'Conferma',
    back: 'Indietro',
    next: 'Avanti',
    previous: 'Precedente',
    close: 'Chiudi',
    open: 'Apri',
    send: 'Invia',
    download: 'Scarica',
    upload: 'Carica',
  },

  // ==========================================
  // FORM FIELDS
  // ==========================================
  fields: {
    firstName: 'Nome',
    lastName: 'Cognome',
    fullName: 'Nome Completo',
    email: 'Email',
    phone: 'Telefono',
    mobile: 'Cellulare',
    address: 'Indirizzo',
    city: 'Città',
    zipCode: 'CAP',
    province: 'Provincia',
    region: 'Regione',
    country: 'Paese',
    company: 'Azienda',
    position: 'Posizione',
    website: 'Sito Web',
    notes: 'Note',
    description: 'Descrizione',
    title: 'Titolo',
    status: 'Stato',
    priority: 'Priorità',
    category: 'Categoria',
    type: 'Tipo',
    value: 'Valore',
    amount: 'Importo',
    date: 'Data',
    time: 'Ora',
    startDate: 'Data Inizio',
    endDate: 'Data Fine',
    dueDate: 'Data Scadenza',
    createdAt: 'Creato il',
    updatedAt: 'Aggiornato il',
    tags: 'Tag',
    source: 'Fonte',
    owner: 'Responsabile',
    assignedTo: 'Assegnato a',
  },

  // ==========================================
  // STATUS LABELS
  // ==========================================
  status: {
    active: 'Attivo',
    inactive: 'Inattivo',
    pending: 'In Attesa',
    completed: 'Completato',
    cancelled: 'Annullato',
    draft: 'Bozza',
    published: 'Pubblicato',
    archived: 'Archiviato',
    new: 'Nuovo',
    inProgress: 'In Corso',
    onHold: 'In Pausa',
    closed: 'Chiuso',
    approved: 'Approvato',
    rejected: 'Respinto',
  },

  // ==========================================
  // PRIORITY LABELS
  // ==========================================
  priority: {
    low: 'Bassa',
    medium: 'Media',
    high: 'Alta',
    urgent: 'Urgente',
    critical: 'Critica',
  },

  // ==========================================
  // CONTACTS & LEADS
  // ==========================================
  contacts: {
    title: 'Contatti',
    newContact: 'Nuovo Contatto',
    contactDetail: 'Dettaglio Contatto',
    editContact: 'Modifica Contatto',
    contactList: 'Lista Contatti',
    leadSource: 'Fonte Lead',
    contactStatus: 'Stato Contatto',
    customerType: 'Tipo Cliente',
    
    // Lead sources
    sources: {
      website: 'Sito Web',
      socialMedia: 'Social Media',
      advertising: 'Pubblicità',
      referral: 'Passaparola',
      coldCall: 'Chiamata a Freddo',
      email: 'Email',
      event: 'Evento',
      partner: 'Partner',
      other: 'Altro',
    },
    
    // Lead status
    leadStatus: {
      new: 'Nuovo',
      contacted: 'Contattato',
      qualified: 'Qualificato',
      proposal: 'Proposta',
      negotiation: 'Negoziazione',
      won: 'Vinto',
      lost: 'Perso',
    }
  },

  // ==========================================
  // OPPORTUNITIES & PIPELINE
  // ==========================================
  opportunities: {
    title: 'Opportunità',
    newOpportunity: 'Nuova Opportunità',
    opportunityDetail: 'Dettaglio Opportunità',
    pipeline: 'Pipeline',
    pipelineStages: 'Fasi Pipeline',
    expectedValue: 'Valore Atteso',
    probability: 'Probabilità',
    closeDate: 'Data Chiusura',
    
    // Pipeline stages
    stages: {
      lead: 'Lead',
      prospect: 'Prospetto',
      proposal: 'Proposta',
      negotiation: 'Negoziazione',
      closing: 'Chiusura',
      won: 'Vinta',
      lost: 'Persa',
    }
  },

  // ==========================================
  // CALENDAR & EVENTS
  // ==========================================
  calendar: {
    title: 'Calendario',
    newEvent: 'Nuovo Evento',
    eventDetail: 'Dettaglio Evento',
    today: 'Oggi',
    week: 'Settimana',
    month: 'Mese',
    day: 'Giorno',
    agenda: 'Agenda',
    
    // Event types
    eventTypes: {
      meeting: 'Riunione',
      call: 'Chiamata',
      appointment: 'Appuntamento',
      task: 'Attività',
      reminder: 'Promemoria',
      follow_up: 'Follow-up',
    }
  },

  // ==========================================
  // FORMS & AUTOMATION
  // ==========================================
  forms: {
    title: 'Moduli',
    newForm: 'Nuovo Modulo',
    formBuilder: 'Costruttore Moduli',
    submissions: 'Invii',
    fields: 'Campi',
    settings: 'Impostazioni',
    preview: 'Anteprima',
    publish: 'Pubblica',
  },

  automations: {
    title: 'Automazioni',
    newAutomation: 'Nuova Automazione',
    workflows: 'Flussi di Lavoro',
    triggers: 'Trigger',
    actions: 'Azioni',
    conditions: 'Condizioni',
    active: 'Attiva',
    inactive: 'Inattiva',
  },

  // ==========================================
  // MESSAGES & NOTIFICATIONS
  // ==========================================
  messages: {
    success: {
      saved: 'Salvato con successo',
      updated: 'Aggiornato con successo',
      created: 'Creato con successo',
      deleted: 'Eliminato con successo',
      sent: 'Inviato con successo',
    },
    error: {
      generic: 'Si è verificato un errore',
      notFound: 'Elemento non trovato',
      unauthorized: 'Non autorizzato',
      validation: 'Errore di validazione',
      network: 'Errore di connessione',
    },
    confirm: {
      delete: 'Sei sicuro di voler eliminare questo elemento?',
      cancel: 'Sei sicuro di voler annullare?',
      save: 'Vuoi salvare le modifiche?',
    }
  },

  // ==========================================
  // COMMON PHRASES
  // ==========================================
  common: {
    loading: 'Caricamento...',
    noData: 'Nessun dato disponibile',
    selectOption: 'Seleziona un\'opzione',
    searchPlaceholder: 'Cerca...',
    required: 'Obbligatorio',
    optional: 'Opzionale',
    yes: 'Sì',
    no: 'No',
    total: 'Totale',
    subtotal: 'Subtotale',
    tax: 'IVA',
    discount: 'Sconto',
    currency: '€',
    per: 'per',
    from: 'da',
    to: 'a',
    of: 'di',
    in: 'in',
    on: 'il',
    at: 'alle',
    by: 'da',
    with: 'con',
    without: 'senza',
    for: 'per',
    all: 'Tutti',
    none: 'Nessuno',
  }
};

/**
 * Utility function to get nested label values
 */
export const getLabel = (path: string, fallback?: string): string => {
  const keys = path.split('.');
  let current = ITALIAN_LABELS as Record<string, unknown>;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current && current[key] !== null) {
      current = current[key] as Record<string, unknown>;
    } else {
      return fallback || path;
    }
  }
  
  return typeof current === 'string' ? current : fallback || path;
};

/**
 * Hook for using Italian labels in components
 */
export const useItalianLabels = () => {
  return {
    labels: ITALIAN_LABELS,
    getLabel,
    t: getLabel, // Alias for easier usage
  };
};