
import React, { useState, useRef, useEffect } from 'react';
import { Tenant } from '../types';
import { ChevronDownIcon, BellIcon, UserCircleIcon, SearchIcon } from './ui/icons';

interface HeaderProps {
  tenants: Tenant[];
  currentTenant: Tenant;
  onTenantChange: (tenantId: number) => void;
}

export const Header: React.FC<HeaderProps> = ({ tenants, currentTenant, onTenantChange }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-card shadow-sm p-4 flex justify-between items-center">
      <div className="relative">
        <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center cursor-pointer bg-gray-100 hover:bg-gray-200 p-2 rounded-lg"
        >
          <span className="font-semibold text-lg text-text-primary">{currentTenant.name}</span>
          <ChevronDownIcon className="w-5 h-5 ml-2 text-gray-500" />
        </div>
        {isDropdownOpen && (
          <div ref={dropdownRef} className="absolute mt-2 w-48 bg-white rounded-md shadow-lg z-10">
            <ul>
              {tenants.map((tenant) => (
                <li
                  key={tenant.id}
                  onClick={() => {
                    onTenantChange(tenant.id);
                    setIsDropdownOpen(false);
                  }}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  {tenant.name}
                </li>
              ))}
            </ul>
          </div>
        )}
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
      </div>
    </header>
  );
};