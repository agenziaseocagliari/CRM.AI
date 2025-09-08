
export type View = 'Dashboard' | 'Opportunities' | 'Contacts' | 'Settings';

export interface Tenant {
  id: number;
  name: string;
}

export interface Contact {
  id: number;
  tenantId: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  createdAt: string;
}

export enum PipelineStage {
  NewLead = 'New Lead',
  Contacted = 'Contacted',
  ProposalSent = 'Proposal Sent',
  Won = 'Won',
  Lost = 'Lost',
}

export interface Opportunity {
  id: number;
  tenantId: number;
  contactName: string;
  value: number;
  stage: PipelineStage;
  assignedTo: string;
  closeDate: string;
}

export type OpportunitiesData = Record<PipelineStage, Opportunity[]>;
