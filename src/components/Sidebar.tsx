import * as Icons from 'lucide-react';
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useVertical } from '../hooks/verticalUtils';
import { AdminPanelIcon, GuardianIcon } from './ui/icons';

const NavItem: React.FC<{
  to: string;
  icon: React.ReactNode;
  label: string;
}> = ({ to, icon, label }) => {
    const activeClass = 'bg-primary text-white';
    const inactiveClass = 'text-gray-300 hover:bg-sidebar-hover hover:text-white';

    return (
        <li>
            <NavLink
                to={to}
                className={({ isActive }) =>
                    `flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors ${isActive ? activeClass : inactiveClass}`
                }
            >
                {icon}
                <span className="ml-3 font-medium">{label}</span>
            </NavLink>
        </li>
    );
};

// Utility function to convert icon names to PascalCase for lucide-react
function toPascalCase(str: string): string {
  // CRITICAL FIX: Defensive null check for undefined icon names
  if (!str || typeof str !== 'string') {
    console.warn('🚨 [Sidebar] toPascalCase received invalid input:', str);
    return 'Circle'; // Fallback icon name
  }
  
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

// Fallback complete menu for Standard vertical
const STANDARD_MENU_FALLBACK = [
  { id: 'dashboard', label: 'Dashboard', icon: 'Home', path: '/dashboard' },
  { id: 'opportunities', label: 'Pipeline', icon: 'TrendingUp', path: '/opportunities' },
  { id: 'contacts', label: 'Contatti', icon: 'Users', path: '/contacts' },
  { id: 'calendar', label: 'Calendario', icon: 'Calendar', path: '/calendar' },
  { id: 'reports', label: 'Reports', icon: 'BarChart3', path: '/reports' },
  { id: 'forms', label: 'Forms', icon: 'FileText', path: '/forms' },
  { id: 'automation', label: 'Automazioni', icon: 'Zap', path: '/automation' },
  { id: 'whatsapp', label: 'WhatsApp', icon: 'MessageCircle', path: '/whatsapp' },
  { id: 'email-marketing', label: 'Email Marketing', icon: 'Mail', path: '/email-marketing' },
  { id: 'credits', label: 'Sistema Crediti', icon: 'CreditCard', path: '/universal-credits' },
  { id: 'store', label: 'Crediti Extra', icon: 'ShoppingBag', path: '/crediti-extra' },
];

export const Sidebar: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const { config, loading, vertical } = useVertical();

  if (loading) {
    return (
      <aside className="w-64 bg-sidebar text-white flex flex-col p-4">
        <div className="flex items-center mb-8 px-2">
          <GuardianIcon className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold ml-2">Guardian AI</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-600 rounded mb-4"></div>
          <div className="h-4 bg-gray-600 rounded mb-4"></div>
          <div className="h-4 bg-gray-600 rounded mb-4"></div>
        </div>
      </aside>
    );
  }

  // Determine menu items - FIXED: Process sections.items structure correctly
  const sidebarSections = config?.sidebarConfig?.sections || [];
  
  // Transform sections structure to flat items list
  let menuItems: { id: string; label: string; icon: string; path: string; }[] = [];
  
  if (sidebarSections.length > 0) {
    // Process sections - each section contains items array
    try {
      for (const section of sidebarSections) {
        // Type assertion to access section properties
        const sectionData = section as { title?: string; items?: Array<{ name?: string; icon?: string; path?: string; }> };
        
        if (sectionData.items && Array.isArray(sectionData.items)) {
          // Process items within each section
          for (const item of sectionData.items) {
            if (item && item.name) {
              // Transform item to match expected menu item structure
              menuItems.push({
                id: item.name.toLowerCase().replace(/\s+/g, '-'),
                label: item.name,
                icon: item.icon || 'Circle',
                path: item.path || '/dashboard'
              });
            }
          }
        }
      }
      
      // REMOVED: Manual addition of "Calcola Nuova Provvigione" 
      // This item is now properly configured in the database via vertical_configurations
      // No need to manually add it here to avoid duplicates
    } catch (error) {
      console.error('🚨 [Sidebar] Error processing sections:', error);
      menuItems = []; // Reset to empty array
    }
  }
  
  // CRITICAL FIX: Remove duplicates based on path to avoid duplicate sidebar entries
  const uniqueItems = Array.from(new Map(menuItems.map(item => [item.path, item])).values());
  menuItems = uniqueItems;

  // Fallback for Standard vertical if config incomplete or missing
  if (vertical === 'standard' && menuItems.length < 8) {
    menuItems = STANDARD_MENU_FALLBACK;
  }

  if (!menuItems || menuItems.length === 0) {
    // For insurance vertical, show a specific message and fallback
    if (vertical === 'insurance') {
      menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: 'Home', path: '/' },
        { id: 'policies', label: 'Polizze', icon: 'FileText', path: '/assicurazioni/polizze' },
        { id: 'claims', label: 'Sinistri', icon: 'AlertTriangle', path: '/assicurazioni/sinistri' },
        { id: 'commissions', label: 'Dashboard Provvigioni', icon: 'BarChart', path: '/assicurazioni/provvigioni' },
        { id: 'calc-commission', label: 'Calcola Nuova Provvigione', icon: 'Calculator', path: '/assicurazioni/provvigioni/new' },
        { id: 'commission-reports', label: 'Report Provvigioni', icon: 'FileText', path: '/assicurazioni/provvigioni/reports' },
        { id: 'contacts', label: 'Contatti', icon: 'Users', path: '/contatti' }
      ];
    } else {
      menuItems = STANDARD_MENU_FALLBACK;
    }
  }

  return (
    <aside className="w-64 bg-sidebar text-white flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center mb-8 px-2">
        <GuardianIcon className="w-8 h-8 text-primary" />
        <div className="ml-2">
          <h1 className="text-2xl font-bold">Guardian AI</h1>
          <p className="text-xs text-gray-400">{config?.displayName || 'CRM'}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <ul>
          {menuItems.map((item) => {
            // CRITICAL FIX: Defensive checks for all item properties
            const safeIcon = item.icon || 'Circle';
            const safePath = item.path || '/dashboard';
            const safeLabel = item.label || 'Unknown';
            const safeId = item.id || 'unknown';
            
            // ROUTING FIX: Add /dashboard prefix to relative paths from sidebar_config
            // Database paths are like "/assicurazioni/polizze" but routes are under "/dashboard"
            // Dashboard item uses relative ".." link, all others get /dashboard prefix
            let fullPath = safePath;
            if (safeId !== 'dashboard' && safePath.startsWith('/') && !safePath.startsWith('/dashboard')) {
              fullPath = `/dashboard${safePath}`;
            }
            
            // Dynamically get icon component from lucide-react
            const iconName = toPascalCase(safeIcon);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const IconComponent = (Icons as any)[iconName] || Icons.Circle;

            return (
              <NavItem
                key={safeId}
                to={
                  safeId === 'dashboard' 
                    ? '..' 
                    : fullPath
                }
                icon={<IconComponent className="w-6 h-6" />}
                label={safeLabel}
              />
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="mt-auto">
        <ul>
          <NavItem
            to="/dashboard/settings"
            icon={<Icons.Settings className="w-6 h-6" />}
            label="Impostazioni"
          />
          {isSuperAdmin && (
            <NavItem
              to="/super-admin"
              icon={<AdminPanelIcon className="w-6 h-6" />}
              label="Super Admin"
            />
          )}
        </ul>
        
        {/* Vertical indicator */}
        <div className="mt-4 p-3 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              {vertical} CRM
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {config?.description || `${vertical} vertical`}
          </p>
        </div>
      </div>
    </aside>
  );
};

