/**
 * PageMeta Component - Dynamic SEO Meta Tags Manager
 * Integrates with react-helmet-async for Italian SEO optimization
 */

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { SEO_CONFIG, STRUCTURED_DATA, TWITTER_CARD } from '../config/seo';

interface PageMetaProps {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  structuredData?: object;
  breadcrumbs?: Array<{name: string, url: string}>;
  noIndex?: boolean;
  canonical?: string;
}

export const PageMeta: React.FC<PageMetaProps> = ({
  title = '',
  description = SEO_CONFIG.site.description,
  keywords = SEO_CONFIG.keywords.global,
  image = SEO_CONFIG.site.image,
  url = SEO_CONFIG.site.url,
  type = 'website',
  structuredData,
  breadcrumbs,
  noIndex = false,
  canonical
}) => {
  // Format title with template
  const formattedTitle = title 
    ? SEO_CONFIG.site.titleTemplate.replace('%s', title)
    : SEO_CONFIG.site.name;

  // Full URL construction
  const fullUrl = url.startsWith('http') ? url : `${SEO_CONFIG.site.url}${url}`;
  const fullImageUrl = image.startsWith('http') ? image : `${SEO_CONFIG.site.url}${image}`;

  // Generate structured data
  const defaultStructuredData = breadcrumbs 
    ? STRUCTURED_DATA.breadcrumbs(breadcrumbs)
    : STRUCTURED_DATA.organization;

  const finalStructuredData = structuredData || defaultStructuredData;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{formattedTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="author" content="Guardian AI" />
      <meta name="language" content="Italian" />
      <meta name="robots" content={noIndex ? 'noindex,nofollow' : 'index,follow'} />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={formattedTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title || SEO_CONFIG.site.name} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content={SEO_CONFIG.site.name} />
      <meta property="og:locale" content={SEO_CONFIG.site.locale} />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content={TWITTER_CARD.card} />
      <meta name="twitter:site" content={TWITTER_CARD.site} />
      <meta name="twitter:creator" content={TWITTER_CARD.creator} />
      <meta name="twitter:title" content={formattedTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      
      {/* Additional SEO Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Language" content="it" />
      <meta name="geo.region" content="IT" />
      <meta name="geo.country" content="Italy" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(finalStructuredData)}
      </script>
      
      {/* Preconnect to external resources */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Favicon and App Icons */}
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />
      <meta name="theme-color" content="#3B82F6" />
    </Helmet>
  );
};

/**
 * Pre-configured PageMeta components for common pages
 */
export const InsuranceDashboardMeta: React.FC = () => (
  <PageMeta
    title={SEO_CONFIG.pages.insurance.dashboard.title}
    description={SEO_CONFIG.pages.insurance.dashboard.description}
    keywords={[...SEO_CONFIG.keywords.global, ...SEO_CONFIG.keywords.insurance]}
    url="/assicurazioni/dashboard"
    image="/og-image-assicurazioni.jpg"
    breadcrumbs={[
      { name: 'Home', url: '/' },
      { name: 'Assicurazioni', url: '/assicurazioni' },
      { name: 'Dashboard', url: '/assicurazioni/dashboard' }
    ]}
  />
);

export const InsurancePoliciesMeta: React.FC = () => (
  <PageMeta
    title={SEO_CONFIG.pages.insurance.policies.title}
    description={SEO_CONFIG.pages.insurance.policies.description}
    keywords={[...SEO_CONFIG.keywords.insurance, 'gestione polizze', 'assicurazioni online']}
    url="/assicurazioni/polizze"
    image="/og-image-assicurazioni.jpg"
    breadcrumbs={[
      { name: 'Home', url: '/' },
      { name: 'Assicurazioni', url: '/assicurazioni' },
      { name: 'Polizze', url: '/assicurazioni/polizze' }
    ]}
  />
);

export const ContactsMeta: React.FC = () => (
  <PageMeta
    title={SEO_CONFIG.pages.contacts.title}
    description={SEO_CONFIG.pages.contacts.description}
    keywords={[...SEO_CONFIG.keywords.global, 'gestione contatti', 'database clienti']}
    url="/contatti"
    breadcrumbs={[
      { name: 'Home', url: '/' },
      { name: 'Contatti', url: '/contatti' }
    ]}
  />
);

export const OpportunitiesMeta: React.FC = () => (
  <PageMeta
    title={SEO_CONFIG.pages.opportunities.title}
    description={SEO_CONFIG.pages.opportunities.description}
    keywords={[...SEO_CONFIG.keywords.global, 'pipeline vendite', 'opportunità']}
    url="/opportunita"
    breadcrumbs={[
      { name: 'Home', url: '/' },
      { name: 'Opportunità', url: '/opportunita' }
    ]}
  />
);