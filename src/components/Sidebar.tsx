import { BarChart3, Mail, MessageCircle } from 'lucide-react';
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AdminPanelIcon, AutomationIcon, CalendarIcon, ContactsIcon, CreditCardIcon, DashboardIcon, FormsIcon, GuardianIcon, PipelineIcon, SettingsIcon } from './ui/icons';

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
  const { isSuperAdmin } = useAuth();

  return (
    <aside className="w-64 bg-sidebar text-white flex flex-col p-4">
      <div className="flex items-center mb-8 px-2">
        <GuardianIcon className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold ml-2">Guardian AI</h1>
      </div>
      <nav>
        <ul>
          <NavItem
            to=""
            icon={<DashboardIcon className="w-6 h-6" />}
            label="Dashboard"
          />
          <NavItem
            to="opportunities"
            icon={<PipelineIcon className="w-6 h-6" />}
            label="Opportunità"
          />
          <NavItem
            to="contacts"
            icon={<ContactsIcon className="w-6 h-6" />}
            label="Contatti"
          />
           <NavItem
            to="calendar"
            icon={<CalendarIcon className="w-6 h-6" />}
            label="Calendario"
          />
          <NavItem
            to="reports"
            icon={<BarChart3 className="w-6 h-6" />}
            label="Reports"
          />

          <NavItem
            to="forms"
            icon={<FormsIcon className="w-6 h-6" />}
            label="Form"
          />
          <NavItem
            to="automation"
            icon={<AutomationIcon className="w-6 h-6" />}
            label="Visual Automation"
          />
          
          {/* Universal Access Modules - All Available */}
          <div className="border-t border-gray-700 my-4 pt-4">
            <div className="flex items-center space-x-2 px-3 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <p className="text-xs text-green-400 uppercase tracking-wide font-semibold">
                🌍 Accesso Universale
              </p>
            </div>
            <NavItem
              to="whatsapp"
              icon={<MessageCircle className="w-6 h-6" />}
              label="WhatsApp"
            />
            <NavItem
              to="email-marketing"
              icon={<Mail className="w-6 h-6" />}
              label="Email Marketing"
            />
          </div>
          
          <NavItem
            to="universal-credits"
            icon={<CreditCardIcon className="w-6 h-6" />}
            label="Sistema Crediti"
          />
          <NavItem
            to="store"
            icon={<CreditCardIcon className="w-6 h-6" />}
            label="Prezzi"
          />
        </ul>
      </nav>
      <div className="mt-auto">
        <ul>
            <NavItem
                to="settings"
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

