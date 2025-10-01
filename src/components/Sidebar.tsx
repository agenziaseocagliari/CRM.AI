import React, { useState, useEffect } from 'react';
// FIX: Corrected the import for NavLink from 'react-router-dom' to resolve module export errors.
import { NavLink } from 'react-router-dom';
import { DashboardIcon, PipelineIcon, ContactsIcon, SettingsIcon, GuardianIcon, FormsIcon, AutomationIcon, CalendarIcon, VideoIcon, AdminPanelIcon } from './ui/icons';
import { supabase } from '../lib/supabaseClient';
import { diagnoseJWT } from '../lib/jwtUtils';

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

export const Sidebar: React.FC = () => {
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const checkSuperAdminRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const diagnostics = diagnoseJWT(session.access_token);
        const role = diagnostics.claims?.user_role;
        if (role === 'super_admin') {
          setIsSuperAdmin(true);
        }
      }
    };

    checkSuperAdminRole();

    // Listen for auth state changes to update the role
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.access_token) {
          const diagnostics = diagnoseJWT(session.access_token);
          const role = diagnostics.claims?.user_role;
          setIsSuperAdmin(role === 'super_admin');
        }
      } else if (event === 'SIGNED_OUT') {
        setIsSuperAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <aside className="w-64 bg-sidebar text-white flex flex-col p-4">
      <div className="flex items-center mb-8 px-2">
        <GuardianIcon className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold ml-2">Guardian AI</h1>
      </div>
      <nav>
        <ul>
          <NavItem
            to="/dashboard"
            icon={<DashboardIcon className="w-6 h-6" />}
            label="Dashboard"
          />
          <NavItem
            to="/opportunities"
            icon={<PipelineIcon className="w-6 h-6" />}
            label="Opportunità"
          />
          <NavItem
            to="/contacts"
            icon={<ContactsIcon className="w-6 h-6" />}
            label="Contatti"
          />
           <NavItem
            to="/calendar"
            icon={<CalendarIcon className="w-6 h-6" />}
            label="Calendario"
          />
          <NavItem
            to="/meetings"
            icon={<VideoIcon className="w-6 h-6" />}
            label="Meeting"
          />
          <NavItem
            to="/forms"
            icon={<FormsIcon className="w-6 h-6" />}
            label="Form"
          />
          <NavItem
            to="/automations"
            icon={<AutomationIcon className="w-6 h-6" />}
            label="Automazioni"
          />
        </ul>
      </nav>
      <div className="mt-auto">
        <ul>
            <NavItem
                to="/settings"
                icon={<SettingsIcon className="w-6 h-6" />}
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
      </div>
    </aside>
  );
};