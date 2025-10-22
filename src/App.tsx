import React, { useEffect } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import toast, { Toaster } from 'react-hot-toast';
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';

// Diagnostic imports
import DiagnosticDashboard from './components/DiagnosticDashboard';
import RouteDebug from './components/RouteDebug';
import { diagnostics } from './utils/diagnostics';

// Italian routing infrastructure
import { ContactsMeta, InsuranceDashboardMeta, InsurancePoliciesMeta, OpportunitiesMeta } from './components/PageMeta';
import { RedirectHandler } from './components/RedirectHandler';
import { ROUTES } from './config/routes';
import TestRoute from './TestRoute';


// Lazy components for performance optimization - temporarily disabled
// Components moved to .bak files

// Keep light components as regular imports
import { DebugPanel } from './components/DebugPanel';
import { ForgotPassword } from './components/ForgotPassword';
import { HomePage } from './components/HomePage';
import { Login } from './components/Login';
import { MainLayout } from './components/MainLayout';
// import { PrivacyPolicy } from './components/PrivacyPolicy'; // Moved to .bak
import PricingPage from './components/pricing/PricingPage';
import PublicBookingPage from './components/PublicBookingPage';
import { PublicForm } from './components/PublicForm';
import { PublicPricingPage } from './components/PublicPricingPage';
// import { ResetPassword } from './components/ResetPassword'; // Moved to .bak
import { GoogleAuthCallback } from './components/Settings';

// CRM Components - Riattivati
import AutomationDiagnostic from './app/dashboard/automation/diagnostic';
import AutomationPage from './app/dashboard/automation/page';
import WorkflowCanvas from './components/automation/WorkflowCanvas';
import { Calendar } from './components/Calendar';
import { Contacts } from './components/Contacts';
import ContactDetailView from './components/contacts/ContactDetailView';
import { Dashboard } from './components/Dashboard';
import EmailMarketingModule from './components/EmailMarketingModule';
import { Forms } from './components/Forms';
import ClaimDetail from './components/insurance/ClaimDetail';
import ClaimsForm from './components/insurance/ClaimsForm';
import ClaimsList from './components/insurance/ClaimsList';
import CommissionCalculator from './components/insurance/CommissionCalculator';
import CommissionDashboard from './components/insurance/CommissionDashboard';
import CommissionDetail from './components/insurance/CommissionDetail';
import CommissionReports from './components/insurance/CommissionReports';
import CommissionsList from './components/insurance/CommissionsList';
import { FormsInsurance } from './components/insurance/FormsInsurance';
import { Opportunities } from './components/Opportunities';
import { Reports } from './components/Reports';
import { ReportsTest } from './components/ReportsTest';
import { Settings } from './components/Settings';
import BookingSettings from './components/settings/BookingSettings';
import { TestComponent } from './components/TestComponent';
import { UniversalCreditDashboard } from './components/universal/UniversalCreditDashboard';
import WhatsAppModule from './components/WhatsAppModule';
// Super Admin lazy components - temporarily disabled
// Components moved to .bak files
// import { TermsOfService } from './components/TermsOfService'; // Moved to .bak
import ExtraCreditsStore from './components/store/ExtraCreditsStore';

// Test Components
import EventModalTest from './components/calendar/EventModalTest';

// Vertical Landing Pages
import InsuranceAgencyLanding from './pages/verticals/InsuranceAgencyLanding';
import MarketingAgencyLanding from './pages/verticals/MarketingAgencyLanding';

// Super Admin Imports
import { AiWorkflows } from './components/superadmin/AiWorkflows';
import { APIIntegrationsManager } from './components/superadmin/APIIntegrationsManager';
import { AuditLogs } from './components/superadmin/AuditLogs';
import { AutomationAgents } from './components/superadmin/AutomationAgents';
import { Customers } from './components/superadmin/Customers';
import { Payments } from './components/superadmin/Payments';
import { QuotaManagement } from './components/superadmin/QuotaManagement';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { SuperAdminLayout } from './components/superadmin/SuperAdminLayout';
import { SystemHealthDashboard } from './components/superadmin/SystemHealthDashboard';
import { TeamManagement } from './components/superadmin/TeamManagement';
import { WorkflowBuilder } from './components/superadmin/WorkflowBuilder';

// Debug Panel
import { useAuth } from './contexts/AuthContext';
import { useCrmData } from './hooks/useCrmData';
import { supabase } from './lib/supabaseClient';

// Vertical System
import { InsuranceOnlyGuard } from './components/guards/VerticalGuard';
import {
    InsuranceCommissionsPage,
    InsurancePoliciesPage,
    InsuranceRenewalsPage,
    PolicyDetail,
    PolicyForm
} from './features/insurance';

// Risk Profiling System (Phase 2)
import RiskAssessment from './components/insurance/RiskAssessment';
import RiskAssessmentList from './components/insurance/RiskAssessmentList';
import RiskProfileView from './components/insurance/RiskProfileView'; // ✅ Production version with Recharts
import { VerticalProvider, useVertical } from './hooks/useVertical';


import { diagnosticLogger } from './lib/mockDiagnosticLogger';

// Performance optimization imports
import { performanceMonitor } from './lib/performanceMonitoring';
import { checkForUpdates, register as registerSW } from './lib/serviceWorkerRegistration';

// Helper component that safely uses vertical hook inside provider
const VerticalAwareRoute: React.FC<{
  standardComponent: React.ReactNode;
  insuranceComponent: React.ReactNode;
}> = ({ standardComponent, insuranceComponent }) => {
  const { vertical } = useVertical(); // ✅ Safe - inside provider
  
  return vertical === 'insurance' ? insuranceComponent : standardComponent;
};

const App: React.FC = () => {
  // 🚨 GLOBAL ERROR LOGGING - Capture all runtime errors
  useEffect(() => {
    console.log('🔧 [APP INIT] v6.0-NUCLEAR-DEBUG - Global error handlers installed');
    
    const handleError = (event: ErrorEvent) => {
      console.error('🚨 [WINDOW ERROR]', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 [UNHANDLED REJECTION]', {
        reason: event.reason,
        promise: event.promise,
        timestamp: new Date().toISOString()
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  const { session, userRole, loading, jwtClaims } = useAuth();
  const crmData = useCrmData();
  const navigate = useNavigate();
  const location = useLocation();

  // Diagnostic logging for App component
  useEffect(() => {
    diagnostics.log('component', 'App', {
      mounted: true,
      session: !!session,
      userRole,
      loading,
      location: window.location.href,
      pathname: location.pathname
    });
  }, [session, userRole, loading, location.pathname]);

  // JWT Health Check - warn if user_role is missing and force logout
  useEffect(() => {
    if (session && jwtClaims && !userRole) {
      diagnosticLogger.error('" [App] JWT TOKEN DEFECT: user_role is missing from JWT');

      toast.error(
        (t) => (
          <div className="space-y-3">
            <p className="font-semibold text-lg">&quot;  Sessione Non Valida</p>
            <p className="text-sm">
              La tua sessione  scaduta o non valida. Devi effettuare nuovamente il login con le credenziali {' '}
              <span className="font-bold">superadmin</span> o del tuo account.
            </p>
            <p className="text-xs text-gray-600">
              IMPORTANTE: Ricaricare la pagina non risolver  il problema.  necessario un nuovo login.
            </p>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                localStorage.clear();
                sessionStorage.clear();
                await supabase.auth.signOut();
                window.location.href = '/login?session_expired=true';
              }}
              className="w-full mt-2 bg-red-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-red-700"
            >
              Logout e Torna al Login
            </button>
          </div>
        ),
        { duration: Infinity, id: 'jwt-defect-force-logout' }
      );
    }
  }, [session, jwtClaims, userRole]);

  // Prevent page reload with invalid session - warn user
  useEffect(() => {
    if (!session || !userRole) { return; }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // If user_role is missing, warn before reload
      if (session && !userRole) {
        e.preventDefault();
        e.returnValue = 'La tua sessione non  valida. Ricaricare non risolver  il problema. Devi effettuare il logout e login.';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [session, userRole]);

  // Performance optimization: Service Worker registration and monitoring
  useEffect(() => {
    // Register service worker for PWA functionality
    if (import.meta.env.PROD) {
      registerSW({
        onSuccess: (_registration) => {
          diagnosticLogger.info('sw', 'Service worker registered successfully');
          performanceMonitor.trackCustomMetric('sw_registration_success', 1);
        },
        onUpdate: (_registration) => {
          diagnosticLogger.info('sw', 'New service worker version available');
          // Could show update notification to user
          toast('New version available! Refresh to update.', {
            duration: 5000,
            icon: '??'
          });
        }
      });

      // Check for service worker updates periodically
      const updateInterval = setInterval(() => {
        checkForUpdates();
      }, 60000); // Check every minute

      // Performance monitoring initialization
      performanceMonitor.mark('app-initialized');
      performanceMonitor.trackCustomMetric('app_load_timestamp', Date.now());

      return () => {
        clearInterval(updateInterval);
      };
    }
  }, []);

  // Performance monitoring for route changes
  useEffect(() => {
    performanceMonitor.mark(`route-${location.pathname}`);
    performanceMonitor.trackCustomMetric('route_changes', Date.now());
  }, [location.pathname]);

  // Handle navigation after sign in/out with role-based routing
  useEffect(() => {
    if (session && location.pathname === '/login') {
      // Role-based redirect after login
      if (userRole === 'super_admin') {
        diagnosticLogger.info(' [App] Super Admin logged in - redirecting to /super-admin/dashboard');
        navigate('/super-admin/dashboard');
      } else {
        diagnosticLogger.info(' [App] Standard user logged in - redirecting to /dashboard');
        navigate('/dashboard');
      }
    } else if (!session && location.pathname !== '/login' && location.pathname !== '/') {
      // Only redirect to login if on a protected route
      const publicPaths = ['/', '/login', '/forgot-password', '/reset-password', '/form/', '/privacy-policy', '/terms-of-service'];
      const isPublicPath = publicPaths.some(path => location.pathname.startsWith(path));
      if (!isPublicPath) {
        diagnosticLogger.info(' [App] Redirecting to login - no session on protected route');
        navigate('/');
      }
    }
  }, [session, location.pathname, navigate, userRole]);

  // Role-based route guard: prevent cross-role access
  useEffect(() => {
    if (loading || !session) { return; }

    const isSuperAdminRoute = location.pathname.startsWith('/super-admin');
    const isStandardCrmRoute = ['/dashboard', '/opportunities', '/contacts', '/calendar', '/meetings', '/forms', '/automations', '/automation', '/whatsapp', '/email-marketing', '/reports', '/settings'].some(
      path => location.pathname.startsWith(path)
    );

    if (userRole === 'super_admin' && isStandardCrmRoute) {
      diagnosticLogger.warn('"  [App] Super Admin attempting to access standard CRM route - redirecting to /super-admin/dashboard');
      toast.error('Come Super Admin, devi usare la dashboard dedicata.', { duration: 3000 });
      navigate('/super-admin/dashboard', { replace: true });
    } else if (userRole !== 'super_admin' && isSuperAdminRoute) {
      diagnosticLogger.warn('"  [App] Non-Super Admin attempting to access Super Admin route - redirecting to /dashboard');
      toast.error('Non hai i permessi per accedere a questa sezione.', { duration: 3000 });
      navigate('/dashboard', { replace: true });
    }
  }, [session, userRole, location.pathname, loading, navigate]);

  // Apply theme from local storage on initial load
  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);


  if (crmData.error?.includes('VITE_SUPABASE')) {
    return (
      <div className="flex h-screen items-center justify-center bg-red-50 p-4">
        <div className="rounded-md bg-white p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-red-600">Errore di Configurazione</h1>
          <p className="mt-4 text-gray-700">{crmData.error}</p>
          <p className="mt-2 text-sm text-gray-500">Assicurati di aver configurato correttamente le variabili d&apos;ambiente nel tuo file `.env` o nelle impostazioni del tuo servizio di hosting.</p>
        </div>
      </div>
    );
  }

  // FIX: Removed `crmData.loading` check to prevent the entire component tree
  // from unmounting during data re-fetches. This is a critical fix to prevent
  // state loss in child components and avoid re-render loops. The loading state
  // is now handled gracefully within MainLayout and its children.
  if (loading) {
    return <div className="flex h-screen items-center justify-center">Caricamento in corso...</div>;
  }

  return (
    <VerticalProvider>
      <HelmetProvider>
        <RedirectHandler>
          <Toaster position="top-center" reverseOrder={false} />
          {/* Diagnostic Components - Only in development */}
          <RouteDebug />
          {import.meta.env.DEV && <DiagnosticDashboard />}
          {/* Debug Panel - Only visible when logged in */}
          {session && <DebugPanel />}
          <Routes>
            {/* EMERGENCY TEST - DELETE AFTER VERIFICATION */}
            <Route path="/test-emergency" element={
              <TestRoute />
            } />
            {/* ========================================== */}
            {/* ITALIAN LOCALIZED ROUTES */}
            {/* ========================================== */}
            
            {/* ========================================== */}
            {/* BACKWARD COMPATIBILITY - OLD INSURANCE ROUTES */}
            {/* CRITICAL FIX: Database sidebar still uses old routes */}
            {/* Mount same components on old paths for immediate fix */}
            {/* ========================================== */}
            
            {/* OLD: /dashboard/insurance/* → Mount same components */}
            <Route path="/dashboard/insurance/policies" element={
              session ? (
                <InsuranceOnlyGuard>
                  <>
                    <InsurancePoliciesMeta />
                    <InsurancePoliciesPage />
                  </>
                </InsuranceOnlyGuard>
              ) : <Navigate to={ROUTES.login} replace />
            } />
            
            {/* OLDER: /insurance/* → Mount same components (exact match from database) */}
            <Route path="/insurance/policies" element={
              session ? (
                <InsuranceOnlyGuard>
                  <>
                    <InsurancePoliciesMeta />
                    <InsurancePoliciesPage />
                  </>
                </InsuranceOnlyGuard>
              ) : <Navigate to={ROUTES.login} replace />
            } />
            <Route path="/insurance/policies/new" element={
              session ? (
                <InsuranceOnlyGuard>
                  <PolicyForm />
                </InsuranceOnlyGuard>
              ) : <Navigate to={ROUTES.login} replace />
            } />
            <Route path="/insurance/policies/:id" element={
              session ? (
                <InsuranceOnlyGuard>
                  <PolicyDetail />
                </InsuranceOnlyGuard>
              ) : <Navigate to={ROUTES.login} replace />
            } />
            <Route path="/insurance/policies/:id/edit" element={
              session ? (
                <InsuranceOnlyGuard>
                  <PolicyForm />
                </InsuranceOnlyGuard>
              ) : <Navigate to={ROUTES.login} replace />
            } />
            <Route path="/insurance/claims" element={
              session ? (
                <InsuranceOnlyGuard>
                  <ClaimsList />
                </InsuranceOnlyGuard>
              ) : <Navigate to={ROUTES.login} replace />
            } />
            <Route path="/insurance/claims/new" element={
              session ? (
                <InsuranceOnlyGuard>
                  <ClaimsForm />
                </InsuranceOnlyGuard>
              ) : <Navigate to={ROUTES.login} replace />
            } />
            <Route path="/insurance/claims/:id" element={
              session ? (
                <InsuranceOnlyGuard>
                  <ClaimDetail />
                </InsuranceOnlyGuard>
              ) : <Navigate to={ROUTES.login} replace />
            } />
            <Route path="/insurance/claims/:id/edit" element={
              session ? (
                <InsuranceOnlyGuard>
                  <ClaimsForm />
                </InsuranceOnlyGuard>
              ) : <Navigate to={ROUTES.login} replace />
            } />
            <Route path="/insurance/commissions" element={
              session ? (
                <InsuranceOnlyGuard>
                  <InsuranceCommissionsPage />
                </InsuranceOnlyGuard>
              ) : <Navigate to={ROUTES.login} replace />
            } />
            <Route path="/insurance/renewals" element={
              session ? (
                <InsuranceOnlyGuard>
                  <InsuranceRenewalsPage />
                </InsuranceOnlyGuard>
              ) : <Navigate to={ROUTES.login} replace />
            } />
            
            <Route path="/dashboard/insurance/policies/new" element={
              session ? (
                <InsuranceOnlyGuard>
                  <PolicyForm />
                </InsuranceOnlyGuard>
              ) : <Navigate to={ROUTES.login} replace />
            } />
            <Route path="/dashboard/insurance/policies/:id" element={
              session ? (
                <InsuranceOnlyGuard>
                  <PolicyDetail />
                </InsuranceOnlyGuard>
              ) : <Navigate to={ROUTES.login} replace />
            } />
            <Route path="/dashboard/insurance/policies/:id/edit" element={
              session ? (
                <InsuranceOnlyGuard>
                  <PolicyForm />
                </InsuranceOnlyGuard>
              ) : <Navigate to={ROUTES.login} replace />
            } />
            
            {/* Risk Profiling Routes (Phase 2) */}
            {/* Landing page - List all risk profiles */}
            <Route path="/dashboard/assicurazioni/valutazione-rischio" element={
              session ? (
                <InsuranceOnlyGuard>
                  <RiskAssessmentList />
                </InsuranceOnlyGuard>
              ) : <Navigate to={ROUTES.login} replace />
            } />
            {/* Create/Edit risk assessment for specific contact */}
            <Route path="/dashboard/assicurazioni/valutazione-rischio/:contactId" element={
              session ? (
                <InsuranceOnlyGuard>
                  <RiskAssessment />
                </InsuranceOnlyGuard>
              ) : <Navigate to={ROUTES.login} replace />
            } />
            {/* ✅ RiskProfileView - Production version with Recharts */}
            <Route path="/dashboard/assicurazioni/valutazione-rischio/view/:profileId" element={
              session ? (
                <InsuranceOnlyGuard>
                  <RiskProfileView />
                </InsuranceOnlyGuard>
              ) : <Navigate to={ROUTES.login} replace />
            } />
            
            <Route path="/dashboard/insurance/dashboard" element={
              session ? (
                <InsuranceOnlyGuard>
                  <MainLayout crmData={crmData} />
                </InsuranceOnlyGuard>
              ) : <Navigate to={ROUTES.login} replace />
            }>
              <Route index element={
                <>
                  <InsuranceDashboardMeta />
                  <Dashboard />
                </>
              } />
            </Route>
            <Route path="/dashboard/insurance/claims" element={
              session ? (
                <InsuranceOnlyGuard>
                  <ClaimsList />
                </InsuranceOnlyGuard>
              ) : <Navigate to={ROUTES.login} replace />
            } />
            <Route path="/dashboard/insurance/claims/new" element={
              session ? (
                <InsuranceOnlyGuard>
                  <ClaimsForm />
                </InsuranceOnlyGuard>
              ) : <Navigate to={ROUTES.login} replace />
            } />
            <Route path="/dashboard/insurance/claims/:id" element={
              session ? (
                <InsuranceOnlyGuard>
                  <ClaimDetail />
                </InsuranceOnlyGuard>
              ) : <Navigate to={ROUTES.login} replace />
            } />
            <Route path="/dashboard/insurance/claims/:id/edit" element={
              session ? (
                <InsuranceOnlyGuard>
                  <ClaimsForm />
                </InsuranceOnlyGuard>
              ) : <Navigate to={ROUTES.login} replace />
            } />
            <Route path="/dashboard/insurance/commissions" element={
              session ? (
                <InsuranceOnlyGuard>
                  <InsuranceCommissionsPage />
                </InsuranceOnlyGuard>
              ) : <Navigate to={ROUTES.login} replace />
            } />
            <Route path="/dashboard/insurance/renewals" element={
              session ? (
                <InsuranceOnlyGuard>
                  <InsuranceRenewalsPage />
                </InsuranceOnlyGuard>
              ) : <Navigate to={ROUTES.login} replace />
            } />
            
            {/* Home & Auth - Italian */}
            <Route path="/" element={session ? <Navigate to={ROUTES.dashboard} replace /> : <HomePage />} />
            <Route path={ROUTES.login} element={
              session
                ? <Navigate to={userRole === 'super_admin' ? '/super-admin/dashboard' : ROUTES.dashboard} replace />
                : <Login />
            } />
            <Route path="/forgot-password" element={
              session
                ? <Navigate to={userRole === 'super_admin' ? '/super-admin/dashboard' : ROUTES.dashboard} replace />
                : <ForgotPassword />
            } />
            
            {/* Italian Insurance Routes */}
            <Route path={ROUTES.insurance.base} element={<InsuranceAgencyLanding />} />
            <Route path={ROUTES.insurance.dashboard} element={
              session ? (
                <InsuranceOnlyGuard>
                  <MainLayout crmData={crmData} />
                </InsuranceOnlyGuard>
              ) : <Navigate to={ROUTES.login} replace />
            }>
              <Route index element={
                <>
                  <InsuranceDashboardMeta />
                  <Dashboard />
                </>
              } />
            </Route>
            
            {/* Italian CRM Routes - REMOVED: Now handled inside /dashboard/* catch-all */}

            {/* ========================================== */}
            {/* ENGLISH ROUTE ALIASES FOR STANDARD CRM COMPATIBILITY */}
            {/* ========================================== */}
            {/* Fix: Redirect non-prefixed paths to /dashboard/* versions */}
            <Route path="/automation" element={<Navigate to="/dashboard/automation" replace />} />
            <Route path="/opportunities" element={<Navigate to="/dashboard/opportunities" replace />} />
            <Route path="/opportunita" element={<Navigate to="/dashboard/opportunities" replace />} />
            <Route path="/universal-credits" element={<Navigate to="/dashboard/universal-credits" replace />} />
            <Route path="/extra-credits" element={<Navigate to="/dashboard/store" replace />} />
            <Route path="/crediti-extra" element={<Navigate to="/dashboard/store" replace />} />
            <Route path="/forms" element={<Navigate to="/dashboard/forms" replace />} />
            <Route path="/moduli" element={<Navigate to="/dashboard/forms" replace />} />
            <Route path="/contacts" element={<Navigate to="/dashboard/contacts" replace />} />
            <Route path="/contatti" element={<Navigate to="/dashboard/contacts" replace />} />
            <Route path="/calendar" element={<Navigate to="/dashboard/calendar" replace />} />
            <Route path="/calendario" element={<Navigate to="/dashboard/calendar" replace />} />
            <Route path="/reports" element={<Navigate to="/dashboard/reports" replace />} />
            <Route path="/report" element={<Navigate to="/dashboard/reports" replace />} />
            <Route path="/automazioni" element={<Navigate to="/dashboard/automations" replace />} />
            <Route path="/whatsapp" element={<Navigate to="/dashboard/whatsapp" replace />} />
            <Route path="/email-marketing" element={<Navigate to="/dashboard/email-marketing" replace />} />


            {/* ========================================== */}
            {/* LEGACY ENGLISH ROUTES (for compatibility) */}
            {/* ========================================== */}
        {/* Public Routes */}
        <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <HomePage />} />
        <Route path="/login" element={
          session
            ? <Navigate to={userRole === 'super_admin' ? '/super-admin/dashboard' : '/dashboard'} replace />
            : <Login />
        } />
        <Route path="/forgot-password" element={
          session
            ? <Navigate to={userRole === 'super_admin' ? '/super-admin/dashboard' : '/dashboard'} replace />
            : <ForgotPassword />
        } />
        <Route path="/reset-password" element={
          session
            ? <Navigate to={userRole === 'super_admin' ? '/super-admin/dashboard' : '/dashboard'} replace />
            : <div className="p-8 text-center">Reset Password temporaneamente non disponibile</div>
        } />

        <Route path="/form/:formId" element={<PublicForm />} />
        
        {/* PUBLIC PRICING - Subscription plans landing page */}
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/prezzi" element={<Navigate to="/pricing" replace />} />
        <Route path="/public-pricing" element={<PublicPricingPage />} />

        {/* Public Booking Page */}
        <Route path="/book/:username" element={<PublicBookingPage />} />

        {/* Test Routes */}
        <Route path="/test/event-modal" element={<EventModalTest />} />

        {/* Vertical Landing Pages */}
        <Route path="/assicurazioni" element={<InsuranceAgencyLanding />} />
        <Route path="/verticals/insurance-agency" element={<Navigate to="/assicurazioni" replace />} />
        <Route path="/verticals/marketing-agency" element={<MarketingAgencyLanding />} />

        <Route path="/settings/oauth/google" element={session ? <GoogleAuthCallback /> : <Navigate to="/login" />} />

        {/* Protected Routes - Only accessible when logged in */}
        <Route
          path="/dashboard/*"
          element={
            session ? <MainLayout crmData={crmData} /> : <Navigate to="/login" replace />
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="opportunities" element={
            <>
              <OpportunitiesMeta />
              <Opportunities />
            </>
          } />
          <Route path="contacts" element={
            <>
              <ContactsMeta />
              <Contacts />
            </>
          } />
          <Route path="contatti" element={
            <>
              <ContactsMeta />
              <Contacts />
            </>
          } />
          <Route path="contacts/:id" element={<ContactDetailView />} />
          <Route path="contatti/:id" element={<ContactDetailView />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="calendario" element={<Calendar />} />
          <Route path="reports" element={<Reports />} />
          <Route path="report" element={<Reports />} />
          <Route path="reports-test" element={<ReportsTest />} />

          <Route path="forms" element={
            <VerticalAwareRoute
              standardComponent={<Forms />}
              insuranceComponent={<FormsInsurance />}
            />
          } />
          <Route path="moduli" element={
            <VerticalAwareRoute
              standardComponent={<Forms />}
              insuranceComponent={<FormsInsurance />}
            />
          } />
          <Route path="automations" element={<WorkflowCanvas />} />
          <Route path="automazioni" element={<WorkflowCanvas />} />
          <Route path="automation" element={<AutomationPage />} />
          <Route path="automation/diagnostic" element={<AutomationDiagnostic />} />

          {/* Enterprise AI Modules */}
          <Route path="whatsapp" element={<WhatsAppModule />} />
          <Route path="email-marketing" element={<EmailMarketingModule />} />

          <Route path="test" element={<TestComponent />} />
          <Route path="universal-credits" element={<UniversalCreditDashboard />} />
          <Route path="store" element={<ExtraCreditsStore />} />
          <Route path="crediti-extra" element={<ExtraCreditsStore />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/booking" element={<BookingSettings />} />

          {/* Insurance Routes - MOVED INSIDE /dashboard/* catch-all */}
          {/* FIX: Direct render without nested Outlet - components get context from MainLayout */}
          <Route path="assicurazioni/polizze" element={
            <InsuranceOnlyGuard>
              <>
                <InsurancePoliciesMeta />
                <InsurancePoliciesPage />
              </>
            </InsuranceOnlyGuard>
          } />
          <Route path="assicurazioni/polizze/:id" element={
            <InsuranceOnlyGuard>
              <PolicyDetail />
            </InsuranceOnlyGuard>
          } />
          <Route path="assicurazioni/polizze/:id/modifica" element={
            <InsuranceOnlyGuard>
              <PolicyForm />
            </InsuranceOnlyGuard>
          } />

          <Route path="assicurazioni/nuova-polizza" element={
            <InsuranceOnlyGuard>
              <PolicyForm />
            </InsuranceOnlyGuard>
          } />

          <Route path="assicurazioni/sinistri" element={
            <InsuranceOnlyGuard>
              <Outlet />
            </InsuranceOnlyGuard>
          }>
            <Route index element={<ClaimsList />} />
            <Route path="nuovo" element={<ClaimsForm />} />
            <Route path=":id" element={<ClaimDetail />} />
            <Route path=":id/modifica" element={<ClaimsForm />} />
          </Route>

          <Route path="assicurazioni/provvigioni" element={
            <InsuranceOnlyGuard>
              <Outlet />
            </InsuranceOnlyGuard>
          }>
            <Route index element={<CommissionDashboard />} />
            <Route path="list" element={<CommissionsList />} />
            <Route path="new" element={<CommissionCalculator />} />
            <Route path="reports" element={<CommissionReports />} />
            <Route path=":id" element={<CommissionDetail />} />
            <Route path=":id/modifica" element={<CommissionCalculator />} />
          </Route>

          <Route path="assicurazioni/scadenzario" element={
            <InsuranceOnlyGuard>
              <InsuranceRenewalsPage />
            </InsuranceOnlyGuard>
          } />

          <Route path="assicurazioni/valutazione-rischio" element={
            <InsuranceOnlyGuard>
              <Outlet />
            </InsuranceOnlyGuard>
          }>
            <Route index element={<RiskAssessmentList />} />
            <Route path=":contactId" element={<RiskAssessment />} />
            <Route path="view/:profileId" element={<RiskProfileView />} />
          </Route>
        </Route>

        {/* Insurance routes - protected */}
        <Route
          path="/insurance/*"
          element={
            session ? (
              <InsuranceOnlyGuard>
                <Routes>
                  <Route path="policies" element={<InsurancePoliciesPage />} />
                  <Route path="claims" element={<ClaimsList />} />
                  <Route path="claims/new" element={<ClaimsForm />} />
                  <Route path="claims/:id" element={<ClaimDetail />} />
                  <Route path="claims/:id/edit" element={<ClaimsForm />} />
                  <Route path="commissions" element={<InsuranceCommissionsPage />} />
                  <Route path="renewals" element={<InsuranceRenewalsPage />} />
                </Routes>
              </InsuranceOnlyGuard>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Super Admin Routes - RIATTIVATE */}
        <Route
          path="/super-admin/*"
          element={
            session && userRole === 'super_admin'
              ? <SuperAdminLayout />
              : <Navigate to="/login" replace />
          }
        >
          <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="payments" element={<Payments />} />
          <Route path="team" element={<TeamManagement />} />
          <Route path="audit" element={<AuditLogs />} />
          <Route path="system-health" element={<SystemHealthDashboard />} />
          <Route path="workflows" element={<WorkflowBuilder />} />
          <Route path="workflows-legacy" element={<AiWorkflows />} />
          <Route path="agents" element={<AutomationAgents />} />
          <Route path="integrations" element={<APIIntegrationsManager />} />
          <Route path="quotas" element={<QuotaManagement />} />
        </Route>

        <Route path="*" element={
          <Navigate to={
            session
              ? (userRole === 'super_admin' ? '/super-admin/dashboard' : '/dashboard')
              : '/'
          } replace />
        } />
      </Routes>
      </RedirectHandler>
    </HelmetProvider>
    </VerticalProvider>
  );
};

export default App;




