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
    type: 'text' | 'email' | 'tel' | 'textarea' | 'checkbox' | 'select' | 'radio' | 'number' | 'date' | 'url';
    required: boolean;
    description?: string;
    placeholder?: string;
    options?: string[];
}

export interface ButtonStyle {
    background_color: string;
    text_color: string;
    border_radius: string;
}

export interface FormStyle {
    primary_color: string;
    secondary_color: string;
    background_color: string;
    text_color: string;
    border_color: string;
    border_radius: string;
    font_family: string;
    button_style: ButtonStyle;
}

// 🆕 AI Metadata from Edge Function
export interface FormMetadata {
    industry?: 'web_agency' | 'wordpress' | 'ecommerce' | 'real_estate' | 'healthcare' | 'general';
    confidence?: number; // 0-1 range
    platform?: 'wordpress' | 'react' | 'html';
    theme?: string;
    gdpr_enabled?: boolean;
    generated_at?: string;
    generation_method?: string;
    characteristics?: string[];
}

// 🆕 Form Creation Modes
export type FormCreationMode = 'ai-quick' | 'ai-chat' | 'manual' | null;

export interface Form {
    id: string;
    organization_id: string;
    name: string;
    title: string;
    fields: FormField[];
    styling?: FormStyle;
    privacy_policy_url?: string;
    metadata?: FormMetadata; // 🆕 AI metadata
    created_at: string;
}

export interface Automation {
    id: number;
    organization_id: string;
    name: string;
    description: string;
    created_at: string;
}

// Interfaccia per la tabella `google_credentials`
export interface GoogleCredential {
  organization_id: string;
  user_id: string; // L'utente che ha autorizzato la connessione
  access_token: string;
  refresh_token: string;
  expiry_date: number; // Unix timestamp in secondi
  scope: string;
}


export interface OrganizationSettings {
    organization_id: string;
    brevo_api_key: string | null;
    twilio_account_sid: string | null;
    twilio_auth_token: string | null;
    // Il token di Google è ora gestito nella tabella `google_credentials`
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

// =====================================================
// Automation Agents & API Integration Types
// =====================================================

export type AgentType = 'health_monitor' | 'payment_revenue' | 'support_ticket' | 'user_engagement' | 'security_watcher';
export type AgentStatus = 'idle' | 'running' | 'error';

export interface AutomationAgent {
    id: string;
    name: string;
    type: AgentType;
    description: string;
    is_active: boolean;
    configuration: Record<string, any>;
    status: AgentStatus;
    last_run_at: string | null;
    last_error: string | null;
    created_at: string;
    updated_at: string;
}

export interface AgentExecutionLog {
    id: number;
    agent_id: string;
    execution_start: string;
    execution_end: string | null;
    status: 'running' | 'success' | 'error' | 'partial';
    result_summary: Record<string, any> | null;
    error_details: string | null;
    actions_taken: any[];
    created_at: string;
}

export type ProviderType = 'messaging' | 'email' | 'ai' | 'push' | 'custom';
export type IntegrationStatus = 'connected' | 'disconnected' | 'error' | 'rate_limited';

export interface APIIntegration {
    id: string;
    provider_name: string;
    provider_type: ProviderType;
    display_name: string;
    is_active: boolean;
    credentials: Record<string, any>;
    configuration: Record<string, any>;
    status: IntegrationStatus;
    last_ping_at: string | null;
    last_error: string | null;
    usage_stats: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface IntegrationUsageLog {
    id: number;
    integration_id: string;
    action_type: string;
    status: 'success' | 'error' | 'rate_limited';
    request_details: Record<string, any> | null;
    response_details: Record<string, any> | null;
    error_message: string | null;
    execution_time_ms: number | null;
    created_at: string;
}

// Organization-level integrations (separate from super-admin APIIntegration)
export interface Integration {
    id: string;
    organization_id: string;
    integration_type: string;
    is_active: boolean;
    configuration: Record<string, any>;
    credentials: Record<string, any>;
    status: 'active' | 'inactive' | 'error' | 'rate_limited';
    last_sync_at: string | null;
    last_error: string | null;
    created_at: string;
    updated_at: string;
}

export type TriggerType = 'manual' | 'schedule' | 'event' | 'condition';

export interface WorkflowDefinition {
    id: string;
    organization_id: string | null;
    name: string;
    description: string | null;
    natural_language_prompt: string;
    workflow_json: Record<string, any>;
    is_active: boolean;
    trigger_type: TriggerType;
    trigger_config: Record<string, any>;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    last_executed_at: string | null;
}

export interface WorkflowExecutionLog {
    id: number;
    workflow_id: string;
    organization_id: string | null;
    execution_start: string;
    execution_end: string | null;
    status: 'running' | 'success' | 'error' | 'partial';
    trigger_data: Record<string, any> | null;
    execution_result: Record<string, any> | null;
    error_details: string | null;
    created_at: string;
}