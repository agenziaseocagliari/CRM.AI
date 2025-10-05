import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GuardianIcon } from './ui/icons';

interface PublicHeaderProps {
  showBackToHome?: boolean;
}

export const PublicHeader: React.FC<PublicHeaderProps> = ({ showBackToHome = false }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/" className="flex items-center">
            <GuardianIcon className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-bold ml-2">Guardian AI CRM</h1>
          </Link>
        </div>
        
        {showBackToHome ? (
          <Link 
            to="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            ← Torna alla Home
          </Link>
        ) : (
          <nav className="hidden md:flex space-x-6 items-center">
            <Link 
              to="/pricing" 
              className="text-gray-700 hover:text-primary transition-colors"
            >
              Prezzi
            </Link>
            
            {/* Solutions Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                className="text-gray-700 hover:text-primary transition-colors flex items-center space-x-1"
              >
                <span>Le Nostre Soluzioni</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                  <Link 
                    to="/verticals/insurance-agency" 
                    className="flex items-center px-4 py-3 text-blue-600 hover:bg-blue-50 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <span className="text-2xl mr-3">🛡️</span>
                    <div>
                      <div className="font-semibold">Assicurazioni</div>
                      <div className="text-sm text-gray-500">CRM per agenzie assicurative</div>
                    </div>
                  </Link>
                  <Link 
                    to="/verticals/marketing-agency" 
                    className="flex items-center px-4 py-3 text-purple-600 hover:bg-purple-50 transition-colors"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <span className="text-2xl mr-3">📊</span>
                    <div>
                      <div className="font-semibold">Marketing</div>
                      <div className="text-sm text-gray-500">CRM per agenzie marketing</div>
                    </div>
                  </Link>
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <div className="px-4 py-2 text-sm text-gray-400">
                      Prossimamente: Healthcare, Legal, Consulting
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <Link 
              to="/login" 
              className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Accedi
            </Link>
          </nav>
        )}

        {/* Mobile menu button */}
        <div className="md:hidden">
          <Link 
            to="/login" 
            className="bg-primary text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
          >
            Accedi
          </Link>
        </div>
      </div>
    </header>
  );
};