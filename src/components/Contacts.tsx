import React, { useState, useMemo } from 'react';
import { Contact, Organization } from '../types';
import { SearchIcon, SparklesIcon, PlusIcon, EditIcon, TrashIcon } from './ui/icons';
import { Modal } from './ui/Modal';
import { supabase } from '../lib/supabaseClient';
// import { GoogleGenAI } from '@google/genai'; // Removed static import

interface ContactsProps {
  contacts: Contact[];
  organization: Organization | null;
  refetchData: () => void;
}

export const Contacts: React.FC<ContactsProps> = ({ contacts, organization, refetchData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof Contact>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  // AI Email state
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [emailPrompt, setEmailPrompt] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  
  // Add Contact state
  const [newContact, setNewContact] = useState({ name: '', email: '', company: '', phone: '' });
  
  // Edit/Delete Contact state
  const [contactToModify, setContactToModify] = useState<Contact | null>(null);
  
  // Generic loading/error state for DB operations
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');


  const handleOpenEmailModal = (contact: Contact) => {
    setSelectedContact(contact);
    setIsEmailModalOpen(true);
    setGeneratedEmail('');
    setEmailPrompt('');
    setGenerationError('');
  };

  const handleOpenAddModal = () => {
    setNewContact({ name: '', email: '', company: '', phone: '' });
    setSaveError('');
    setAddModalOpen(true);
  }

  const handleOpenEditModal = (contact: Contact) => {
    setContactToModify(contact);
    setSaveError('');
    setEditModalOpen(true);
  };

  const handleOpenDeleteModal = (contact: Contact) => {
    setContactToModify(contact);
    setSaveError('');
    setDeleteModalOpen(true);
  };
  
  const handleCloseModals = () => {
    setIsEmailModalOpen(false);
    setAddModalOpen(false);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setSelectedContact(null);
    setContactToModify(null);
  }

  const handleGenerateEmail = async () => {
    if (!emailPrompt || !selectedContact) {
      setGenerationError("Per favore, fornisci un obiettivo per l'email.");
      return;
    }
    setIsGenerating(true);
    setGeneratedEmail('');
    setGenerationError('');
    
    try {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
      const fullPrompt = `Sei un assistente professionale per le relazioni con i clienti. Scrivi un'email professionale e concisa a un contatto.
      
      Nome Contatto: ${selectedContact.name}
      Azienda Contatto: ${selectedContact.company}
      
      L'obiettivo dell'email è: "${emailPrompt}"
      
      Genera solo il corpo del testo dell'email.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
      });
      
      setGeneratedEmail(response.text?.trim() ?? '');

    } catch (err) {
      console.error(err);
      setGenerationError("Impossibile generare l'email. Controlla la chiave API e riprova.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleAddNewContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !organization) {
        setSaveError("Il nome è obbligatorio.");
        return;
    }
    setIsSaving(true);
    setSaveError('');

    try {
        const { error } = await supabase
            .from('contacts')
            .insert({
                ...newContact,
                organization_id: organization.id
            });

        if (error) throw error;
        
        handleCloseModals();
        refetchData();

    } catch (err: any) {
        setSaveError(`Errore nel salvataggio del contatto: ${err.message}`);
        console.error(err);
    } finally {
        setIsSaving(false);
    }
  }

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactToModify || !contactToModify.name) {
        setSaveError("Il nome è obbligatorio.");
        return;
    }
    setIsSaving(true);
    setSaveError('');
    
    try {
        const { error } = await supabase
            .from('contacts')
            .update({
                name: contactToModify.name,
                email: contactToModify.email,
                company: contactToModify.company,
                phone: contactToModify.phone
            })
            .eq('id', contactToModify.id);

        if (error) throw error;

        handleCloseModals();
        refetchData();
        
    } catch (err: any) {
        setSaveError(`Errore nell'aggiornamento del contatto: ${err.message}`);
        console.error(err);
    } finally {
        setIsSaving(false);
    }
  }

  const handleDeleteContact = async () => {
    if (!contactToModify) return;

    setIsSaving(true);
    setSaveError('');

    try {
        const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('id', contactToModify.id);
        
        if (error) throw error;

        handleCloseModals();
        refetchData();

    } catch (err: any) {
        setSaveError(`Errore nell'eliminazione del contatto: ${err.message}`);
        console.error(err);
    } finally {
        setIsSaving(false);
    }
  }


  const filteredAndSortedContacts = useMemo(() => {
    if (!contacts) return [];
    return contacts
      .filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (contact.company && contact.company.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort((a, b) => {
        const valA = a[sortColumn] || '';
        const valB = b[sortColumn] || '';

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [contacts, searchTerm, sortColumn, sortDirection]);

  const handleSort = (column: keyof Contact) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const SortableHeader: React.FC<{ column: keyof Contact, title: string }> = ({ column, title }) => (
    <th
      onClick={() => handleSort(column)}
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
    >
      <div className="flex items-center">
        {title}
        {sortColumn === column && (
          <span className="ml-2">{sortDirection === 'asc' ? '▲' : '▼'}</span>
        )}
      </div>
    </th>
  );
  

  return (
    <>
      <div className="bg-card p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-text-primary">Contatti</h1>
          <div className="flex items-center space-x-2">
              <div className="relative">
                  <input 
                      type="text"
                      placeholder="Cerca contatti..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            <button onClick={handleOpenAddModal} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
              <PlusIcon className="w-5 h-5" />
              <span>Aggiungi Contatto</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortableHeader column="name" title="Nome" />
                <SortableHeader column="email" title="Email" />
                <SortableHeader column="company" title="Azienda" />
                <SortableHeader column="phone" title="Telefono" />
                <SortableHeader column="created_at" title="Creato il" />
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contact.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.company}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contact.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(contact.created_at).toLocaleDateString('it-IT')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => handleOpenEditModal(contact)} title="Modifica Contatto" className="text-gray-500 hover:text-primary">
                            <EditIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleOpenDeleteModal(contact)} title="Elimina Contatto" className="text-gray-500 hover:text-red-600">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleOpenEmailModal(contact)} title="Email con AI" className="text-gray-500 hover:text-primary flex items-center">
                            <SparklesIcon className="w-5 h-5" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Modal per Generazione Email */}
      <Modal isOpen={isEmailModalOpen} onClose={handleCloseModals} title={`Genera Email con AI per ${selectedContact?.name}`}>
        <div className="space-y-4">
            <div>
                <label htmlFor="email-prompt" className="block text-sm font-medium text-gray-700">Obiettivo dell'Email</label>
                <input
                    type="text" id="email-prompt" value={emailPrompt}
                    onChange={(e) => setEmailPrompt(e.target.value)}
                    placeholder="Es: Follow-up sulla nostra ultima conversazione"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
            </div>
            <div className="flex justify-end">
                <button
                    onClick={handleGenerateEmail} disabled={isGenerating}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center"
                >
                    {isGenerating ? 'Generazione...' : 'Genera Email'}
                </button>
            </div>
            {generationError && <p className="text-red-500 text-sm">{generationError}</p>}
            {generatedEmail && (
                <div>
                    <label htmlFor="generated-email" className="block text-sm font-medium text-gray-700">Email Generata</label>
                    <textarea
                        id="generated-email" rows={10} value={generatedEmail}
                        onChange={(e) => setGeneratedEmail(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                </div>
            )}
        </div>
      </Modal>

      {/* Modal per Aggiungere Contatto */}
      <Modal isOpen={isAddModalOpen} onClose={handleCloseModals} title="Aggiungi Nuovo Contatto">
        <form onSubmit={handleAddNewContact} className="space-y-4">
            <div>
                <label htmlFor="add-name" className="block text-sm font-medium text-gray-700">Nome Completo *</label>
                <input type="text" id="add-name" required value={newContact.name} onChange={(e) => setNewContact({...newContact, name: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
            </div>
            <div>
                <label htmlFor="add-email" className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="add-email" value={newContact.email} onChange={(e) => setNewContact({...newContact, email: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
            </div>
            <div>
                <label htmlFor="add-company" className="block text-sm font-medium text-gray-700">Azienda</label>
                <input type="text" id="add-company" value={newContact.company} onChange={(e) => setNewContact({...newContact, company: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
            </div>
            <div>
                <label htmlFor="add-phone" className="block text-sm font-medium text-gray-700">Telefono</label>
                <input type="tel" id="add-phone" value={newContact.phone} onChange={(e) => setNewContact({...newContact, phone: e.target.value})} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
            </div>
            {saveError && <p className="text-red-500 text-sm">{saveError}</p>}
            <div className="flex justify-end pt-4 border-t mt-4">
                 <button type="button" onClick={handleCloseModals} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 mr-2">
                    Annulla
                </button>
                <button type="submit" disabled={isSaving} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">
                    {isSaving ? 'Salvataggio...' : 'Salva Contatto'}
                </button>
            </div>
        </form>
      </Modal>

       {/* Modal per Modificare Contatto */}
      <Modal isOpen={isEditModalOpen} onClose={handleCloseModals} title={`Modifica ${contactToModify?.name}`}>
        <form onSubmit={handleUpdateContact} className="space-y-4">
            <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">Nome Completo *</label>
                <input type="text" id="edit-name" required value={contactToModify?.name || ''} onChange={(e) => setContactToModify(contact => contact ? {...contact, name: e.target.value} : null)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
            </div>
            <div>
                <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" id="edit-email" value={contactToModify?.email || ''} onChange={(e) => setContactToModify(contact => contact ? {...contact, email: e.target.value} : null)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
            </div>
            <div>
                <label htmlFor="edit-company" className="block text-sm font-medium text-gray-700">Azienda</label>
                <input type="text" id="edit-company" value={contactToModify?.company || ''} onChange={(e) => setContactToModify(contact => contact ? {...contact, company: e.target.value} : null)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
            </div>
            <div>
                <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700">Telefono</label>
                <input type="tel" id="edit-phone" value={contactToModify?.phone || ''} onChange={(e) => setContactToModify(contact => contact ? {...contact, phone: e.target.value} : null)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"/>
            </div>
            {saveError && <p className="text-red-500 text-sm">{saveError}</p>}
            <div className="flex justify-end pt-4 border-t mt-4">
                 <button type="button" onClick={handleCloseModals} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 mr-2">
                    Annulla
                </button>
                <button type="submit" disabled={isSaving} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">
                    {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
            </div>
        </form>
      </Modal>

      {/* Modal di Conferma Eliminazione */}
      <Modal isOpen={isDeleteModalOpen} onClose={handleCloseModals} title="Conferma Eliminazione">
        <div className="space-y-4">
          <p>Sei sicuro di voler eliminare il contatto <strong>{contactToModify?.name}</strong>? Questa azione è irreversibile.</p>
          {saveError && <p className="text-red-500 text-sm">{saveError}</p>}
          <div className="flex justify-end pt-4 border-t mt-4">
              <button type="button" onClick={handleCloseModals} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 mr-2">
                  Annulla
              </button>
              <button onClick={handleDeleteContact} disabled={isSaving} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400">
                  {isSaving ? 'Eliminazione...' : 'Elimina'}
              </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
