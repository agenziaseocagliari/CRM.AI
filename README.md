# Guardian AI CRM

Guardian AI CRM è una piattaforma avanzata e AI-nativa progettata per ottimizzare le vendite, il marketing e la gestione dei clienti attraverso automazione intelligente e analisi approfondite.

# Policy CI/CD

Il workflow di Continuous Integration e Continuous Deployment (CI/CD) è gestito da GitHub Actions.

- **File di Configurazione:** Il file di workflow principale è `.github/workflows/deploy-supabase.yml`.
- **Standard:** Questo file deve essere mantenuto in questa directory per garantire che GitHub Actions lo rilevi ed esegua automaticamente ad ogni push o pull request sul branch `main`.
- **Modifiche:** Qualsiasi modifica alla pipeline di deploy deve essere effettuata direttamente su questo file e committata nel repository. La vecchia directory `.github_workflow_backup` è obsoleta e non deve essere utilizzata.

## 🚀 Vercel Deployment Policy

**Deploy Governance:**
- ✅ **Production**: Deploy automatico **SOLO** su branch `main`
- ✅ **Preview**: Deploy su PR con branch `feature/*`, `fix/*`, `hotfix/*`, `release/*`
- ✅ **Cleanup**: Automatico alla chiusura PR + schedulato daily per preview > 7 giorni
- ✅ **Optimization**: File non necessari esclusi via `.vercelignore`
- 🚫 **Blocked**: Branch `copilot/*`, `test/*`, `draft/*`, `wip/*`, `experimental/*`, `docs/*`, `ci/*`

**Workflows:**
- `.github/workflows/vercel-preview.yml` - Deploy preview condizionale su PR
- `.github/workflows/vercel-cleanup.yml` - Cleanup automatico preview obsoleti

**Configurazione:**
- `vercel.json` - Config deploy, security headers, cache optimization, branch blocking
- `.vercelignore` - Esclusione docs, tests, scripts dal deployment

**📚 Documentazione:**
- [VERCEL_DEPLOYMENT_POLICY.md](./VERCEL_DEPLOYMENT_POLICY.md) - Policy completa e best practices
- [VERCEL_DASHBOARD_SETUP_GUIDE.md](./VERCEL_DASHBOARD_SETUP_GUIDE.md) - ⚠️ Configurazione Dashboard (CRITICO)
- [PR_CONFLICT_RESOLUTION_GUIDE.md](./PR_CONFLICT_RESOLUTION_GUIDE.md) - Risoluzione conflitti PR

**⚠️ IMPORTANTE:** Per bloccare completamente i deploy non autorizzati, è necessario configurare anche il Vercel Dashboard manualmente. Vedi [VERCEL_DASHBOARD_SETUP_GUIDE.md](./VERCEL_DASHBOARD_SETUP_GUIDE.md)

# Gestione Autenticazione Google OAuth

L'integrazione con Google Calendar utilizza un flusso OAuth 2.0 sicuro per l'autorizzazione.

- **Flusso del Token:** Al primo collegamento, l'applicazione riceve un `access_token` (a breve scadenza) e un `refresh_token` (a lunga scadenza). Il `refresh_token` viene utilizzato in modo sicuro dal backend per richiedere nuovi `access_token` in modo automatico, senza che l'utente debba ricollegarsi.
- **Stabilità:** Per garantire che l'integrazione rimanga attiva, è fondamentale **non revocare l'accesso a "Guardian AI CRM"** dalle impostazioni di sicurezza del proprio account Google.
- **Riconnessione:** Se l'integrazione smette di funzionare (ad esempio, dopo una revoca manuale o la scadenza del `refresh_token`), è sufficiente tornare alla pagina `Impostazioni`, disconnettere l'account e ricollegarlo.

## Sincronizzazione sicura directory workflow (.github/workflows)

- Tutte le modifiche ai workflow GitHub Actions si fanno da GitHub (web) o da ambiente locale/codespaces, MAI da AI Studio.
- Prima di lavorare su AI Studio, eseguire sempre `git pull origin main` per portare le ultime versioni del codice e della directory `.github/workflows/`.
- Non modificare/cancellare la directory `.github/` in AI Studio. Se accidentalmente eliminata, ripetere subito `git pull origin main` per ripristinarla.
- Al prossimo push, AI Studio manterrà la directory intatta: la cancellerà solo se localmente non esiste.

---

## 📚 Documentazione Completa

Il progetto include documentazione tecnica comprehensiva:

### 🚀 Guide Quick Start
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Guida passo-passo per setup completo (GitHub, Supabase, Vercel)
- **[VERCEL_DEPLOYMENT_POLICY.md](./VERCEL_DEPLOYMENT_POLICY.md)** - 📋 **Policy ufficiale Vercel**: production su main, preview su PR, TTL 7 giorni, cleanup automatico
- **[VERCEL_DEPLOYMENT_OPTIMIZATION.md](./VERCEL_DEPLOYMENT_OPTIMIZATION.md)** - 🎯 Strategia ottimizzazione deploy Vercel e riduzione costi
- **[VERCEL_QUICK_REFERENCE.md](./VERCEL_QUICK_REFERENCE.md)** - 🚀 Quick reference per sviluppatori su branch naming e workflow
- **[.env.example](./.env.example)** - Template configurazione con tutte le variabili ambiente necessarie

### 📖 Documentazione Tecnica
- **[EDGE_FUNCTIONS_API.md](./EDGE_FUNCTIONS_API.md)** - Documentazione completa API per tutte le 22 edge functions
- **[SUPERVISION_REPORT.md](./SUPERVISION_REPORT.md)** - Report analisi architettura e best practices
- **[SYNC_CHECKLIST.md](./SYNC_CHECKLIST.md)** - Checklist per verifiche periodiche GitHub ↔️ Supabase
- **[SUPER_ADMIN_IMPLEMENTATION.md](./SUPER_ADMIN_IMPLEMENTATION.md)** - 🆕 Implementazione strategia Super Admin Security
- **[MIGRATION_ROBUSTNESS_GUIDE.md](./MIGRATION_ROBUSTNESS_GUIDE.md)** - 🛡️ Guida robustezza migration e RLS policies
- **[docs/RLS_POLICY_GUIDE.md](./docs/RLS_POLICY_GUIDE.md)** - 📘 Guida completa strategia RLS policies con esempi
- **[API_ROLE_MANAGEMENT_GUIDE.md](./API_ROLE_MANAGEMENT_GUIDE.md)** - 🔐 Guida completa gestione ruoli JWT-based (previene errori "role does not exist")
- **[ROLE_MANAGEMENT_VERIFICATION_REPORT.md](./ROLE_MANAGEMENT_VERIFICATION_REPORT.md)** - ✅ Report verifica compliance gestione ruoli

### 🛠️ Automazione
- **[scripts/verify-sync.sh](./scripts/verify-sync.sh)** - Script automatico per verificare sincronizzazione
- **[scripts/test-superadmin.sh](./scripts/test-superadmin.sh)** - 🆕 Test suite per Super Admin security
- **[scripts/verify-role-cleanup.sh](./scripts/verify-role-cleanup.sh)** - 🔍 Verifica riferimenti ruoli PostgreSQL
- **[scripts/verify-api-role-usage.sh](./scripts/verify-api-role-usage.sh)** - 🔍 Verifica utilizzo ruoli nelle API calls
- **[scripts/lint-api-role-usage.sh](./scripts/lint-api-role-usage.sh)** - 🔍 Lint per pattern problematici gestione ruoli
- **[scripts/README.md](./scripts/README.md)** - Documentazione script di verifica
- **[.github/workflows/deploy-supabase.yml](./.github/workflows/deploy-supabase.yml)** - CI/CD automatico per deploy

### 📊 Reports
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Riepilogo completo implementazioni e metriche

---

## 🔧 Quick Commands

### Verifica Repository
```bash
# Esegui verifiche automatiche
./scripts/verify-sync.sh

# Verifica gestione ruoli (previene errori "role does not exist")
npm run verify:role

# Lint codice per pattern problematici gestione ruoli
npm run lint:role

# Esegui tutte le verifiche
npm run verify:all
```

### Development
```bash
# Install dependencies
npm install

# Run TypeScript checks
npm run lint

# Build project
npm run build

# Run dev server
npm run dev
```

### Deploy (Automatico via GitHub Actions)
```bash
# Deploy su push a main (automatico)
git push origin main

# Deploy manuale edge functions (se necessario)
supabase functions deploy --no-verify-jwt
```

### Super Admin Testing
```bash
# Test sicurezza Super Admin
export SUPABASE_URL='https://your-project.supabase.co'
export SUPABASE_ANON_KEY='your-anon-key'
export SUPER_ADMIN_JWT='your-super-admin-jwt-token'
./scripts/test-superadmin.sh
```

---

## 🎯 Architettura

### Frontend
- **Framework**: React 19 + TypeScript
- **Styling**: TailwindCSS
- **State Management**: React Hooks
- **Routing**: React Router v6
- **Build**: Vite
- **Hosting**: Vercel

### Backend
- **Database**: Supabase PostgreSQL
- **API**: Supabase Edge Functions (Deno)
- **Authentication**: Supabase Auth (JWT)
- **Storage**: Supabase Storage
- **Real-time**: Supabase Realtime

### Integrazioni
- **Calendar**: Google Calendar API
- **AI**: Google Gemini
- **Email**: Brevo (Sendinblue)
- **WhatsApp**: Twilio
- **Automation**: n8n (optional)

### Edge Functions (30 totali)
- 🛡️ **Super Admin** (8) - NEW!
- Autenticazione & OAuth (3)
- Gestione Calendario (7)
- Sistema Crediti (1)
- AI & Automazione (5)
- Comunicazioni (3)
- Reminders (2)
- Utility (2)

Per dettagli completi, vedi [EDGE_FUNCTIONS_API.md](./EDGE_FUNCTIONS_API.md)

**🆕 Super Admin Functions**: Sistema completo di gestione con validazione JWT, RLS policies, e audit logging per operazioni sensibili (gestione utenti, organizzazioni, crediti, pagamenti). Vedi [SUPER_ADMIN_IMPLEMENTATION.md](./SUPER_ADMIN_IMPLEMENTATION.md).

---

## 🔒 Sicurezza

### Row Level Security (RLS) Strategy

**⚠️ CRITICAL POLICY PATTERN:**

All RLS policies follow a strict security pattern:
- **Always use `TO public`** - Never use `TO authenticated`, `TO super_admin`, or other internal Postgres roles
- **Always filter by custom profile claims** - Use `profiles.role = 'super_admin'` for authorization
- **Zero role errors** - Eliminates `"role does not exist"` errors (SQLSTATE 22023, 42704)

**Example:**
```sql
CREATE POLICY "Super admins can view all" ON organizations
    FOR SELECT
    TO public  -- ✅ Always use public
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'super_admin'  -- ✅ Custom claim
        )
    );
```

### General Security
- ✅ Row Level Security (RLS) abilitato su tutte le tabelle
- ✅ JWT Authentication per tutte le API
- ✅ Service Role Key isolato server-side
- ✅ Secrets gestiti tramite Supabase Edge Functions Secrets
- ✅ Security audit automatizzato nel workflow CI/CD
- ✅ Nessun secret hardcoded nel codice
- ✅ RLS policies use only `TO public` with custom profile filters

**📚 For complete RLS policy documentation, see:**
- [MIGRATION_ROBUSTNESS_GUIDE.md](./MIGRATION_ROBUSTNESS_GUIDE.md) - RLS policy best practices
- [SUPER_ADMIN_IMPLEMENTATION.md](./SUPER_ADMIN_IMPLEMENTATION.md) - Super Admin security implementation

---

## 📊 Status

- **Build**: ✅ Passing
- **TypeScript**: ✅ 0 Errors
- **Security**: ✅ 0 Vulnerabilities
- **Documentation**: ✅ 100% Coverage
- **CI/CD**: ✅ Automated
- **Quality**: 🟢 **ECCELLENTE**

---

## 🤝 Contributing

Per contribuire al progetto:

1. Fork del repository
2. Crea branch feature: `git checkout -b feature/nome-feature`
3. Commit changes: `git commit -m 'Add feature'`
4. Push al branch: `git push origin feature/nome-feature`
5. Apri Pull Request
6. Il workflow CI/CD eseguirà verifiche automatiche

---

## 📄 License

Proprietario: seo-cagliari
