import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';


// Lazy components for performance optimization - temporarily disabled
// Components moved to .bak files

// Keep light components as regular imports
import { DebugPanel } from './components/DebugPanel';
import { ForgotPassword } from './components/ForgotPassword';
import { HomePage } from './components/HomePage';
import { Login } from './components/Login';
import { MainLayout } from './components/MainLayout';
// import { PrivacyPolicy } from './components/PrivacyPolicy'; // Moved to .bak
import { PublicForm } from './components/PublicForm';
import { PublicPricingPage } from './components/PublicPricingPage';
// import { ResetPassword } from './components/ResetPassword'; // Moved to .bak
import { GoogleAuthCallback } from './components/Settings';

// CRM Components - Riattivati
import { Dashboard } from './components/Dashboard';
import { Opportunities } from './components/Opportunities';
import { Contacts } from './components/Contacts';
import { Forms } from './components/Forms';
import { Automations } from './components/Automations';
import { CalendarView } from './components/CalendarView';
import { Settings } from './components/Settings';
import { TestComponent } from './components/TestComponent';
import WhatsAppModule from './components/WhatsAppModule';
import EmailMarketingModule from './components/EmailMarketingModule';
// Super Admin lazy components - temporarily disabled
// Components moved to .bak files
// import { TermsOfService } from './components/TermsOfService'; // Moved to .bak
import ExtraCreditsStore from './components/store/ExtraCreditsStore';

// Vertical Landing Pages
import InsuranceAgencyLanding from './pages/verticals/InsuranceAgencyLanding';
import MarketingAgencyLanding from './pages/verticals/MarketingAgencyLanding';

// Super Admin Imports

// Debug Panel
import { useAuth } from './contexts/AuthContext';
import { useCrmData } from './hooks/useCrmData';
import { supabase } from './lib/supabaseClient';


import { diagnosticLogger } from './lib/mockDiagnosticLogger';

// Performance optimization imports
import { register as registerSW, checkForUpdates } from './lib/serviceWorkerRegistration';
import { performanceMonitor } from './lib/performanceMonitoring';

const App: React.FC = () => {
  const { session, userRole, loading, jwtClaims } = useAuth();
  const crmData = useCrmData();
  const navigate = useNavigate();
  const location = useLocation();

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
    if (!session || !userRole) {return;}

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
    if (process.env.NODE_ENV === 'production') {
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
    if (loading || !session) {return;}

    const isSuperAdminRoute = location.pathname.startsWith('/super-admin');
    const isStandardCrmRoute = ['/dashboard', '/opportunities', '/contacts', '/calendar', '/meetings', '/forms', '/automations', '/whatsapp', '/email-marketing', '/settings'].some(
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
    <HelmetProvider>
      <Toaster position="top-center" reverseOrder={false} />
      {/* Debug Panel - Only visible when logged in */}
      {session && <DebugPanel />}
      <Routes>
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
        <Route path="/pricing" element={<PublicPricingPage />} />
        
        {/* Vertical Landing Pages */}
        <Route path="/verticals/insurance-agency" element={<InsuranceAgencyLanding />} />
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
          <Route path="opportunities" element={<Opportunities />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="calendar" element={<CalendarView />} />

          <Route path="forms" element={<Forms />} />
          <Route path="automations" element={<Automations />} />
          
          {/* Enterprise AI Modules */}
          <Route path="whatsapp" element={<WhatsAppModule />} />
          <Route path="email-marketing" element={<EmailMarketingModule />} />
          
          <Route path="test" element={<TestComponent />} />
          <Route path="store" element={<ExtraCreditsStore />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Super Admin Routes - Temporarily Disabled */}
        <Route path="/super-admin/*" element={<div className="p-8 text-center">Super Admin sezione temporaneamente non disponibile</div>} />

        <Route path="*" element={
          <Navigate to={
            session
              ? (userRole === 'super_admin' ? '/super-admin/dashboard' : '/dashboard')
              : '/'
          } replace />
        } />
      </Routes>
    </HelmetProvider>
  );
};

export default App;




