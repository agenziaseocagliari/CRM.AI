import React, { useEffect, useState } from 'react';
import { FormField, FormStyle } from '../../types';
import { PlusIcon, TrashIcon } from '../ui/icons';
// import { PencilIcon } from '../ui/icons'; // TODO: Re-enable when edit functionality is added

// Icona Swatch personalizzata (sostituisce SwatchIcon)
const SwatchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
    </svg>
);

interface PostAIEditorProps {
    fields: FormField[];
    onFieldsChange: (fields: FormField[]) => void;
    style?: FormStyle;
    onStyleChange: (style: FormStyle) => void;
    privacyPolicyUrl?: string;
    onPrivacyPolicyChange: (url: string) => void;
    // 🎨 DESIGN AVANZATO: Funzione per riaprire questionario
    onOpenQuestionnaire?: () => void;
}

export const PostAIEditor: React.FC<PostAIEditorProps> = ({
    fields,
    onFieldsChange,
    style,
    onStyleChange,
    privacyPolicyUrl = '',
    onPrivacyPolicyChange,
    onOpenQuestionnaire
}) => {
    // Stati per la personalizzazione dei colori
    const [primaryColor, setPrimaryColor] = useState(style?.primary_color || '#6366f1');
    const [backgroundColor, setBackgroundColor] = useState(style?.background_color || '#ffffff');

    // 🎯 UX IMPROVEMENT: Se non c'è text_color, inizializza con primaryColor
    const [textColor, setTextColor] = useState(
        style?.text_color || style?.primary_color || '#1f2937'
    );

    // 🎯 UX IMPROVEMENT: Traccia se il testo è stato personalizzato manualmente
    // Se non c'è text_color nel style iniziale, significa che è auto-sync
    const [isTextColorCustomized, setIsTextColorCustomized] = useState(!!style?.text_color);

    // 🆕 CRITICAL FIX: Sincronizza state locale con props quando cambiano
    // Questo risolve il problema dove PostAIEditor mostra colori default
    // mentre il parent formStyle ha già i colori corretti dal questionario/meta
    useEffect(() => {
        console.log('🎨 PostAIEditor - Syncing with parent style prop:', style);
        if (style?.primary_color) {
            setPrimaryColor(style.primary_color);
        }
        if (style?.background_color) {
            setBackgroundColor(style.background_color);
        }
        if (style?.text_color) {
            setTextColor(style.text_color);
            setIsTextColorCustomized(true); // Se c'è text_color, è personalizzato
        } else if (style?.primary_color && !isTextColorCustomized) {
            // Se non c'è text_color ma c'è primary_color, auto-sync
            setTextColor(style.primary_color);
        }
    }, [style, isTextColorCustomized]); // ✅ FIX: Aggiungi isTextColorCustomized alle dependencies


    // Preset di colori basati sui commit GitHub (Oct 8, 2025)
    const colorPresets = [
        { name: 'Corporate', primary: '#1e40af', background: '#ffffff', text: '#1f2937' },
        { name: 'Creative', primary: '#7c3aed', background: '#faf5ff', text: '#1f2937' },
        { name: 'Minimal', primary: '#374151', background: '#f9fafb', text: '#111827' },
        { name: 'Success', primary: '#059669', background: '#ecfdf5', text: '#064e3b' },
        { name: 'Warm', primary: '#ea580c', background: '#fff7ed', text: '#9a3412' }
    ];

    // Aggiorna lo stile quando cambiano i colori
    // ✅ RIMOSSO useEffect - Chiamiamo onStyleChange solo quando user modifica colori
    // Questo evita loop infiniti e garantisce che i cambiamenti siano intenzionali

    const buildStyleObject = (primary: string, background: string, text: string): FormStyle => {
        return {
            primary_color: primary,
            secondary_color: '#f3f4f6',
            background_color: background,
            text_color: text,
            border_color: primary,
            border_radius: '8px',
            font_family: 'Inter, system-ui, sans-serif',
            button_style: {
                background_color: primary,
                text_color: '#ffffff',
                border_radius: '6px'
            }
        };
    };

    const handleColorChange = (type: 'primary' | 'background' | 'text', color: string) => {
        console.log('🎨 COLOR CHANGE:', { type, color, timestamp: new Date().toISOString() });

        let newPrimary = primaryColor;
        let newBackground = backgroundColor;
        let newText = textColor;

        if (type === 'primary') {
            newPrimary = color;
            setPrimaryColor(color);

            // 🎯 UX MAGIC: Sincronizza automaticamente il testo col primario 
            // SOLO se l'utente non ha mai personalizzato il testo manualmente
            if (!isTextColorCustomized) {
                newText = color;
                setTextColor(color);
                console.log('🔄 Auto-syncing text color with primary:', color);
            }
        } else if (type === 'background') {
            newBackground = color;
            setBackgroundColor(color);
        } else if (type === 'text') {
            newText = color;
            setTextColor(color);
            // 🏷️ Marca il testo come personalizzato manualmente
            setIsTextColorCustomized(true);
            console.log('✏️ Text color manually customized:', color);
        }

        // ✅ Chiama onStyleChange IMMEDIATAMENTE con i nuovi valori
        onStyleChange(buildStyleObject(newPrimary, newBackground, newText));
    };

    const applyPreset = (preset: typeof colorPresets[0]) => {
        // 🛡️ PROTEZIONE: Chiedi conferma se ci sono personalizzazioni
        const hasCustomizations =
            primaryColor !== '#6366f1' ||
            backgroundColor !== '#ffffff' ||
            textColor !== '#1f2937';

        if (hasCustomizations) {
            const confirmed = window.confirm(
                `⚠️ Applicare il tema "${preset.name}" cancellerà le tue personalizzazioni colori.\n\nVuoi procedere?`
            );
            if (!confirmed) {
                return; // Annulla operazione
            }
        }

        console.log('🎨 APPLYING PRESET:', { preset, timestamp: new Date().toISOString() });
        setPrimaryColor(preset.primary);
        setBackgroundColor(preset.background);
        setTextColor(preset.text);
        setIsTextColorCustomized(false); // 🎯 Reset personalizzazione quando si applica un preset

        // ✅ Applica preset immediatamente
        onStyleChange(buildStyleObject(preset.primary, preset.background, preset.text));
    };

    const updateField = (index: number, updates: Partial<FormField>) => {
        const updatedFields = fields.map((field, i) =>
            i === index ? { ...field, ...updates } : field
        );
        onFieldsChange(updatedFields);
    };

    const removeField = (index: number) => {
        const updatedFields = fields.filter((_, i) => i !== index);
        onFieldsChange(updatedFields);
    };

    const addNewField = () => {
        const newField: FormField = {
            name: `campo_${Date.now()}`,
            label: 'Nuovo Campo',
            type: 'text',
            required: false,
            description: ''
        };
        onFieldsChange([...fields, newField]);
    };

    return (
        <div className="space-y-6">
            {/* 🎨 Sezione Personalizzazione Colori */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <SwatchIcon className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-semibold text-gray-900">Personalizza Colori Form</h3>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            ✨ FormMaster Level 6
                        </span>
                    </div>

                    {/* 🎨 Pulsante per riaprire questionario */}
                    {onOpenQuestionnaire && (
                        <button
                            onClick={onOpenQuestionnaire}
                            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-md transition-colors"
                            title="Apri questionario per personalizzazione avanzata"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Design Avanzato</span>
                        </button>
                    )}
                </div>

                {/* Color Pickers */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Colore Primario
                        </label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="color"
                                value={primaryColor}
                                onChange={(e) => handleColorChange('primary', e.target.value)}
                                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={primaryColor}
                                onChange={(e) => handleColorChange('primary', e.target.value)}
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="#6366f1"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Colore Sfondo
                        </label>
                        <div className="flex items-center space-x-2">
                            <input
                                type="color"
                                value={backgroundColor}
                                onChange={(e) => handleColorChange('background', e.target.value)}
                                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={backgroundColor}
                                onChange={(e) => handleColorChange('background', e.target.value)}
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="#ffffff"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-700">
                                Colore Testo
                            </label>
                            {!isTextColorCustomized && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    🔄 Auto-sync
                                </span>
                            )}
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="color"
                                value={textColor}
                                onChange={(e) => handleColorChange('text', e.target.value)}
                                className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                                type="text"
                                value={textColor}
                                onChange={(e) => handleColorChange('text', e.target.value)}
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="#1f2937"
                            />
                        </div>
                        {!isTextColorCustomized && (
                            <p className="text-xs text-gray-500">
                                💡 Il colore del testo segue automaticamente il primario. Modificalo per personalizzarlo.
                            </p>
                        )}
                    </div>
                </div>

                {/* Preset Themes */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm font-medium text-gray-700">
                            Temi Predefiniti
                        </label>
                        {(primaryColor !== '#6366f1' || backgroundColor !== '#ffffff' || textColor !== '#1f2937') && (
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded flex items-center">
                                🎨 Personalizzato
                            </span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {colorPresets.map((preset) => (
                            <button
                                key={preset.name}
                                onClick={() => applyPreset(preset)}
                                className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex space-x-1">
                                    <div
                                        className="w-3 h-3 rounded-full border"
                                        style={{ backgroundColor: preset.primary }}
                                    />
                                    <div
                                        className="w-3 h-3 rounded-full border"
                                        style={{ backgroundColor: preset.background }}
                                    />
                                </div>
                                <span>{preset.name}</span>
                            </button>
                        ))}
                        {(primaryColor !== '#6366f1' || backgroundColor !== '#ffffff' || textColor !== '#1f2937') && (
                            <button
                                onClick={() => {
                                    setPrimaryColor('#6366f1');
                                    setBackgroundColor('#ffffff');
                                    setTextColor('#1f2937');
                                    setIsTextColorCustomized(false); // 🎯 Reset anche la personalizzazione
                                    onStyleChange(buildStyleObject('#6366f1', '#ffffff', '#1f2937'));
                                }}
                                className="flex items-center space-x-2 px-3 py-2 text-sm border border-orange-300 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors"
                                title="Ripristina colori di default"
                            >
                                <span>🔄 Reset</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Anteprima Colori */}
                <div className="mt-4 p-3 rounded-lg border-2"
                    style={{
                        backgroundColor: backgroundColor,
                        borderColor: primaryColor,
                        color: textColor
                    }}>
                    <div className="text-sm font-medium" style={{ color: textColor }}>
                        🎨 Anteprima Colori
                    </div>
                    <div className="mt-2">
                        <button
                            className="px-4 py-2 rounded text-white text-sm font-medium"
                            style={{ backgroundColor: primaryColor }}
                        >
                            Pulsante di Esempio
                        </button>
                    </div>
                </div>
            </div>

            {/* 📝 Sezione Modifica Campi */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Modifica Campi Form</h3>
                    <button
                        onClick={addNewField}
                        className="flex items-center space-x-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span>Aggiungi Campo</span>
                    </button>
                </div>

                <div className="space-y-3">
                    {fields.map((field, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg border">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Etichetta
                                    </label>
                                    <input
                                        type="text"
                                        value={field.label}
                                        onChange={(e) => updateField(index, { label: e.target.value })}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Nome (ID)
                                    </label>
                                    <input
                                        type="text"
                                        value={field.name}
                                        onChange={(e) => updateField(index, { name: e.target.value })}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Tipo
                                    </label>
                                    <select
                                        value={field.type}
                                        onChange={(e) => updateField(index, { type: e.target.value as FormField['type'] })}
                                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                                    >
                                        <option value="text">Testo</option>
                                        <option value="email">Email</option>
                                        <option value="tel">Telefono</option>
                                        <option value="textarea">Area Testo</option>
                                        <option value="select">Select</option>
                                        <option value="checkbox">Checkbox</option>
                                        <option value="radio">Radio</option>
                                        <option value="number">Numero</option>
                                        <option value="date">Data</option>
                                        <option value="url">URL</option>
                                    </select>
                                </div>

                                <div className="flex items-end space-x-2">
                                    <label className="flex items-center text-xs">
                                        <input
                                            type="checkbox"
                                            checked={field.required}
                                            onChange={(e) => updateField(index, { required: e.target.checked })}
                                            className="mr-1 h-3 w-3 text-indigo-600"
                                        />
                                        Obbligatorio
                                    </label>
                                    <button
                                        onClick={() => removeField(index)}
                                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                                        title="Elimina campo"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Descrizione campo */}
                            <div className="mt-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Descrizione / Placeholder
                                </label>
                                <input
                                    type="text"
                                    value={field.description || ''}
                                    onChange={(e) => updateField(index, { description: e.target.value })}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                                    placeholder="Testo di aiuto per l'utente"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 🔒 Sezione Privacy Policy */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-3">Configurazione Privacy</h3>
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        URL Privacy Policy
                    </label>
                    <input
                        type="url"
                        value={privacyPolicyUrl}
                        onChange={(e) => onPrivacyPolicyChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="https://tuosito.com/privacy-policy"
                    />
                    <p className="text-xs text-gray-600">
                        Se specificato, verrà aggiunto automaticamente un checkbox per l&apos;accettazione della privacy policy.
                    </p>
                </div>
            </div>

            {/* 📊 Debug Info */}
            <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
                <strong>🔍 Debug Info:</strong> Campi: {fields.length} |
                Colore Primario: {primaryColor} |
                Colore Sfondo: {backgroundColor} |
                Privacy URL: {privacyPolicyUrl ? '✅' : '❌'}
            </div>
        </div>
    );
};
