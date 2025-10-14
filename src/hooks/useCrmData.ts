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
  PipelineStage,
  Profile
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
  console.log('🗂️ PIPELINE DEBUG: Grouping opportunities by stage, input:', opportunities)
  
  const emptyData: OpportunitiesData = {
    [PipelineStage.NewLead]: [],
    [PipelineStage.Contacted]: [],
    [PipelineStage.ProposalSent]: [],
    [PipelineStage.Won]: [],
    [PipelineStage.Lost]: [],
  };

  if (!opportunities || opportunities.length === 0) { 
    console.log('⚠️ PIPELINE DEBUG: No opportunities to group, returning empty data')
    return emptyData; 
  }

  const grouped = opportunities.reduce((acc, op) => {
    console.log(`📌 PIPELINE DEBUG: Processing opportunity "${op.contact_name}" with database stage "${op.stage}"`)
    
    // ADAPTER: Map database stage TEXT to PipelineStage enum
    const mappedStage = STAGE_MAPPING[op.stage] || STAGE_MAPPING['default'];
    console.log(`🔄 PIPELINE DEBUG: Mapped "${op.stage}" → "${mappedStage}"`)
    
    if (acc[mappedStage]) {
      acc[mappedStage].push(op);
      console.log(`✅ PIPELINE DEBUG: Added to stage "${mappedStage}", now has ${acc[mappedStage].length} opportunities`)
    } else {
      console.error(`❌ PIPELINE DEBUG: Mapping failed for stage "${op.stage}" → "${mappedStage}"`)
      // Fallback to New Lead
      acc[PipelineStage.NewLead].push(op);
    }
    return acc;
  }, emptyData);
  
  console.log('🎯 PIPELINE DEBUG: Final grouped opportunities:', grouped)
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
        .select('organization_id')
        .eq('id', user.id)
        .single<Pick<Profile, 'organization_id'>>();

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
          console.log('🔍 PIPELINE DEBUG: Loading opportunities for organization:', organization_id)
          
          // ADAPTED QUERY: Use actual database schema columns with proper ordering
          const result = await supabase
            .from('opportunities')
            .select('*')
            .eq('organization_id', organization_id)
            .order('created_at', { ascending: false })
          console.log('📦 PIPELINE DEBUG: Raw opportunities query result:', {
            error: result.error,
            count: result.data?.length || 0,
            data: result.data
          })
          
          if (result.error) {
            console.error('❌ PIPELINE DEBUG: Opportunities loading error:', result.error)
            if (result.error.code === '42P01') {
              console.error('⚠️ PIPELINE DEBUG: opportunities table does not exist! Run PHASE1_DATABASE_SCRIPTS.sql')
            }
          } else if (result.data) {
            console.log('📊 PIPELINE DEBUG: Individual opportunities details:')
            result.data.forEach((opp, index) => {
              console.log(`  ${index + 1}. ID: ${opp.id}, Contact: ${opp.contact_name}, Stage: "${opp.stage}", Value: €${opp.value}`)
            })
            
            // ADAPTER: Transform database format to component expectations  
            const adaptedData = result.data.map(opp => ({
              ...opp,
              title: opp.contact_name,  // Alias for components that expect title
              stage_name: opp.stage,    // Alias for stage name
              stage_id: opp.stage       // Use TEXT stage as identifier
            }))
            
            console.log('🔄 PIPELINE DEBUG: Data adapted for components:', adaptedData.length, 'opportunities')
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
      console.log('🔥 PIPELINE DEBUG: Setting opportunities state with:', groupedOpps)
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


