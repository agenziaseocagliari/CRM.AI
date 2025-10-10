import React, { useCallback, useMemo, useState } from 'react';
import { SparklesIcon } from './ui/icons';

// CheckIcon component inline
const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

// ✅ NUOVO: Interfaccia risultato strutturato
export interface QuestionnaireResult {
  prompt: string;
  privacyUrl?: string;
  colors?: {
    primary: string;
    background: string;
    text: string;
  };
  metadata?: {
    gdpr_required: boolean;
    marketing_consent: boolean;
  };
}

interface InteractiveAIQuestionnaire {
  onComplete: (result: QuestionnaireResult) => void;
  initialPrompt: string;
}

interface QuestionnaireData {
  business_type: string;
  target_audience: string;
  form_purpose: string;
  required_fields: string[];
  privacy_policy_url: string;
  branding_colors: {
    primary: string;
    secondary: string;
  };
  gdpr_required: boolean;
  marketing_consent: boolean;
}

export const InteractiveAIQuestionnaire: React.FC<
  InteractiveAIQuestionnaire
> = ({ onComplete, initialPrompt }) => {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<QuestionnaireData>({
    business_type: '',
    target_audience: '',
    form_purpose: '',
    required_fields: [],
    privacy_policy_url: '',
    branding_colors: {
      primary: '#6366f1',
      secondary: '#f3f4f6',
    },
    gdpr_required: true,
    marketing_consent: false,
  });

  const totalSteps = 6;

  const updateData = useCallback((updates: Partial<QuestionnaireData>) => {
    setData(prev => ({ ...prev, ...updates }));
  }, []);

  // Ottimizzato per evitare re-render del textarea
  const handleTargetAudienceChange = useCallback((value: string) => {
    setData(prev => ({ ...prev, target_audience: value }));
  }, []);

  // Handlers ottimizzati per i color picker
  const handlePrimaryColorChange = useCallback((value: string) => {
    setData(prev => ({
      ...prev,
      branding_colors: { ...prev.branding_colors, primary: value },
    }));
  }, []);

  const handleSecondaryColorChange = useCallback((value: string) => {
    setData(prev => ({
      ...prev,
      branding_colors: { ...prev.branding_colors, secondary: value },
    }));
  }, []);

  const handleFieldToggle = (field: string) => {
    const newFields = data.required_fields.includes(field)
      ? data.required_fields.filter(f => f !== field)
      : [...data.required_fields, field];
    updateData({ required_fields: newFields });
  };

  const generateEnhancedPrompt = () => {
    // Genera un prompt base intelligente basato sui dati del questionario
    const basePrompt =
      initialPrompt ||
      `Crea un form ${data.form_purpose.toLowerCase()} per ${data.business_type.toLowerCase()} che si rivolge a: ${data.target_audience}`;

    const enhanced = `${basePrompt}

CONTESTO BUSINESS:
- Tipo di business: ${data.business_type}
- Target audience: ${data.target_audience}
- Scopo del form: ${data.form_purpose}

SPECIFICHE TECNICHE:
- Campi obbligatori: ${data.required_fields.join(', ')}
- GDPR compliance: ${data.gdpr_required ? 'Richiesto' : 'Non necessario'}
- Consenso marketing: ${data.marketing_consent ? 'Include opzione' : 'Non includere'}
- URL Privacy Policy: ${data.privacy_policy_url || 'Da configurare'}

BRANDING:
- Colore primario: ${data.branding_colors.primary}
- Colore sfondo: ${data.branding_colors.secondary}

ISTRUZIONI AI:
Crea un form professionale che rispetti tutte le specifiche indicate. 
Se GDPR è richiesto, includi automaticamente un campo privacy con link cliccabile.
Utilizza i colori del brand specificati.
Ottimizza per la conversione e l'usabilità.
Genera i campi specificamente richiesti: ${data.required_fields.join(', ')}.
        `.trim();

    console.log('🎯 Questionnaire - Enhanced Prompt Generated:', enhanced);
    console.log('🎨 Questionnaire - Colors:', data.branding_colors);
    console.log('🔒 Questionnaire - Privacy URL:', data.privacy_policy_url);

    // ✅ NUOVO: Restituisci oggetto strutturato invece di solo stringa
    const result: QuestionnaireResult = {
      prompt: enhanced,
      privacyUrl: data.privacy_policy_url || undefined,
      colors: {
        primary: data.branding_colors.primary,
        background: data.branding_colors.secondary,
        text: '#1f2937'
      },
      metadata: {
        gdpr_required: data.gdpr_required,
        marketing_consent: data.marketing_consent
      }
    };
    
    console.log('🎁 Questionnaire - Complete Result:', result);
    onComplete(result);
  };

  const commonFieldOptions = [
    'Nome completo',
    'Email',
    'Telefono',
    'Azienda',
    'Settore',
    'Messaggio',
    'Budget',
    'Timeline',
    'Servizi interesse',
    'Come ci hai conosciuto',
  ];

  const businessTypes = [
    'Web Agency',
    'E-commerce',
    'Agenzia Marketing',
    'Consulenza',
    'Software House',
    'Freelancer',
    'Startup',
    'Altro',
  ];

  const formPurposes = [
    'Lead Generation',
    'Richiesta Preventivo',
    'Contatto Generale',
    'Iscrizione Newsletter',
    'Download Risorsa',
    'Prenotazione Consulenza',
  ];

  const Step1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Che tipo di business hai?
      </h3>
      <p className="text-sm text-gray-600">
        Questo mi aiuterà a creare campi più pertinenti
      </p>

      <div className="grid grid-cols-2 gap-3">
        {businessTypes.map(type => (
          <button
            key={type}
            onClick={() => updateData({ business_type: type })}
            className={`p-3 rounded-lg border text-left transition-all ${
              data.business_type === type
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {data.business_type === 'Altro' && (
        <input
          type="text"
          placeholder="Specifica il tuo settore..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          onChange={e => updateData({ business_type: e.target.value })}
        />
      )}
    </div>
  );

  const Step2 = useMemo(
    () => (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Chi è il tuo target?
        </h3>
        <p className="text-sm text-gray-600">
          Descrivi brevemente i tuoi clienti ideali
        </p>

        <textarea
          key="target-audience-textarea"
          value={data.target_audience}
          onChange={e => handleTargetAudienceChange(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="Es: PMI italiane che cercano soluzioni di marketing digitale, con budget 5-50k€, settori B2B..."
          autoComplete="off"
          spellCheck="false"
        />
      </div>
    ),
    [data.target_audience, handleTargetAudienceChange]
  );

  const Step3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Qual è lo scopo del form?
      </h3>

      <div className="grid grid-cols-1 gap-3">
        {formPurposes.map(purpose => (
          <button
            key={purpose}
            onClick={() => updateData({ form_purpose: purpose })}
            className={`p-3 rounded-lg border text-left transition-all ${
              data.form_purpose === purpose
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {purpose}
          </button>
        ))}
      </div>
    </div>
  );

  const Step4 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Quali campi vuoi includere?
      </h3>
      <p className="text-sm text-gray-600">
        Seleziona tutti i campi che ritieni importanti
      </p>

      <div className="grid grid-cols-2 gap-3">
        {commonFieldOptions.map(field => (
          <button
            key={field}
            onClick={() => handleFieldToggle(field)}
            className={`p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
              data.required_fields.includes(field)
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <span>{field}</span>
            {data.required_fields.includes(field) && (
              <CheckIcon className="w-4 h-4" />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const Step5 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Privacy e GDPR</h3>

      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="gdpr"
            checked={data.gdpr_required}
            onChange={e => updateData({ gdpr_required: e.target.checked })}
            className="h-4 w-4 text-primary"
          />
          <label htmlFor="gdpr" className="text-sm font-medium text-gray-700">
            Richiedi compliance GDPR (raccomandato per UE)
          </label>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="marketing"
            checked={data.marketing_consent}
            onChange={e => updateData({ marketing_consent: e.target.checked })}
            className="h-4 w-4 text-primary"
          />
          <label
            htmlFor="marketing"
            className="text-sm font-medium text-gray-700"
          >
            Includi consenso per email marketing
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL Privacy Policy (opzionale)
          </label>
          <input
            type="url"
            value={data.privacy_policy_url}
            onChange={e => updateData({ privacy_policy_url: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="https://tuosito.com/privacy"
          />
        </div>
      </div>
    </div>
  );

  const Step6 = useMemo(
    () => (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Personalizzazione Colori
        </h3>
        <p className="text-sm text-gray-600">Scegli i colori del tuo brand</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Colore Primario
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={data.branding_colors.primary}
                onChange={e => {
                  e.stopPropagation();
                  handlePrimaryColorChange(e.target.value);
                }}
                onClick={e => e.stopPropagation()}
                className="w-10 h-10 rounded border cursor-pointer"
              />
              <input
                type="text"
                value={data.branding_colors.primary}
                onChange={e => handlePrimaryColorChange(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Colore Sfondo
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={data.branding_colors.secondary}
                onChange={e => {
                  e.stopPropagation();
                  handleSecondaryColorChange(e.target.value);
                }}
                onClick={e => e.stopPropagation()}
                className="w-10 h-10 rounded border cursor-pointer"
              />
              <input
                type="text"
                value={data.branding_colors.secondary}
                onChange={e => handleSecondaryColorChange(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">
            Anteprima Riepilogo:
          </h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>
              <strong>Business:</strong> {data.business_type}
            </p>
            <p>
              <strong>Scopo:</strong> {data.form_purpose}
            </p>
            <p>
              <strong>Campi:</strong>{' '}
              {data.required_fields.slice(0, 3).join(', ')}
              {data.required_fields.length > 3 ? '...' : ''}
            </p>
            <p>
              <strong>GDPR:</strong> {data.gdpr_required ? 'Sì' : 'No'}
            </p>
          </div>
        </div>
      </div>
    ),
    [
      data.branding_colors.primary,
      data.branding_colors.secondary,
      data.business_type,
      data.form_purpose,
      data.required_fields,
      data.gdpr_required,
      handlePrimaryColorChange,
      handleSecondaryColorChange,
    ]
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1 />;
      case 2:
        return Step2;
      case 3:
        return <Step3 />;
      case 4:
        return <Step4 />;
      case 5:
        return <Step5 />;
      case 6:
        return Step6;
      default:
        return <Step1 />;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!data.business_type;
      case 2:
        return !!data.target_audience;
      case 3:
        return !!data.form_purpose;
      case 4:
        return data.required_fields.length > 0;
      case 5:
        return true; // Privacy step is optional
      case 6:
        return true; // Colors have defaults
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <SparklesIcon className="w-5 h-5 mr-2 text-primary" />
          AI Questionnaire Intelligente
        </h2>
        <span className="text-sm text-gray-500">
          {step} di {totalSteps}
        </span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${(step / totalSteps) * 100}%` }}
        />
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">{renderStep()}</div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4 border-t">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="text-sm text-gray-600 hover:text-primary disabled:opacity-50"
        >
          ← Indietro
        </button>

        {step < totalSteps ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Continua →
          </button>
        ) : (
          <button
            onClick={generateEnhancedPrompt}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <SparklesIcon className="w-4 h-4" />
            <span>Genera Form AI</span>
          </button>
        )}
      </div>
    </div>
  );
};
