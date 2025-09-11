import React from 'react';
import { NavLink } from 'react-router-dom';
import { DashboardIcon, PipelineIcon, ContactsIcon, SettingsIcon, GuardianIcon, FormsIcon, MessageBotIcon } from './ui/icons';

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
            to="/forms"
            icon={<FormsIcon className="w-6 h-6" />}
            label="Form"
          />
          <NavItem
            to="/automations"
            icon={<MessageBotIcon className="w-6 h-6" />}
            label="Agenti AI"
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
        </ul>
      </div>
    </aside>
  );
};