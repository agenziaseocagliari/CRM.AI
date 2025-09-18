// Allineato con lo schema del database Supabase

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
    twilio_account_sid: string | null;
    twilio_auth_token: string | null;
    google_auth_token: string | null; // Aggiunto per i token OAuth di Google
    created_at: string;
    updated_at: string;
}

// --- NUOVI TIPI PER EVENTI E PROMEMORIA ---
export type ReminderChannel = 'Email' | 'WhatsApp';

export interface Reminder {
    id: string; // un ID temporaneo lato client, es. `Date.now()`
    minutesBefore: number;
    channel: ReminderChannel;
    message: string;
}

export interface EventFormData {
    title: string;
    date: string; // "YYYY-MM-DD"
    time: string; // "HH:mm"
    duration: number; // in minutes
    location: string;
    description: string;
    addMeet: boolean;
    reminders: Reminder[];
}

// --- NUOVI TIPI PER TEMPLATE EVENTI ---
export interface EventTemplate {
    id: string; // es. Date.now().toString()
    name: string; // Nome dato dall'utente al template
    // Salva i dati riutilizzabili dell'evento
    data: {
        title: string;
        duration: number;
        location: string;
        description: string;
        addMeet: boolean;
        reminders: Reminder[];
    };
}

// --- NUOVI TIPI PER GOOGLE CALENDAR ---
export interface BusySlot {
    start: string; // ISO Date String
    end: string;   // ISO Date String
}

// --- NUOVI TIPI PER EVENTI E PROMEMORIA NEL DB ---
export interface EventReminder {
  id: number;
  channel: ReminderChannel;
  scheduled_at: string; // ISO string
  status: 'scheduled' | 'sent' | 'failed';
  error_message: string | null;
}

// --- NUOVO TIPO PER EVENTI CRM ---
export interface CrmEvent {
  id: number;
  google_event_id: string | null; // Può essere null per eventi non sincronizzati
  organization_id: string;
  contact_id: string;
  event_summary: string;
  event_start_time: string; // ISO string
  event_end_time: string;   // ISO string
  status: 'confirmed' | 'cancelled';
  created_at: string;
  // Join data
  event_reminders?: EventReminder[];
}

// --- NUOVI TIPI PER IL SISTEMA DI CREDITI ---
export interface OrganizationSubscription {
  id: string; // UUID
  organization_id: string;
  plan_name: string;
  total_credits: number;
  current_credits: number;
  cycle_start_date: string; // ISO string
  cycle_end_date: string | null; // ISO string
}

export interface CreditLedgerEntry {
    id: number;
    action_type: string;
    credits_changed: number;
    new_balance: number;
    outcome: 'SUCCESS' | 'INSUFFICIENT_FUNDS';
    created_at: string; // ISO string
}

// --- NUOVI TIPI PER I PAYLOAD DEGLI EVENTI ---
interface BaseEventPayload {
  userId: string;
  organization_id: string;
  eventDetails: {
    summary: string;
    description: string;
    startTime: string;
    endTime: string;
    location?: string;
  };
}

export interface CreateGoogleEventPayload extends BaseEventPayload {
  contact_id: string;
  eventDetails: BaseEventPayload['eventDetails'] & {
    addMeet: boolean;
  };
  contact: {
    id: string;
    email: string;
  };
}

export interface UpdateGoogleEventPayload extends BaseEventPayload {
  crm_event_id: number;
}
