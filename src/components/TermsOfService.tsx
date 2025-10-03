import React from 'react';
// FIX: Corrected the import for Link from 'react-router-dom' to resolve module export errors.
import { Link } from 'react-router-dom';

import { GuardianIcon } from './ui/icons';

export const TermsOfService: React.FC = () => {
    return (
        <div className="bg-background min-h-screen">
             <header className="bg-white shadow-sm">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <Link to="/" className="flex items-center">
                        <GuardianIcon className="w-8 h-8 text-primary" />
                        <h1 className="text-xl font-bold ml-2 text-text-primary">Guardian AI CRM</h1>
                    </Link>
                </div>
            </header>
            <main className="container mx-auto px-6 py-12">
                <div className="bg-white p-8 rounded-lg shadow-md max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-text-primary mb-6">Termini e Condizioni del Servizio</h1>
                    <div className="space-y-4 text-text-secondary">
                        <p><strong>Ultimo aggiornamento:</strong> 11 settembre 2025</p>

                        <p>I presenti Termini e Condizioni ("Termini") disciplinano l'utilizzo della piattaforma software Guardian AI CRM (il "Servizio") offerta da <strong>SEO Cagliari marchio SI TECH LTD</strong> (P.I. BG203132735), con sede legale in Mayor Parvan Toshev, 25, 1° piano – Sofia ("Fornitore").</p>

                        <h2 className="text-2xl font-semibold text-text-primary pt-4 border-t mt-6">1. Accettazione dei Termini</h2>
                        <p>
                           Accedendo o utilizzando il Servizio, l'utente ("Utente") accetta di essere vincolato dai presenti Termini. Se non si accettano questi Termini, non è possibile utilizzare il Servizio. Il Fornitore si riserva il diritto di modificare i Termini in qualsiasi momento; le modifiche saranno efficaci dalla loro pubblicazione sul sito web del Servizio.
                        </p>

                        <h2 className="text-2xl font-semibold text-text-primary pt-4 border-t mt-6">2. Descrizione del Servizio</h2>
                        <p>
                            Guardian AI CRM è una piattaforma software as a service (SaaS) che fornisce strumenti per la gestione delle relazioni con i clienti (CRM), potenziati da funzionalità di intelligenza artificiale per l'automazione, l'analisi e la comunicazione.
                        </p>

                        <h2 className="text-2xl font-semibold text-text-primary pt-4 border-t mt-6">3. Account Utente</h2>
                        <p>
                            Per utilizzare il Servizio, l'Utente deve registrarsi e creare un account. L'Utente è responsabile della veridicità e completezza dei dati forniti, nonché della custodia delle proprie credenziali di accesso. L'Utente è l'unico responsabile di tutte le attività che si verificano tramite il proprio account.
                        </p>
                        
                         <h2 className="text-2xl font-semibold text-text-primary pt-4 border-t mt-6">4. Obblighi dell'Utente</h2>
                        <p>L'Utente si impegna a utilizzare il Servizio in conformità con la legge e i presenti Termini. È vietato:</p>
                         <ul className="list-disc ml-6 space-y-2">
                            <li>Utilizzare il Servizio per scopi illegali o non autorizzati.</li>
                            <li>Caricare o trasmettere dati (inclusi i dati dei propri contatti) in violazione delle leggi sulla privacy applicabili (es. GDPR). L'Utente dichiara di avere il consenso necessario per trattare i dati caricati nel CRM.</li>
                            <li>Accedere o tentare di accedere a sistemi o reti del Fornitore in modo non autorizzato.</li>
                            <li>Svolgere attività di reverse engineering, decompilare o disassemblare il software del Servizio.</li>
                        </ul>

                        <h2 className="text-2xl font-semibold text-text-primary pt-4 border-t mt-6">5. Limitazione di Responsabilità</h2>
                        <p>
                           Il Servizio è fornito "così com'è" e "come disponibile". Il Fornitore non garantisce che il Servizio sarà ininterrotto, sicuro o privo di errori. Nei limiti massimi consentiti dalla legge, il Fornitore non sarà responsabile per eventuali danni diretti, indiretti, incidentali, speciali o consequenziali derivanti dall'uso o dall'impossibilità di utilizzare il Servizio.
                        </p>
                        
                        <h2 className="text-2xl font-semibold text-text-primary pt-4 border-t mt-6">6. Legge Applicabile e Foro Competente</h2>
                        <p>
                           I presenti Termini sono regolati dalla legge bulgara. Per qualsiasi controversia derivante da o connessa ai presenti Termini, sarà competente in via esclusiva il Tribunale di Sofia, Bulgaria.
                        </p>

                        <h2 className="text-2xl font-semibold text-text-primary pt-4 border-t mt-6">7. Contatti</h2>
                        <p>
                           Per qualsiasi domanda relativa ai presenti Termini, è possibile contattare il Fornitore all'indirizzo email: <strong>agenziaseocagliari@gmail.com</strong>.
                        </p>

                        <p className="pt-6 text-sm text-gray-500">
                           <strong>Disclaimer:</strong> Questo è un modello di Termini e Condizioni. È essenziale che questo documento venga revisionato da un consulente legale per adattarlo alle specifiche esigenze aziendali e per garantire la piena conformità legale.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};