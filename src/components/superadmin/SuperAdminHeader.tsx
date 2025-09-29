import React, { useState, useEffect } from 'react';
import { UserCircleIcon, SunIcon, MoonIcon } from '../ui/icons';

export const SuperAdminHeader: React.FC = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="bg-card dark:bg-dark-card shadow-sm p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary">AI Ops & Admin Panel</h1>
      
      <div className="flex items-center space-x-4">
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600">
          {theme === 'light' ? 
            <MoonIcon className="w-6 h-6 text-gray-500 dark:text-gray-300" /> : 
            <SunIcon className="w-6 h-6 text-gray-500 dark:text-gray-300" />
          }
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600">
          <UserCircleIcon className="w-8 h-8 text-gray-500 dark:text-gray-300" />
        </button>
      </div>
    </header>
  );
};
