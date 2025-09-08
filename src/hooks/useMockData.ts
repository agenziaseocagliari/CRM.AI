
import { useState, useCallback } from 'react';
import { Tenant, Contact, Opportunity, PipelineStage, OpportunitiesData } from '../types';

const initialTenants: Tenant[] = [
  { id: 1, name: 'SEO Agency Client' },
  { id: 2, name: 'Insurance Agency Client' },
];

const initialContacts: Contact[] = [
  // Tenant 1: SEO Agency
  { id: 1, tenantId: 1, name: 'John Doe', email: 'john.d@example.com', phone: '123-456-7890', company: 'Tech Corp', createdAt: '2023-01-15' },
  { id: 2, tenantId: 1, name: 'Jane Smith', email: 'jane.s@example.com', phone: '234-567-8901', company: 'Innovate Ltd', createdAt: '2023-02-20' },
  { id: 3, tenantId: 1, name: 'Sam Wilson', email: 'sam.w@example.com', phone: '345-678-9012', company: 'Solutions Inc', createdAt: '2023-03-10' },

  // Tenant 2: Insurance Agency
  { id: 4, tenantId: 2, name: 'Alice Johnson', email: 'alice.j@example.com', phone: '456-789-0123', company: 'SafeGuard Insurance', createdAt: '2023-04-05' },
  { id: 5, tenantId: 2, name: 'Bob Williams', email: 'bob.w@example.com', phone: '567-890-1234', company: 'SecureLife Co', createdAt: '2023-05-12' },
  { id: 6, tenantId: 2, name: 'Charlie Brown', email: 'charlie.b@example.com', phone: '678-901-2345', company: 'Family First Insurance', createdAt: '2023-06-18' },
  { id: 7, tenantId: 2, name: 'Diana Prince', email: 'diana.p@example.com', phone: '789-012-3456', company: 'Shield Insurance', createdAt: '2023-07-22' },
];

const initialOpportunities: Opportunity[] = [
  // Tenant 1
  { id: 1, tenantId: 1, contactName: 'John Doe', value: 5000, stage: PipelineStage.ProposalSent, assignedTo: 'Mike', closeDate: '2024-08-30' },
  { id: 2, tenantId: 1, contactName: 'Jane Smith', value: 7500, stage: PipelineStage.Contacted, assignedTo: 'Sarah', closeDate: '2024-09-15' },
  { id: 3, tenantId: 1, contactName: 'New SEO Lead', value: 3000, stage: PipelineStage.NewLead, assignedTo: 'Mike', closeDate: '2024-09-20' },
  { id: 4, tenantId: 1, contactName: 'Old Client', value: 10000, stage: PipelineStage.Won, assignedTo: 'Sarah', closeDate: '2024-07-01' },
  { id: 5, tenantId: 1, contactName: 'Lost Deal', value: 2500, stage: PipelineStage.Lost, assignedTo: 'Mike', closeDate: '2024-06-10' },

  // Tenant 2
  { id: 6, tenantId: 2, contactName: 'Alice Johnson', value: 1200, stage: PipelineStage.Won, assignedTo: 'Chris', closeDate: '2024-07-15' },
  { id: 7, tenantId: 2, contactName: 'Bob Williams', value: 800, stage: PipelineStage.ProposalSent, assignedTo: 'Anna', closeDate: '2024-08-25' },
  { id: 8, tenantId: 2, contactName: 'Charlie Brown', value: 1500, stage: PipelineStage.Contacted, assignedTo: 'Chris', closeDate: '2024-09-05' },
  { id: 9, tenantId: 2, contactName: 'New Insurance Inquiry', value: 500, stage: PipelineStage.NewLead, assignedTo: 'Anna', closeDate: '2024-09-10' },
  { id: 10, tenantId: 2, contactName: 'Expired Policy', value: 950, stage: PipelineStage.Lost, assignedTo: 'Chris', closeDate: '2024-05-20' },
];

const groupOpportunitiesByStage = (opportunities: Opportunity[]): OpportunitiesData => {
  const emptyData: OpportunitiesData = {
    [PipelineStage.NewLead]: [],
    [PipelineStage.Contacted]: [],
    [PipelineStage.ProposalSent]: [],
    [PipelineStage.Won]: [],
    [PipelineStage.Lost]: [],
  };

  return opportunities.reduce((acc, op) => {
    if (!acc[op.stage]) {
      acc[op.stage] = [];
    }
    acc[op.stage].push(op);
    return acc;
  }, emptyData);
};

export const useMockData = () => {
  const [tenants] = useState<Tenant[]>(initialTenants);
  const [contacts] = useState<Contact[]>(initialContacts);
  const [opportunities, setOpportunities] = useState<Record<number, OpportunitiesData>>({
      1: groupOpportunitiesByStage(initialOpportunities.filter(op => op.tenantId === 1)),
      2: groupOpportunitiesByStage(initialOpportunities.filter(op => op.tenantId === 2)),
  });

  const getTenantContacts = useCallback((tenantId: number) => {
    return contacts.filter(c => c.tenantId === tenantId);
  }, [contacts]);

  const getTenantOpportunities = useCallback((tenantId: number) => {
    return opportunities[tenantId] || {
        [PipelineStage.NewLead]: [],
        [PipelineStage.Contacted]: [],
        [PipelineStage.ProposalSent]: [],
        [PipelineStage.Won]: [],
        [PipelineStage.Lost]: [],
    };
  }, [opportunities]);

  return {
    tenants,
    contacts,
    opportunitiesData: opportunities,
    setOpportunitiesData: setOpportunities,
    getTenantContacts,
    getTenantOpportunities
  };
};