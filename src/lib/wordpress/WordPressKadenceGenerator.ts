/**
 * 🎯 WORDPRESS KADENCE THEME GENERATOR - ENGINEERING FELLOW LEVEL 5
 * ================================================================
 * Complete embed code generator for WordPress with Kadence theme compatibility
 * Responsive design, custom styling, and seamless integration
 */

export interface FormField {
  name: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'number';
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: Record<string, unknown>;
  description?: string;
  options?: string[];
}

export interface WordPressEmbedOptions {
  theme: 'kadence' | 'astra' | 'generatepress' | 'custom';
  style: 'modern' | 'classic' | 'minimal' | 'corporate';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    border: string;
  };
  spacing: 'compact' | 'normal' | 'spacious';
  buttonStyle: 'filled' | 'outlined' | 'gradient';
  animation: boolean;
  responsive: boolean;
}

/**
 * WordPress Kadence Theme Integration Generator
 */
export class WordPressKadenceGenerator {
  private formFields: FormField[];
  private options: WordPressEmbedOptions;
  private formId: string;
  private organizationId: string;
  private privacyUrl?: string; // ✅ NUOVO: Privacy Policy URL

  constructor(formFields: FormField[], options: Partial<WordPressEmbedOptions> = {}, privacyUrl?: string) {
    this.formFields = formFields;
    this.formId = `form-${Date.now()}`;
    this.organizationId = 'wordpress-integration';
    this.privacyUrl = privacyUrl; // ✅ Store privacy URL
    
    // Default Kadence-optimized settings
    this.options = {
      theme: 'kadence',
      style: 'modern',
      colors: {
        primary: '#0073aa',
        secondary: '#005177',
        background: '#ffffff',
        text: '#333333',
        border: '#ddd'
      },
      spacing: 'normal',
      buttonStyle: 'filled',
      animation: true,
      responsive: true,
      ...options
    };
  }

  /**
   * Generate Complete WordPress Embed Code
   */
  generateCompleteEmbedCode(): {
    html: string;
    css: string;
    javascript: string;
    instructions: string;
    shortcode: string;
  } {
    const html = this.generateHTML();
    const css = this.generateCSS();
    const javascript = this.generateJavaScript();
    const instructions = this.generateInstructions();
    const shortcode = this.generateShortcode();

    return {
      html,
      css,
      javascript,
      instructions,
      shortcode
    };
  }

  /**
   * Generate Kadence-Optimized HTML
   */
  private generateHTML(): string {
    const fieldsHTML = this.formFields.map(field => this.generateFieldHTML(field)).join('\n');

    // ✅ NUOVO: Privacy checkbox se URL presente
    const privacyHTML = this.privacyUrl ? `
      <div class="formmaster-field-group formmaster-privacy">
        <label class="formmaster-checkbox-label">
          <input type="checkbox" name="privacy_consent" required class="formmaster-checkbox">
          <span>Accetto la <a href="${this.privacyUrl}" target="_blank" rel="noopener noreferrer" class="formmaster-privacy-link">Privacy Policy</a> e acconsento al trattamento dei miei dati personali. *</span>
        </label>
      </div>
    ` : '';

    return `<!-- FormMaster - WordPress Kadence Integration -->
<div class="formmaster-kadence-wrapper" id="${this.formId}-wrapper">
  <form class="formmaster-form kadence-form" id="${this.formId}" method="POST" action="#" data-kadence-form>
    <div class="formmaster-header">
      <h3 class="formmaster-title">Contattaci</h3>
      <p class="formmaster-description">Compila il form per ricevere informazioni</p>
    </div>
    
    <div class="formmaster-fields">
${fieldsHTML}
    </div>
    
${privacyHTML}
    
    <div class="formmaster-actions">
      <button type="submit" class="formmaster-submit kadence-button">
        <span class="button-text">Invia Richiesta</span>
        <span class="button-loader" style="display: none;">
          <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"/>
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
        </span>
      </button>
    </div>
    
    <div class="formmaster-messages">
      <div class="success-message" style="display: none;">
        <p>✅ Messaggio inviato con successo! Ti risponderemo presto.</p>
      </div>
      <div class="error-message" style="display: none;">
        <p>❌ Si è verificato un errore. Riprova o contattaci direttamente.</p>
      </div>
    </div>
  </form>
</div>`;
  }

  /**
   * Generate Individual Field HTML
   */
  private generateFieldHTML(field: FormField): string {
    const fieldId = `${this.formId}-${field.name}`;
    const requiredAttr = field.required ? 'required' : '';
    const requiredMark = field.required ? '<span class="required">*</span>' : '';

    let inputHTML = '';

    switch (field.type) {
      case 'textarea':
        inputHTML = `<textarea 
          class="formmaster-input kadence-textarea" 
          id="${fieldId}" 
          name="${field.name}" 
          placeholder="${field.placeholder || ''}" 
          ${requiredAttr}
          rows="4"
        ></textarea>`;
        break;

      case 'select': {
        const options = field.options?.map(option => 
          `<option value="${option}">${option}</option>`
        ).join('\n        ') || '';
        inputHTML = `<select 
          class="formmaster-input kadence-select" 
          id="${fieldId}" 
          name="${field.name}" 
          ${requiredAttr}
        >
          <option value="">Seleziona...</option>
          ${options}
        </select>`;
        break;
      }

      default:
        inputHTML = `<input 
          class="formmaster-input kadence-input" 
          type="${field.type}" 
          id="${fieldId}" 
          name="${field.name}" 
          placeholder="${field.placeholder || ''}" 
          ${requiredAttr}
        />`;
    }

    return `      <div class="formmaster-field kadence-field">
        <label class="formmaster-label kadence-label" for="${fieldId}">
          ${field.label} ${requiredMark}
        </label>
        ${inputHTML}
        ${field.description ? `<small class="formmaster-help">${field.description}</small>` : ''}
      </div>`;
  }

  /**
   * Generate Kadence-Compatible CSS
   */
  private generateCSS(): string {
    const { colors, spacing, buttonStyle } = this.options;
    
    const spacingMap = {
      compact: { field: '0.75rem', padding: '0.5rem' },
      normal: { field: '1rem', padding: '0.75rem' },
      spacious: { field: '1.5rem', padding: '1rem' }
    };
    
    const currentSpacing = spacingMap[spacing];

    return `/* FormMaster - Kadence Theme Integration CSS */
.formmaster-kadence-wrapper {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background: ${colors.background};
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  font-family: inherit;
}

.formmaster-header {
  text-align: center;
  margin-bottom: 2rem;
}

.formmaster-title {
  color: ${colors.primary};
  font-size: 1.875rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  line-height: 1.2;
}

.formmaster-description {
  color: ${colors.text};
  font-size: 1.125rem;
  margin: 0;
  opacity: 0.8;
}

.formmaster-fields {
  display: flex;
  flex-direction: column;
  gap: ${currentSpacing.field};
}

.formmaster-field {
  display: flex;
  flex-direction: column;
}

.formmaster-label {
  color: ${colors.text};
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

.formmaster-label .required {
  color: #dc2626;
  margin-left: 0.25rem;
}

.formmaster-input {
  padding: ${currentSpacing.padding};
  border: 2px solid ${colors.border};
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: ${colors.background};
  color: ${colors.text};
}

.formmaster-input:focus {
  outline: none;
  border-color: ${colors.primary};
  box-shadow: 0 0 0 3px rgba(0, 115, 170, 0.1);
}

.kadence-textarea {
  resize: vertical;
  min-height: 100px;
}

.formmaster-help {
  color: ${colors.text};
  opacity: 0.7;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.formmaster-actions {
  margin-top: 2rem;
  text-align: center;
}

.formmaster-submit {
  background: ${buttonStyle === 'gradient' 
    ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})` 
    : colors.primary};
  color: white;
  border: ${buttonStyle === 'outlined' ? `2px solid ${colors.primary}` : 'none'};
  background: ${buttonStyle === 'outlined' ? 'transparent' : colors.primary};
  color: ${buttonStyle === 'outlined' ? colors.primary : 'white'};
  padding: 1rem 2rem;
  border-radius: 6px;
  font-size: 1.125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 180px;
  justify-content: center;
}

.formmaster-submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 115, 170, 0.3);
  background: ${buttonStyle === 'outlined' ? colors.primary : colors.secondary};
  color: white;
}

.formmaster-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.formmaster-messages {
  margin-top: 1rem;
}

.success-message, .error-message {
  padding: 1rem;
  border-radius: 6px;
  margin-top: 1rem;
}

.success-message {
  background: #dcfce7;
  border: 1px solid #16a34a;
  color: #15803d;
}

.error-message {
  background: #fef2f2;
  border: 1px solid #dc2626;
  color: #dc2626;
}

/* Kadence Theme Compatibility */
.kadence-form .formmaster-input {
  font-family: inherit;
}

.kadence-button {
  font-family: inherit;
}

/* Responsive Design */
@media (max-width: 768px) {
  .formmaster-kadence-wrapper {
    padding: 1rem;
    margin: 1rem;
  }
  
  .formmaster-title {
    font-size: 1.5rem;
  }
  
  .formmaster-submit {
    width: 100%;
    padding: 1rem;
  }
}

/* Animation Styles */
${this.options.animation ? `
.formmaster-field {
  animation: fadeInUp 0.6s ease-out;
}

.formmaster-field:nth-child(2) { animation-delay: 0.1s; }
.formmaster-field:nth-child(3) { animation-delay: 0.2s; }
.formmaster-field:nth-child(4) { animation-delay: 0.3s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
` : ''}`;
  }

  /**
   * Generate JavaScript for Form Functionality
   */
  private generateJavaScript(): string {
    return `/* FormMaster - WordPress Integration JavaScript */
(function() {
  'use strict';
  
  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    initializeFormMaster('${this.formId}');
  });
  
  function initializeFormMaster(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const submitButton = form.querySelector('.formmaster-submit');
    const buttonText = submitButton.querySelector('.button-text');
    const buttonLoader = submitButton.querySelector('.button-loader');
    const successMessage = form.querySelector('.success-message');
    const errorMessage = form.querySelector('.error-message');
    
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Show loading state
      submitButton.disabled = true;
      buttonText.style.display = 'none';
      buttonLoader.style.display = 'inline-flex';
      hideMessages();
      
      try {
        // Collect form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        // Send to FormMaster API
        const response = await fetch('https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/submit-form', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg0Njk1NzYsImV4cCI6MjA0NDA0NTU3Nn0.Z2Cv3vfCOBDmtSjXnQP8cKJrD4Uc2BEn7qHj6dcNhUs'
          },
          body: JSON.stringify({
            form_id: formId,
            data: data,
            source: 'wordpress-kadence'
          })
        });
        
        if (response.ok) {
          showSuccessMessage();
          form.reset();
        } else {
          throw new Error('Submission failed');
        }
        
      } catch (error) {
        console.error('Form submission error:', error);
        showErrorMessage();
      } finally {
        // Reset button state
        submitButton.disabled = false;
        buttonText.style.display = 'inline';
        buttonLoader.style.display = 'none';
      }
    });
    
    function showSuccessMessage() {
      successMessage.style.display = 'block';
      successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    function showErrorMessage() {
      errorMessage.style.display = 'block';
      errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    function hideMessages() {
      successMessage.style.display = 'none';
      errorMessage.style.display = 'none';
    }
  }
})();`;
  }

  /**
   * Generate WordPress Shortcode
   */
  private generateShortcode(): string {
    return `[formmaster_embed id="${this.formId}" theme="kadence" style="${this.options.style}"]`;
  }

  /**
   * Generate Installation Instructions
   */
  private generateInstructions(): string {
    return `# 🎯 FORMMASTER WORDPRESS INTEGRATION - ISTRUZIONI
## Installazione per Tema Kadence

### METODO 1: Shortcode (Raccomandato)
1. Copia questo shortcode nel tuo editor WordPress:
   \`${this.generateShortcode()}\`

2. Il form apparirà automaticamente con lo stile Kadence!

### METODO 2: HTML Personalizzato
1. **Aggiungi il CSS al tuo tema:**
   - Vai su **Aspetto > Personalizza > CSS Aggiuntivo**
   - Incolla il CSS fornito

2. **Aggiungi il JavaScript:**
   - Installa il plugin "Insert Headers and Footers"
   - Incolla il JavaScript nel footer

3. **Inserisci il form:**
   - Usa un blocco HTML personalizzato
   - Incolla il codice HTML fornito

### METODO 3: Plugin Functions.php
\`\`\`php
// Aggiungi al functions.php del tuo tema
function enqueue_formmaster_assets() {
    wp_enqueue_style('formmaster-kadence', get_template_directory_uri() . '/css/formmaster.css');
    wp_enqueue_script('formmaster-kadence', get_template_directory_uri() . '/js/formmaster.js', array(), '1.0', true);
}
add_action('wp_enqueue_scripts', 'enqueue_formmaster_assets');
\`\`\`

### 🎨 PERSONALIZZAZIONE
- **Colori:** Modifica le variabili CSS per adattarle al tuo brand
- **Dimensioni:** Regola padding e margin secondo le tue preferenze  
- **Animazioni:** Disabilita/abilita nella sezione animation del CSS

### 📱 COMPATIBILITÀ
✅ Responsive design ottimizzato per mobile
✅ Compatibile con Kadence, Astra, GeneratePress
✅ Testato con WordPress 6.0+
✅ Performance ottimizzate per Core Web Vitals

### 🔧 SUPPORTO
Per assistenza tecnica o personalizzazioni avanzate, 
contatta il team FormMaster all'indirizzo: support@formmaster.ai`;
  }

  /**
   * Generate Kadence Block Pattern
   */
  generateKadenceBlockPattern(): string {
    return `<!-- wp:group {"className":"formmaster-kadence-pattern"} -->
<div class="wp-block-group formmaster-kadence-pattern">
<!-- wp:heading {"textAlign":"center","level":3,"style":{"color":{"text":"${this.options.colors.primary}"}}} -->
<h3 class="wp-block-heading has-text-align-center" style="color:${this.options.colors.primary}">Contattaci</h3>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"center"} -->
<p class="has-text-align-center">Compila il form per ricevere informazioni</p>
<!-- /wp:paragraph -->

<!-- wp:html -->
${this.generateHTML()}
<!-- /wp:html -->
</div>
<!-- /wp:group -->`;
  }
}

/**
 * Factory Functions for Easy Usage
 */
export function generateKadenceForm(fields: FormField[], options?: Partial<WordPressEmbedOptions>, privacyUrl?: string) {
  const generator = new WordPressKadenceGenerator(fields, options, privacyUrl);
  return generator.generateCompleteEmbedCode();
}

export function generateKadenceBlockPattern(fields: FormField[], options?: Partial<WordPressEmbedOptions>, privacyUrl?: string) {
  const generator = new WordPressKadenceGenerator(fields, options, privacyUrl);
  return generator.generateKadenceBlockPattern();
}