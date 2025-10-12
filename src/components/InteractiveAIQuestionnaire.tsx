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

// ✅ LEVEL 6 FIX: Interfaccia risultato strutturato con required_fields + design avanzato
export interface QuestionnaireResult {
  prompt: string;
  privacyUrl?: string;
  required_fields?: string[];  // ✅ CRITICAL FIX: Lista campi selezionati dall'utente
  colors?: {
    primary: string;
    background: string;
    text: string;
  };
  // 🎨 DESIGN AVANZATO: Nuove opzioni
  design?: {
    border_radius: number;
    border_width: number;
    padding: 'compact' | 'normal' | 'spacious';
    font_size: 'small' | 'normal' | 'large';
    shadow: 'none' | 'subtle' | 'medium' | 'strong';
  };
  metadata?: {
    gdpr_required: boolean;
    marketing_consent: boolean;
  };
}

interface InteractiveAIQuestionnaire {
  onComplete: (result: QuestionnaireResult) => void;
  initialPrompt: string;
  initialStep?: number; // 🎯 Per aprire direttamente step specifico (es. step 5 per Design Avanzato)
}

interface QuestionnaireData {
  business_type: string;
  business_type_other: string;  // 🆕 Campo separato per "Altro"
  target_audience: string;
  form_purpose: string;
  required_fields: string[];
  privacy_policy_url: string;
  branding_colors: {
    primary: string;
    secondary: string;
    text: string;  // ✅ Aggiunto per auto-sync text color
  };
  // 🎨 DESIGN AVANZATO: Nuove opzioni di personalizzazione
  design_options: {
    border_radius: number;     // Border radius in px
    border_width: number;      // Border width in px
    padding: 'compact' | 'normal' | 'spacious';  // Spacing preset
    font_size: 'small' | 'normal' | 'large';     // Typography size
    shadow: 'none' | 'subtle' | 'medium' | 'strong'; // Shadow depth
  };
  gdpr_required: boolean;
  marketing_consent: boolean;
}

export const InteractiveAIQuestionnaire: React.FC<
  InteractiveAIQuestionnaire
> = ({ onComplete, initialPrompt, initialStep = 1 }) => {
  const [step, setStep] = useState(initialStep);
  const [data, setData] = useState<QuestionnaireData>({
    business_type: '',  // Mantenuto per compatibilità ma non usato
    business_type_other: '',
    target_audience: '',
    form_purpose: '',
    required_fields: [],
    privacy_policy_url: '',
    branding_colors: {
      primary: '#3B82F6',
      secondary: '#10B981',
      text: '#3B82F6',
    },
    // 🎨 DESIGN AVANZATO: Valori di default
    design_options: {
      border_radius: 8,        // 8px radius (moderno)
      border_width: 1,         // 1px border (standard)
      padding: 'normal',       // Spacing normale
      font_size: 'normal',     // Font size normale
      shadow: 'subtle',        // Ombra sottile
    },
    gdpr_required: false,
    marketing_consent: false,
  });

  const totalSteps = 5; // ✅ Ridotto da 6 a 5 (rimosso business type)

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
      branding_colors: {
        ...prev.branding_colors,
        primary: value,
        text: value // Auto-sync text color with primary color
      }
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

  // 🎯 Auto-seleziona campi consigliati quando cambia il purpose
  const handlePurposeChange = useCallback((purpose: string) => {
    const recommendedFields = getRecommendedFields(purpose);
    updateData({
      form_purpose: purpose,
      required_fields: recommendedFields // Auto-seleziona i campi consigliati
    });
  }, [updateData]);

  const generateEnhancedPrompt = () => {
    // Genera un prompt base intelligente basato sui dati del questionario
    const basePrompt =
      initialPrompt ||
      `Crea un form ${data.form_purpose.toLowerCase()} mirato per: ${data.target_audience}`;

    const enhanced = `${basePrompt}

CONTESTO:
- Target audience: ${data.target_audience}
- Scopo del form: ${data.form_purpose}

SPECIFICHE TECNICHE:
- Campi obbligatori: ${data.required_fields.join(', ')}
- GDPR compliance: ${data.gdpr_required ? 'Richiesto' : 'Non necessario'}
- Consenso marketing: ${data.marketing_consent ? 'Include opzione' : 'Non includere'}
- URL Privacy Policy: ${data.privacy_policy_url || 'Da configurare'}

BRANDING:
- Colore primario: ${data.branding_colors.primary}
- Colore secondario: ${data.branding_colors.secondary}
- Colore testo: ${data.branding_colors.text}

DESIGN AVANZATO:
- Border radius: ${data.design_options.border_radius}px
- Border width: ${data.design_options.border_width}px
- Padding: ${data.design_options.padding}
- Font size: ${data.design_options.font_size}
- Shadow: ${data.design_options.shadow}

ISTRUZIONI AI:
Crea un form professionale che rispetti tutte le specifiche indicate. 
Se GDPR è richiesto, includi automaticamente un campo privacy con link cliccabile.
Utilizza i colori del brand e le opzioni di design specificati.
Applica border-radius, border-width, padding, font-size e shadow secondo le impostazioni.
Ottimizza per la conversione e l'usabilità.
Genera i campi specificamente richiesti: ${data.required_fields.join(', ')}.
        `.trim();

    console.log('🎯 Questionnaire - Enhanced Prompt Generated:', enhanced);
    console.log('🎨 Questionnaire - Colors:', data.branding_colors);
    console.log('🔒 Questionnaire - Privacy URL:', data.privacy_policy_url);
    console.log('📋 Questionnaire - Required Fields:', data.required_fields);

    // ✅ LEVEL 6 FIX: Restituisci oggetto strutturato con required_fields + design
    const result: QuestionnaireResult = {
      prompt: enhanced,
      privacyUrl: data.privacy_policy_url || undefined,
      required_fields: data.required_fields,  // ✅ CRITICAL FIX
      colors: {
        primary: data.branding_colors.primary,
        background: data.branding_colors.secondary,
        text: data.branding_colors.text  // ✅ FIX: Usa il text color sincronizzato!
      },
      // 🎨 DESIGN AVANZATO: Includi le nuove opzioni
      design: {
        border_radius: data.design_options.border_radius,
        border_width: data.design_options.border_width,
        padding: data.design_options.padding,
        font_size: data.design_options.font_size,
        shadow: data.design_options.shadow,
      },
      metadata: {
        gdpr_required: data.gdpr_required,
        marketing_consent: data.marketing_consent
      }
    };

    console.log('🎁 Questionnaire - Complete Result:', result);
    onComplete(result);
  };

  // 🎯 SMART FIELD SUGGESTIONS: Campi personalizzati in base allo scopo
  const getRecommendedFields = (purpose: string) => {
    const baseFields = ['Nome completo', 'Email'];

    switch (purpose) {
      case 'Lead Generation':
        return [...baseFields, 'Telefono', 'Azienda', 'Settore', 'Servizi interesse', 'Budget', 'Timeline', 'Come ci hai conosciuto'];

      case 'Richiesta Preventivo':
        return [...baseFields, 'Telefono', 'Azienda', 'Settore', 'Dettagli progetto', 'Budget', 'Timeline', 'Servizi richiesti'];

      case 'Contatto Generale':
        return [...baseFields, 'Telefono', 'Oggetto', 'Messaggio', 'Come ci hai conosciuto'];

      case 'Iscrizione Newsletter':
        return [...baseFields, 'Settore interesse', 'Frequenza email', 'Come ci hai conosciuto'];

      case 'Download Risorsa':
        return [...baseFields, 'Azienda', 'Settore', 'Ruolo aziendale', 'Come userai la risorsa'];

      case 'Prenotazione Consulenza':
        return [...baseFields, 'Telefono', 'Azienda', 'Settore', 'Tipo consulenza', 'Budget', 'Disponibilità', 'Obiettivi'];

      default:
        return [...baseFields, 'Telefono', 'Azienda', 'Messaggio'];
    }
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
    // Campi specifici per scopi diversi
    'Dettagli progetto',
    'Servizi richiesti',
    'Oggetto',
    'Settore interesse',
    'Frequenza email',
    'Ruolo aziendale',
    'Come userai la risorsa',
    'Tipo consulenza',
    'Disponibilità',
    'Obiettivi',
  ];

  // � Form purposes universali per qualsiasi business
  const formPurposes = [
    'Lead Generation',
    'Richiesta Preventivo',
    'Contatto Generale',
    'Iscrizione Newsletter',
    'Download Risorsa',
    'Prenotazione Consulenza',
  ];

  // �🆕 STEP 1: Target Audience (era Step2)
  const Step1 = useMemo(
    () => (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Chi è il tuo target?
        </h3>
        <p className="text-sm text-gray-600">
          Descrivi brevemente i tuoi clienti ideali per creare un form più mirato
        </p>

        <textarea
          key="target-audience-textarea"
          value={data.target_audience}
          onChange={e => handleTargetAudienceChange(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
          placeholder="Es: Clienti locali che cercano servizi di qualità, famiglie con bambini, professionisti 25-45 anni..."
          autoComplete="off"
          spellCheck="false"
        />
      </div>
    ),
    [data.target_audience, handleTargetAudienceChange]
  );

  // 🆕 STEP 2: Form Purpose (era Step3)
  const Step2 = useMemo(() => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        Qual è lo scopo del form?
      </h3>
      <p className="text-sm text-gray-600">
        Seleziona l&apos;obiettivo principale per ottimizzare i campi consigliati
      </p>

      <div className="grid grid-cols-1 gap-3">
        {formPurposes.map((purpose: string) => (
          <button
            key={purpose}
            onClick={() => handlePurposeChange(purpose)}
            className={`p-3 rounded-lg border text-left transition-all ${data.form_purpose === purpose
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-gray-200 hover:border-gray-300'
              }`}
          >
            {purpose}
          </button>
        ))}
      </div>
    </div>
  ), [data.form_purpose, handlePurposeChange, formPurposes]);

  // 🆕 STEP 3: Form Fields (era Step4)
  const Step3 = () => {
    const recommendedFields = getRecommendedFields(data.form_purpose);

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Quali campi vuoi includere?
          </h3>
          <p className="text-sm text-gray-600">
            Campi consigliati per &ldquo;{data.form_purpose}&rdquo; + tutti gli altri disponibili
          </p>
        </div>

        {/* 🎯 CAMPI CONSIGLIATI */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🤖</span>
            <h4 className="text-sm font-medium text-blue-900">
              Campi consigliati per {data.form_purpose}
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {recommendedFields.map(field => (
              <button
                key={`rec-${field}`}
                onClick={() => handleFieldToggle(field)}
                className={`p-2 rounded-md border text-left text-sm transition-all flex items-center justify-between ${data.required_fields.includes(field)
                  ? 'border-blue-400 bg-blue-100 text-blue-900'
                  : 'border-blue-200 bg-white hover:border-blue-300 text-blue-700'
                  }`}
              >
                <span>{field}</span>
                {data.required_fields.includes(field) && (
                  <CheckIcon className="w-3 h-3" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 📋 TUTTI I CAMPI DISPONIBILI */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Tutti i campi disponibili</h4>
          <div className="grid grid-cols-2 gap-3">
            {commonFieldOptions.map(field => (
              <button
                key={field}
                onClick={() => handleFieldToggle(field)}
                className={`p-3 rounded-lg border text-left transition-all flex items-center justify-between ${data.required_fields.includes(field)
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
      </div>
    );
  };

  // 🆕 STEP 4: Privacy/GDPR (era Step5)
  const Step4 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Privacy e GDPR</h3>

      <div className="space-y-3">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="gdpr"
              checked={data.gdpr_required}
              onChange={e => updateData({ gdpr_required: e.target.checked })}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <label htmlFor="gdpr" className="text-sm font-medium text-gray-700">
                <span className="text-blue-700">📋 GDPR COMPLIANCE</span><br />
                Richiedi compliance GDPR (raccomandato per UE)
              </label>
              <p className="text-xs text-blue-600 mt-1">
                Aggiunge automaticamente checkbox privacy policy
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="marketing"
              checked={data.marketing_consent}
              onChange={e => updateData({ marketing_consent: e.target.checked })}
              className="mt-1 h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <div>
              <label
                htmlFor="marketing"
                className="text-sm font-medium text-gray-700"
              >
                <span className="text-green-700">📧 MARKETING NEWSLETTER</span><br />
                Includi consenso per email marketing
              </label>
              <p className="text-xs text-green-600 mt-1">
                ⚠️ Se NON spunti questa opzione, il campo marketing NON apparirà nel form!
              </p>
            </div>
          </div>
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

  // 🆕 STEP 5: Design Avanzato (era Step6)
  const Step5 = useMemo(
    () => (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            🎨 Personalizza Design Form
          </h3>
          <p className="text-sm text-gray-600">
            Personalizza colori, bordi, spaziatura e stile del tuo form
          </p>
        </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Colore Testo
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={data.branding_colors.text}
                onChange={e => {
                  e.stopPropagation();
                  updateData({ branding_colors: { ...data.branding_colors, text: e.target.value } });
                }}
                onClick={e => e.stopPropagation()}
                className="w-10 h-10 rounded border cursor-pointer"
              />
              <input
                type="text"
                value={data.branding_colors.text}
                onChange={e => updateData({ branding_colors: { ...data.branding_colors, text: e.target.value } })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>

        {/* 🎨 DESIGN AVANZATO: Nuove opzioni di personalizzazione */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🎨</span>
            <h4 className="text-sm font-medium text-purple-900">
              Personalizzazione Avanzata
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Border Radius */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📐 Rotondità Bordi
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={data.design_options.border_radius}
                  onChange={e => updateData({
                    design_options: {
                      ...data.design_options,
                      border_radius: parseInt(e.target.value)
                    }
                  })}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-12">
                  {data.design_options.border_radius}px
                </span>
              </div>
            </div>

            {/* Border Width */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📏 Spessore Bordi
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="0"
                  max="4"
                  value={data.design_options.border_width}
                  onChange={e => updateData({
                    design_options: {
                      ...data.design_options,
                      border_width: parseInt(e.target.value)
                    }
                  })}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-12">
                  {data.design_options.border_width}px
                </span>
              </div>
            </div>

            {/* Padding */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📦 Spaziatura
              </label>
              <select
                value={data.design_options.padding}
                onChange={e => updateData({
                  design_options: {
                    ...data.design_options,
                    padding: e.target.value as 'compact' | 'normal' | 'spacious'
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="compact">Compatta</option>
                <option value="normal">Normale</option>
                <option value="spacious">Ampia</option>
              </select>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🔤 Dimensione Testo
              </label>
              <select
                value={data.design_options.font_size}
                onChange={e => updateData({
                  design_options: {
                    ...data.design_options,
                    font_size: e.target.value as 'small' | 'normal' | 'large'
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="small">Piccolo</option>
                <option value="normal">Normale</option>
                <option value="large">Grande</option>
              </select>
            </div>

            {/* Shadow */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                🌟 Ombreggiatura
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['none', 'subtle', 'medium', 'strong'] as const).map(shadow => (
                  <button
                    key={shadow}
                    onClick={() => updateData({
                      design_options: {
                        ...data.design_options,
                        shadow
                      }
                    })}
                    className={`p-2 rounded border text-xs transition-all ${data.design_options.shadow === shadow
                      ? 'border-purple-400 bg-purple-100 text-purple-900'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    {shadow === 'none' && 'Nessuna'}
                    {shadow === 'subtle' && 'Sottile'}
                    {shadow === 'medium' && 'Media'}
                    {shadow === 'strong' && 'Forte'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">
            Anteprima Riepilogo:
          </h4>
          <div className="text-xs text-gray-600 space-y-1">
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
            <p>
              <strong>Design:</strong> Bordi {data.design_options.border_radius}px,
              Padding {data.design_options.padding},
              Ombra {data.design_options.shadow}
            </p>
          </div>

          {/* 🎯 ANTEPRIMA LIVE DESIGN */}
          <div className="mt-3 p-3 bg-white border" style={{
            borderRadius: `${data.design_options.border_radius}px`,
            borderWidth: `${data.design_options.border_width}px`,
            borderColor: data.branding_colors.primary,
            padding: data.design_options.padding === 'compact' ? '8px' :
              data.design_options.padding === 'spacious' ? '20px' : '12px',
            fontSize: data.design_options.font_size === 'small' ? '14px' :
              data.design_options.font_size === 'large' ? '18px' : '16px',
            boxShadow: data.design_options.shadow === 'none' ? 'none' :
              data.design_options.shadow === 'subtle' ? '0 1px 3px rgba(0,0,0,0.1)' :
                data.design_options.shadow === 'medium' ? '0 4px 6px rgba(0,0,0,0.1)' :
                  '0 10px 15px rgba(0,0,0,0.1)',
            color: data.branding_colors.text
          }}>
            <div style={{ color: data.branding_colors.primary, fontWeight: 'bold', marginBottom: '8px' }}>
              ✨ Anteprima Stile Form
            </div>
            <div style={{ marginBottom: '6px' }}>Nome: ____________</div>
            <div style={{ marginBottom: '6px' }}>Email: ____________</div>
            <button style={{
              backgroundColor: data.branding_colors.primary,
              color: 'white',
              padding: '6px 12px',
              border: 'none',
              borderRadius: `${data.design_options.border_radius}px`,
              fontSize: 'inherit'
            }}>
              Invia Form
            </button>
          </div>
        </div>
      </div>
    ),
    [
      data.branding_colors.primary,
      data.branding_colors.secondary,
      data.branding_colors.text,
      data.design_options.border_radius,
      data.design_options.border_width,
      data.design_options.padding,
      data.design_options.font_size,
      data.design_options.shadow,
      data.business_type,
      data.form_purpose,
      data.required_fields,
      data.gdpr_required,
      handlePrimaryColorChange,
      handleSecondaryColorChange,
      updateData,
    ]
  );

  const renderStep = () => {
    switch (step) {
      case 1:
        return Step1;
      case 2:
        return Step2;
      case 3:
        return <Step3 />;
      case 4:
        return <Step4 />;
      case 5:
        return Step5;
      default:
        return Step1;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!data.target_audience;  // Step1 ora è target audience
      case 2:
        return !!data.form_purpose;     // Step2 ora è form purpose
      case 3:
        return data.required_fields.length > 0;  // Step3 ora è fields
      case 4:
        return true; // Privacy step is optional
      case 5:
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
