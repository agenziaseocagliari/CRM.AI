import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { performRiskAssessment } from '@/services/riskScoringService';
import type { HealthFactors, FinancialFactors, LifestyleFactors } from '@/services/riskScoringService';
import {
  User, Heart, DollarSign, Activity, 
  ArrowRight, ArrowLeft, CheckCircle, AlertCircle
} from 'lucide-react';

interface FormData {
  // Demographics
  age: number;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  profession: string;
  marital_status: 'single' | 'married' | 'divorced' | 'widowed';
  
  // Health
  height_cm: number;
  weight_kg: number;
  smoking_status: 'never' | 'former' | 'current' | 'occasional';
  alcohol_consumption: 'none' | 'occasional' | 'moderate' | 'heavy';
  preexisting_conditions: Array<{name: string; since: string; controlled: boolean}>;
  medications: string[];
  last_medical_checkup?: string;
  physical_activity_level: 'sedentary' | 'light' | 'moderate' | 'intense';
  
  // Financial
  annual_income_eur: number;
  total_assets_eur: number;
  total_debts_eur: number;
  employment_status: 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'student';
  employment_stability_years: number;
  homeowner: boolean;
  
  // Lifestyle
  risky_hobbies: string[];
  travel_frequency_per_year: number;
  extreme_sports: boolean;
  high_risk_destinations: string[];
  driving_record: 'clean' | 'minor_violations' | 'major_violations' | 'accidents';
  daily_commute_km: number;
  
  notes?: string;
}

const HIGH_RISK_CONDITIONS = [
  'Diabete', 'Malattie Cardiache', 'Cancro', 'Ictus', 
  'Ipertensione', 'BPCO', 'Malattie Renali', 'Epatite'
];

const RISKY_HOBBIES_LIST = [
  'Paracadutismo', 'Base Jumping', 'Arrampicata', 'Motociclismo',
  'Immersioni Subacquee', 'Alpinismo', 'Corse Automobilistiche'
];

export default function RiskAssessment() {
  const navigate = useNavigate();
  const { contactId } = useParams<{ contactId: string }>();
  const { session, organizationId } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    age: 30,
    gender: 'prefer_not_to_say',
    profession: '',
    marital_status: 'single',
    height_cm: 170,
    weight_kg: 70,
    smoking_status: 'never',
    alcohol_consumption: 'none',
    preexisting_conditions: [],
    medications: [],
    physical_activity_level: 'moderate',
    annual_income_eur: 25000,
    total_assets_eur: 0,
    total_debts_eur: 0,
    employment_status: 'employed',
    employment_stability_years: 1,
    homeowner: false,
    risky_hobbies: [],
    travel_frequency_per_year: 0,
    extreme_sports: false,
    high_risk_destinations: [],
    driving_record: 'clean',
    daily_commute_km: 0,
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const handleInputChange = (field: keyof FormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConditionToggle = (condition: string) => {
    setFormData(prev => {
      const exists = prev.preexisting_conditions.find(c => c.name === condition);
      if (exists) {
        return {
          ...prev,
          preexisting_conditions: prev.preexisting_conditions.filter(c => c.name !== condition)
        };
      } else {
        return {
          ...prev,
          preexisting_conditions: [
            ...prev.preexisting_conditions,
            { name: condition, since: new Date().getFullYear().toString(), controlled: false }
          ]
        };
      }
    });
  };

  const handleHobbyToggle = (hobby: string) => {
    setFormData(prev => {
      const exists = prev.risky_hobbies.includes(hobby);
      if (exists) {
        return { ...prev, risky_hobbies: prev.risky_hobbies.filter(h => h !== hobby) };
      } else {
        return { ...prev, risky_hobbies: [...prev.risky_hobbies, hobby] };
      }
    });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.age >= 18 && formData.age <= 120 && formData.profession.length > 0;
      case 2:
        return formData.height_cm > 0 && formData.weight_kg > 0;
      case 3:
        return formData.annual_income_eur >= 0 && formData.employment_stability_years >= 0;
      case 4:
        return formData.daily_commute_km >= 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      setError('Per favore compila tutti i campi obbligatori');
      return;
    }
    setError(null);
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep) || !organizationId || !contactId) {
      setError('Dati mancanti o non validi');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare data for risk scoring
      const healthFactors: HealthFactors = {
        age: formData.age,
        height_cm: formData.height_cm,
        weight_kg: formData.weight_kg,
        smoking_status: formData.smoking_status,
        alcohol_consumption: formData.alcohol_consumption,
        preexisting_conditions: formData.preexisting_conditions,
        physical_activity_level: formData.physical_activity_level,
      };

      const financialFactors: FinancialFactors = {
        annual_income_eur: formData.annual_income_eur,
        total_assets_eur: formData.total_assets_eur,
        total_debts_eur: formData.total_debts_eur,
        employment_status: formData.employment_status,
        employment_stability_years: formData.employment_stability_years,
        homeowner: formData.homeowner,
      };

      const lifestyleFactors: LifestyleFactors = {
        risky_hobbies: formData.risky_hobbies,
        travel_frequency_per_year: formData.travel_frequency_per_year,
        extreme_sports: formData.extreme_sports,
        high_risk_destinations: formData.high_risk_destinations,
        driving_record: formData.driving_record,
        daily_commute_km: formData.daily_commute_km,
      };

      // Calculate risk scores
      const riskResult = performRiskAssessment(
        healthFactors,
        financialFactors,
        lifestyleFactors
      );

      // Insert into database
      const { data: riskProfile, error: insertError } = await supabase
        .from('insurance_risk_profiles')
        .insert({
          contact_id: contactId,
          organization_id: organizationId,
          created_by: session?.user?.id,
          ...formData,
          preexisting_conditions: JSON.stringify(formData.preexisting_conditions),
          medications: JSON.stringify(formData.medications),
          risky_hobbies: JSON.stringify(formData.risky_hobbies),
          high_risk_destinations: JSON.stringify(formData.high_risk_destinations),
          health_score: riskResult.scores.health_score,
          financial_score: riskResult.scores.financial_score,
          lifestyle_score: riskResult.scores.lifestyle_score,
          total_risk_score: riskResult.scores.total_risk_score,
          risk_category: riskResult.scores.risk_category,
          recommended_products: JSON.stringify(riskResult.recommendations),
          assessment_date: new Date().toISOString(),
          valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Navigate to profile view
      navigate(`/dashboard/assicurazioni/valutazione-rischio/${riskProfile.id}`);
    } catch (err) {
      const error = err as Error;
      console.error('Error saving risk assessment:', error);
      setError(error.message || 'Errore durante il salvataggio della valutazione');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-5 h-5" />
              Dati Demografici
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Età *</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
                  min="18"
                  max="120"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Genere</label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="male">Maschio</option>
                  <option value="female">Femmina</option>
                  <option value="other">Altro</option>
                  <option value="prefer_not_to_say">Preferisco non specificare</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Professione *</label>
                <input
                  type="text"
                  value={formData.profession}
                  onChange={(e) => handleInputChange('profession', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Es: Ingegnere, Medico, Commerciante"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Stato Civile</label>
                <select
                  value={formData.marital_status}
                  onChange={(e) => handleInputChange('marital_status', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="single">Celibe/Nubile</option>
                  <option value="married">Coniugato/a</option>
                  <option value="divorced">Divorziato/a</option>
                  <option value="widowed">Vedovo/a</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Valutazione Salute
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Altezza (cm) *</label>
                <input
                  type="number"
                  value={formData.height_cm}
                  onChange={(e) => handleInputChange('height_cm', parseInt(e.target.value))}
                  min="1"
                  max="300"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Peso (kg) *</label>
                <input
                  type="number"
                  value={formData.weight_kg}
                  onChange={(e) => handleInputChange('weight_kg', parseFloat(e.target.value))}
                  min="1"
                  step="0.1"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Stato Fumatore *</label>
                <select
                  value={formData.smoking_status}
                  onChange={(e) => handleInputChange('smoking_status', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="never">Mai fumato</option>
                  <option value="former">Ex fumatore</option>
                  <option value="occasional">Fumatore occasionale</option>
                  <option value="current">Fumatore attuale</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Consumo Alcol</label>
                <select
                  value={formData.alcohol_consumption}
                  onChange={(e) => handleInputChange('alcohol_consumption', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="none">Nessuno</option>
                  <option value="occasional">Occasionale</option>
                  <option value="moderate">Moderato</option>
                  <option value="heavy">Frequente</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Attività Fisica</label>
                <select
                  value={formData.physical_activity_level}
                  onChange={(e) => handleInputChange('physical_activity_level', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="sedentary">Sedentario</option>
                  <option value="light">Leggera (1-2 volte/settimana)</option>
                  <option value="moderate">Moderata (3-4 volte/settimana)</option>
                  <option value="intense">Intensa (5+ volte/settimana)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Patologie Preesistenti</label>
              <div className="grid grid-cols-2 gap-2">
                {HIGH_RISK_CONDITIONS.map(condition => (
                  <label key={condition} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.preexisting_conditions.some(c => c.name === condition)}
                      onChange={() => handleConditionToggle(condition)}
                      className="rounded"
                    />
                    <span className="text-sm">{condition}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Valutazione Finanziaria
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Reddito Annuo (€) *</label>
                <input
                  type="number"
                  value={formData.annual_income_eur}
                  onChange={(e) => handleInputChange('annual_income_eur', parseFloat(e.target.value))}
                  min="0"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Stato Occupazionale *</label>
                <select
                  value={formData.employment_status}
                  onChange={(e) => handleInputChange('employment_status', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="employed">Dipendente</option>
                  <option value="self_employed">Autonomo</option>
                  <option value="unemployed">Disoccupato</option>
                  <option value="retired">Pensionato</option>
                  <option value="student">Studente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Anni Stabilità Lavorativa *</label>
                <input
                  type="number"
                  value={formData.employment_stability_years}
                  onChange={(e) => handleInputChange('employment_stability_years', parseInt(e.target.value))}
                  min="0"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Totale Patrimonio (€)</label>
                <input
                  type="number"
                  value={formData.total_assets_eur}
                  onChange={(e) => handleInputChange('total_assets_eur', parseFloat(e.target.value))}
                  min="0"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Totale Debiti (€)</label>
                <input
                  type="number"
                  value={formData.total_debts_eur}
                  onChange={(e) => handleInputChange('total_debts_eur', parseFloat(e.target.value))}
                  min="0"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.homeowner}
                    onChange={(e) => handleInputChange('homeowner', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Proprietario di Casa</span>
                </label>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Valutazione Stile di Vita
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Viaggi all'Anno</label>
                <input
                  type="number"
                  value={formData.travel_frequency_per_year}
                  onChange={(e) => handleInputChange('travel_frequency_per_year', parseInt(e.target.value))}
                  min="0"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Record di Guida</label>
                <select
                  value={formData.driving_record}
                  onChange={(e) => handleInputChange('driving_record', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="clean">Pulito</option>
                  <option value="minor_violations">Infrazioni Minori</option>
                  <option value="major_violations">Infrazioni Gravi</option>
                  <option value="accidents">Incidenti</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Tragitto Giornaliero (km)</label>
                <input
                  type="number"
                  value={formData.daily_commute_km}
                  onChange={(e) => handleInputChange('daily_commute_km', parseInt(e.target.value))}
                  min="0"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.extreme_sports}
                    onChange={(e) => handleInputChange('extreme_sports', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">Pratico Sport Estremi</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Hobby Rischiosi</label>
              <div className="grid grid-cols-2 gap-2">
                {RISKY_HOBBIES_LIST.map(hobby => (
                  <label key={hobby} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.risky_hobbies.includes(hobby)}
                      onChange={() => handleHobbyToggle(hobby)}
                      className="rounded"
                    />
                    <span className="text-sm">{hobby}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Note Aggiuntive</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Informazioni aggiuntive rilevanti..."
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Valutazione Rischio Assicurativo</h2>
          <p className="text-gray-600">Step {currentStep} di {totalSteps}</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Form Step */}
        <div className="mb-8">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Indietro
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Avanti
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>Salvataggio...</>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Completa Valutazione
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
