import React, { useState } from 'react';
import { FormField, FormStyle } from '../types';
import { CogIcon, PencilIcon, PlusIcon, TrashIcon } from './ui/icons';

// SwatchIcon component inline
const SwatchIcon = ({ className }: { className?: string }) => (
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
      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM7 3v18m8-14h4a2 2 0 012 2v6a2 2 0 01-2 2h-4"
    />
  </svg>
);

interface PostAIEditorProps {
  fields: FormField[];
  onFieldsChange: (fields: FormField[]) => void;
  style?: FormStyle;
  onStyleChange?: (style: FormStyle) => void;
  privacyPolicyUrl?: string;
  onPrivacyPolicyChange?: (url: string) => void;
}

export const PostAIEditor: React.FC<PostAIEditorProps> = ({
  fields,
  onFieldsChange,
  style,
  onStyleChange,
  privacyPolicyUrl = '',
  onPrivacyPolicyChange,
}) => {
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(
    null
  );
  const [showStyleEditor, setShowStyleEditor] = useState(false);
  const [showPrivacyEditor, setShowPrivacyEditor] = useState(false);

  // Default style
  const defaultStyle: FormStyle = {
    primary_color: '#6366f1',
    secondary_color: '#f3f4f6',
    background_color: '#ffffff',
    text_color: '#1f2937',
    font_family: 'Inter, sans-serif',
    border_radius: 8,
    spacing: 'normal',
    button_style: 'solid',
  };

  const currentStyle = style || defaultStyle;

  const updateField = (index: number, updates: Partial<FormField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    onFieldsChange(newFields);
  };

  const addField = () => {
    const newField: FormField = {
      name: `campo_${fields.length + 1}`,
      label: 'Nuovo Campo',
      type: 'text',
      required: false,
    };
    onFieldsChange([...fields, newField]);
  };

  const removeField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    onFieldsChange(newFields);
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    const newFields = [...fields];
    const [removed] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, removed);
    onFieldsChange(newFields);
  };

  const addPrivacyField = () => {
    const privacyField: FormField = {
      name: 'privacy_policy',
      label: `Accetto la <a href="${privacyPolicyUrl || '#'}" target="_blank" class="text-blue-600 underline">Privacy Policy</a>`,
      type: 'checkbox',
      required: true,
      privacy_link: privacyPolicyUrl,
      privacy_text: 'Privacy Policy',
    };
    onFieldsChange([...fields, privacyField]);
  };

  const FieldEditor: React.FC<{ field: FormField; index: number }> = ({
    field,
    index,
  }) => (
    <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Nome Campo
            </label>
            <input
              type="text"
              value={field.name}
              onChange={e => updateField(index, { name: e.target.value })}
              className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Tipo
            </label>
            <select
              value={field.type}
              onChange={e =>
                updateField(index, {
                  type: e.target.value as FormField['type'],
                })
              }
              className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="text">Testo</option>
              <option value="email">Email</option>
              <option value="tel">Telefono</option>
              <option value="textarea">Area di Testo</option>
              <option value="checkbox">Checkbox</option>
              <option value="select">Select</option>
              <option value="url">URL</option>
              <option value="date">Data</option>
              <option value="rating">Rating</option>
              <option value="file">File Upload</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700">
            Etichetta
          </label>
          <input
            type="text"
            value={field.label}
            onChange={e => updateField(index, { label: e.target.value })}
            className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {field.type === 'select' && (
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Opzioni (una per riga)
            </label>
            <textarea
              value={field.options?.join('\n') || ''}
              onChange={e =>
                updateField(index, {
                  options: e.target.value.split('\n').filter(opt => opt.trim()),
                })
              }
              rows={3}
              className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Opzione 1&#10;Opzione 2&#10;Opzione 3"
            />
          </div>
        )}

        {field.type === 'checkbox' && field.name.includes('privacy') && (
          <div>
            <label className="block text-xs font-medium text-gray-700">
              Link Privacy Policy
            </label>
            <input
              type="url"
              value={field.privacy_link || ''}
              onChange={e =>
                updateField(index, {
                  privacy_link: e.target.value,
                  label: `Accetto la <a href="${e.target.value}" target="_blank" class="text-blue-600 underline">Privacy Policy</a>`,
                })
              }
              className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="https://tuosito.com/privacy"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-700">
            Descrizione/Help
          </label>
          <input
            type="text"
            value={field.description || ''}
            onChange={e => updateField(index, { description: e.target.value })}
            className="mt-1 block w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Testo di aiuto per l'utente"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={field.required}
              onChange={e => updateField(index, { required: e.target.checked })}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <span className="text-xs font-medium text-gray-700">
              Obbligatorio
            </span>
          </label>

          <div className="flex space-x-2">
            <button
              onClick={() => moveField(index, Math.max(0, index - 1))}
              disabled={index === 0}
              className="text-xs text-gray-500 hover:text-primary disabled:opacity-50"
            >
              ↑
            </button>
            <button
              onClick={() =>
                moveField(index, Math.min(fields.length - 1, index + 1))
              }
              disabled={index === fields.length - 1}
              className="text-xs text-gray-500 hover:text-primary disabled:opacity-50"
            >
              ↓
            </button>
            <button
              onClick={() => removeField(index)}
              className="text-xs text-red-500 hover:text-red-700"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const StyleEditor: React.FC = () => (
    <div className="bg-white p-4 rounded-lg border space-y-4">
      <h4 className="font-medium text-gray-900 flex items-center">
        <SwatchIcon className="w-5 h-5 mr-2" />
        Personalizza Stile
      </h4>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700">
            Colore Primario
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={currentStyle.primary_color}
              onChange={e =>
                onStyleChange?.({
                  ...currentStyle,
                  primary_color: e.target.value,
                })
              }
              className="w-8 h-8 rounded border"
            />
            <input
              type="text"
              value={currentStyle.primary_color}
              onChange={e =>
                onStyleChange?.({
                  ...currentStyle,
                  primary_color: e.target.value,
                })
              }
              className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700">
            Colore Sfondo
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={currentStyle.background_color}
              onChange={e =>
                onStyleChange?.({
                  ...currentStyle,
                  background_color: e.target.value,
                })
              }
              className="w-8 h-8 rounded border"
            />
            <input
              type="text"
              value={currentStyle.background_color}
              onChange={e =>
                onStyleChange?.({
                  ...currentStyle,
                  background_color: e.target.value,
                })
              }
              className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700">
            Font
          </label>
          <select
            value={currentStyle.font_family}
            onChange={e =>
              onStyleChange?.({ ...currentStyle, font_family: e.target.value })
            }
            className="mt-1 block w-full px-2 py-1 text-xs border border-gray-300 rounded"
          >
            <option value="Inter, sans-serif">Inter</option>
            <option value="system-ui, sans-serif">System</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="'Courier New', monospace">Courier</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700">
            Spaziatura
          </label>
          <select
            value={currentStyle.spacing}
            onChange={e =>
              onStyleChange?.({
                ...currentStyle,
                spacing: e.target.value as FormStyle['spacing'],
              })
            }
            className="mt-1 block w-full px-2 py-1 text-xs border border-gray-300 rounded"
          >
            <option value="compact">Compatta</option>
            <option value="normal">Normale</option>
            <option value="spacious">Spaziosa</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700">
          Arrotondamento Bordi
        </label>
        <input
          type="range"
          min="0"
          max="20"
          value={currentStyle.border_radius}
          onChange={e =>
            onStyleChange?.({
              ...currentStyle,
              border_radius: parseInt(e.target.value),
            })
          }
          className="w-full"
        />
        <span className="text-xs text-gray-500">
          {currentStyle.border_radius}px
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center space-x-2">
          <button
            onClick={addField}
            className="flex items-center space-x-1 text-sm bg-primary text-white px-3 py-1 rounded hover:bg-indigo-700"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Aggiungi Campo</span>
          </button>

          <button
            onClick={addPrivacyField}
            className="flex items-center space-x-1 text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          >
            <CogIcon className="w-4 h-4" />
            <span>Privacy Policy</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPrivacyEditor(!showPrivacyEditor)}
            className="text-sm text-gray-600 hover:text-primary"
          >
            Privacy Settings
          </button>

          <button
            onClick={() => setShowStyleEditor(!showStyleEditor)}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-primary"
          >
            <SwatchIcon className="w-4 h-4" />
            <span>Stile</span>
          </button>
        </div>
      </div>

      {/* Privacy Settings */}
      {showPrivacyEditor && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-3">
            Impostazioni Privacy
          </h4>
          <div>
            <label className="block text-sm font-medium text-blue-800">
              URL Privacy Policy
            </label>
            <input
              type="url"
              value={privacyPolicyUrl}
              onChange={e => onPrivacyPolicyChange?.(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-blue-300 rounded-md"
              placeholder="https://tuosito.com/privacy-policy"
            />
            <p className="mt-1 text-xs text-blue-600">
              Questo URL sarà usato automaticamente nei campi privacy
            </p>
          </div>
        </div>
      )}

      {/* Style Editor */}
      {showStyleEditor && <StyleEditor />}

      {/* Fields Editor */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Campi del Form</h4>

        {fields.map((field, index) => (
          <div key={`${field.name}-${index}`} className="group">
            <div className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">{field.label}</span>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                    {field.type}
                  </span>
                  {field.required && (
                    <span className="text-xs text-red-500">*</span>
                  )}
                </div>
                {field.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {field.description}
                  </p>
                )}
              </div>

              <button
                onClick={() =>
                  setEditingFieldIndex(
                    editingFieldIndex === index ? null : index
                  )
                }
                className="p-2 text-gray-400 hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>

            {editingFieldIndex === index && (
              <div className="mt-2">
                <FieldEditor field={field} index={index} />
              </div>
            )}
          </div>
        ))}

        {fields.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Nessun campo presente. Aggiungi il primo campo!</p>
          </div>
        )}
      </div>
    </div>
  );
};
