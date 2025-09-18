// Gli import vanno sempre puliti e organizzati dopo ogni refactor o patch.
import { useState, useEffect, useCallback } from 'react';

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
    PipelineStage,
    Profile
} from '../types';
import { invokeSupabaseFunction } from '../lib/api';

const groupOpportunitiesByStage = (opportunities: Opportunity[]): OpportunitiesData => {
  const emptyData: OpportunitiesData = {
    [PipelineStage.NewLead]: [],
    [PipelineStage.Contacted]: [],
    [PipelineStage.ProposalSent]: [],
    [PipelineStage.Won]: [],
    [PipelineStage.Lost]: [],
  };

  if (!opportunities) return emptyData;

  return opportunities.reduce((acc, op) => {
    if (acc[op.stage]) {
      acc[op.stage].push(op);
    }
    return acc;
  }, emptyData);
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
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if(sessionError) throw sessionError;
      const user = session?.user;
      
      if (!user) {
        setLoading(false);
        setOrganization(null); setContacts([]); setOpportunities(groupOpportunitiesByStage([]));
        setForms([]); setAutomations([]); setOrganizationSettings(null);
        setCrmEvents([]); setSubscription(null); setLedger([]);
        setIsCalendarLinked(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single<Pick<Profile, 'organization_id'>>();
      
      if (profileError || !profileData) {
        throw new Error("Impossibile trovare il profilo dell'utente o l'organizzazione associata.");
      }
      const { organization_id } = profileData;

      const [eventsResponse, orgResponse, contactsResponse, opportunitiesResponse, formsResponse, automationsResponse, settingsResponse, subscriptionResponse, ledgerResponse] = await Promise.all([
        invokeSupabaseFunction('get-all-crm-events', { organization_id }),
        supabase.from('organizations').select('*').eq('id', organization_id).single<Organization>(),
        supabase.from('contacts').select('*').eq('organization_id', organization_id).order('created_at', { ascending: false }),
        supabase.from('opportunities').select('*').eq('organization_id', organization_id),
        supabase.from('forms').select('*').eq('organization_id', organization_id).order('created_at', { ascending: false }),
        supabase.from('automations').select('*').eq('organization_id', organization_id).order('created_at', { ascending: false }),
        supabase.from('organization_settings').select('*').eq('organization_id', organization_id).maybeSingle<OrganizationSettings>(),
        supabase.from('organization_subscriptions').select('*').eq('organization_id', organization_id).maybeSingle<OrganizationSubscription>(),
        supabase.from('credit_ledger').select('*').eq('organization_id', organization_id).order('created_at', { ascending: false }).limit(20)
      ]);

      if (orgResponse.error) throw new Error(`Errore nel caricamento dell'organizzazione: ${orgResponse.error.message}`);
      if (contactsResponse.error) throw new Error(`Errore nel caricamento dei contatti: ${contactsResponse.error.message}`);
      if (opportunitiesResponse.error) throw new Error(`Errore nel caricamento delle opportunità: ${opportunitiesResponse.error.message}`);
      if (formsResponse.error) throw new Error(`Errore nel caricamento dei form: ${formsResponse.error.message}`);
      if (automationsResponse.error) throw new Error(`Errore nel caricamento delle automazioni: ${automationsResponse.error.message}`);
      if (settingsResponse.error) throw new Error(`Errore nel caricamento delle impostazioni: ${settingsResponse.error.message}`);
      if (subscriptionResponse.error) throw new Error(`Errore nel caricamento della sottoscrizione: ${subscriptionResponse.error.message}`);
      if (ledgerResponse.error) throw new Error(`Errore nel caricamento dello storico crediti: ${ledgerResponse.error.message}`);
      
      setOrganization(orgResponse.data);
      setContacts(contactsResponse.data || []);
      setOpportunities(groupOpportunitiesByStage(opportunitiesResponse.data || []));
      setForms(formsResponse.data || []);
      setAutomations(automationsResponse.data || []);
      setOrganizationSettings(settingsResponse.data);
      setCrmEvents(eventsResponse?.events || []);
      setSubscription(subscriptionResponse.data);
      setLedger(ledgerResponse.data || []);
      setIsCalendarLinked(!!settingsResponse.data?.google_auth_token);

    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, _session) => {
        if(event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
            fetchData();
        }
    });

    return () => authListener?.subscription.unsubscribe();

  }, [fetchData]);

  return { organization, contacts, opportunities, forms, automations, organizationSettings, crmEvents, subscription, ledger, isCalendarLinked, loading, error, refetch: fetchData };
};
