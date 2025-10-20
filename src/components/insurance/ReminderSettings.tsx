import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/useAuth';
import { Bell, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface RenewalSettings {
  id?: string;
  organization_id: string;
  reminder_7_days: boolean;
  reminder_30_days: boolean;
  reminder_60_days: boolean;
  reminder_90_days: boolean;
  notification_email: string;
  email_enabled: boolean;
}

export function ReminderSettings() {
  const { organizationId, userEmail } = useAuth();
  const [settings, setSettings] = useState<RenewalSettings>({
    organization_id: '',
    reminder_7_days: true,
    reminder_30_days: true,
    reminder_60_days: true,
    reminder_90_days: false,
    notification_email: '',
    email_enabled: true,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch existing settings
  useEffect(() => {
    async function fetchSettings() {
      if (!organizationId) return;

      try {
        const { data, error } = await supabase
          .from('renewal_settings')
          .select('*')
          .eq('organization_id', organizationId)
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setSettings(data);
        } else {
          // Initialize with defaults
          setSettings(prev => ({
            ...prev,
            organization_id: organizationId,
            notification_email: userEmail || '',
          }));
        }
      } catch (error) {
        console.error('Error fetching renewal settings:', error);
        setMessage({ type: 'error', text: 'Errore nel caricamento delle impostazioni' });
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [organizationId, userEmail]);

  // Save settings
  async function handleSave() {
    if (!organizationId) return;

    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        ...settings,
        organization_id: organizationId,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('renewal_settings')
        .upsert(payload, { onConflict: 'organization_id' });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Impostazioni salvate con successo!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
      
    } catch (error) {
      console.error('Error saving renewal settings:', error);
      setMessage({ type: 'error', text: 'Errore nel salvataggio delle impostazioni' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center mb-6">
        <Bell className="h-6 w-6 text-blue-600 mr-3" />
        <h3 className="text-xl font-semibold text-gray-900">
          Impostazioni Promemoria Rinnovi
        </h3>
      </div>

      {/* Email Configuration */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email per Notifiche
        </label>
        <input
          type="email"
          value={settings.notification_email}
          onChange={(e) => setSettings({ ...settings, notification_email: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="notifiche@agenzia.it"
        />
        <p className="mt-1 text-sm text-gray-500">
          Email dove ricevere i promemoria dei rinnovi in scadenza
        </p>
      </div>

      {/* Reminder Frequency Toggles */}
      <div className="space-y-4 mb-6">
        <h4 className="text-sm font-medium text-gray-900">
          Anticipo Promemoria (giorni prima della scadenza)
        </h4>

        {[
          { key: 'reminder_7_days', label: '7 giorni', description: 'Urgente - Ultima settimana', color: 'red' },
          { key: 'reminder_30_days', label: '30 giorni', description: 'Importante - Ultimo mese', color: 'orange' },
          { key: 'reminder_60_days', label: '60 giorni', description: 'Normale - 2 mesi prima', color: 'blue' },
          { key: 'reminder_90_days', label: '90 giorni', description: 'Anticipato - 3 mesi prima', color: 'green' },
        ].map(({ key, label, description, color }) => (
          <label key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings[key as keyof RenewalSettings] as boolean}
                onChange={(e) => setSettings({ ...settings, [key]: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="ml-3">
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full bg-${color}-100 text-${color}-800 mr-2`}>
                  {label}
                </span>
                <span className="text-sm text-gray-600">{description}</span>
              </div>
            </div>
          </label>
        ))}
      </div>

      {/* Email Enable Toggle */}
      <div className="mb-6 pb-6 border-b border-gray-200">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.email_enabled}
            onChange={(e) => setSettings({ ...settings, email_enabled: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="ml-3 text-sm font-medium text-gray-700">
            Abilita notifiche email automatiche
          </span>
        </label>
        <p className="mt-1 ml-7 text-sm text-gray-500">
          Le email verranno inviate automaticamente ogni giorno alle 09:00
        </p>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`mb-4 p-4 rounded-lg flex items-center ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 mr-2" />
          ) : (
            <AlertCircle className="h-5 w-5 mr-2" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {saving ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Salvataggio...
          </>
        ) : (
          <>
            <Save className="h-5 w-5 mr-2" />
            Salva Impostazioni
          </>
        )}
      </button>
    </div>
  );
}
