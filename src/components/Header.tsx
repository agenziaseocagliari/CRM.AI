import React from 'react';
import { Organization } from '../types';
import { BellIcon, UserCircleIcon, SearchIcon, LogoutIcon } from './ui/icons';

interface HeaderProps {
  organization: Organization | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ organization, onLogout }) => {
  return (
    <header className="bg-card shadow-sm p-4 flex justify-between items-center">
      <div>
        <div 
            className="flex items-center bg-gray-100 p-2 rounded-lg"
        >
          <span className="font-semibold text-lg text-text-primary">{organization?.name || 'Caricamento...'}</span>
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
        <button className="p-2 rounded-full hover:bg-gray-100">
          <UserCircleIcon className="w-8 h-8 text-gray-500" />
        </button>
        <button onClick={onLogout} title="Logout" className="p-2 rounded-full hover:bg-gray-100">
          <LogoutIcon className="w-6 h-6 text-gray-500" />
        </button>
      </div>
    </header>
  );
};