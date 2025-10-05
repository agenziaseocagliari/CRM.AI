/**
 * GUARDIAN AI CRM - SISTEMA PRICING BASATO SU CREDITI E COSTI REALI
 * Implementazione pricing competitivo per mercato italiano
 * Dat      real_cost: 675.22,
      margin: 68.8
    },
    
    business: {
      name: 'Business', 
      description: 'Per grandi agenzie e broker',
      price: 699,
      launch_price: 559, // primi 6 mesi
      billing: 'mensile',
      popular: false,
      tier_level: 4,5
 */

// Import disponibili da costAnalysis.ts per referenza
// import { INSURANCE_COST_ANALYSIS, MARKETING_COST_ANALYSIS, CREDIT_SYSTEM, LAUNCH_PRICING } from './costAnalysis';

// ===================================================================
// NUOVI PREZZI BASATI SU ANALISI COSTI REALI
// ===================================================================

export const COMPETITIVE_PRICING = {
  insurance_agency: {
    starter: {
      name: 'Starter',
      description: 'Perfetto per piccole agenzie che iniziano',
      price: 39,
      launch_price: 29, // primi 6 mesi
      billing: 'mensile',
      popular: false,
      tier_level: 1,
      features: [
        '500 clienti',
        '100 polizze gestite',
        '2.000 email/mese',
        '200 WhatsApp/mese',
        '50 SMS/mese',
        '2GB storage documenti',
        'Gestione rinnovi automatica',
        'Report base',
        'Supporto email'
      ],
      limits: {
        clients: 500,
        policies: 100,
        emails_month: 2000,
        whatsapp_month: 200,
        sms_month: 50,
        storage_gb: 2,
        users: 2
      },
      real_cost: 120.67,
      margin: 67.7 // margine percentuale
    },
    
    professional: {
      name: 'Professional',
      description: 'Per agenzie in crescita con più clienti',
      price: 79,
      launch_price: 59, // primi 6 mesi
      billing: 'mensile',
      popular: true,
      tier_level: 2,
      features: [
        '2.000 clienti',
        '500 polizze gestite',
        '8.000 email/mese',
        '800 WhatsApp/mese',
        '200 SMS/mese',
        '8GB storage documenti',
        'Automazioni avanzate',
        'Integrazioni IVASS',
        'Report avanzati',
        'Supporto prioritario'
      ],
      limits: {
        clients: 2000,
        policies: 500,
        emails_month: 8000,
        whatsapp_month: 800,
        sms_month: 200,
        storage_gb: 8,
        users: 5
      },
      real_cost: 202.66,
      margin: 61.0
    },
    
    premium: {
      name: 'Premium',
      description: 'Per agenzie multi-compagnia e specializzate',
      price: 199,
      launch_price: 159, // primi 6 mesi
      billing: 'mensile',
      popular: false,
      tier_level: 3,
      features: [
        '5.000 clienti',
        '1.000 polizze gestite',
        '20.000 email/mese',
        '2.000 WhatsApp/mese',
        '500 SMS/mese',
        '15GB storage documenti',
        'Multi-compagnia avanzata',
        'API personalizzate limitate',
        'Dashboard personalizzate',
        'Supporto telefonico prioritario'
      ],
      limits: {
        clients: 5000,
        policies: 1000,
        emails_month: 20000,
        whatsapp_month: 2000,
        sms_month: 500,
        storage_gb: 15,
        users: 10
      },
      real_cost: 318.45,
      margin: 64.2
    },
    
    advanced: {
      name: 'Advanced',
      description: 'Per agenzie consolidate con alto volume',
      price: 399,
      launch_price: 319, // primi 6 mesi
      billing: 'mensile',
      popular: false,
      tier_level: 4,
      features: [
        '15.000 clienti',
        '3.000 polizze gestite',
        '50.000 email/mese',
        '5.000 WhatsApp/mese',
        '1.200 SMS/mese',
        '50GB storage documenti',
        'Multi-compagnia completa',
        'API personalizzate complete',
        'White label parziale',
        'Integrazioni enterprise',
        'Account manager dedicato'
      ],
      limits: {
        clients: 15000,
        policies: 3000,
        emails_month: 50000,
        whatsapp_month: 5000,
        sms_month: 1200,
        storage_gb: 50,
        users: 25
      },
      real_cost: 433.78,
      margin: 65.6
    },
    
    business: {
      name: 'Business',
      description: 'Per grandi agenzie e broker',
      price: 699,
      launch_price: 559, // primi 6 mesi
      billing: 'mensile',
      popular: false,
      tier_level: 4,
      features: [
        '25.000 clienti',
        '5.000 polizze gestite',
        '100.000 email/mese',
        '8.000 WhatsApp/mese',
        '2.000 SMS/mese',
        '100GB storage documenti',
        'White label completo',
        'Multi-agenzia',
        'Integrazioni enterprise complete',
        'SLA garantito 99.9%',
        'Supporto dedicato 24/7'
      ],
      limits: {
        clients: 25000,
        policies: 5000,
        emails_month: 100000,
        whatsapp_month: 8000,
        sms_month: 2000,
        storage_gb: 100,
        users: 50
      },
      real_cost: 1847.33,
      margin: 69.8
    },
    
    enterprise: {
      name: 'Enterprise',
      description: 'Soluzione personalizzata con servizi dedicati',
      price: 1299,
      launch_price: 999, // primi 6 mesi
      billing: 'mensile',
      popular: false,
      tier_level: 5,
      features: [
        'Clienti illimitati',
        'Polizze illimitate', 
        'Email illimitate',
        'WhatsApp illimitati',
        'SMS illimitati',
        'Storage illimitato',
        'Sviluppo personalizzato completo',
        'Hosting dedicato privato',
        'Integrazioni custom illimitate',
        'White label 100% personalizzato',
        'Team di sviluppo dedicato',
        'Supporto 24/7 con SLA <1h',
        'Formazione avanzata inclusa',
        'Consulenza strategica mensile',
        'Backup e disaster recovery dedicato'
      ],
      limits: {
        clients: -1,
        policies: -1,
        emails_month: -1,
        whatsapp_month: -1,
        sms_month: -1,
        storage_gb: -1,
        users: -1
      },
      real_cost: 6850.75,
      margin: 85.4
    }
  },
  
  marketing_agency: {
    freelancer: {
      name: 'Freelancer',
      description: 'Perfetto per freelancer e consulenti',
      price: 49,
      launch_price: 29, // primi 6 mesi
      billing: 'mensile',
      popular: false,
      tier_level: 1,
      features: [
        '100 clienti',
        '5 campagne simultanee',
        '3.000 email/mese',
        '500 WhatsApp/mese',
        '5 automazioni marketing',
        '5 landing page',
        '1GB storage',
        'Analytics base',
        'Supporto email'
      ],
      limits: {
        clients: 100,
        projects: 25,
        campaigns: 5,
        emails_month: 5000,
        landing_pages: 5,
        storage_gb: 1,
        users: 1
      },
      real_cost: 104.05,
      margin: 72.1
    },
    
    agency: {
      name: 'Agency',
      description: 'Per piccole agenzie di marketing',
      price: 89,
      launch_price: 59, // primi 6 mesi
      billing: 'mensile',
      popular: true,
      tier_level: 2,
      features: [
        '500 clienti',
        '20 campagne simultanee',
        '8.000 email/mese',
        '1.500 WhatsApp/mese',
        '20 automazioni marketing',
        '20 landing page',
        '5GB storage',
        'ROI tracking avanzato',
        'Report clienti personalizzati',
        'Supporto prioritario'
      ],
      limits: {
        clients: 500,
        projects: 100,
        campaigns: 20,
        emails_month: 15000,
        landing_pages: 20,
        storage_gb: 5,
        users: 3
      },
      real_cost: 147.22,
      margin: 59.9
    },
    
    professional: {
      name: 'Professional',
      description: 'Per agenzie in crescita con più servizi',
      price: 149,
      launch_price: 99, // primi 6 mesi
      billing: 'mensile',
      popular: false,
      tier_level: 3,
      features: [
        '1.000 clienti',
        '30 campagne simultanee',
        '15.000 email/mese',
        '3.000 WhatsApp/mese',
        '50 automazioni marketing',
        '30 landing page',
        '10GB storage',
        'A/B testing avanzato',
        'ROI tracking dettagliato',
        'Automazioni multi-canale',
        'Report personalizzati'
      ],
      limits: {
        clients: 1000,
        projects: 200,
        campaigns: 30,
        emails_month: 25000,
        landing_pages: 30,
        storage_gb: 10,
        users: 5
      },
      real_cost: 196.18,
      margin: 64.8
    },
    
    studio: {
      name: 'Studio',
      description: 'Per studi creativi e agenzie medie',
      price: 299,
      launch_price: 199, // primi 6 mesi
      billing: 'mensile',
      popular: false,
      tier_level: 4,
      features: [
        '3.000 clienti',
        '75 campagne simultanee',
        '40.000 email/mese',
        '8.000 WhatsApp/mese',
        '100 automazioni marketing',
        '75 landing page',
        '30GB storage',
        'A/B testing avanzato',
        'Multi-channel campaigns',
        'Conversion tracking avanzato',
        'Dashboard personalizzate',
        'White label parziale',
        'Account manager dedicato'
      ],
      limits: {
        clients: 3000,
        projects: 750,
        campaigns: 75,
        emails_month: 75000,
        landing_pages: 75,
        storage_gb: 30,
        users: 15
      },
      real_cost: 342.18,
      margin: 68.1
    },
    
    business: {
      name: 'Business',
      description: 'Per network e holding di agenzie',
      price: 599,
      launch_price: 399, // primi 6 mesi
      billing: 'mensile',
      popular: false,
      tier_level: 4,
      features: [
        '10.000 clienti',
        '200 campagne simultanee',
        '100.000 email/mese',
        '20.000 WhatsApp/mese',
        '500 automazioni marketing',
        '200 landing page',
        '100GB storage',
        'White label completo',
        'Multi-agency management',
        'API personalizzate',
        'SLA garantito'
      ],
      limits: {
        clients: 10000,
        projects: 2000,
        campaigns: 200,
        emails_month: 200000,
        landing_pages: 200,
        storage_gb: 100,
        users: 25
      },
      real_cost: 756.45,
      margin: 65.2
    },
    
    enterprise: {
      name: 'Enterprise',
      description: 'Soluzione personalizzata con servizi dedicati',
      price: 899,
      launch_price: 699, // primi 6 mesi
      billing: 'mensile',
      popular: false,
      tier_level: 5,
      features: [
        'Clienti illimitati',
        'Campagne illimitate',
        'Email illimitate',
        'WhatsApp illimitato',
        'Automazioni illimitate',
        'Landing page illimitate',
        'Storage illimitato',
        'Sviluppo personalizzato completo',
        'Hosting dedicato privato',
        'Integrazioni custom illimitate',
        'White label 100% personalizzato',
        'Team di sviluppo dedicato',
        'Supporto 24/7 con SLA <1h',
        'Consulenza strategica settimanale',
        'Formazione avanzata team',
        'Backup e disaster recovery dedicato'
      ],
      limits: {
        clients: -1,
        projects: -1,
        campaigns: -1,
        emails_month: -1,
        landing_pages: -1,
        storage_gb: -1,
        users: -1
      },
      real_cost: 2847.66,
      margin: 79.2
    }
  }
};

// ===================================================================
// PACCHETTI CREDITI AGGIUNTIVI
// ===================================================================

export const CREDIT_PACKAGES = {
  small: {
    name: 'Pacchetto Small',
    credits: 1000,
    price: 9,
    bonus_credits: 0,
    description: 'Per piccoli extra mensili',
    equivalent_usage: {
      emails: '1.000 email aggiuntive',
      whatsapp: '20 WhatsApp aggiuntivi',
      sms: '12 SMS aggiuntivi',
      storage: '50GB storage aggiuntivi'
    }
  },
  
  medium: {
    name: 'Pacchetto Medium',
    credits: 5000,
    price: 39,
    bonus_credits: 500, // 10% bonus
    description: 'Ottimo rapporto qualità-prezzo',
    equivalent_usage: {
      emails: '5.500 email aggiuntive (con bonus)',
      whatsapp: '110 WhatsApp aggiuntivi (con bonus)',
      sms: '69 SMS aggiuntivi (con bonus)',
      storage: '275GB storage aggiuntivi (con bonus)'
    }
  },
  
  large: {
    name: 'Pacchetto Large',
    credits: 15000,
    price: 99,
    bonus_credits: 2000, // 13% bonus
    description: 'Per agenzie con volumi alti',
    equivalent_usage: {
      emails: '17.000 email aggiuntive (con bonus)',
      whatsapp: '340 WhatsApp aggiuntivi (con bonus)',
      sms: '212 SMS aggiuntivi (con bonus)',
      storage: '850GB storage aggiuntivi (con bonus)'
    }
  },
  
  enterprise: {
    name: 'Pacchetto Enterprise',
    credits: 50000,
    price: 299,
    bonus_credits: 10000, // 20% bonus
    description: 'Massima convenienza per grandi volumi',
    equivalent_usage: {
      emails: '60.000 email aggiuntive (con bonus)',
      whatsapp: '1.200 WhatsApp aggiuntivi (con bonus)',
      sms: '750 SMS aggiuntivi (con bonus)',
      storage: '3TB storage aggiuntivi (con bonus)'
    }
  }
};

// ===================================================================
// CONFRONTO COMPETITIVO MERCATO ITALIANO
// ===================================================================

export const MARKET_COMPARISON = {
  insurance_crm_competitors: {
    'Salesforce Insurance Cloud': {
      starting_price: 150,
      target: 'Enterprise',
      note: 'Troppo costoso per piccole agenzie'
    },
    'Applied Epic': {
      starting_price: 120,
      target: 'Mid-Market',
      note: 'Focalizzato su broker grandi'
    },
    'Nexsys': {
      starting_price: 89,
      target: 'Small-Medium',
      note: 'Competitor diretto Italia'
    },
    'Guardian AI CRM': {
      starting_price: 39, // prezzo lancio
      regular_price: 69,
      target: 'All segments',
      note: 'Prezzo più competitivo del mercato'
    }
  },
  
  marketing_crm_competitors: {
    'HubSpot Marketing': {
      starting_price: 45,
      target: 'Small-Medium',
      note: 'Competitor diretto'
    },
    'Mailchimp All-in-One': {
      starting_price: 35,
      target: 'Small Business',
      note: 'Limitato per agenzie'
    },
    'ActiveCampaign': {
      starting_price: 29,
      target: 'Small-Medium',
      note: 'Forte competitor'
    },
    'Guardian AI CRM': {
      starting_price: 29, // prezzo lancio
      regular_price: 49,
      target: 'All segments',
      note: 'Competitivo con migliori funzionalità AI'
    }
  }
};

// ===================================================================
// STRATEGIA DI LANCIO
// ===================================================================

export const LAUNCH_STRATEGY = {
  phase_1: {
    duration: '3 mesi',
    focus: 'Early Adopters',
    discount: '50%',
    target_customers: 50,
    goal: 'Raccogliere feedback e testimonial'
  },
  
  phase_2: {
    duration: '3 mesi',
    focus: 'Market Penetration',
    discount: '35%',
    target_customers: 200,
    goal: 'Acquisire quota di mercato'
  },
  
  phase_3: {
    duration: 'ongoing',
    focus: 'Premium Value',
    discount: '0%',
    target_customers: 1000,
    goal: 'Posizionamento premium con valore superiore'
  },
  
  success_metrics: {
    churn_rate: '<5%',
    customer_satisfaction: '>4.5/5',
    monthly_growth: '>20%',
    ltv_cac_ratio: '>3:1'
  }
};

export default {
  COMPETITIVE_PRICING,
  CREDIT_PACKAGES,
  MARKET_COMPARISON,
  LAUNCH_STRATEGY
};