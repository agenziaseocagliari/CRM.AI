import React from 'react';
import { Organization } from '../types';
import { BellIcon, UserCircleIcon, SearchIcon, LogoutIcon } from './ui/icons';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  organization: Organization | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ organization, onLogout }) => {
  const { userRole, userEmail } = useAuth();
  
  const getRoleDisplay = () => {
    if (!userRole) return { text: 'Ruolo non definito', color: 'bg-gray-100 text-gray-600' };
    
    switch (userRole) {
      case 'super_admin':
        return { text: '🔐 Super Admin', color: 'bg-purple-100 text-purple-700' };
      case 'admin':
        return { text: '⚙️ Admin', color: 'bg-blue-100 text-blue-700' };
      case 'user':
        return { text: '👤 Utente Standard', color: 'bg-green-100 text-green-700' };
      default:
        return { text: `📋 ${userRole}`, color: 'bg-gray-100 text-gray-700' };
    }
  };
  
  const roleDisplay = getRoleDisplay();
  
  return (
    <header className="bg-card shadow-sm p-4 flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <div 
            className="flex items-center bg-gray-100 p-2 rounded-lg"
        >
          <span className="font-semibold text-lg text-text-primary">{organization?.name || 'Caricamento...'}</span>
        </div>
        
        {/* Current Role Display */}
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${roleDisplay.color}`}>
          {roleDisplay.text}
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Cerca..."
            className="bg-gray-100 rounded-full py-2 px-4 pl-10 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
        <button className="p-2 rounded-full hover:bg-gray-100">
          <BellIcon className="w-6 h-6 text-gray-500" />
        </button>
        <button 
          className="p-2 rounded-full hover:bg-gray-100 relative group"
          title={userEmail || 'Utente'}
        >
          <UserCircleIcon className="w-8 h-8 text-gray-500" />
          {userEmail && (
            <div className="hidden group-hover:block absolute right-0 top-full mt-2 w-64 p-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
              <div className="text-xs text-gray-600 truncate">{userEmail}</div>
            </div>
          )}
        </button>
        <button 
          onClick={onLogout} 
          title="Logout - Per cambiare ruolo effettua logout e login con account diverso" 
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <LogoutIcon className="w-6 h-6 text-gray-500" />
        </button>
      </div>
    </header>
  );
};