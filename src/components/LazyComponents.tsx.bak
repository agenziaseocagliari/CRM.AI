import React, { Suspense, ComponentType } from 'react';

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p className="text-text-secondary dark:text-dark-text-secondary">Caricamento...</p>
    </div>
  </div>
);

// Higher-order component for lazy loading with suspense
export const withLazyLoading = <P extends object>(
  LazyComponent: React.LazyExoticComponent<ComponentType<P>>
): React.FC<P> => {
  const Component = (props: P) => (
    <Suspense fallback={<LoadingSpinner />}>
      <LazyComponent {...(props as any)} />
    </Suspense>
  );
  Component.displayName = 'LazyLoadedComponent';
  return Component;
};

// Lazy loaded components
export const LazyDashboard = React.lazy(() => import('./Dashboard').then(module => ({ default: module.Dashboard })));
export const LazyContacts = React.lazy(() => import('./Contacts').then(module => ({ default: module.Contacts })));
export const LazyOpportunities = React.lazy(() => import('./Opportunities').then(module => ({ default: module.Opportunities })));
export const LazyForms = React.lazy(() => import('./Forms').then(module => ({ default: module.Forms })));
export const LazyAutomations = React.lazy(() => import('./Automations').then(module => ({ default: module.Automations })));
export const LazyCalendarView = React.lazy(() => import('./CalendarView').then(module => ({ default: module.CalendarView })));
export const LazyMeetings = React.lazy(() => import('./Meetings').then(module => ({ default: module.Meetings })));
export const LazySettings = React.lazy(() => import('./Settings').then(module => ({ default: module.Settings })));

// Super Admin lazy components - These are the heaviest!
export const LazySuperAdminDashboard = React.lazy(() => import('./superadmin/SuperAdminDashboard').then(module => ({ default: module.SuperAdminDashboard })));
export const LazySuperAdminLayout = React.lazy(() => import('./superadmin/SuperAdminLayout').then(module => ({ default: module.SuperAdminLayout })));
export const LazySystemHealthDashboard = React.lazy(() => import('./superadmin/SystemHealthDashboard').then(module => ({ default: module.SystemHealthDashboard })));
export const LazyAPIIntegrationsManager = React.lazy(() => import('./superadmin/APIIntegrationsManager').then(module => ({ default: module.APIIntegrationsManager })));
export const LazyQuotaManagement = React.lazy(() => import('./superadmin/QuotaManagement').then(module => ({ default: module.QuotaManagement })));
export const LazyWorkflowBuilder = React.lazy(() => import('./superadmin/WorkflowBuilder').then(module => ({ default: module.WorkflowBuilder })));
export const LazyAutomationAgents = React.lazy(() => import('./superadmin/AutomationAgents').then(module => ({ default: module.AutomationAgents })));

// Charts components - Very heavy with recharts
export const LazySuperAdminCustomers = React.lazy(() => import('./superadmin/Customers').then(module => ({ default: module.Customers })));
export const LazySuperAdminPayments = React.lazy(() => import('./superadmin/Payments').then(module => ({ default: module.Payments })));
export const LazySuperAdminAuditLogs = React.lazy(() => import('./superadmin/AuditLogs').then(module => ({ default: module.AuditLogs })));
export const LazySuperAdminAiWorkflows = React.lazy(() => import('./superadmin/AiWorkflows').then(module => ({ default: module.AiWorkflows })));

// Wrapped components with Suspense
export const Dashboard = withLazyLoading(LazyDashboard);
export const Contacts = withLazyLoading(LazyContacts);
export const Opportunities = withLazyLoading(LazyOpportunities);
export const Forms = withLazyLoading(LazyForms);
export const Automations = withLazyLoading(LazyAutomations);
export const CalendarView = withLazyLoading(LazyCalendarView);
export const Meetings = withLazyLoading(LazyMeetings);
export const Settings = withLazyLoading(LazySettings);

// Super Admin components
export const SuperAdminDashboard = withLazyLoading(LazySuperAdminDashboard);
export const SuperAdminLayout = withLazyLoading(LazySuperAdminLayout);
export const SystemHealthDashboard = withLazyLoading(LazySystemHealthDashboard);
export const APIIntegrationsManager = withLazyLoading(LazyAPIIntegrationsManager);
export const QuotaManagement = withLazyLoading(LazyQuotaManagement);
export const WorkflowBuilder = withLazyLoading(LazyWorkflowBuilder);
export const AutomationAgents = withLazyLoading(LazyAutomationAgents);

// Heavy chart components
export const SuperAdminCustomers = withLazyLoading(LazySuperAdminCustomers);
export const SuperAdminPayments = withLazyLoading(LazySuperAdminPayments);
export const SuperAdminAuditLogs = withLazyLoading(LazySuperAdminAuditLogs);
export const SuperAdminAiWorkflows = withLazyLoading(LazySuperAdminAiWorkflows);