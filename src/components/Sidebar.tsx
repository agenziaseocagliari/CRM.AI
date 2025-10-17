import * as Icons from 'lucide-react';
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useVertical } from '../hooks/useVertical';
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
  { id: 'store', label: 'Prezzi', icon: 'CreditCard', path: '/store' },
];

export const Sidebar: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const { config, loading, vertical } = useVertical();

  console.log('🔍 [Sidebar] Render');
  console.log('🔍 [Sidebar] Vertical:', vertical);
  console.log('🔍 [Sidebar] Config:', config);
  console.log('🔍 [Sidebar] Loading:', loading);
  console.log('🔍 [Sidebar] Sidebar sections:', config?.sidebarConfig?.sections);
  console.log('🔍 [Sidebar] Menu items count:', config?.sidebarConfig?.sections?.length);
  console.log('🔍 [Sidebar] Is Super Admin:', isSuperAdmin);

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

  // Determine menu items
  let menuItems = config?.sidebarConfig?.sections || [];
  console.log('🔍 [Sidebar] Initial menu items from config:', menuItems);

  // Fallback for Standard vertical if config incomplete or missing
  if (vertical === 'standard' && menuItems.length < 8) {
    console.log('🔍 [Sidebar] Using STANDARD_MENU_FALLBACK (items < 8)');
    menuItems = STANDARD_MENU_FALLBACK;
  }

  if (!menuItems || menuItems.length === 0) {
    console.log('🔍 [Sidebar] No menu items, using STANDARD_MENU_FALLBACK');
    return (
      <aside className="w-64 bg-sidebar text-white flex flex-col p-4">
        <div className="flex items-center mb-8 px-2">
          <GuardianIcon className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold ml-2">Guardian AI</h1>
        </div>
        <div className="text-red-400 text-sm">
          <p>Sidebar config missing</p>
          <p className="text-xs mt-2">Vertical: {vertical}</p>
        </div>
      </aside>
    );
  }

  console.log('🔍 [Sidebar] Final menu items count:', menuItems.length);
  console.log('🔍 [Sidebar] Final menu items:', menuItems);

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
          {menuItems.map((section) => {
            // Dynamically get icon component from lucide-react
            const iconName = toPascalCase(section.icon);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const IconComponent = (Icons as any)[iconName] || Icons.Circle;

            return (
              <NavItem
                key={section.id}
                to={
                  section.id === 'dashboard' 
                    ? '..' 
                    : (section.path.startsWith('/') ? section.path.substring(1) : section.path)
                }
                icon={<IconComponent className="w-6 h-6" />}
                label={section.label}
              />
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="mt-auto">
        <ul>
          <NavItem
            to="settings"
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

