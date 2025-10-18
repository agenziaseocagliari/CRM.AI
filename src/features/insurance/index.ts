import React from 'react';
import PlaceholderPage from '../../components/PlaceholderPage';

// Insurance vertical module - Phase 1.1 Complete Implementation

export { default as InsuranceDashboard } from './components/Dashboard';

// Phase 1.1: Polizze Management - Complete Implementation
export { PoliciesList } from './components/PoliciesList';
export { PolicyDetail } from './components/PolicyDetail';
export { PolicyForm } from './components/PolicyForm';

// Page wrappers for routing - import and re-export for proper typing
import { PoliciesList } from './components/PoliciesList';
export const InsurancePoliciesPage = PoliciesList;

// Placeholder exports for future phases with professional UI
export const InsuranceClaimsPage = () => React.createElement(PlaceholderPage, {
    title: 'Sinistri',
    description: 'Gestione completa dei sinistri assicurativi con tracking status e documentazione.'
});

export const InsuranceCommissionsPage = () => React.createElement(PlaceholderPage, {
    title: 'Provvigioni',
    description: 'Calcolo automatico e tracking delle provvigioni su polizze attive e rinnovate.'
});

export const InsuranceRenewalsPage = () => React.createElement(PlaceholderPage, {
    title: 'Scadenzario',
    description: 'Gestione scadenze polizze con promemoria automatici e workflow di rinnovo.'
});