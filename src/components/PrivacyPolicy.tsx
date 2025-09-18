import React from 'react';
// FIX: Corrected the import for Link from 'react-router-dom' to resolve module export errors.
import { Link } from 'react-router-dom';
import { GuardianIcon } from './ui/icons';

export const PrivacyPolicy: React.FC = () => {
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
                    <h1 className="text-3xl font-bold text-text-primary mb-6">Informativa sulla Privacy (Privacy Policy)</h1>
                    <div className="space-y-4 text-text-secondary">
                        <p><strong>Ultimo aggiornamento:</strong> 11 settembre 2025</p>
                        <p>La presente Informativa sulla Privacy descrive come i tuoi dati personali vengono raccolti, utilizzati e condivisi quando utilizzi il servizio Guardian AI CRM (il "Servizio"), fornito da SI Tech LTD.</p>
                        
                        <h2 className="text-2xl font-semibold text-text-primary pt-4 border-t mt-6">1. Titolare del Trattamento dei Dati</h2>
                        <p>
                            <strong>SEO Cagliari marchio SI TECH LTD</strong><br />
                            P.I. BG203132735<br />
                            Sede legale: Mayor Parvan Toshev, 25, 1° piano – Sofia<br />
                            <strong>Indirizzo email di contatto:</strong> agenziaseocagliari@gmail.com
                        </p>

                        <h2 className="text-2xl font-semibold text-text-primary pt-4 border-t mt-6">2. Tipi di Dati raccolti</h2>
                        <p>
                            Fra i Dati Personali raccolti da questo Servizio, in modo autonomo o tramite terze parti, ci sono: email, nome, cognome, numero di telefono, dati di utilizzo, cookie e dati relativi all'organizzazione. I dettagli completi su ciascuna tipologia di dati raccolti sono forniti nelle sezioni dedicate di questa privacy policy o mediante specifici testi informativi visualizzati prima della raccolta dei dati stessi.
                        </p>

                        <h2 className="text-2xl font-semibold text-text-primary pt-4 border-t mt-6">3. Finalità e Base Giuridica del Trattamento</h2>
                        <p>I Dati dell’Utente sono raccolti per consentire al Titolare di fornire il Servizio, adempiere a obblighi di legge, rispondere a richieste o azioni esecutive, tutelare i propri diritti ed interessi (o quelli di Utenti o di terze parti), individuare eventuali attività dolose o fraudaudolente, nonché per le seguenti finalità:</p>
                        <ul className="list-disc ml-6 space-y-2">
                            <li><strong>Fornitura del Servizio:</strong> Per creare e gestire l'account utente, fornire le funzionalità del CRM, e garantire l'operatività tecnica. La base giuridica è l'esecuzione di un contratto di cui l'Utente è parte.</li>
                            <li><strong>Contattare l'Utente:</strong> Per inviare comunicazioni di servizio o rispondere a richieste di supporto. La base giuridica è l'esecuzione di un contratto.</li>
                            <li><strong>Statistica e Analisi:</strong> Per monitorare e analizzare i dati di traffico in forma aggregata e anonima per migliorare il Servizio. La base giuridica è il legittimo interesse del Titolare.</li>
                            <li><strong>Adempimenti legali:</strong> Per rispettare gli obblighi di legge a cui il Titolare è soggetto.</li>
                        </ul>

                        <h2 className="text-2xl font-semibold text-text-primary pt-4 border-t mt-6">4. Modalità e Luogo del Trattamento</h2>
                        <p>Il Titolare adotta le opportune misure di sicurezza volte ad impedire l’accesso, la divulgazione, la modifica o la distruzione non autorizzate dei Dati Personali. Il trattamento viene effettuato mediante strumenti informatici e/o telematici, con modalità organizzative e con logiche strettamente correlate alle finalità indicate. I Dati sono trattati presso le sedi operative del Titolare ed in ogni altro luogo in cui le parti coinvolte nel trattamento siano localizzate, all'interno dello Spazio Economico Europeo (SEE).</p>

                         <h2 className="text-2xl font-semibold text-text-primary pt-4 border-t mt-6">5. Periodo di Conservazione</h2>
                        <p>I Dati sono trattati e conservati per il tempo richiesto dalle finalità per le quali sono stati raccolti. Pertanto, i Dati Personali raccolti per scopi collegati all’esecuzione di un contratto tra il Titolare e l’Utente saranno trattenuti sino a quando sia completata l’esecuzione di tale contratto. Al termine del periodo di conservazione i Dati Personali saranno cancellati.</p>

                        <h2 className="text-2xl font-semibold text-text-primary pt-4 border-t mt-6">6. Diritti dell’Utente (Art. 15-22 GDPR)</h2>
                        <p>Gli Utenti possono esercitare determinati diritti con riferimento ai Dati trattati dal Titolare. In particolare, l’Utente ha il diritto di:</p>
                         <ul className="list-disc ml-6 space-y-2">
                            <li><strong>Revocare il consenso</strong> in ogni momento.</li>
                            <li><strong>Opporsi al trattamento</strong> dei propri Dati.</li>
                            <li><strong>Accedere</strong> ai propri Dati.</li>
                            <li><strong>Verificare e chiedere la rettificazione.</strong></li>
                            <li>Ottenere la <strong>limitazione del trattamento.</strong></li>
                            <li>Ottenere la <strong>cancellazione o rimozione</strong> dei propri Dati Personali (diritto all'oblio).</li>
                            <li><strong>Ricevere i propri Dati</strong> o farli trasferire ad altro titolare (portabilità).</li>
                            <li>Proporre <strong>reclamo</strong> all'autorità di controllo della protezione dei dati personali competente.</li>
                        </ul>

                        <h2 className="text-2xl font-semibold text-text-primary pt-4 border-t mt-6">7. Come Esercitare i Diritti</h2>
                        <p>Per esercitare i propri diritti, gli Utenti possono indirizzare una richiesta agli estremi di contatto del Titolare indicati in questo documento. Le richieste sono depositate a titolo gratuito e evase dal Titolare nel più breve tempo possibile, in ogni caso entro un mese.</p>
                        
                        <p className="pt-6 text-sm text-gray-500">
                           <strong>Disclaimer:</strong> Questa è una bozza di informativa sulla privacy. Si consiglia vivamente di consultare un professionista legale per garantire la piena conformità con tutte le leggi e i regolamenti applicabili.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};