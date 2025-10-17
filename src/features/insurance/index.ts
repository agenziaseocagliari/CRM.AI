import React from 'react';

// Insurance vertical module - Phase 1.1 Complete Implementation

export { default as InsuranceDashboard } from './components/Dashboard';

// Phase 1.1: Polizze Management - Complete Implementation
export { PoliciesList } from './components/PoliciesList';
export { PolicyDetail } from './components/PolicyDetail';
export { PolicyForm } from './components/PolicyForm';

// Page wrappers for routing - import and re-export for proper typing
import { PoliciesList } from './components/PoliciesList';
export const InsurancePoliciesPage = PoliciesList;

// Placeholder exports for future phases
export const InsuranceClaimsPage = () => React.createElement('div', null, 'Claims - Coming in Phase 2');
export const InsuranceCommissionsPage = () => React.createElement('div', null, 'Commissions - Coming in Phase 2');
export const InsuranceRenewalsPage = () => React.createElement('div', null, 'Renewals - Coming in Phase 2');