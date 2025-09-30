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
      // Step 1: Get JWT session and extract user
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if(sessionError) {
        console.error('[useCrmData] Session error:', sessionError);
        throw sessionError;
      }
      const user = session?.user;
      
      if (!user) {
        console.log('[useCrmData] No user session found, clearing state');
        setLoading(false);
        setOrganization(null); setContacts([]); setOpportunities(groupOpportunitiesByStage([]));
        setForms([]); setAutomations([]); setOrganizationSettings(null);
        setCrmEvents([]); setSubscription(null); setLedger([]);
        setIsCalendarLinked(false);
        localStorage.removeItem('organization_id');
        return;
      }

      // Step 2: Log JWT user details for debugging
      console.log('[useCrmData] User authenticated from JWT:', {
        userId: user.id,
        email: user.email,
        jwtSub: user.id, // This is the 'sub' claim from JWT
        timestamp: new Date().toISOString()
      });

      // Step 3: Query profile using JWT user.id (which matches the 'sub' claim)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single<Pick<Profile, 'organization_id'>>();
      
      // Step 4: Enhanced error handling with diagnostic information
      if (profileError || !profileData) {
        console.error('[useCrmData] Profile lookup failed:', {
          error: profileError,
          queriedUserId: user.id,
          userEmail: user.email,
          profileData: profileData,
          errorCode: profileError?.code,
          errorMessage: profileError?.message,
          errorDetails: profileError?.details,
          hint: profileError?.hint
        });
        
        // Provide detailed error message with actual values used
        const errorMsg = `Impossibile trovare il profilo dell'utente o l'organizzazione associata.\n\n` +
          `Debug Info:\n` +
          `- User ID (da JWT): ${user.id}\n` +
          `- Email: ${user.email}\n` +
          `- Errore DB: ${profileError?.message || 'Profilo non trovato'}\n` +
          `- Codice: ${profileError?.code || 'N/A'}\n\n` +
          `Azione suggerita: Contattare il supporto con questi dettagli o ricaricare la pagina.`;
        
        throw new Error(errorMsg);
      }
      
      const { organization_id } = profileData;
      console.log('[useCrmData] Profile found successfully:', {
        userId: user.id,
        organizationId: organization_id
      });

      const [eventsResponse, orgResponse, contactsResponse, opportunitiesResponse, formsResponse, automationsResponse, settingsResponse, subscriptionResponse, ledgerResponse, googleCredsResponse] = await Promise.all([
        invokeSupabaseFunction('get-all-crm-events', { organization_id }),
        supabase.from('organizations').select('*').eq('id', organization_id).single<Organization>(),
        supabase.from('contacts').select('*').eq('organization_id', organization_id).order('created_at', { ascending: false }),
        supabase.from('opportunities').select('*').eq('organization_id', organization_id),
        supabase.from('forms').select('*').eq('organization_id', organization_id).order('created_at', { ascending: false }),
        supabase.from('automations').select('*').eq('organization_id', organization_id).order('created_at', { ascending: false }),
        supabase.from('organization_settings').select('*').eq('organization_id', organization_id).maybeSingle<OrganizationSettings>(),
        supabase.from('organization_subscriptions').select('*').eq('organization_id', organization_id).maybeSingle<OrganizationSubscription>(),
        supabase.from('credit_ledger').select('*').eq('organization_id', organization_id).order('created_at', { ascending: false }).limit(20),
        supabase.from('google_credentials').select('organization_id').eq('organization_id', organization_id).maybeSingle()
      ]);

      console.log('[useCrmData] Data fetch completed for organization:', organization_id);

      if (orgResponse.error) throw new Error(`Errore nel caricamento dell'organizzazione: ${orgResponse.error.message}`);
      if (contactsResponse.error) throw new Error(`Errore nel caricamento dei contatti: ${contactsResponse.error.message}`);
      if (opportunitiesResponse.error) throw new Error(`Errore nel caricamento delle opportunità: ${opportunitiesResponse.error.message}`);
      if (formsResponse.error) throw new Error(`Errore nel caricamento dei form: ${formsResponse.error.message}`);
      if (automationsResponse.error) throw new Error(`Errore nel caricamento delle automazioni: ${automationsResponse.error.message}`);
      if (settingsResponse.error) throw new Error(`Errore nel caricamento delle impostazioni: ${settingsResponse.error.message}`);
      if (subscriptionResponse.error) throw new Error(`Errore nel caricamento della sottoscrizione: ${subscriptionResponse.error.message}`);
      if (ledgerResponse.error) throw new Error(`Errore nel caricamento dello storico crediti: ${ledgerResponse.error.message}`);
      if (googleCredsResponse.error) throw new Error(`Errore nel caricamento delle credenziali Google: ${googleCredsResponse.error.message}`);
      
      if (orgResponse.data) {
        setOrganization(orgResponse.data);
        localStorage.setItem('organization_id', orgResponse.data.id);
      }
      setContacts(contactsResponse.data || []);
      setOpportunities(groupOpportunitiesByStage(opportunitiesResponse.data || []));
      setForms(formsResponse.data || []);
      setAutomations(automationsResponse.data || []);
      setOrganizationSettings(settingsResponse.data);
      setCrmEvents(eventsResponse?.events || []);
      setSubscription(subscriptionResponse.data);
      setLedger(ledgerResponse.data || []);
      setIsCalendarLinked(!!googleCredsResponse.data);

    } catch (err: any) {
      console.error('[useCrmData] Error in fetchData:', {
        error: err,
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
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