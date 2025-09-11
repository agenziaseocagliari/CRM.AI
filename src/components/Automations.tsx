import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SparklesIcon, UserCircleIcon } from './ui/icons';

interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

export const Automations: React.FC = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            sender: 'ai',
            text: "Ciao! Sono il tuo Agente AI. Descrivi l'automazione che vuoi creare. Ad esempio: 'Quando un nuovo lead si registra dal form Contatti, inviagli un'email di benvenuto'."
        }
    ]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isProcessing) return;

        const newMessages: ChatMessage[] = [...messages, { sender: 'user', text: input }];
        setMessages(newMessages);
        setInput('');
        setIsProcessing(true);

        // Simula la risposta dell'AI
        setTimeout(() => {
            setMessages([
                ...newMessages,
                { sender: 'ai', text: `Perfetto, ho capito. Sto impostando un'automazione per: "${input}". Potrebbe volerci un momento...` }
            ]);
            setIsProcessing(false);
        }, 1500);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold text-text-primary">Parla con il tuo Agente AI</h1>
                <button onClick={() => navigate('/settings')} className="text-primary hover:text-indigo-800 font-medium">
                    Configura le tue integrazioni &rarr;
                </button>
            </div>
            
            <div className="flex-grow bg-white rounded-lg shadow p-4 flex flex-col">
                {/* Chat history */}
                <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'ai' && (
                                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0">
                                    <SparklesIcon className="w-5 h-5" />
                                </div>
                            )}
                            <div className={`p-3 rounded-lg max-w-lg ${msg.sender === 'ai' ? 'bg-gray-100 text-text-primary' : 'bg-primary text-white'}`}>
                                <p className="text-sm">{msg.text}</p>
                            </div>
                             {msg.sender === 'user' && (
                                <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                                    <UserCircleIcon className="w-6 h-6" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isProcessing && (
                         <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0">
                                <SparklesIcon className="w-5 h-5 animate-pulse" />
                            </div>
                            <div className="p-3 rounded-lg bg-gray-100 text-text-primary">
                                <p className="text-sm italic">L'agente sta pensando...</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Chat input */}
                <div className="mt-4 pt-4 border-t">
                    <form onSubmit={handleSendMessage} className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Scrivi qui la tua richiesta..."
                            className="w-full pl-4 pr-28 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            disabled={isProcessing}
                        />
                        <button
                            type="submit"
                            disabled={isProcessing || !input.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-300"
                        >
                            Invia
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
