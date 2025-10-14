import React, { useCallback, useEffect, useMemo, useState } from 'react';
// FIX: Corrected the import for useOutletContext from 'react-router-dom' to resolve module export errors.
import { toast } from 'react-hot-toast';
import { useLocation, useOutletContext } from 'react-router-dom';

import { useCrmData } from '../hooks/useCrmData';
import { invokeSupabaseFunction } from '../lib/api';
import { countryCodes } from '../lib/countryCodes'; // Importiamo la lista
import { supabase } from '../lib/supabaseClient';
import { Contact, PipelineStage } from '../types';
import { UniversalAIChat } from './ai/UniversalAIChat';
import ContactSearch, { FilterState } from './contacts/ContactSearch';
import ContactsTable from './contacts/ContactsTable';

import { diagnosticLogger } from '../lib/mockDiagnosticLogger';
import { InputValidator, SecureLogger } from '../lib/security/securityUtils';
import { filterContacts } from '../utils/contactFilters';
import { ContactEventsList } from './ContactEventsList'; // Importa il nuovo componente
import ContactDetailModal from './contacts/ContactDetailModal';
import { CreateEventModal } from './CreateEventModal';
import { SparklesIcon, WhatsAppIcon } from './ui/icons';
import { Modal } from './ui/Modal';

// Error interface for proper typing
interface ApiError {
    message: string;
    status?: number;
    code?: string;
}
// FIX: Corrected import path for CreateEventModal.
// FIX: Corrected import path for ContactEventsList.


// Definiamo un tipo per i dati del form per maggiore chiarezza e sicurezza.
// Ora include phonePrefix e phoneNumber invece di un unico campo 'phone'.
type ContactFormData = {
    name: string;
    email: string;
    company: string;
    phonePrefix: string;
    phoneNumber: string;
};

// Stato iniziale per il form di aggiunta/modifica contatto.
const initialFormState: ContactFormData = {
    name: '',
    email: '',
    company: '',
    phonePrefix: '+39', // Default su Italia
    phoneNumber: '',
};

// Tipo per il form deal creation 
type DealFormData = {
    contact_name: string;
    value: number;
    assigned_to: string;
    close_date: string;
    stage: PipelineStage;
};

const initialDealFormState: DealFormData = {
    contact_name: '',
    value: 0,
    assigned_to: '',
    close_date: new Date().toISOString().split('T')[0],
    stage: PipelineStage.NewLead,
};

// Funzione helper per dividere un numero di telefono completo
const splitPhoneNumber = (fullPhone: string): { prefix: string; number: string } => {
    if (!fullPhone) {
        return { prefix: '+39', number: '' };
    }
    // Cerca il prefisso più lungo che corrisponde all'inizio del numero
    const bestMatch = countryCodes.find(code => fullPhone.startsWith(code.dial_code));

    if (bestMatch) {
        return {
            prefix: bestMatch.dial_code,
            number: fullPhone.substring(bestMatch.dial_code.length),
        };
    }

    // Fallback se nessun prefisso noto viene trovato
    if (fullPhone.startsWith('+')) {
        // Supponiamo un prefisso di 2 cifre dopo il + come fallback generico
        const prefix = fullPhone.substring(0, 3);
        const number = fullPhone.substring(3);
        // Controlla se il prefisso trovato è valido, altrimenti default
        if (countryCodes.some(c => c.dial_code === prefix)) {
            return { prefix, number };
        }
    }

    return { prefix: '+39', number: fullPhone }; // Default finale
};


export const Contacts: React.FC = () => {
    console.log('👥 Contacts component is rendering');
    const { contacts, organization, crmEvents, refetch, isCalendarLinked } = useOutletContext<ReturnType<typeof useCrmData>>();
    const location = useLocation();
    console.log('👥 Contacts data:', { contacts, organization, crmEvents, isCalendarLinked });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
    const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
    const [isViewEventsModalOpen, setIsViewEventsModalOpen] = useState(false);
    const [isViewContactModalOpen, setIsViewContactModalOpen] = useState(false);
    const [isCreateDealModalOpen, setIsCreateDealModalOpen] = useState(false);


    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [formData, setFormData] = useState<ContactFormData>(initialFormState);
    const [dealFormData, setDealFormData] = useState<DealFormData>(initialDealFormState);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const [aiPrompt, setAiPrompt] = useState('');
    const [generatedContent, setGeneratedContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Search and filter state
    const [searchTerm, setSearchTerm] = useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('q') || '';
    });
    const [filters, setFilters] = useState<FilterState>(() => {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            hasEmail: urlParams.get('hasEmail') === 'true',
            hasPhone: urlParams.get('hasPhone') === 'true',
            hasCompany: urlParams.get('hasCompany') === 'true',
            recent: urlParams.get('recent') === 'true',
        };
    });

    // Apply filters to contacts
    const filteredContacts = useMemo(() => {
        return filterContacts(contacts, searchTerm, filters);
    }, [contacts, searchTerm, filters]);

    // âš¡ Performance: Memoized handlers to prevent unnecessary re-renders
    const handleOpenAddModal = useCallback(() => {
        setModalMode('add');
        setFormData(initialFormState);
        setSelectedContact(null);
        setIsModalOpen(true);
    }, []);

    const handleOpenEditModal = useCallback((contact: Contact) => {
        setModalMode('edit');
        setSelectedContact(contact);
        // **FIX CRITICO**: Usiamo la funzione helper per dividere il numero
        const { prefix, number } = splitPhoneNumber(contact.phone);
        setFormData({
            name: contact.name,
            email: contact.email,
            company: contact.company,
            phonePrefix: prefix,
            phoneNumber: number,
        });
        setIsModalOpen(true);
    }, []);

    const handleOpenDeleteModal = useCallback((contact: Contact) => {
        setSelectedContact(contact);
        setIsDeleteModalOpen(true);
    }, []);

    const handleOpenEmailModal = useCallback((contact: Contact) => {
        setSelectedContact(contact);
        setAiPrompt('');
        setGeneratedContent('');
        setIsEmailModalOpen(true);
    }, []);

    const handleOpenWhatsAppModal = useCallback((contact: Contact) => {
        setSelectedContact(contact);
        setAiPrompt('');
        setGeneratedContent('');
        setIsWhatsAppModalOpen(true);
    }, []);

    const handleOpenCreateEventModal = useCallback((contact: Contact) => {
        setSelectedContact(contact);
        setIsCreateEventModalOpen(true);
    }, []);

    const handleOpenViewEventsModal = useCallback((contact: Contact) => {
        setSelectedContact(contact);
        setIsViewEventsModalOpen(true);
    }, []);

    const handleOpenViewContactModal = useCallback((contact: Contact) => {
        setSelectedContact(contact);
        setIsViewContactModalOpen(true);
    }, []);

    const handleOpenCreateDealModal = useCallback((contact: Contact) => {
        setSelectedContact(contact);
        setDealFormData({
            ...initialDealFormState,
            contact_name: contact.name,
        });
        setIsCreateDealModalOpen(true);
    }, []);

    // Performance: Stats computation removed to eliminate unused variable warning

    // Sorted contacts logic removed to eliminate unused variable warning

    const handleCloseModals = useCallback(() => {
        setIsModalOpen(false);
        setIsDeleteModalOpen(false);
        setIsEmailModalOpen(false);
        setIsWhatsAppModalOpen(false);
        setIsCreateEventModalOpen(false);
        setIsViewEventsModalOpen(false);
        setIsViewContactModalOpen(false);
        setIsCreateDealModalOpen(false);
        setSelectedContact(null);
    }, []);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // Different sanitization for different fields
        let sanitizedValue: string;
        
        if (name === 'company') {
            // For company names, preserve spaces and common business punctuation
            // Only remove the most dangerous XSS vectors
            sanitizedValue = value
                .replace(/[<>]/g, '') // Remove HTML tags
                .replace(/javascript:/gi, '') // Remove javascript: schemes
                .replace(/on\w+=/gi, '') // Remove event handlers
                .slice(0, 200); // Reasonable company name length limit
        } else {
            // Use standard sanitization for other fields
            sanitizedValue = InputValidator.sanitizeString(value);
        }

        // Additional validation for specific fields
        if (name === 'email' && sanitizedValue && !InputValidator.isValidEmail(sanitizedValue)) {
            SecureLogger.warn('contacts', 'Invalid email format entered', { field: name });
            // Still allow input but log suspicious activity
        }

        if (name === 'phoneNumber' && sanitizedValue && !InputValidator.isValidPhone(`${formData.phonePrefix}${sanitizedValue}`)) {
            SecureLogger.warn('contacts', 'Invalid phone format entered', { field: name });
        }

        setFormData(prev => ({ ...prev, [name]: sanitizedValue }));
    };

    const handleSaveContact = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        if (!organization) {
            toast.error("Informazioni sull'organizzazione non disponibili.");
            setIsSaving(false);
            return;
        }

        try {
            // Additional validation before saving
            if (formData.email && !InputValidator.isValidEmail(formData.email)) {
                throw new Error('Formato email non valido');
            }

            // Validate and sanitize all form fields
            const sanitizedFormData = {
                name: InputValidator.sanitizeString(formData.name),
                email: InputValidator.sanitizeString(formData.email),
                company: InputValidator.sanitizeString(formData.company),
                phonePrefix: InputValidator.sanitizeString(formData.phonePrefix),
                phoneNumber: InputValidator.sanitizeString(formData.phoneNumber)
            };

            let successMessage = '';
            // Ricostruiamo il numero di telefono completo prima di salvarlo
            const fullPhoneNumber = `${sanitizedFormData.phonePrefix}${sanitizedFormData.phoneNumber}`;

            // Final phone validation
            if (fullPhoneNumber.length > 3 && !InputValidator.isValidPhone(fullPhoneNumber)) {
                throw new Error('Formato telefono non valido');
            }

            SecureLogger.info('contacts', 'Contact save operation initiated', {
                isEditing: !!selectedContact,
                organizationId: organization.id,
                hasEmail: !!sanitizedFormData.email,
                hasPhone: !!sanitizedFormData.phoneNumber
            });

            // Prepariamo i dati da salvare, escludendo i campi separati del telefono
            const dataToSave = {
                name: sanitizedFormData.name,
                email: sanitizedFormData.email,
                company: sanitizedFormData.company,
                phone: fullPhoneNumber,
                organization_id: organization.id,
            };

            if (modalMode === 'edit' && selectedContact) {
                const { error } = await supabase.from('contacts').update(dataToSave).eq('id', selectedContact.id);
                if (error) { throw error; }
                successMessage = 'Contatto aggiornato!';
            } else {
                const { error } = await supabase.from('contacts').insert(dataToSave);
                if (error) { throw error; }
                successMessage = 'Contatto creato!';
            }
            refetch();
            handleCloseModals();
            toast.success(successMessage);
        } catch (err: unknown) {
            const error = err as ApiError;
            toast.error(`Errore: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteContact = async () => {
        if (!selectedContact) { return; }
        setIsSaving(true);
        try {
            const { error } = await supabase.from('contacts').delete().eq('id', selectedContact.id);
            if (error) { throw error; }
            refetch();
            handleCloseModals();
            toast.success('Contatto eliminato.');
        } catch (err: unknown) {
            const error = err as ApiError;
            toast.error(`Errore: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateEmail = async () => {
        if (!aiPrompt || !selectedContact) { return; }
        setIsGenerating(true);
        setGeneratedContent('');
        const toastId = toast.loading('Generazione email in corso...');

        try {
            const data = await invokeSupabaseFunction('generate-email-content', {
                prompt: aiPrompt,
                contact: selectedContact,
            });

            // Type guard for API response
            if (data && typeof data === 'object' && 'email' in data && typeof (data as Record<string, unknown>).email === 'string') {
                setGeneratedContent((data as { email: string }).email);
            } else {
                throw new Error('Risposta API non valida');
            }
            toast.success('Email generata!', { id: toastId });
        } catch (err: unknown) {
            const error = err as ApiError;
            toast.error(`Errore durante la generazione.`, { id: toastId });
            diagnosticLogger.error('api', 'Errore generazione email AI:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateWhatsApp = async () => {
        if (!aiPrompt || !selectedContact) { return; }
        setIsGenerating(true);
        setGeneratedContent('');
        const toastId = toast.loading('Creazione messaggio...');

        try {
            const data = await invokeSupabaseFunction('generate-whatsapp-message', {
                prompt: aiPrompt,
                contact: selectedContact,
            });

            // Type guard for API response
            if (data && typeof data === 'object' && 'message' in data && typeof (data as Record<string, unknown>).message === 'string') {
                setGeneratedContent((data as { message: string }).message);
            } else {
                throw new Error('Risposta API non valida');
            }
            toast.success('Messaggio pronto!', { id: toastId });
        } catch (err: unknown) {
            const error = err as ApiError;
            toast.error(`Errore durante la creazione.`, { id: toastId });
            diagnosticLogger.error('api', 'Errore generazione WhatsApp AI:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSendWhatsApp = async () => {
        if (!generatedContent || !selectedContact) { return; }
        setIsSaving(true);
        const toastId = toast.loading('Invio in corso...');

        try {
            await invokeSupabaseFunction('send-whatsapp-message', {
                contact_phone: selectedContact.phone,
                message: generatedContent,
            });
            toast.success('Messaggio WhatsApp inviato!', { id: toastId });
            handleCloseModals();
        } catch (err: unknown) {
            const error = err as ApiError;
            toast.error(`Errore durante l'invio.`, { id: toastId });
            diagnosticLogger.error('api', 'Errore invio WhatsApp:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCreateDeal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!organization) {
            toast.error('Organizzazione non disponibile');
            return;
        }
        
        setIsSaving(true);
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error('Devi essere autenticato');
                return;
            }

            // Find the pipeline stage ID based on the selected stage
            // First try to find existing stage, otherwise create a default "New Lead" stage
            let stageData;
            const { data: existingStage, error: stageError } = await supabase
                .from('pipeline_stages')
                .select('id, name')
                .eq('name', dealFormData.stage)
                .single();

            if (stageError || !existingStage) {
                // Stage doesn't exist, create it or use default
                const { data: newLeadStage, error: newLeadError } = await supabase
                    .from('pipeline_stages')
                    .select('id, name')
                    .eq('name', 'New Lead')
                    .single();
                
                if (newLeadError || !newLeadStage) {
                    // Create basic stages if none exist
                    const { error: createError } = await supabase
                        .from('pipeline_stages')
                        .insert([
                            { name: 'New Lead', color: '#3B82F6', order_index: 0 },
                            { name: 'Contacted', color: '#F59E0B', order_index: 1 },
                            { name: 'Proposal Sent', color: '#6366F1', order_index: 2 },
                            { name: 'Won', color: '#10B981', order_index: 3 },
                            { name: 'Lost', color: '#EF4444', order_index: 4 }
                        ]);

                    if (createError) {
                        console.warn('Could not create pipeline stages:', createError);
                    }

                    // Get the newly created "New Lead" stage
                    const { data: createdStage } = await supabase
                        .from('pipeline_stages')
                        .select('id')
                        .eq('name', 'New Lead')
                        .single();
                    
                    stageData = createdStage;
                } else {
                    stageData = newLeadStage;
                }
            } else {
                stageData = existingStage;
            }

            if (stageError || !stageData) {
                toast.error('Stadio pipeline non trovato');
                return;
            }

            // Create opportunity with proper organization context
            const { error } = await supabase
                .from('opportunities')
                .insert({
                    name: dealFormData.contact_name,
                    contact_id: selectedContact?.id,
                    value: dealFormData.value,
                    stage_id: stageData.id,
                    assigned_to: user.id,
                    created_by: user.id,
                    organization_id: organization.id,
                    close_date: dealFormData.close_date,
                    status: 'open',
                    source: 'manual',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            
            if (error) throw error;
            
            toast.success('Deal creato con successo!');
            refetch(); // Refresh data
            handleCloseModals();
        } catch (err: unknown) {
            const error = err as ApiError;
            toast.error(`Errore nella creazione del deal: ${error.message}`);
            diagnosticLogger.error('api', 'Errore creazione deal:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDealFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setDealFormData(prev => ({ 
            ...prev, 
            [name]: name === 'value' ? parseFloat(value) || 0 : value 
        }));
    };

    // Handle navigation state from dashboard quick actions
    useEffect(() => {
        const state = location.state as { openAddModal?: boolean; openEmailModal?: boolean } | null;
        
        if (state?.openAddModal) {
            handleOpenAddModal();
            // Clear the state to prevent reopening on re-renders
            window.history.replaceState({}, '', location.pathname);
        }
        
        if (state?.openEmailModal && filteredContacts.length > 0) {
            // Open email modal for the first contact, or could show a selection
            handleOpenEmailModal(filteredContacts[0]);
            window.history.replaceState({}, '', location.pathname);
        }
    }, [location.state, location.pathname, filteredContacts, handleOpenAddModal, handleOpenEmailModal]);

    return (
        <>
            <ContactSearch
                onSearchChange={setSearchTerm}
                onFiltersChange={setFilters}
                initialSearch={searchTerm}
                initialFilters={filters}
            />
            <ContactsTable
                contacts={filteredContacts}
                onEditContact={handleOpenEditModal}
                onDeleteContact={handleOpenDeleteModal}
                onEmailContact={handleOpenEmailModal}
                _onWhatsAppContact={handleOpenWhatsAppModal}
                onCreateEvent={handleOpenCreateEventModal}
                _onViewEvents={handleOpenViewEventsModal}
                onViewContact={handleOpenViewContactModal}
                onCreateDeal={handleOpenCreateDealModal}
                onAddContact={handleOpenAddModal}
                onUploadSuccess={refetch}
                onBulkOperationComplete={refetch}
                currentFilters={{ ...filters, searchQuery: searchTerm }}
            />

            {/* Modal Aggiungi/Modifica Contatto */}
            <Modal isOpen={isModalOpen} onClose={handleCloseModals} title={modalMode === 'add' ? 'Crea Nuovo Contatto' : 'Modifica Contatto'}>
                <form onSubmit={handleSaveContact} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome Completo *</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email *</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>
                    <div>
                        <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Telefono</label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                            <select
                                id="phonePrefix"
                                name="phonePrefix"
                                value={formData.phonePrefix}
                                onChange={handleFormChange}
                                className="block w-40 rounded-none rounded-l-md border-r-0 border-gray-300 bg-gray-50 text-gray-700 focus:ring-primary focus:border-primary"
                            >
                                {countryCodes.map((c) => (
                                    <option key={c.code} value={c.dial_code}>
                                        {c.flag} {c.name} ({c.dial_code})
                                    </option>
                                ))}
                            </select>
                            <input
                                type="tel"
                                id="phoneNumber"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleFormChange}
                                className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-primary focus:border-primary"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-700">Azienda</label>
                        <input type="text" id="company" name="company" value={formData.company} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>
                    <div className="flex justify-end pt-4 border-t mt-4">
                        <button type="button" onClick={handleCloseModals} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 mr-2">Annulla</button>
                        <button type="submit" disabled={isSaving} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">{isSaving ? 'Salvataggio...' : 'Salva'}</button>
                    </div>
                </form>
            </Modal>

            {/* Modal Conferma Eliminazione */}
            <Modal isOpen={isDeleteModalOpen} onClose={handleCloseModals} title="Conferma Eliminazione">
                <p>Sei sicuro di voler eliminare il contatto <strong>{selectedContact?.name}</strong>? Questa azione è irreversibile.</p>
                <div className="flex justify-end pt-4 border-t mt-4">
                    <button type="button" onClick={handleCloseModals} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 mr-2">Annulla</button>
                    <button onClick={handleDeleteContact} disabled={isSaving} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400">{isSaving ? 'Eliminazione...' : 'Elimina'}</button>
                </div>
            </Modal>

            {/* Modal Genera Email AI */}
            <Modal isOpen={isEmailModalOpen} onClose={handleCloseModals} title={`Scrivi Email a ${selectedContact?.name}`}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="ai-prompt-email" className="block text-sm font-medium text-gray-700">Obiettivo dell&apos;email</label>
                        <input type="text" id="ai-prompt-email" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Es: Follow-up dopo la nostra telefonata" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleGenerateEmail} disabled={isGenerating} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:bg-gray-400">{isGenerating ? 'Generazione...' : <><SparklesIcon className="w-5 h-5" /><span>Genera Testo</span></>}</button>
                    </div>
                    {generatedContent && (
                        <div className="pt-4 border-t">
                            <label className="block text-sm font-medium text-gray-700">Testo generato</label>
                            <textarea value={generatedContent} readOnly rows={10} className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm" />
                            <div className="flex justify-end mt-2">
                                <button onClick={() => { navigator.clipboard.writeText(generatedContent); toast.success('Testo copiato!'); }} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm">Copia Testo</button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Modal Genera/Invia WhatsApp AI */}
            <Modal isOpen={isWhatsAppModalOpen} onClose={handleCloseModals} title={`Messaggio WhatsApp a ${selectedContact?.name}`}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="ai-prompt-whatsapp" className="block text-sm font-medium text-gray-700">Obiettivo del messaggio</label>
                        <input type="text" id="ai-prompt-whatsapp" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Es: Ricorda appuntamento di domani" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleGenerateWhatsApp} disabled={isGenerating || generatedContent !== ''} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:bg-gray-400">{isGenerating ? 'Generazione...' : <><SparklesIcon className="w-5 h-5" /><span>Crea Messaggio</span></>}</button>
                    </div>
                    {generatedContent && (
                        <div className="pt-4 border-t">
                            <label className="block text-sm font-medium text-gray-700">Messaggio</label>
                            <textarea value={generatedContent} onChange={(e) => setGeneratedContent(e.target.value)} rows={5} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                            <p className="mt-2 text-xs text-gray-500">Puoi modificare il testo prima dell&apos;invio. Numero destinatario: {selectedContact?.phone}</p>
                            <div className="flex justify-end mt-2">
                                <button onClick={handleSendWhatsApp} disabled={isSaving} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center space-x-2 disabled:bg-gray-400">{isSaving ? 'Invio...' : <><WhatsAppIcon className="w-4 h-4" /><span>Invia ora via Twilio</span></>}</button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            <CreateEventModal
                isOpen={isCreateEventModalOpen}
                onClose={handleCloseModals}
                contact={selectedContact}
                organization={organization}
                isCalendarLinked={isCalendarLinked}
                onActionSuccess={refetch}
            />

            <Modal isOpen={isViewEventsModalOpen} onClose={handleCloseModals} title={`Eventi per ${selectedContact?.name}`}>
                <ContactEventsList
                    contact={selectedContact}
                    events={crmEvents}
                    onActionSuccess={refetch}
                />
            </Modal>

            {/* Enhanced Contact Details Modal */}
            <ContactDetailModal
                isOpen={isViewContactModalOpen}
                onClose={handleCloseModals}
                contact={selectedContact}
                onUpdate={(updatedContact) => {
                    // Update the contact in the list
                    refetch()
                }}
            />

            {/* Create Deal Modal */}
            <Modal isOpen={isCreateDealModalOpen} onClose={handleCloseModals} title={`Crea Deal per ${selectedContact?.name}`}>
                <form onSubmit={handleCreateDeal} className="space-y-4">
                    <div>
                        <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700">Nome Contatto *</label>
                        <input 
                            type="text" 
                            id="contact_name" 
                            name="contact_name" 
                            value={dealFormData.contact_name} 
                            onChange={handleDealFormChange} 
                            required 
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                        />
                    </div>
                    <div>
                        <label htmlFor="value" className="block text-sm font-medium text-gray-700">Valore (€) *</label>
                        <input 
                            type="number" 
                            id="value" 
                            name="value" 
                            value={dealFormData.value} 
                            onChange={handleDealFormChange} 
                            required 
                            min="0"
                            step="0.01"
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                        />
                    </div>
                    <div>
                        <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700">Assegnato a</label>
                        <input 
                            type="text" 
                            id="assigned_to" 
                            name="assigned_to" 
                            value={dealFormData.assigned_to} 
                            onChange={handleDealFormChange} 
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                        />
                    </div>
                    <div>
                        <label htmlFor="close_date" className="block text-sm font-medium text-gray-700">Data Chiusura Prevista *</label>
                        <input 
                            type="date" 
                            id="close_date" 
                            name="close_date" 
                            value={dealFormData.close_date} 
                            onChange={handleDealFormChange} 
                            required 
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                        />
                    </div>
                    <div>
                        <label htmlFor="stage" className="block text-sm font-medium text-gray-700">Stadio Pipeline *</label>
                        <select 
                            id="stage" 
                            name="stage" 
                            value={dealFormData.stage} 
                            onChange={handleDealFormChange} 
                            required 
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        >
                            <option value={PipelineStage.NewLead}>Nuovo Lead</option>
                            <option value={PipelineStage.Contacted}>Contattato</option>
                            <option value={PipelineStage.ProposalSent}>Proposta Inviata</option>
                            <option value={PipelineStage.Won}>Vinto</option>
                            <option value={PipelineStage.Lost}>Perso</option>
                        </select>
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button type="button" onClick={handleCloseModals} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 mr-2">
                            Annulla
                        </button>
                        <button 
                            type="submit" 
                            disabled={isSaving} 
                            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:bg-gray-400"
                        >
                            {isSaving ? 'Creazione...' : 'Crea Deal'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Universal AI Chat - Analytics Oracle */}
            <UniversalAIChat
                currentModule="Contacts"
                organizationId="demo-org"
                userId="demo-user"
                onActionTriggered={(action, data) => {
                    console.log('Contacts AI Action:', action, data);
                    // Handle AI actions (contact analysis, segmentation, etc.)
                }}
            />
        </>
    );
};

