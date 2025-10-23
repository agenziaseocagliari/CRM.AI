// Gli import vanno sempre puliti e organizzati dopo ogni refactor o patch.
import { useCallback, useEffect, useState } from 'react';

import { invokeSupabaseFunction } from '../lib/api';
import { diagnosticLogger } from '../lib/mockDiagnosticLogger';
import { supabase } from '../lib/supabaseClient';
import {
  Automation,
  Contact,
  CreditLedgerEntry,
  CrmEvent,
  Form,
  OpportunitiesData,
  Opportunity,
  Organization,
  OrganizationSettings,
  OrganizationSubscription,
  PipelineStage
} from '../types';

// ADAPTER: Map database TEXT stages to pipeline stages
const STAGE_MAPPING: Record<string, PipelineStage> = {
  'New Lead': PipelineStage.NewLead,
  'Contacted': PipelineStage.Contacted,
  'Proposal Sent': PipelineStage.ProposalSent,
  'Won': PipelineStage.Won,
  'Lost': PipelineStage.Lost,
  // Fallback for unknown stages
  'default': PipelineStage.NewLead
};

const groupOpportunitiesByStage = (opportunities: Opportunity[]): OpportunitiesData => {
  const emptyData: OpportunitiesData = {
    [PipelineStage.NewLead]: [],
    [PipelineStage.Contacted]: [],
    [PipelineStage.ProposalSent]: [],
    [PipelineStage.Won]: [],
    [PipelineStage.Lost]: [],
  };

  if (!opportunities || opportunities.length === 0) {
    return emptyData;
  }

  const grouped = opportunities.reduce((acc, op) => {
    // ADAPTER: Map database stage TEXT to PipelineStage enum
    const mappedStage = STAGE_MAPPING[op.stage] || STAGE_MAPPING['default'];

    if (acc[mappedStage]) {
      acc[mappedStage].push(op);
    } else {
      // Fallback to New Lead
      acc[PipelineStage.NewLead].push(op);
    }
    return acc;
  }, emptyData);

  return grouped;
};


export const useCrmData = () => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunitiesData>(groupOpportunitiesByStage([]));
  const [forms, setForms] = useState<Form[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [organizationSettings, setOrganizationSettings] = useState<OrganizationSettings | null>(null);
  const [crmEvents, setCrmEvents] = useState<CrmEvent[]>([]);
  const [subscription, setSubscription] = useState<OrganizationSubscription | null>(null);
  const [ledger, setLedger] = useState<CreditLedgerEntry[]>([]);
  const [isCalendarLinked, setIsCalendarLinked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Get JWT session and extract user
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        diagnosticLogger.error('[useCrmData] Session error:', sessionError);
        throw sessionError;
      }
      const user = session?.user;

      if (!user) {
        diagnosticLogger.info('[useCrmData] No user session found, clearing state');
        setLoading(false);
        setOrganization(null); setContacts([]); setOpportunities(groupOpportunitiesByStage([]));
        setForms([]); setAutomations([]); setOrganizationSettings(null);
        setCrmEvents([]); setSubscription(null); setLedger([]);
        setIsCalendarLinked(false);
        localStorage.removeItem('organization_id');
        return;
      }

      // Step 2: Log JWT user details for debugging
      diagnosticLogger.info('[useCrmData] User authenticated from JWT:', {
        userId: user.id,
        email: user.email,
        jwtSub: user.id, // This is the 'sub' claim from JWT
        timestamp: new Date().toISOString()
      });

      // Step 3: Query profile using JWT user.id (which matches the 'sub' claim)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id, vertical')
        .eq('id', user.id)
        .maybeSingle();

      // Step 4: Enhanced error handling with diagnostic information
      if (profileError || !profileData) {
        diagnosticLogger.error('[useCrmData] Profile lookup failed:', {
          error: profileError,
          queriedUserId: user.id,
          userEmail: user.email,
          profileData: profileData,
          errorCode: profileError?.code,
          errorMessage: profileError?.message,
          errorDetails: profileError?.details,
          hint: profileError?.hint
        });

        // Don't throw error - let app continue, useVertical will handle its own loading
        console.warn('Profile lookup failed, app will continue loading...');

        // Return early without blocking app initialization
        setError('Profile lookup failed');
        setLoading(false);
        return;
      }

      // SUPER ADMIN FIX: Se organization_id è "ALL", usa la prima organizzazione disponibile
      let { organization_id } = profileData;
      if (organization_id === 'ALL') {
        diagnosticLogger.info('[useCrmData] Super admin detected with organization_id="ALL", using first available organization');
        const { data: firstOrg } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .single();

        if (firstOrg) {
          organization_id = firstOrg.id;
          diagnosticLogger.info('[useCrmData] Using organization:', organization_id);
        } else {
          throw new Error('Nessuna organizzazione disponibile per il super admin');
        }
      }
      diagnosticLogger.info('[useCrmData] Profile found successfully:', {
        userId: user.id,
        organizationId: organization_id
      });

      const [eventsResponse, orgResponse, contactsResponse, opportunitiesResponse, formsResponse, automationsResponse, settingsResponse, subscriptionResponse, ledgerResponse, googleCredsResponse] = await Promise.all([
        invokeSupabaseFunction('get-all-crm-events', { organization_id }),
        supabase.from('organizations').select('*').eq('id', organization_id).single<Organization>(),
        supabase.from('contacts').select('*').eq('organization_id', organization_id).order('created_at', { ascending: false }),
        (async () => {
          // ADAPTED QUERY: Use actual database schema columns with proper ordering
          const result = await supabase
            .from('opportunities')
            .select('*')
            .eq('organization_id', organization_id)
            .order('created_at', { ascending: false })

          if (result.data) {
            // ADAPTER: Transform database format to component expectations  
            const adaptedData = result.data.map(opp => ({
              ...opp,
              title: opp.contact_name,  // Alias for components that expect title
              stage_name: opp.stage,    // Alias for stage name
              stage_id: opp.stage       // Use TEXT stage as identifier
            }))

            result.data = adaptedData
          }
          return result
        })(),
        supabase.from('forms').select('*').eq('organization_id', organization_id).order('created_at', { ascending: false }),
        supabase.from('automations').select('*').eq('organization_id', organization_id).order('created_at', { ascending: false }),
        supabase.from('organization_settings').select('*').eq('organization_id', organization_id).maybeSingle<OrganizationSettings>(),
        supabase.from('organization_subscriptions').select('*').eq('organization_id', organization_id).maybeSingle<OrganizationSubscription>(),
        supabase.from('credit_ledger').select('*').eq('organization_id', organization_id).order('created_at', { ascending: false }).limit(20),
        supabase.from('google_credentials').select('organization_id').eq('organization_id', organization_id).maybeSingle()
      ]);

      diagnosticLogger.info('[useCrmData] Data fetch completed for organization:', organization_id);

      if (orgResponse.error) { throw new Error(`Errore nel caricamento dell'organizzazione: ${orgResponse.error.message}`); }
      if (contactsResponse.error) { throw new Error(`Errore nel caricamento dei contatti: ${contactsResponse.error.message}`); }
      if (opportunitiesResponse.error) { throw new Error(`Errore nel caricamento delle opportunit� : ${opportunitiesResponse.error.message}`); }
      if (formsResponse.error) { throw new Error(`Errore nel caricamento dei form: ${formsResponse.error.message}`); }
      if (automationsResponse.error) { throw new Error(`Errore nel caricamento delle automazioni: ${automationsResponse.error.message}`); }
      if (settingsResponse.error) { throw new Error(`Errore nel caricamento delle impostazioni: ${settingsResponse.error.message}`); }
      if (subscriptionResponse.error) { throw new Error(`Errore nel caricamento della sottoscrizione: ${subscriptionResponse.error.message}`); }
      if (ledgerResponse.error) { throw new Error(`Errore nel caricamento dello storico crediti: ${ledgerResponse.error.message}`); }
      if (googleCredsResponse.error) { throw new Error(`Errore nel caricamento delle credenziali Google: ${googleCredsResponse.error.message}`); }

      if (orgResponse.data) {
        setOrganization(orgResponse.data);
        localStorage.setItem('organization_id', orgResponse.data.id);
      }
      setContacts(contactsResponse.data || []);

      const groupedOpps = groupOpportunitiesByStage(opportunitiesResponse.data || []);
      setOpportunities(groupedOpps);

      setForms(formsResponse.data || []);
      setAutomations(automationsResponse.data || []);
      setOrganizationSettings(settingsResponse.data);
      setCrmEvents((eventsResponse as { events?: CrmEvent[] })?.events || []);
      setSubscription(subscriptionResponse.data);
      setLedger(ledgerResponse.data || []);
      setIsCalendarLinked(!!googleCredsResponse.data);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      diagnosticLogger.error('[useCrmData] Error in fetchData:', {
        error,
        message: errorMessage,
        stack: errorStack,
        timestamp: new Date().toISOString()
      });
      setError(errorMessage);
      diagnosticLogger.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, _session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        fetchData();
      }
    });

    return () => authListener?.subscription.unsubscribe();

  }, [fetchData]);

  return { organization, contacts, opportunities, forms, automations, organizationSettings, crmEvents, subscription, ledger, isCalendarLinked, loading, error, refetch: fetchData };
};


