# Guardian AI CRM

Guardian AI CRM è una piattaforma avanzata e AI-nativa progettata per ottimizzare le vendite, il marketing e la gestione dei clienti attraverso automazione intelligente e analisi approfondite.

# Policy CI/CD

Il workflow di Continuous Integration e Continuous Deployment (CI/CD) è gestito da GitHub Actions.

- **File di Configurazione:** Il file di workflow principale è `.github/workflows/deploy-supabase.yml`.
- **Standard:** Questo file deve essere mantenuto in questa directory per garantire che GitHub Actions lo rilevi ed esegua automaticamente ad ogni push o pull request sul branch `main`.
- **Modifiche:** Qualsiasi modifica alla pipeline di deploy deve essere effettuata direttamente su questo file e committata nel repository. La vecchia directory `.github_workflow_backup` è obsoleta e non deve essere utilizzata.

# Gestione Autenticazione Google OAuth

L'integrazione con Google Calendar utilizza un flusso OAuth 2.0 sicuro per l'autorizzazione.

- **Flusso del Token:** Al primo collegamento, l'applicazione riceve un `access_token` (a breve scadenza) e un `refresh_token` (a lunga scadenza). Il `refresh_token` viene utilizzato in modo sicuro dal backend per richiedere nuovi `access_token` in modo automatico, senza che l'utente debba ricollegarsi.
- **Stabilità:** Per garantire che l'integrazione rimanga attiva, è fondamentale **non revocare l'accesso a "Guardian AI CRM"** dalle impostazioni di sicurezza del proprio account Google.
- **Riconnessione:** Se l'integrazione smette di funzionare (ad esempio, dopo una revoca manuale o la scadenza del `refresh_token`), è sufficiente tornare alla pagina `Impostazioni`, disconnettere l'account e ricollegarlo.