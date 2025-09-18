// File: src/types.ts

export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  organization_id: string;
  // other profile fields...
}

export interface Contact {
  id: number;
  organization_id: string;
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
  id: string;
  organization_id: string;
  contact_name: string;
  value: number;
  stage: PipelineStage;
  assigned_to: string;
  close_date: string;
  created_at: string;
}

export type OpportunitiesData = Record<PipelineStage, Opportunity[]>;

export interface FormField {
    name: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'textarea';
    required: boolean;
}

export interface Form {
    id: string;
    organization_id: string;
    name: string;
    title: string;
    fields: FormField[];
    created_at: string;
}

export interface Automation {
    id: number;
    organization_id: string;
    name: string;
    description: string;
    created_at: string;
}

export interface OrganizationSettings {
    organization_id: string;
    brevo_api_key: string | null;
    twilio_account_sid: string | null;
    twilio_auth_token: string | null;
    google_auth_token: string | null; // This will be a JSON string
}

export interface EventReminder {
    id: number;
    crm_event_id: number;
    channel: 'Email' | 'WhatsApp';
    scheduled_at: string;
    status: 'scheduled' | 'sent' | 'failed';
    error_message?: string | null;
    message?: string | null;
}

export interface CrmEvent {
    id: number;
    organization_id: string;
    contact_id: number;
    event_summary: string;
    event_description: string | null;
    event_start_time: string;
    event_end_time: string;
    status: 'confirmed' | 'cancelled';
    google_event_id: string | null;
    created_at: string;
    event_reminders?: EventReminder[];
}

export interface OrganizationSubscription {
    organization_id: string;
    plan_name: string;
    current_credits: number;
    total_credits: number;
    cycle_start_date: string;
    cycle_end_date: string | null;
}

export interface CreditLedgerEntry {
    id: number;
    organization_id: string;
    action_type: string;
    credits_changed: number;
    outcome: 'SUCCESS' | 'INSUFFICIENT_FUNDS';
    created_at: string;
}
