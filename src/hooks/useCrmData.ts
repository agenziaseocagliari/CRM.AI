import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Organization, Contact, Opportunity, OpportunitiesData, PipelineStage, Profile, Form } from '../types';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Non è un errore se l'utente non è loggato, semplicemente non ci sono dati da caricare.
        // La logica in App.tsx gestirà la redirezione.
        setLoading(false);
        setOrganization(null);
        setContacts([]);
        setOpportunities(groupOpportunitiesByStage([]));
        setForms([]);
        return;
      }

      // 1. Fetch user profile to get organization_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single<Pick<Profile, 'organization_id'>>();
      
      if (profileError || !profileData) {
        throw new Error("Impossibile trovare il profilo dell'utente o l'organizzazione associata.");
      }

      const { organization_id } = profileData;

      // 2. Fetch organization, contacts, opportunities, and forms in parallel
      const [orgResponse, contactsResponse, opportunitiesResponse, formsResponse] = await Promise.all([
        supabase.from('organizations').select('*').eq('id', organization_id).single<Organization>(),
        supabase.from('contacts').select('*').eq('organization_id', organization_id).order('created_at', { ascending: false }),
        supabase.from('opportunities').select('*').eq('organization_id', organization_id),
        supabase.from('forms').select('*').eq('organization_id', organization_id).order('created_at', { ascending: false })
      ]);

      if (orgResponse.error) throw new Error(`Errore nel caricamento dell'organizzazione: ${orgResponse.error.message}`);
      if (contactsResponse.error) throw new Error(`Errore nel caricamento dei contatti: ${contactsResponse.error.message}`);
      if (opportunitiesResponse.error) throw new Error(`Errore nel caricamento delle opportunità: ${opportunitiesResponse.error.message}`);
      if (formsResponse.error) throw new Error(`Errore nel caricamento dei form: ${formsResponse.error.message}`);


      setOrganization(orgResponse.data);
      setContacts(contactsResponse.data || []);
      setOpportunities(groupOpportunitiesByStage(opportunitiesResponse.data || []));
      setForms(formsResponse.data || []);

    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Carica i dati quando il componente che usa l'hook viene montato
    // e quando lo stato di autenticazione cambia.
    fetchData();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, _session) => {
        if(event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
            fetchData();
        }
    });

    return () => authListener?.subscription.unsubscribe();

  }, [fetchData]);

  return { organization, contacts, opportunities, forms, loading, error, refetch: fetchData };
};