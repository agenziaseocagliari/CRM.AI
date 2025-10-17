/**
 * SEO Configuration for Guardian AI CRM - Italian Localization
 * Provides comprehensive meta tags and structured data for Italian market
 */

export const SEO_CONFIG = {
  site: {
    name: 'Guardian AI CRM',
    titleTemplate: '%s | Guardian AI CRM - Gestione Clienti Intelligente',
    description: 'Piattaforma CRM leader in Italia con AI integrata per assicurazioni, vendite e marketing automation. Aumenta le conversioni del 300%+',
    url: 'https://guardian-ai-crm.com',
    locale: 'it_IT',
    image: '/og-image-it.jpg',
  },
  
  keywords: {
    global: [
      'CRM Italia', 'gestione clienti', 'automazione vendite', 'AI marketing',
      'software CRM', 'lead management', 'pipeline vendite'
    ],
    insurance: [
      'CRM assicurazioni', 'gestione polizze', 'sinistri online', 'provvigioni assicurative',
      'scadenzario polizze', 'assicurazioni digitali', 'agenti assicurativi'
    ]
  },
  
  pages: {
    home: {
      title: 'Guardian AI CRM - Software Gestione Clienti Leader in Italia',
      description: 'Trasforma il tuo business con il CRM più avanzato d\'Italia. AI integrata, automazioni intelligenti, risultati garantiti. Prova gratuita 30 giorni.',
      keywords: ['CRM Italia', 'software gestione clienti', 'AI vendite', 'automazione marketing']
    },
    
    insurance: {
      dashboard: {
        title: 'Dashboard Assicurazioni - Panoramica Completa',
        description: 'Controlla tutte le tue attività assicurative: polizze attive, sinistri, scadenze e performance agenti in un\'unica dashboard intelligente.',
        keywords: ['dashboard assicurazioni', 'gestione polizze', 'controllo sinistri']
      },
      
      policies: {
        title: 'Gestione Polizze Assicurative - Controllo Totale',
        description: 'Sistema completo per gestire polizze vita, auto, casa. Scadenzario automatico, rinnovi intelligenti, tracking commissioni.',
        keywords: ['gestione polizze', 'assicurazioni online', 'rinnovi automatici']
      },
      
      claims: {
        title: 'Gestione Sinistri - Processo Digitalizzato',
        description: 'Gestisci sinistri assicurativi in modo efficiente: apertura pratica, documentazione, follow-up automatico, reporting completo.',
        keywords: ['gestione sinistri', 'sinistri online', 'pratica sinistro']
      },
      
      commissions: {
        title: 'Calcolo Provvigioni Assicurative - Precisione Garantita',
        description: 'Calcolo automatico provvigioni, tracking pagamenti, report dettagliati per agenti e broker assicurativi.',
        keywords: ['provvigioni assicurative', 'calcolo commissioni', 'agenti assicurativi']
      }
    },
    
    contacts: {
      title: 'Gestione Contatti CRM - Database Clienti Avanzato',
      description: 'Centralizza tutti i contatti: lead, prospect, clienti. Segmentazione intelligente, storico completo, integrazione WhatsApp.',
      keywords: ['gestione contatti', 'database clienti', 'CRM contatti']
    },
    
    opportunities: {
      title: 'Pipeline Vendite - Converti Più Lead in Clienti',
      description: 'Gestisci il processo di vendita completo: lead qualification, follow-up automatico, previsioni AI, chiusura deal.',
      keywords: ['pipeline vendite', 'gestione opportunità', 'conversione lead']
    }
  }
};

/**
 * Structured Data (JSON-LD) for Italian market SEO
 */
export const STRUCTURED_DATA = {
  organization: {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Guardian AI CRM',
    description: 'Piattaforma CRM con AI integrata per gestione clienti, vendite e marketing automation',
    url: 'https://guardian-ai-crm.com',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      description: 'Prova gratuita 30 giorni',
      eligibleRegion: 'IT'
    },
    author: {
      '@type': 'Organization',
      name: 'Guardian AI',
      url: 'https://guardian-ai-crm.com'
    },
    inLanguage: 'it-IT',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '150',
      bestRating: '5'
    }
  },
  
  breadcrumbs: (items: Array<{name: string, url: string}>) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  })
};

/**
 * Open Graph configurations for social sharing
 */
export const OPEN_GRAPH = {
  type: 'website',
  locale: 'it_IT',
  siteName: 'Guardian AI CRM',
  
  images: {
    default: {
      url: '/og-image-it.jpg',
      width: 1200,
      height: 630,
      alt: 'Guardian AI CRM - Gestione Clienti Intelligente'
    },
    insurance: {
      url: '/og-image-assicurazioni.jpg',
      width: 1200,
      height: 630,
      alt: 'CRM per Assicurazioni - Gestione Polizze e Sinistri'
    }
  }
};

/**
 * Twitter Card configurations
 */
export const TWITTER_CARD = {
  card: 'summary_large_image',
  site: '@GuardianAICRM',
  creator: '@GuardianAICRM'
};