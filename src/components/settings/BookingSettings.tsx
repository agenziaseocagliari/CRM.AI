import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import BookingSettingsForm from '../settings/BookingSettingsForm';

const BookingSettings = () => {
    const { session } = useAuth();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.id) {
            fetchProfile();
        }
    }, [session]);

    const fetchProfile = async () => {
        if (!session?.user?.id) return;

        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
            } else {
                setProfile(profile);
            }
        } catch (error) {
            console.error('Profile fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">Devi effettuare il login per accedere a questa pagina.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Impostazioni Prenotazione</h1>
                <p className="text-gray-600 mt-2">
                    Personalizza la tua pagina di prenotazione pubblica
                </p>
            </div>

            <BookingSettingsForm profile={profile} userId={session.user.id} />
        </div>
    );
};

export default BookingSettings;