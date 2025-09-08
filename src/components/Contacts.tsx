
import React, { useState, useMemo } from 'react';
import { Contact } from '../types';
import { SearchIcon, SparklesIcon } from './ui/icons';
import { Modal } from './ui/Modal';
// import { GoogleGenAI } from '@google/genai'; // Removed static import

export const Contacts: React.FC<{ contacts: Contact[] }> = ({ contacts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof Contact>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [emailPrompt, setEmailPrompt] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOpenModal = (contact: Contact) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
    setGeneratedEmail('');
    setEmailPrompt('');
    setError('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedContact(null);
  };

  const handleGenerateEmail = async () => {
    if (!emailPrompt || !selectedContact) {
      setError("Per favore, fornisci un obiettivo per l'email.");
      return;
    }
    setIsLoading(true);
    setGeneratedEmail('');
    setError('');
    
    try {
      // Dynamically import the library when the function is called
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
      setError("Impossibile generare l'email. Controlla la chiave API e riprova.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedContacts = useMemo(() => {
    return contacts
      .filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (a[sortColumn] < b[sortColumn]) return sortDirection === 'asc' ? -1 : 1;
        if (a[sortColumn] > b[sortColumn]) return sortDirection === 'asc' ? 1 : -1;
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
            <button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              Aggiungi Contatto
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
                <SortableHeader column="createdAt" title="Creato il" />
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(contact.createdAt).toLocaleDateString('it-IT')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleOpenModal(contact)} className="text-indigo-600 hover:text-indigo-900 flex items-center space-x-1">
                        <SparklesIcon className="w-5 h-5" />
                        <span>Email con AI</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={`Genera Email con AI per ${selectedContact?.name}`}>
        <div className="space-y-4">
            <div>
                <label htmlFor="email-prompt" className="block text-sm font-medium text-gray-700">Obiettivo dell'Email</label>
                <input
                    type="text"
                    id="email-prompt"
                    value={emailPrompt}
                    onChange={(e) => setEmailPrompt(e.target.value)}
                    placeholder="Es: Follow-up sulla nostra ultima conversazione"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleGenerateEmail}
                    disabled={isLoading}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 flex items-center"
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Generazione...
                        </>
                    ) : 'Genera Email'}
                </button>
            </div>
            
            {error && <p className="text-red-500 text-sm">{error}</p>}
            
            {generatedEmail && (
                <div>
                    <label htmlFor="generated-email" className="block text-sm font-medium text-gray-700">Email Generata</label>
                    <textarea
                        id="generated-email"
                        rows={10}
                        value={generatedEmail}
                        onChange={(e) => setGeneratedEmail(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                </div>
            )}
        </div>
      </Modal>
    </>
  );
};