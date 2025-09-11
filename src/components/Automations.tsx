
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { MessageBotIcon, UserCircleIcon, SparklesIcon } from './ui/icons';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export const Automations: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll to the bottom of the chat on new messages
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const { data, error } = await supabase.functions.invoke('process-automation-request', {
                body: { prompt: input },
            });

            if (error) throw new Error(`Errore di rete: ${error.message}`);
            if (data.error) throw new Error(data.error);
            if (!data.reply) throw new Error("La risposta dell'AI non è valida.");

            const aiMessage: Message = { sender: 'ai', text: data.reply };
            setMessages(prev => [...prev, aiMessage]);

        } catch (err: any) {
            toast.error(`Errore: ${err.message}`);
            // Optional: add the error message back to chat
            const errorMessage: Message = { sender: 'ai', text: `Mi dispiace, si è verificato un errore: ${err.message}` };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg border">
            <header className="p-4 border-b">
                <h1 className="text-2xl font-bold text-text-primary flex items-center">
                    <MessageBotIcon className="w-7 h-7 mr-3 text-primary" />
                    Agente AI Conversazionale
                </h1>
                <p className="text-sm text-text-secondary mt-1">
                    Descrivi a parole cosa vuoi automatizzare. L'agente ti aiuterà a definire i passaggi.
                </p>
            </header>

            <main className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 ? (
                     <div className="text-center text-gray-500 mt-8">
                        <SparklesIcon className="w-12 h-12 mx-auto text-gray-300" />
                        <p className="mt-4 text-lg">Inizia una conversazione</p>
                        <p className="text-sm">Prova a chiedere: "Voglio inviare un'email di benvenuto ai nuovi contatti".</p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                             {msg.sender === 'ai' && <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-primary flex-shrink-0"><MessageBotIcon className="w-6 h-6"/></div>}
                             <div className={`max-w-lg px-4 py-3 rounded-2xl ${msg.sender === 'user' ? 'bg-primary text-white rounded-br-none' : 'bg-gray-100 text-text-primary rounded-bl-none'}`}>
                                <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                            </div>
                             {msg.sender === 'user' && <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0"><UserCircleIcon className="w-7 h-7"/></div>}
                        </div>
                    ))
                )}
                 {isLoading && (
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
                <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Scrivi il tuo messaggio..."
                        className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !input.trim()} className="bg-primary text-white px-6 py-2 rounded-full hover:bg-indigo-700 disabled:bg-gray-400 font-semibold">
                        Invia
                    </button>
                </form>
            </footer>
        </div>
    );
};
      