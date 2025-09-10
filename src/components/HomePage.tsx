import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GuardianIcon, BrainCircuitIcon, MessageBotIcon, ClipboardDataIcon } from './ui/icons';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-white p-6 rounded-lg shadow-md transition-transform transform hover:-translate-y-2">
        <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-text-primary mb-2">{title}</h3>
        <p className="text-text-secondary">{children}</p>
    </div>
);


export const HomePage: React.FC = () => {
    const navigate = useNavigate();

    const handleNavigateToLogin = () => {
        navigate('/login');
    };

    return (
        <div className="bg-background min-h-screen text-text-primary">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 shadow-sm">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center">
                        <GuardianIcon className="w-8 h-8 text-primary" />
                        <h1 className="text-2xl font-bold ml-2">Guardian AI</h1>
                    </div>
                    <nav className="hidden md:flex items-center space-x-6">
                        <a href="#features" className="text-gray-600 hover:text-primary transition">Funzionalità</a>
                        <a href="#" className="text-gray-600 hover:text-primary transition">Prezzi</a>
                        <a href="#" className="text-gray-600 hover:text-primary transition">Contatti</a>
                    </nav>
                    <div className="flex items-center space-x-2">
                        <button onClick={handleNavigateToLogin} className="text-primary font-semibold px-4 py-2 rounded-md hover:bg-indigo-50 transition">
                            Accedi
                        </button>
                        <button onClick={handleNavigateToLogin} className="bg-primary text-white font-semibold px-4 py-2 rounded-md hover:bg-indigo-700 transition shadow">
                            Inizia la Prova Gratuita
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <main>
                <section className="text-center py-20 md:py-32 px-6 bg-white">
                    <div className="container mx-auto">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-text-primary leading-tight mb-4">
                            Smetti di gestire. <span className="text-primary">Inizia a crescere.</span>
                        </h1>
                        <p className="text-lg md:text-xl text-text-secondary max-w-3xl mx-auto mb-8">
                            Guardian AI CRM è la piattaforma intelligente che automatizza le vendite, personalizza il marketing e ti dà il tempo di concentrarti su ciò che conta davvero: i tuoi clienti.
                        </p>
                        <div className="flex justify-center space-x-4">
                            <button onClick={handleNavigateToLogin} className="bg-primary text-white font-bold px-8 py-3 rounded-lg text-lg hover:bg-indigo-700 transition shadow-lg">
                                Provalo Gratis per 14 giorni
                            </button>
                            <button className="bg-gray-200 text-gray-800 font-bold px-8 py-3 rounded-lg text-lg hover:bg-gray-300 transition">
                                Richiedi una Demo
                            </button>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20 px-6">
                    <div className="container mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-text-primary">Un CRM che lavora per te</h2>
                            <p className="text-lg text-text-secondary max-w-2xl mx-auto mt-4">
                                Dimentica i task manuali e le operazioni ripetitive. Il nostro CRM usa l'intelligenza artificiale per potenziare ogni aspetto del tuo business.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-8">
                            <FeatureCard 
                                icon={<BrainCircuitIcon className="w-6 h-6 text-primary" />}
                                title="Automazione Intelligente"
                            >
                                Descrivi un workflow a parole e la nostra AI lo creerà per te. "Quando un cliente firma, invia un'email di benvenuto e crea un task per il project manager." Fatto.
                            </FeatureCard>
                            <FeatureCard 
                                icon={<MessageBotIcon className="w-6 h-6 text-primary" />}
                                title="Comunicazione Efficace"
                            >
                                Genera email personalizzate e persuasive in pochi secondi. L'AI analizza il profilo del contatto e scrive il messaggio perfetto per ogni occasione, dal follow-up alla chiusura.
                            </FeatureCard>
                             <FeatureCard 
                                icon={<ClipboardDataIcon className="w-6 h-6 text-primary" />}
                                title="Gestione Lead Evoluta"
                            >
                                I nostri form intelligenti non solo raccolgono dati, ma qualificano i lead in tempo reale, li assegnano al venditore giusto e creano automaticamente un'opportunità nella pipeline.
                            </FeatureCard>
                        </div>
                    </div>
                </section>

                 {/* Testimonial Section */}
                <section className="bg-white py-20 px-6">
                    <div className="container mx-auto text-center">
                        <p className="text-2xl md:text-3xl font-medium text-text-primary max-w-3xl mx-auto">
                            "Guardian AI ha trasformato il nostro processo di vendita. Abbiamo ridotto del 70% il tempo speso in attività amministrative e aumentato le conversioni del 30%. È una rivoluzione."
                        </p>
                        <p className="mt-6 font-bold text-lg">Silvestro Sanna</p>
                        <p className="text-text-secondary">CEO, SEO Cagliari</p>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-sidebar text-white py-12 px-6">
                <div className="container mx-auto text-center">
                    <p>&copy; {new Date().getFullYear()} Guardian AI CRM. Tutti i diritti riservati.</p>
                    <p className="mt-2 text-sm text-gray-400">
                        Un prodotto by <a href="https://seo-cagliari.it/" target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline text-white">SEO Cagliari</a>
                    </p>
                    <div className="mt-4 space-x-6">
                         <a href="#" className="hover:underline">Privacy Policy</a>
                         <a href="#" className="hover:underline">Termini di Servizio</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};