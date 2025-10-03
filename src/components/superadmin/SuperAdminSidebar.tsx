import React from 'react';
import { NavLink, Link } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { 
    GuardianIcon, 
    DashboardIcon, 
    UsersIcon, 
    CreditCardIcon, 
    DocumentMagnifyingGlassIcon, 
    SparklesIcon,
    CpuChipIcon,
    GlobeAltIcon,
    ChartBarIcon,
    ShieldCheckIcon
} from '../ui/icons';

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string; }> = ({ to, icon, label }) => {
    const activeClass = 'bg-primary text-white dark:bg-dark-primary';
    const inactiveClass = 'text-gray-300 hover:bg-sidebar-hover hover:text-white dark:hover:bg-dark-sidebar-hover';

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

export const SuperAdminSidebar: React.FC = () => {
  const { userRole } = useAuth();
  
  return (
    <aside className="w-64 bg-sidebar text-white dark:bg-dark-sidebar flex flex-col p-4 flex-shrink-0 h-screen sticky top-0">
      <div className="flex items-center mb-8 px-2">
        <GuardianIcon className="w-8 h-8 text-primary dark:text-dark-primary" />
        <h1 className="text-2xl font-bold ml-2">Guardian AI</h1>
      </div>
       <div className="mb-4 px-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Super Admin</p>
      </div>
      <nav className="flex-grow">
        <ul>
          <NavItem to="dashboard" icon={<DashboardIcon className="w-6 h-6" />} label="Dashboard" />
          <NavItem to="system-health" icon={<ShieldCheckIcon className="w-6 h-6" />} label="System Health" />
          <NavItem to="quota-management" icon={<ChartBarIcon className="w-6 h-6" />} label="Quota & Limits" />
          <NavItem to="customers" icon={<UsersIcon className="w-6 h-6" />} label="Clienti" />
          <NavItem to="payments" icon={<CreditCardIcon className="w-6 h-6" />} label="Pagamenti" />
          <NavItem to="automation-agents" icon={<CpuChipIcon className="w-6 h-6" />} label="Agenti AI" />
          <NavItem to="api-integrations" icon={<GlobeAltIcon className="w-6 h-6" />} label="API & Integrazioni" />
          <NavItem to="workflow-builder" icon={<SparklesIcon className="w-6 h-6" />} label="Workflow Builder" />
          <NavItem to="ai-workflows" icon={<SparklesIcon className="w-6 h-6" />} label="Workflow Legacy" />
          <NavItem to="audit-logs" icon={<DocumentMagnifyingGlassIcon className="w-6 h-6" />} label="Audit Logs" />
        </ul>
      </nav>
        {userRole !== "super_admin" && (
          <div className="mt-auto px-2">
              <Link to="/dashboard" className="text-sm text-gray-400 hover:text-white dark:hover:text-dark-text-primary">
                  &larr; Torna al CRM
              </Link>
          </div>
        )}
    </aside>
  );
};