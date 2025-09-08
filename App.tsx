
import React, { useState, useCallback, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Opportunities } from './components/Opportunities';
import { Contacts } from './components/Contacts';
import { Tenant, View } from './types';
import { useMockData } from './hooks/useMockData';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('Dashboard');
  const [currentTenantId, setCurrentTenantId] = useState<number>(1);
  
  const { tenants, contacts, opportunitiesData, setOpportunitiesData, getTenantContacts, getTenantOpportunities } = useMockData();

  const currentTenant = useMemo(() => tenants.find(t => t.id === currentTenantId) || tenants[0], [tenants, currentTenantId]);
  
  const handleTenantChange = useCallback((tenantId: number) => {
    setCurrentTenantId(tenantId);
  }, []);

  const renderView = () => {
    const tenantContacts = getTenantContacts(currentTenantId);
    const tenantOpportunities = getTenantOpportunities(currentTenantId);

    switch (currentView) {
      case 'Dashboard':
        return <Dashboard opportunities={tenantOpportunities} contacts={tenantContacts} />;
      case 'Opportunities':
        return <Opportunities initialData={tenantOpportunities} setData={setOpportunitiesData} />;
      case 'Contacts':
        return <Contacts contacts={tenantContacts} />;
      default:
        return <Dashboard opportunities={tenantOpportunities} contacts={tenantContacts} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 text-text-primary">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          tenants={tenants} 
          currentTenant={currentTenant} 
          onTenantChange={handleTenantChange} 
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;
