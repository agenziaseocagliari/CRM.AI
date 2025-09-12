import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Organization, Contact, Opportunity, OpportunitiesData, PipelineStage, Profile, Form, Automation, OrganizationSettings } from '../types';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // FIX: Replaced `getUser` with `getSession` to resolve the type error and provide a more robust session check.
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if(sessionError) throw sessionError;
      const user = session?.user;
      
      if (!user) {
        setLoading(false);
        setOrganization(null);
        setContacts([]);
        setOpportunities(groupOpportunitiesByStage([]));
        setForms([]);
        setAutomations([]);
        setOrganizationSettings(null);
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

      const [orgResponse, contactsResponse, opportunitiesResponse, formsResponse, automationsResponse, settingsResponse] = await Promise.all([
        supabase.from('organizations').select('*').eq('id', organization_id).single<Organization>(),
        supabase.from('contacts').select('*').eq('organization_id', organization_id).order('created_at', { ascending: false }),
        supabase.from('opportunities').select('*').eq('organization_id', organization_id),
        supabase.from('forms').select('*').eq('organization_id', organization_id).order('created_at', { ascending: false }),
        supabase.from('automations').select('*').eq('organization_id', organization_id).order('created_at', { ascending: false }),
        supabase.from('organization_settings').select('*').eq('organization_id', organization_id).single<OrganizationSettings>()
      ]);

      if (orgResponse.error) throw new Error(`Errore nel caricamento dell'organizzazione: ${orgResponse.error.message}`);
      if (contactsResponse.error) throw new Error(`Errore nel caricamento dei contatti: ${contactsResponse.error.message}`);
      if (opportunitiesResponse.error) throw new Error(`Errore nel caricamento delle opportunità: ${opportunitiesResponse.error.message}`);
      if (formsResponse.error) throw new Error(`Errore nel caricamento dei form: ${formsResponse.error.message}`);
      if (automationsResponse.error) throw new Error(`Errore nel caricamento delle automazioni: ${automationsResponse.error.message}`);
      // Un errore nelle impostazioni non è fatale, potrebbe semplicemente non esistere un record
      if (settingsResponse.error && settingsResponse.status !== 406) {
         throw new Error(`Errore nel caricamento delle impostazioni: ${settingsResponse.error.message}`);
      }


      setOrganization(orgResponse.data);
      setContacts(contactsResponse.data || []);
      setOpportunities(groupOpportunitiesByStage(opportunitiesResponse.data || []));
      setForms(formsResponse.data || []);
      setAutomations(automationsResponse.data || []);
      setOrganizationSettings(settingsResponse.data);

    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    // FIX: Correctly call onAuthStateChange which is a valid Supabase auth method.
    const { data: authListener } = supabase.auth.onAuthStateChange((event, _session) => {
        if(event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            fetchData();
        }
    });

    return () => authListener?.subscription.unsubscribe();

  }, [fetchData]);

  return { organization, contacts, opportunities, forms, automations, organizationSettings, loading, error, refetch: fetchData };
};
