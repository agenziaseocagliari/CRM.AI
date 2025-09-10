import React, { useState, useMemo, useRef } from 'react';
import { Contact, Organization } from '../types';
import { SearchIcon, SparklesIcon, PlusIcon, EditIcon, TrashIcon, UploadIcon } from './ui/icons';
import { Modal } from './ui/Modal';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';

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
  const [isImportModalOpen, setImportModalOpen] = useState(false);

  // AI Email state
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [emailPrompt, setEmailPrompt] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Add Contact state
  const [newContact, setNewContact] = useState({ name: '', email: '', company: '', phone: '' });
  
  // Edit/Delete Contact state
  const [contactToModify, setContactToModify] = useState<Contact | null>(null);

  // Import CSV state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  
  // Generic loading/error state for DB operations
  const [isSaving, setIsSaving] = useState(false);


  const handleOpenEmailModal = (contact: Contact) => {
    setSelectedContact(contact);
    setIsEmailModalOpen(true);
    setGeneratedEmail('');
    setEmailPrompt('');
  };

  const handleOpenAddModal = () => {
    setNewContact({ name: '', email: '', company: '', phone: '' });
    setAddModalOpen(true);
  }

  const handleOpenEditModal = (contact: Contact) => {
    setContactToModify(contact);
    setEditModalOpen(true);
  };

  const handleOpenDeleteModal = (contact: Contact) => {
    setContactToModify(contact);
    setDeleteModalOpen(true);
  };
  
  const handleOpenImportModal = () => {
    setImportFile(null);
    setImportModalOpen(true);
  }

  const handleCloseModals = () => {
    setIsEmailModalOpen(false);
    setAddModalOpen(false);
    setEditModalOpen(false);
    setDeleteModalOpen(false);
    setImportModalOpen(false);
    setSelectedContact(null);
    setContactToModify(null);
  }

  const handleGenerateEmail = async () => {
    if (!emailPrompt || !selectedContact) {
      toast.error("Per favore, fornisci un obiettivo per l'email.");
      return;
    }
    setIsGenerating(true);
    setGeneratedEmail('');
    
    const toastId = toast.loading('Generazione email in corso...');
    try {
        const { data, error: invokeError } = await supabase.functions.invoke('generate-email-content', {
            body: { prompt: emailPrompt, contact: selectedContact },
        });

        if (invokeError) throw new Error(`Errore di rete: ${invokeError.message}`);
        if (data.error) throw new Error(data.error);
      
        setGeneratedEmail(data.email);
        toast.success('Email generata con successo!', { id: toastId });

    } catch (err: any) {
      console.error(err);
      toast.error(`Impossibile generare l'email: ${err.message}.`, { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleAddNewContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !organization) {
        toast.error("Il nome è obbligatorio.");
        return;
    }
    setIsSaving(true);

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
        toast.success('Contatto creato con successo!');

    } catch (err: any) {
        toast.error(`Errore nel salvataggio del contatto: ${err.message}`);
        console.error(err);
    } finally {
        setIsSaving(false);
    }
  }

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactToModify || !contactToModify.name) {
        toast.error("Il nome è obbligatorio.");
        return;
    }
    setIsSaving(true);
    
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
        toast.success('Contatto aggiornato!');
        
    } catch (err: any) {
        toast.error(`Errore nell'aggiornamento del contatto: ${err.message}`);
        console.error(err);
    } finally {
        setIsSaving(false);
    }
  }

  const handleDeleteContact = async () => {
    if (!contactToModify) return;
    setIsSaving(true);

    try {
        const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('id', contactToModify.id);
        
        if (error) throw error;

        handleCloseModals();
        refetchData();
        toast.success('Contatto eliminato.');

    } catch (err: any) {
        toast.error(`Errore nell'eliminazione del contatto: ${err.message}`);
        console.error(err);
    } finally {
        setIsSaving(false);
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  }

  const handleImportCSV = async () => {
    if (!importFile || !organization) {
      toast.error("Seleziona un file CSV da importare.");
      return;
    }
    setIsImporting(true);

    try {
      const fileContent = await importFile.text();
      const lines = fileContent.split('\n').filter(line => line.trim() !== '');
      if (lines.length < 2) {
        throw new Error("Il file CSV è vuoto o contiene solo l'intestazione.");
      }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['name', 'email', 'company', 'phone'];
      
      if(!headers.includes('name')) {
          throw new Error(`L'intestazione 'name' è obbligatoria nel file CSV.`);
      }

      const contactsToInsert = lines.slice(1).map((line, index) => {
        const values = line.split(',');
        const contactData = headers.reduce((obj, header, i) => {
          if (requiredHeaders.includes(header)) {
              obj[header as keyof typeof obj] = values[i]?.trim() || '';
          }
          return obj;
        }, { name: '', email: '', company: '', phone: '' });

        if (!contactData.name) {
          throw new Error(`Il nome è mancante alla riga ${index + 2}.`);
        }

        return {
          ...contactData,
          organization_id: organization.id,
        };
      });

      const { error } = await supabase.from('contacts').insert(contactsToInsert);
      if (error) throw error;

      toast.success(`${contactsToInsert.length} contatti importati con successo!`);
      refetchData();
      handleCloseModals();

    } catch (err: any) {
      toast.error(`Errore durante l'importazione: ${err.message}`);
      console.error(err);
    } finally {
      setIsImporting(false);
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
              <button onClick={handleOpenImportModal} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 flex items-center space-x-2">
                <UploadIcon className="w-5 h-5" />
                <span>Importa CSV</span>
              </button>
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

      {/* Modal per Importazione CSV */}
      <Modal isOpen={isImportModalOpen} onClose={handleCloseModals} title="Importa Contatti da CSV">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Carica un file CSV con le seguenti colonne: <strong>name, email, company, phone</strong>. La colonna 'name' è obbligatoria.
          </p>
          <div>
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-gray-100 border-2 border-dashed border-gray-300 p-6 rounded-lg text-center hover:bg-gray-200"
            >
              {importFile ? (
                <span className="text-green-600 font-semibold">{importFile.name}</span>
              ) : (
                <span>Clicca per selezionare un file</span>
              )}
            </button>
          </div>
          
          <div className="flex justify-end pt-4 border-t mt-4">
              <button type="button" onClick={handleCloseModals} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 mr-2">
                  Annulla
              </button>
              <button 
                onClick={handleImportCSV} 
                disabled={isImporting || !importFile} 
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
              >
                  {isImporting ? 'Importazione...' : 'Importa Contatti'}
              </button>
          </div>
        </div>
      </Modal>
    </>
  );
};