import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { MessageBotIcon, UserCircleIcon, SparklesIcon, TrashIcon } from './ui/icons';
import { useCrmData } from '../hooks/useCrmData';
import { Automation } from '../types';
import { Modal } from './ui/Modal';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

const AutomationCard: React.FC<{ automation: Automation; onDelete: (automation: Automation) => void; }> = ({ automation, onDelete }) => (
    <div className="bg-white p-4 rounded-lg shadow border flex flex-col justify-between">
        <div>
            <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg text-text-primary pr-2">{automation.name}</h3>
                <span className="text-xs font-semibold px-2.5 py-1 bg-green-100 text-green-800 rounded-full">Attiva</span>
            </div>
            <p className="text-sm text-text-secondary mt-2" style={{ whiteSpace: 'pre-wrap' }}>{automation.description}</p>
        </div>
        <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t">
            <button onClick={() => onDelete(automation)} title="Elimina" className="p-2 text-red-500 hover:bg-red-50 rounded-md">
                <TrashIcon className="w-5 h-5" />
            </button>
        </div>
    </div>
);


export const Automations: React.FC = () => {
    const { automations, organization, refetch } = useOutletContext<ReturnType<typeof useCrmData>>();
    
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lastInteraction, setLastInteraction] = useState<{ user: string; ai: string } | null>(null);

    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [automationToDelete, setAutomationToDelete] = useState<Automation | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        
        setLastInteraction(null);
        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const { data, error } = await supabase.functions.invoke('process-automation-request', {
                body: { prompt: userMessage.text },
            });

            if (error) throw new Error(`Errore di rete: ${error.message}`);
            if (data.error) throw new Error(data.error);
            if (!data.reply) throw new Error("La risposta dell'AI non è valida.");

            const aiMessage: Message = { sender: 'ai', text: data.reply };
            setMessages(prev => [...prev, aiMessage]);
            setLastInteraction({ user: userMessage.text, ai: aiMessage.text });

        } catch (err: any) {
            const errorMessage: Message = { sender: 'ai', text: `Mi dispiace, si è verificato un errore: ${err.message}` };
            setMessages(prev => [...prev, errorMessage]);
            toast.error(`Errore: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAutomation = async () => {
        if (!lastInteraction || !organization) return;
        setIsLoading(true);

        try {
            const { error } = await supabase.from('automations').insert({
                name: lastInteraction.user,
                description: lastInteraction.ai,
                organization_id: organization.id,
            });
            if (error) throw error;
            toast.success("Automazione salvata con successo!");
            refetch(); // Ricarica la lista delle automazioni
            // Reset chat
            setMessages([]);
            setLastInteraction(null);
        } catch (err: any) {
            toast.error(`Errore nel salvataggio: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const openDeleteModal = (automation: Automation) => {
        setAutomationToDelete(automation);
        setDeleteModalOpen(true);
    };

    const handleDeleteAutomation = async () => {
        if (!automationToDelete) return;
        setIsLoading(true);
        try {
            const { error } = await supabase.from('automations').delete().eq('id', automationToDelete.id);
            if (error) throw error;
            toast.success("Automazione eliminata!");
            refetch();
            setDeleteModalOpen(false);
            setAutomationToDelete(null);
        } catch(err: any) {
            toast.error(`Errore: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <>
            <div className="space-y-8 max-w-4xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Le Tue Automazioni</h1>
                    <p className="text-text-secondary mt-1">
                        Qui trovi tutte le automazioni che hai creato. Attualmente sono salvate come "ricette" pronte per essere eseguite.
                    </p>
                </div>

                {automations.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {automations.map(auto => <AutomationCard key={auto.id} automation={auto} onDelete={openDeleteModal} />)}
                    </div>
                ) : (
                    <div className="bg-white p-8 rounded-lg shadow border text-center">
                        <MessageBotIcon className="w-12 h-12 mx-auto text-gray-300" />
                        <h2 className="mt-4 text-xl font-semibold text-text-primary">Nessuna automazione ancora creata</h2>
                        <p className="mt-1 text-text-secondary">Usa l'agente AI qui sotto per iniziare a costruirne una.</p>
                    </div>
                )}
                
                <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg border">
                    <header className="p-4 border-b">
                        <h2 className="text-2xl font-bold text-text-primary flex items-center">
                            <SparklesIcon className="w-7 h-7 mr-3 text-primary" />
                            Crea una Nuova Automazione
                        </h2>
                        <p className="text-sm text-text-secondary mt-1">
                            Descrivi cosa vuoi fare e l'agente preparerà i passaggi per te.
                        </p>
                    </header>
                    <main className="flex-1 overflow-y-auto p-6 space-y-6">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                                 {msg.sender === 'ai' && <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-primary flex-shrink-0"><MessageBotIcon className="w-6 h-6"/></div>}
                                 <div className={`max-w-lg px-4 py-3 rounded-2xl ${msg.sender === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-100 text-text-primary rounded-bl-none'}`}>
                                    <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                                </div>
                                 {msg.sender === 'user' && <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0"><UserCircleIcon className="w-7 h-7"/></div>}
                            </div>
                        ))}
                         {isLoading && messages.length > 0 && (
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-primary flex-shrink-0"><MessageBotIcon className="w-6 h-6"/></div>
                                <div className="max-w-lg px-4 py-3 rounded-2xl bg-gray-100 text-text-primary rounded-bl-none">
                                    <div className="flex items-center space-x-2">
                                        <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="h-2 w-2 bg-primary rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            </div>
                         )}
                        <div ref={chatEndRef} />
                    </main>
                    <footer className="p-4 border-t bg-white">
                        {lastInteraction && (
                            <div className="text-center mb-4 p-3 bg-indigo-50 rounded-md">
                                <p className="text-sm text-indigo-800">Ti piace questa automazione? Salvala per usarla in futuro.</p>
                                <button onClick={handleSaveAutomation} disabled={isLoading} className="mt-2 bg-primary text-white font-semibold px-4 py-2 text-sm rounded-lg hover:bg-indigo-700 disabled:bg-gray-400">
                                    {isLoading ? 'Salvataggio...' : 'Crea Automazione'}
                                </button>
                            </div>
                        )}
                        <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                            <input
                                type="text" value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Es: Invia un'email di benvenuto ai nuovi contatti..."
                                className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                                disabled={isLoading}
                            />
                            <button type="submit" disabled={isLoading || !input.trim()} className="bg-primary text-white px-6 py-2 rounded-full hover:bg-indigo-700 disabled:bg-gray-400 font-semibold">
                                Invia
                            </button>
                        </form>
                    </footer>
                </div>
            </div>
            
            <Modal isOpen={isDeleteModalOpen} onClose={() => setDeleteModalOpen(false)} title="Conferma Eliminazione">
                <p>Sei sicuro di voler eliminare l'automazione <strong>"{automationToDelete?.name}"</strong>? Questa azione è irreversibile.</p>
                <div className="flex justify-end pt-4 border-t mt-4">
                    <button type="button" onClick={() => setDeleteModalOpen(false)} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 mr-2">Annulla</button>
                    <button onClick={handleDeleteAutomation} disabled={isLoading} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400">{isLoading ? 'Eliminazione...' : 'Elimina'}</button>
                </div>
            </Modal>
        </>
    );
};