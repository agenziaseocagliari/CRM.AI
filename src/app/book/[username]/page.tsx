// Note: This will be integrated as a route in the React Router setup
// For now, creating as a component for the existing Vite+React architecture

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import PublicBookingPage from '../../../components/calendar/PublicBookingPage';

interface Profile {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  timezone?: string;
  organization?: {
    name: string;
    logo_url?: string;
  };
}

export default function BookingPageContainer() {
  const { username } = useParams<{ username: string }>();
  const [searchParams] = useSearchParams();
  const eventType = searchParams.get('event');

  const [profile, setProfile] = useState<Profile | null>(null);
  const [availability, setAvailability] = useState(null);
  const [bookedSlots, setBookedSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;

    const fetchBookingData = async () => {
      try {
        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(`
            id, 
            full_name, 
            username, 
            avatar_url, 
            bio, 
            timezone
          `)
          .eq('username', username)
          .single();

        if (profileError || !profileData) {
          setError('Utente non trovato');
          return;
        }

        setProfile(profileData);

        // Get user's availability settings
        const { data: availabilityData } = await supabase
          .from('user_availability')
          .select('*')
          .eq('user_id', profileData.id)
          .single();

        setAvailability(availabilityData);

        // Get upcoming booked slots
        const today = new Date().toISOString();
        const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        const { data: bookedEvents } = await supabase
          .from('events')
          .select('start_time, end_time')
          .eq('created_by', profileData.id)
          .gte('start_time', today)
          .lte('start_time', nextMonth)
          .eq('status', 'scheduled');

        setBookedSlots(bookedEvents || []);
      } catch (err) {
        setError('Errore nel caricamento dei dati');
        console.error('Booking page error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();

    // Update document title
    if (profile?.full_name) {
      document.title = `Prenota con ${profile.full_name}`;
    }
  }, [username, profile?.full_name]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Pagina non trovata</h1>
          <p className="text-gray-600 mb-4">{error || 'Utente non disponibile per prenotazioni'}</p>
          <a href="/" className="text-blue-600 hover:underline">
            Torna alla home
          </a>
        </div>
      </div>
    );
  }

  return (
    <PublicBookingPage
      profile={profile}
      availability={availability}
      bookedSlots={bookedSlots}
      eventType={eventType}
    />
  );
}