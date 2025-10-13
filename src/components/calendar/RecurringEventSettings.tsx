'use client';

import React, { useState } from 'react';
import { Repeat, Calendar, Clock, AlertCircle } from 'lucide-react';

interface RecurringSettings {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  endDate?: string;
  maxOccurrences?: number;
}

interface RecurringSettingsProps {
  isRecurring: boolean;
  onToggle: (enabled: boolean) => void;
  settings: RecurringSettings;
  onSettingsChange: (settings: RecurringSettings) => void;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lun', full: 'Lunedì' },
  { value: 2, label: 'Mar', full: 'Martedì' },
  { value: 3, label: 'Mer', full: 'Mercoledì' },
  { value: 4, label: 'Gio', full: 'Giovedì' },
  { value: 5, label: 'Ven', full: 'Venerdì' },
  { value: 6, label: 'Sab', full: 'Sabato' },
  { value: 0, label: 'Dom', full: 'Domenica' },
];

export default function RecurringEventSettings({
  isRecurring,
  onToggle,
  settings,
  onSettingsChange
}: RecurringSettingsProps) {
  const [previewText, setPreviewText] = useState('');

  // Generate human-readable preview
  const generatePreview = (currentSettings: RecurringSettings): string => {
    const { frequency, interval, daysOfWeek, endDate } = currentSettings;
    
    let text = 'Ripeti ';
    
    if (frequency === 'daily') {
      text += interval === 1 ? 'ogni giorno' : `ogni ${interval} giorni`;
    } else if (frequency === 'weekly') {
      if (interval === 1) {
        if (daysOfWeek && daysOfWeek.length > 0) {
          const dayNames = daysOfWeek
            .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
            .map(day => DAYS_OF_WEEK.find(d => d.value === day)?.full)
            .join(', ');
          text += `ogni settimana il ${dayNames}`;
        } else {
          text += 'ogni settimana';
        }
      } else {
        text += `ogni ${interval} settimane`;
        if (daysOfWeek && daysOfWeek.length > 0) {
          const dayNames = daysOfWeek
            .map(day => DAYS_OF_WEEK.find(d => d.value === day)?.full)
            .join(', ');
          text += ` il ${dayNames}`;
        }
      }
    } else if (frequency === 'monthly') {
      text += interval === 1 ? 'ogni mese' : `ogni ${interval} mesi`;
    }
    
    if (endDate) {
      const date = new Date(endDate);
      text += ` fino al ${date.toLocaleDateString('it-IT')}`;
    }
    
    return text;
  };

  React.useEffect(() => {
    if (isRecurring) {
      setPreviewText(generatePreview(settings));
    }
  }, [isRecurring, settings]);

  const updateSettings = (updates: Partial<RecurringSettings>) => {
    const newSettings = { ...settings, ...updates };
    onSettingsChange(newSettings);
  };

  return (
    <div className="border-t border-gray-200 pt-6">
      {/* Main Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => onToggle(e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <div className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-blue-600" />
            <div>
              <div className="font-semibold text-gray-900">Evento Ricorrente</div>
              <div className="text-sm text-gray-600">
                {isRecurring ? 'Configurato' : 'Crea una serie di eventi ripetuti'}
              </div>
            </div>
          </div>
        </label>
        
        {isRecurring && (
          <div className="text-right">
            <div className="text-sm font-medium text-blue-600">Attivo</div>
            <div className="text-xs text-gray-500">Pro Feature</div>
          </div>
        )}
      </div>

      {/* Advanced Settings (shown when enabled) */}
      {isRecurring && (
        <div className="mt-6 space-y-6 bg-white border border-gray-200 rounded-xl p-6">
          
          {/* Frequency Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Frequenza
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'daily', label: 'Giornaliera', icon: '📅', desc: 'Ogni giorno' },
                { value: 'weekly', label: 'Settimanale', icon: '🗓️', desc: 'Ogni settimana' },
                { value: 'monthly', label: 'Mensile', icon: '📆', desc: 'Ogni mese' }
              ].map(freq => (
                <button
                  key={freq.value}
                  onClick={() => updateSettings({ frequency: freq.value as any })}
                  className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    settings.frequency === freq.value
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-1">{freq.icon}</div>
                  <div className={`font-semibold text-sm ${settings.frequency === freq.value ? 'text-blue-700' : 'text-gray-900'}`}>
                    {freq.label}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {freq.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Interval */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <Clock className="w-5 h-5 text-gray-600" />
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm font-medium text-gray-700">Ripeti ogni</span>
              <input
                type="number"
                min="1"
                max="99"
                value={settings.interval}
                onChange={(e) => updateSettings({ interval: parseInt(e.target.value) || 1 })}
                className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-700">
                {settings.frequency === 'daily' && (settings.interval === 1 ? 'giorno' : 'giorni')}
                {settings.frequency === 'weekly' && (settings.interval === 1 ? 'settimana' : 'settimane')}
                {settings.frequency === 'monthly' && (settings.interval === 1 ? 'mese' : 'mesi')}
              </span>
            </div>
          </div>

          {/* Days of Week (for weekly frequency) */}
          {settings.frequency === 'weekly' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Giorni della settimana
              </label>
              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map(day => {
                  const isSelected = settings.daysOfWeek?.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      onClick={() => {
                        const current = settings.daysOfWeek || [];
                        const updated = isSelected
                          ? current.filter(d => d !== day.value)
                          : [...current, day.value].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));
                        updateSettings({ daysOfWeek: updated });
                      }}
                      className={`h-12 rounded-xl font-semibold text-sm transition-all duration-200 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Seleziona uno o più giorni della settimana
              </p>
            </div>
          )}

          {/* End Condition */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Termine
            </label>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">
                  Data di fine (opzionale)
                </label>
                <input
                  type="date"
                  value={settings.endDate || ''}
                  onChange={(e) => updateSettings({ endDate: e.target.value || undefined })}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Se non specificato, gli eventi continueranno indefinitamente
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Anteprima Ricorrenza
            </h4>
            <p className="text-blue-800 font-medium">
              {previewText}
            </p>
            
            {/* Additional Info */}
            <div className="mt-3 pt-3 border-t border-blue-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Prossimi eventi:</span>
                  <div className="text-blue-600 text-xs mt-1">
                    {/* TODO: Generate next 3 dates based on settings */}
                    Domani, Dopodomani, +1...
                  </div>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Gestione:</span>
                  <div className="text-blue-600 text-xs mt-1">
                    Modifiche si applicano a eventi futuri
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pro Tips */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2">💡 Suggerimenti Pro</h4>
            <div className="space-y-2 text-sm text-purple-800">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong>Riunioni 1:1:</strong> Settimanali sono perfette per check-in con il team
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong>Stand-up:</strong> Giornalieri (Lun-Ven) mantengono il team sincronizzato  
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <strong>Review mensili:</strong> Ideali per valutazioni di performance
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}