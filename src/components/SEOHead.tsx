import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  structuredData?: Record<string, unknown>;
}

export const SEOHead: React.FC<SEOHeadProps> = ({
  title = "Guardian AI CRM - Il Primo CRM 100% AI Nativo in Italia",
  description = "Trasforma il tuo business con l'intelligenza artificiale integrata nativamente. CRM specializzato per assicurazioni e marketing con automazione completa.",
  keywords = "CRM, intelligenza artificiale, AI, automazione, assicurazioni, marketing, gestione clienti, vendite",
  canonical,
  ogTitle,
  ogDescription,
  ogImage = "/og-image.jpg",
  structuredData
}) => {
  const fullTitle = title.includes('Guardian AI CRM') ? title : `${title} | Guardian AI CRM`;
  
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Guardian AI CRM" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph */}
      <meta property="og:title" content={ogTitle || fullTitle} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Guardian AI CRM" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle || fullTitle} />
      <meta name="twitter:description" content={ogDescription || description} />
      <meta name="twitter:image" content={ogImage} />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};