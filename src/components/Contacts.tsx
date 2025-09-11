import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Contact } from '../types';
import { supabase } from '../lib/supabaseClient';
import { Modal } from './ui/Modal';
import { PlusIcon, EditIcon, TrashIcon, SparklesIcon, WhatsAppIcon } from './ui/icons';
import toast from 'react-hot-toast';
import { useCrmData } from '../hooks/useCrmData';
import { LeadScoreBadge } from './ui/LeadScoreBadge';

// Definiamo un tipo per i dati del form per maggiore chiarezza e sicurezza.
type ContactFormData = Omit<Contact, 'id' | 'organization_id' | 'created_at' | 'lead_score' | 'lead_category' | 'lead_score_reasoning'>;

// Stato iniziale per il form di aggiunta/modifica contatto.
const initialFormState: ContactFormData = {
    name: '',
    email: '',
    phone: '',
    company: '',
};

export const Contacts: React.FC = () => {
    const { contacts, organization, refetch } = useOutletContext<ReturnType<typeof useCrmData>>();

    // Stati per la gestione delle modali
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

    // Stati per i dati e il caricamento
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [formData, setFormData] = useState<ContactFormData>(initialFormState);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // Stati per le funzionalità AI
    const [aiPrompt, setAiPrompt] = useState('');
    const [generatedContent, setGeneratedContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);


    // ---- GESTIONE MODALI ---- //
    
    const handleOpenAddModal = () => {
        setModalMode('add');
        setFormData(initialFormState);
        setSelectedContact(null);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (contact: Contact) => {
        setModalMode('edit');
        setSelectedContact(contact);
        setFormData({
            name: contact.name,
            email: contact.email,
            phone: contact.phone,
            company: contact.company,
        });
        setIsModalOpen(true);
    };

    const handleOpenDeleteModal = (contact: Contact) => {
        setSelectedContact(contact);
        setIsDeleteModalOpen(true);
    };

    const handleOpenEmailModal = (contact: Contact) => {
        setSelectedContact(contact);
        setAiPrompt('');
        setGeneratedContent('');
        setIsEmailModalOpen(true);
    };
    
     const handleOpenWhatsAppModal = (contact: Contact) => {
        setSelectedContact(contact);
        setAiPrompt('');
        setGeneratedContent('');
        setIsWhatsAppModalOpen(true);
    };

    const handleCloseModals = () => {
        setIsModalOpen(false);
        setIsDeleteModalOpen(false);
        setIsEmailModalOpen(false);
        setIsWhatsAppModalOpen(false);
        setSelectedContact(null);
    };
    
    // ---- OPERAZIONI CRUD ---- //

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
            let successMessage = '';
            const dataToSave = { ...formData, organization_id: organization.id };

            if (modalMode === 'edit' && selectedContact) {
                const { error } = await supabase.from('contacts').update(dataToSave).eq('id', selectedContact.id);
                if (error) throw error;
                successMessage = 'Contatto aggiornato!';
            } else {
                const { error } = await supabase.from('contacts').insert(dataToSave);
                if (error) throw error;
                successMessage = 'Contatto creato!';
                // Le funzioni score-contact-lead e send-welcome-email vengono attivate tramite trigger su Supabase
            }
            refetch();
            handleCloseModals();
            toast.success(successMessage);
        } catch (err: any) {
            toast.error(`Errore: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteContact = async () => {
        if (!selectedContact) return;
        setIsSaving(true);
        try {
            const { error } = await supabase.from('contacts').delete().eq('id', selectedContact.id);
            if (error) throw error;
            refetch();
            handleCloseModals();
            toast.success('Contatto eliminato.');
        } catch (err: any) {
            toast.error(`Errore: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    // ---- FUNZIONALITÀ AI ---- //

    const handleGenerateEmail = async () => {
        if (!aiPrompt || !selectedContact) return;
        setIsGenerating(true);
        setGeneratedContent('');
        const toastId = toast.loading('Generazione email in corso...');
        
        try {
             const { data, error } = await supabase.functions.invoke('generate-email-content', {
                body: { prompt: aiPrompt, contact: selectedContact },
            });
            if (error) throw new Error(error.message);
            if(data.error) throw new Error(data.error);

            setGeneratedContent(data.email);
            toast.success('Email generata!', { id: toastId });
        } catch (err: any) {
            toast.error(`Errore: ${err.message}`, { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleGenerateWhatsApp = async () => {
        if (!aiPrompt || !selectedContact) return;
        setIsGenerating(true);
        setGeneratedContent('');
        const toastId = toast.loading('Creazione messaggio...');
        
        try {
            const { data, error } = await supabase.functions.invoke('generate-whatsapp-message', {
                body: { prompt: aiPrompt, contact: selectedContact },
            });
            if (error) throw new Error(error.message);
            if (data.error) throw new Error(data.error);

            setGeneratedContent(data.message);
            toast.success('Messaggio pronto!', { id: toastId });
        } catch (err: any) {
            toast.error(`Errore: ${err.message}`, { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleSendWhatsApp = async () => {
        if (!generatedContent || !selectedContact || !organization) return;
        setIsSaving(true);
        const toastId = toast.loading('Invio in corso...');

        try {
            const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
                body: {
                    contact_phone: selectedContact.phone,
                    message: generatedContent,
                    organization_id: organization.id
                },
            });
            if (error) throw new Error(error.message);
            if (data.error) throw new Error(data.error);

            toast.success('Messaggio WhatsApp inviato!', { id: toastId });
            handleCloseModals();
        } catch (err: any) {
            toast.error(`Errore: ${err.message}`, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-text-primary">Contatti</h1>
                <button onClick={handleOpenAddModal} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
                    <PlusIcon className="w-5 h-5" />
                    <span>Aggiungi Contatto</span>
                </button>
            </div>
            
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azienda</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email & Telefono</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Score</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Azioni</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {contacts.map((contact) => (
                            <tr key={contact.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{contact.company}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{contact.email}</div>
                                    <div className="text-sm text-gray-500">{contact.phone}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <LeadScoreBadge score={contact.lead_score} category={contact.lead_category} reasoning={contact.lead_score_reasoning} />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-2">
                                        <button onClick={() => handleOpenEmailModal(contact)} title="Scrivi Email con AI" className="p-2 text-gray-500 hover:bg-gray-100 rounded-md">
                                            <SparklesIcon className="w-5 h-5" />
                                        </button>
                                         <button onClick={() => handleOpenWhatsAppModal(contact)} title="Invia WhatsApp con AI" className="p-2 text-green-600 hover:bg-green-50 rounded-md">
                                            <WhatsAppIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleOpenEditModal(contact)} title="Modifica" className="p-2 text-gray-500 hover:bg-gray-100 rounded-md">
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleOpenDeleteModal(contact)} title="Elimina" className="p-2 text-red-500 hover:bg-red-50 rounded-md">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {contacts.length === 0 && <p className="text-center text-gray-500 py-8">Nessun contatto trovato. Inizia aggiungendone uno!</p>}
            </div>

            {/* Modal Aggiungi/Modifica Contatto */}
            <Modal isOpen={isModalOpen} onClose={handleCloseModals} title={modalMode === 'add' ? 'Crea Nuovo Contatto' : 'Modifica Contatto'}>
                <form onSubmit={handleSaveContact} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome Completo *</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email *</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleFormChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                    </div>
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefono</label>
                        <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                    </div>
                    <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-700">Azienda</label>
                        <input type="text" id="company" name="company" value={formData.company} onChange={handleFormChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
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
                        <label htmlFor="ai-prompt-email" className="block text-sm font-medium text-gray-700">Obiettivo dell'email</label>
                        <input type="text" id="ai-prompt-email" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Es: Follow-up dopo la nostra telefonata" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleGenerateEmail} disabled={isGenerating} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:bg-gray-400">{isGenerating ? 'Generazione...' : <><SparklesIcon className="w-5 h-5"/><span>Genera Testo</span></>}</button>
                    </div>
                    {generatedContent && (
                        <div className="pt-4 border-t">
                            <label className="block text-sm font-medium text-gray-700">Testo generato</label>
                            <textarea value={generatedContent} readOnly rows={10} className="mt-1 block w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md shadow-sm"/>
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
                        <input type="text" id="ai-prompt-whatsapp" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Es: Ricorda appuntamento di domani" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={handleGenerateWhatsApp} disabled={isGenerating || generatedContent !== ''} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:bg-gray-400">{isGenerating ? 'Generazione...' : <><SparklesIcon className="w-5 h-5"/><span>Crea Messaggio</span></>}</button>
                    </div>
                    {generatedContent && (
                        <div className="pt-4 border-t">
                            <label className="block text-sm font-medium text-gray-700">Messaggio</label>
                            <textarea value={generatedContent} onChange={(e) => setGeneratedContent(e.target.value)} rows={5} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
                             <p className="mt-2 text-xs text-gray-500">Puoi modificare il testo prima dell'invio. Numero destinatario: {selectedContact?.phone}</p>
                            <div className="flex justify-end mt-2">
                                <button onClick={handleSendWhatsApp} disabled={isSaving} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center space-x-2 disabled:bg-gray-400">{isSaving ? 'Invio...': <><WhatsAppIcon className="w-4 h-4" /><span>Invia ora via Twilio</span></>}</button>
                            </div>
                        </div>
                    )}
                 </div>
            </Modal>

        </>
    );
};
