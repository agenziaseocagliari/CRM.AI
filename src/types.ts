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
  lead_score: number | null;
  lead_category: 'Hot' | 'Warm' | 'Cold' | null;
  lead_score_reasoning: string | null;
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

// Tipi per la nuova funzionalità Form Builder AI
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea';
  required: boolean;
}

export interface Form {
  id: string; // UUID
  organization_id: string;
  name: string;
  title: string;
  fields: FormField[];
  created_at: string;
}

// Tipi per la nuova funzionalità Automations
export interface Automation {
  id: string; // UUID
  organization_id: string;
  name: string;
  description: string;
  created_at: string;
}

// Tipi per le impostazioni dell'organizzazione (es. API Keys)
export interface OrganizationSettings {
    id: string; // UUID
    organization_id: string;
    brevo_api_key: string | null;
    created_at: string;
    updated_at: string;
}
