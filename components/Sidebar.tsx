
import React from 'react';
import { View } from '../types';
import { DashboardIcon, PipelineIcon, ContactsIcon, SettingsIcon, GuardianIcon, FormsIcon, AutomationIcon } from './ui/icons';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <li
    onClick={onClick}
    className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-colors ${
      isActive
        ? 'bg-primary text-white'
        : 'text-gray-300 hover:bg-sidebar-hover hover:text-white'
    }`}
  >
    {icon}
    <span className="ml-3 font-medium">{label}</span>
  </li>
);

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView }) => {
  return (
    <aside className="w-64 bg-sidebar text-white flex flex-col p-4">
      <div className="flex items-center mb-8 px-2">
        <GuardianIcon className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold ml-2">Guardian AI</h1>
      </div>
      <nav>
        <ul>
          <NavItem
            icon={<DashboardIcon className="w-6 h-6" />}
            label="Dashboard"
            isActive={currentView === 'Dashboard'}
            onClick={() => setCurrentView('Dashboard')}
          />
          <NavItem
            icon={<PipelineIcon className="w-6 h-6" />}
            label="Opportunities"
            isActive={currentView === 'Opportunities'}
            onClick={() => setCurrentView('Opportunities')}
          />
          <NavItem
            icon={<ContactsIcon className="w-6 h-6" />}
            label="Contacts"
            isActive={currentView === 'Contacts'}
            onClick={() => setCurrentView('Contacts')}
          />
          <NavItem
            icon={<FormsIcon className="w-6 h-6" />}
            label="Forms"
            isActive={currentView === 'Forms'}
            onClick={() => setCurrentView('Forms')}
          />
          <NavItem
            icon={<AutomationIcon className="w-6 h-6" />}
            label="Automations"
            isActive={currentView === 'Automations'}
            onClick={() => setCurrentView('Automations')}
          />
        </ul>
      </nav>
      <div className="mt-auto">
        <ul>
            <NavItem
                icon={<SettingsIcon className="w-6 h-6" />}
                label="Settings"
                isActive={currentView === 'Settings'}
                onClick={() => setCurrentView('Settings')}
            />
        </ul>
      </div>
    </aside>
  );
};