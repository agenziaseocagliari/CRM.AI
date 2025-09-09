// Allineato con lo schema del database Supabase
export type View = 'Dashboard' | 'Opportunities' | 'Contacts' | 'Forms' | 'Automations' | 'Settings';

export interface Organization {
  id: string; // UUID
  name: string;
  created_at: string;
}

export interface Profile {
  id: string; // User UUID from auth.users
  organization_id: string; // Foreign key to Organization
}

export interface Contact {
  id: string; // UUID
  organization_id: string; // Foreign key
  name: string;
  email: string;
  phone: string;
  company: string;
  created_at: string;
}

export enum PipelineStage {
  NewLead = 'New Lead',
  Contacted = 'Contacted',
  ProposalSent = 'Proposal Sent',
  Won = 'Won',
  Lost = 'Lost',
}

export interface Opportunity {
  id: string; // UUID
  organization_id: string; // Foreign key
  contact_name: string;
  value: number;
  stage: PipelineStage;
  assigned_to: string;
  close_date: string;
  created_at: string;
}

export type OpportunitiesData = Record<PipelineStage, Opportunity[]>;