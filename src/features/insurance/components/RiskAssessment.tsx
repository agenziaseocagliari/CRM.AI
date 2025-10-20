import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import { 
  User, Heart, DollarSign, Plane, 
  ChevronRight, ChevronLeft, Check 
} from 'lucide-react';
import {
  HealthFactors,
  FinancialFactors,
  LifestyleFactors,
  performRiskAssessment,
} from '@/services/riskScoringService';

// ================================================================
// TYPE DEFINITIONS
// ================================================================

interface FormData {
  // Step 1: Demographics
  age: number;
  gender: string;
  profession: string;
  marital_status: string;
  
  // Step 2: Health
  height_cm: number;
  weight_kg: number;
  smoking_status: string;
  alcohol_consumption: string;
  preexisting_conditions: Array<{ name: string; since: string; controlled: boolean }>;
  physical_activity_level: string;
  medications: string[];
  last_medical_checkup: string;
  
  // Step 3: Financial
  annual_income_eur: number;
  total_assets_eur: number;
  total_debts_eur: number;
  employment_status: string;
  employment_stability_years: number;
  homeowner: boolean;
  
  // Step 4: Lifestyle
  risky_hobbies: string[];
  travel_frequency_per_year: number;
  extreme_sports: boolean;
  high_risk_destinations: string[];
  driving_record: string;
  daily_commute_km: number;
}

const initialFormData: FormData = {
  age: 35,
  gender: 'prefer_not_to_say',
  profession: '',
  marital_status: 'single',
  height_cm: 170,
  weight_kg: 70,
  smoking_status: 'never',
  alcohol_consumption: 'occasional',
  preexisting_conditions: [],
  physical_activity_level: 'moderate',
  medications: [],
  last_medical_checkup: '',
  annual_income_eur: 30000,
  total_assets_eur: 50000,
  total_debts_eur: 0,
  employment_status: 'employed',
  employment_stability_years: 3,
  homeowner: false,
  risky_hobbies: [],
  travel_frequency_per_year: 2,
  extreme_sports: false,
  high_risk_destinations: [],
  driving_record: 'clean',
  daily_commute_km: 20,
};

// ================================================================
// MAIN COMPONENT
// ================================================================

export default function RiskAssessment() {
  const navigate = useNavigate();
  const { contactId } = useParams<{ contactId: string }>();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [newCondition, setNewCondition] = useState({ name: '', since: '', controlled: false });
  const [newHobby, setNewHobby] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [newMedication, setNewMedication] = useState('');

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  // ================================================================
  // FORM HANDLERS
  // ================================================================

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addCondition = () => {
    if (newCondition.name && newCondition.since) {
      setFormData(prev => ({
        ...prev,
        preexisting_conditions: [...prev.preexisting_conditions, { ...newCondition }],
      }));
      setNewCondition({ name: '', since: '', controlled: false });
    }
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      preexisting_conditions: prev.preexisting_conditions.filter((_, i) => i !== index),
    }));
  };

  const addHobby = () => {
    if (newHobby.trim()) {
      setFormData(prev => ({
        ...prev,
        risky_hobbies: [...prev.risky_hobbies, newHobby.trim()],
      }));
      setNewHobby('');
    }
  };

  const removeHobby = (index: number) => {
    setFormData(prev => ({
      ...prev,
      risky_hobbies: prev.risky_hobbies.filter((_, i) => i !== index),
    }));
  };

  const addDestination = () => {
    if (newDestination.trim()) {
      setFormData(prev => ({
        ...prev,
        high_risk_destinations: [...prev.high_risk_destinations, newDestination.trim()],
      }));
      setNewDestination('');
    }
  };

  const removeDestination = (index: number) => {
    setFormData(prev => ({
      ...prev,
      high_risk_destinations: prev.high_risk_destinations.filter((_, i) => i !== index),
    }));
  };

  const addMedication = () => {
    if (newMedication.trim()) {
      setFormData(prev => ({
        ...prev,
        medications: [...prev.medications, newMedication.trim()],
      }));
      setNewMedication('');
    }
  };

  const removeMedication = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  // ================================================================
  // VALIDATION
  // ================================================================

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.age || formData.age < 18 || formData.age > 120) {
          toast.error('Età deve essere tra 18 e 120 anni');
          return false;
        }
        return true;
      case 2:
        if (!formData.height_cm || !formData.weight_kg) {
          toast.error('Altezza e peso sono obbligatori');
          return false;
        }
        return true;
      case 3:
        if (formData.annual_income_eur < 0 || formData.total_assets_eur < 0 || formData.total_debts_eur < 0) {
          toast.error('I valori finanziari non possono essere negativi');
          return false;
        }
        return true;
      case 4:
        return true;
      default:
        return true;
    }
  };

  // ================================================================
  // NAVIGATION
  // ================================================================

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(prev => prev + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // ================================================================
  // SUBMISSION
  // ================================================================

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    if (!contactId) {
      toast.error('ID contatto mancante');
      return;
    }

    setLoading(true);

    try {
      // Get current user and organization
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Utente non autenticato');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        toast.error('Profilo non trovato');
        return;
      }

      // Prepare data for risk assessment
      const healthFactors: HealthFactors = {
        age: formData.age,
        height_cm: formData.height_cm,
        weight_kg: formData.weight_kg,
        smoking_status: formData.smoking_status as any,
        alcohol_consumption: formData.alcohol_consumption as any,
        preexisting_conditions: formData.preexisting_conditions,
        physical_activity_level: formData.physical_activity_level as any,
        last_medical_checkup: formData.last_medical_checkup ? new Date(formData.last_medical_checkup) : undefined,
      };

      const financialFactors: FinancialFactors = {
        annual_income_eur: formData.annual_income_eur,
        total_assets_eur: formData.total_assets_eur,
        total_debts_eur: formData.total_debts_eur,
        employment_status: formData.employment_status as any,
        employment_stability_years: formData.employment_stability_years,
        homeowner: formData.homeowner,
      };

      const lifestyleFactors: LifestyleFactors = {
        risky_hobbies: formData.risky_hobbies,
        travel_frequency_per_year: formData.travel_frequency_per_year,
        extreme_sports: formData.extreme_sports,
        high_risk_destinations: formData.high_risk_destinations,
        driving_record: formData.driving_record as any,
        daily_commute_km: formData.daily_commute_km,
      };

      // Calculate risk scores
      const { scores, recommendations } = performRiskAssessment(
        healthFactors,
        financialFactors,
        lifestyleFactors
      );

      // Calculate valid_until (12 months from now)
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      // Insert risk profile
      const { data: riskProfile, error } = await supabase
        .from('insurance_risk_profiles')
        .insert({
          contact_id: contactId,
          organization_id: profile.organization_id,
          created_by: user.id,
          ...formData,
          medications: formData.medications,
          health_score: scores.health_score,
          financial_score: scores.financial_score,
          lifestyle_score: scores.lifestyle_score,
          total_risk_score: scores.total_risk_score,
          risk_category: scores.risk_category,
          recommended_products: recommendations,
          valid_until: validUntil.toISOString().split('T')[0],
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Valutazione rischio completata con successo!');
      navigate(`/dashboard/assicurazioni/valutazione-rischio/${riskProfile.id}`);

    } catch (error: any) {
      console.error('Error submitting risk assessment:', error);
      toast.error(`Errore: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Valutazione del Rischio
        </h1>
        <p className="text-gray-600">
          Completa il questionario per ottenere una valutazione personalizzata del rischio
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} di {totalSteps}
          </span>
          <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center justify-between mb-8">
        {[
          { number: 1, icon: User, label: 'Dati Anagrafici' },
          { number: 2, icon: Heart, label: 'Salute' },
          { number: 3, icon: DollarSign, label: 'Situazione Finanziaria' },
          { number: 4, icon: Plane, label: 'Lifestyle' },
        ].map(({ number, icon: Icon, label }) => (
          <div key={number} className="flex flex-col items-center flex-1">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                currentStep >= number
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {currentStep > number ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
            </div>
            <span className="text-xs mt-2 text-center text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        {currentStep === 1 && (
          <Step1Demographics formData={formData} handleInputChange={handleInputChange} />
        )}
        {currentStep === 2 && (
          <Step2Health
            formData={formData}
            handleInputChange={handleInputChange}
            newCondition={newCondition}
            setNewCondition={setNewCondition}
            addCondition={addCondition}
            removeCondition={removeCondition}
            newMedication={newMedication}
            setNewMedication={setNewMedication}
            addMedication={addMedication}
            removeMedication={removeMedication}
          />
        )}
        {currentStep === 3 && (
          <Step3Financial formData={formData} handleInputChange={handleInputChange} />
        )}
        {currentStep === 4 && (
          <Step4Lifestyle
            formData={formData}
            handleInputChange={handleInputChange}
            newHobby={newHobby}
            setNewHobby={setNewHobby}
            addHobby={addHobby}
            removeHobby={removeHobby}
            newDestination={newDestination}
            setNewDestination={setNewDestination}
            addDestination={addDestination}
            removeDestination={removeDestination}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="flex items-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-2" />
          Indietro
        </button>

        {currentStep < totalSteps ? (
          <button
            onClick={nextStep}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Avanti
            <ChevronRight className="w-5 h-5 ml-2" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Elaborazione...
              </>
            ) : (
              <>
                <Check className="w-5 h-5 mr-2" />
                Completa Valutazione
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ================================================================
// STEP COMPONENTS
// ================================================================

function Step1Demographics({ formData, handleInputChange }: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Dati Anagrafici</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Età *
          </label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
            min="18"
            max="120"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Genere
          </label>
          <select
            value={formData.gender}
            onChange={(e) => handleInputChange('gender', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="male">Maschio</option>
            <option value="female">Femmina</option>
            <option value="other">Altro</option>
            <option value="prefer_not_to_say">Preferisco non dire</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Professione
        </label>
        <input
          type="text"
          value={formData.profession}
          onChange={(e) => handleInputChange('profession', e.target.value)}
          placeholder="es. Ingegnere, Medico, Impiegato..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Stato Civile
        </label>
        <select
          value={formData.marital_status}
          onChange={(e) => handleInputChange('marital_status', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="single">Single</option>
          <option value="married">Sposato/a</option>
          <option value="divorced">Divorziato/a</option>
          <option value="widowed">Vedovo/a</option>
        </select>
      </div>
    </div>
  );
}

function Step2Health({ 
  formData, 
  handleInputChange,
  newCondition,
  setNewCondition,
  addCondition,
  removeCondition,
  newMedication,
  setNewMedication,
  addMedication,
  removeMedication,
}: any) {
  const bmi = formData.weight_kg / Math.pow(formData.height_cm / 100, 2);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Salute</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Altezza (cm) *
          </label>
          <input
            type="number"
            value={formData.height_cm}
            onChange={(e) => handleInputChange('height_cm', parseInt(e.target.value))}
            min="100"
            max="250"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Peso (kg) *
          </label>
          <input
            type="number"
            value={formData.weight_kg}
            onChange={(e) => handleInputChange('weight_kg', parseFloat(e.target.value))}
            min="30"
            max="300"
            step="0.1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
      </div>

      {!isNaN(bmi) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>BMI Calcolato:</strong> {bmi.toFixed(1)} 
            {bmi < 18.5 && ' (Sottopeso)'}
            {bmi >= 18.5 && bmi < 25 && ' (Normale)'}
            {bmi >= 25 && bmi < 30 && ' (Sovrappeso)'}
            {bmi >= 30 && ' (Obesità)'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stato Fumatore *
          </label>
          <select
            value={formData.smoking_status}
            onChange={(e) => handleInputChange('smoking_status', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="never">Mai fumato</option>
            <option value="former">Ex fumatore</option>
            <option value="occasional">Fumatore occasionale</option>
            <option value="current">Fumatore attuale</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Consumo Alcol
          </label>
          <select
            value={formData.alcohol_consumption}
            onChange={(e) => handleInputChange('alcohol_consumption', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="none">Nessuno</option>
            <option value="occasional">Occasionale</option>
            <option value="moderate">Moderato</option>
            <option value="heavy">Frequente</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Livello di Attività Fisica *
        </label>
        <select
          value={formData.physical_activity_level}
          onChange={(e) => handleInputChange('physical_activity_level', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="sedentary">Sedentario (nessuna attività)</option>
          <option value="light">Leggero (1-2 giorni/settimana)</option>
          <option value="moderate">Moderato (3-5 giorni/settimana)</option>
          <option value="intense">Intenso (6-7 giorni/settimana)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Condizioni Preesistenti
        </label>
        <div className="space-y-2">
          {formData.preexisting_conditions.map((condition: any, index: number) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div>
                <span className="font-medium">{condition.name}</span>
                <span className="text-sm text-gray-600 ml-2">
                  (dal {condition.since}, {condition.controlled ? 'controllata' : 'non controllata'})
                </span>
              </div>
              <button
                onClick={() => removeCondition(index)}
                className="text-red-600 hover:text-red-800"
              >
                Rimuovi
              </button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <input
            type="text"
            value={newCondition.name}
            onChange={(e) => setNewCondition({ ...newCondition, name: e.target.value })}
            placeholder="Nome condizione"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <input
            type="text"
            value={newCondition.since}
            onChange={(e) => setNewCondition({ ...newCondition, since: e.target.value })}
            placeholder="Anno (es. 2020)"
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <div className="flex items-center space-x-2">
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={newCondition.controlled}
                onChange={(e) => setNewCondition({ ...newCondition, controlled: e.target.checked })}
                className="mr-2"
              />
              Controllata
            </label>
            <button
              onClick={addCondition}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Aggiungi
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Farmaci Attuali
        </label>
        <div className="space-y-2">
          {formData.medications.map((med: string, index: number) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <span>{med}</span>
              <button
                onClick={() => removeMedication(index)}
                className="text-red-600 hover:text-red-800"
              >
                Rimuovi
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={newMedication}
            onChange={(e) => setNewMedication(e.target.value)}
            placeholder="Nome farmaco"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            onClick={addMedication}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Aggiungi
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ultimo Controllo Medico
        </label>
        <input
          type="date"
          value={formData.last_medical_checkup}
          onChange={(e) => handleInputChange('last_medical_checkup', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}

function Step3Financial({ formData, handleInputChange }: any) {
  const debtToIncomeRatio = formData.annual_income_eur > 0
    ? ((formData.total_debts_eur / formData.annual_income_eur) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Situazione Finanziaria</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Reddito Annuale (€) *
        </label>
        <input
          type="number"
          value={formData.annual_income_eur}
          onChange={(e) => handleInputChange('annual_income_eur', parseFloat(e.target.value))}
          min="0"
          step="1000"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Patrimonio Totale (€)
          </label>
          <input
            type="number"
            value={formData.total_assets_eur}
            onChange={(e) => handleInputChange('total_assets_eur', parseFloat(e.target.value))}
            min="0"
            step="1000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Debiti Totali (€)
          </label>
          <input
            type="number"
            value={formData.total_debts_eur}
            onChange={(e) => handleInputChange('total_debts_eur', parseFloat(e.target.value))}
            min="0"
            step="1000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Rapporto Debito/Reddito:</strong> {debtToIncomeRatio}%
          {parseFloat(debtToIncomeRatio) < 20 && ' (Eccellente)'}
          {parseFloat(debtToIncomeRatio) >= 20 && parseFloat(debtToIncomeRatio) < 40 && ' (Buono)'}
          {parseFloat(debtToIncomeRatio) >= 40 && parseFloat(debtToIncomeRatio) < 60 && ' (Attenzione)'}
          {parseFloat(debtToIncomeRatio) >= 60 && ' (Alto rischio)'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stato Lavorativo *
          </label>
          <select
            value={formData.employment_status}
            onChange={(e) => handleInputChange('employment_status', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="employed">Dipendente</option>
            <option value="self_employed">Autonomo</option>
            <option value="unemployed">Disoccupato</option>
            <option value="retired">Pensionato</option>
            <option value="student">Studente</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Anni di Stabilità Lavorativa
          </label>
          <input
            type="number"
            value={formData.employment_stability_years}
            onChange={(e) => handleInputChange('employment_stability_years', parseInt(e.target.value))}
            min="0"
            max="50"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.homeowner}
            onChange={(e) => handleInputChange('homeowner', e.target.checked)}
            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            Proprietario di Casa
          </span>
        </label>
      </div>
    </div>
  );
}

function Step4Lifestyle({
  formData,
  handleInputChange,
  newHobby,
  setNewHobby,
  addHobby,
  removeHobby,
  newDestination,
  setNewDestination,
  addDestination,
  removeDestination,
}: any) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Lifestyle</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Attività Rischiose / Hobby
        </label>
        <div className="space-y-2">
          {formData.risky_hobbies.map((hobby: string, index: number) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <span>{hobby}</span>
              <button
                onClick={() => removeHobby(index)}
                className="text-red-600 hover:text-red-800"
              >
                Rimuovi
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={newHobby}
            onChange={(e) => setNewHobby(e.target.value)}
            placeholder="es. Paracadutismo, Motociclismo..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            onClick={addHobby}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Aggiungi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Viaggi all'Anno
          </label>
          <input
            type="number"
            value={formData.travel_frequency_per_year}
            onChange={(e) => handleInputChange('travel_frequency_per_year', parseInt(e.target.value))}
            min="0"
            max="50"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="flex items-center space-x-3 cursor-pointer pt-8">
            <input
              type="checkbox"
              checked={formData.extreme_sports}
              onChange={(e) => handleInputChange('extreme_sports', e.target.checked)}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Pratico Sport Estremi
            </span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Destinazioni ad Alto Rischio
        </label>
        <div className="space-y-2">
          {formData.high_risk_destinations.map((dest: string, index: number) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <span>{dest}</span>
              <button
                onClick={() => removeDestination(index)}
                className="text-red-600 hover:text-red-800"
              >
                Rimuovi
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={newDestination}
            onChange={(e) => setNewDestination(e.target.value)}
            placeholder="es. Zone di guerra, aree ad alta criminalità..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            onClick={addDestination}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Aggiungi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Record di Guida
          </label>
          <select
            value={formData.driving_record}
            onChange={(e) => handleInputChange('driving_record', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="clean">Pulito (nessuna infrazione)</option>
            <option value="minor_violations">Infrazioni minori</option>
            <option value="major_violations">Infrazioni gravi</option>
            <option value="accidents">Con incidenti</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tragitto Giornaliero (km)
          </label>
          <input
            type="number"
            value={formData.daily_commute_km}
            onChange={(e) => handleInputChange('daily_commute_km', parseInt(e.target.value))}
            min="0"
            max="500"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}
