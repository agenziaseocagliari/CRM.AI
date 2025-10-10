# 🤖 FIX AGENTI AI MANCANTI - ISTRUZIONI

**Problema**: Il modulo "Agenti di Automazione" mostra "0 / 0 agenti attivi" invece dei 5 agenti AI predefiniti.

**Root Cause Possibili**:
1. ❌ Migration `20250102000000_create_agents_and_integrations.sql` non applicata
2. ❌ INSERT degli agenti fallito durante la migration
3. ❌ RLS policy blocca la visualizzazione (improbabile - le policy sono corrette)

---

## 🔍 DIAGNOSI

### Step 1: Verifica Tabella e Dati

Vai su **Supabase Studio** → **SQL Editor** e esegui:

```sql
-- Verifica esistenza tabella
SELECT 
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'automation_agents'
    ) as table_exists;

-- Conta agenti esistenti
SELECT COUNT(*) as total_agents FROM automation_agents;
```

**Risultati Possibili**:

| Scenario | table_exists | total_agents | Azione |
|----------|-------------|--------------|--------|
| A | true | 5 | ✅ Agenti esistono - problema RLS o frontend |
| B | true | 0 | ⚠️ Tabella esiste ma vuota - esegui INSERT |
| C | false | ERROR | ❌ Tabella non esiste - applica migration |

---

## ✅ SOLUZIONE - Scenario B (Tabella vuota)

### Opzione 1: Popola tramite SQL Studio (CONSIGLIATO)

1. Vai su **Supabase Studio** → **SQL Editor**
2. Apri il file `POPULATE_AUTOMATION_AGENTS.sql` (in workspace root)
3. Esegui **Step 1-4** per verificare la situazione
4. Se `total_agents = 0`, **rimuovi il commento** da Step 5 e esegui l'INSERT
5. Esegui **Step 6-7** per verificare

**INSERT da eseguire**:
```sql
INSERT INTO automation_agents (name, type, description, is_active, configuration, status) VALUES
    ('Health Monitor', 'health_monitor', 'Monitora uptime, errori API, anomalie login, warning sicurezza, dashboard health', 
     true,
     '{"alert_channels": ["in_app", "email"], "check_interval_minutes": 15, "thresholds": {"error_rate": 5, "uptime_percentage": 99}}'::jsonb,
     'idle'),
    ('Payment/Revenue Agent', 'payment_revenue', 'Monitora pagamenti ricorrenti, crediti, rinnovi, abbonamenti, transazioni failed',
     true,
     '{"alert_channels": ["email", "whatsapp"], "check_interval_minutes": 30, "thresholds": {"failed_payment_count": 3}}'::jsonb,
     'idle'),
    ('Support/Ticket Agent', 'support_ticket', 'Classe, smista, risponde alle richieste support incoming con escalation automatica',
     true,
     '{"alert_channels": ["in_app", "email"], "auto_response_enabled": true, "escalation_threshold_hours": 24}'::jsonb,
     'idle'),
    ('User Engagement Agent', 'user_engagement', 'Automatizza onboarding clienti, invio remind upgrade, campagne marketing',
     true,
     '{"channels": ["email", "whatsapp"], "onboarding_enabled": true, "upgrade_reminder_days": 7}'::jsonb,
     'idle'),
    ('Security Watcher', 'security_watcher', 'Scannerizza log auth/API, segnala anomalie, tentativi login irregolari',
     true,
     '{"alert_channels": ["email", "telegram"], "auto_lock_enabled": false, "failed_login_threshold": 5, "anomaly_detection_enabled": true}'::jsonb,
     'idle');
```

### Opzione 2: Crea Edge Function per Auto-Populate

(Da implementare se necessario)

---

## ✅ SOLUZIONE - Scenario C (Tabella non esiste)

### Applica Migration Manualmente

1. Vai su **Supabase Studio** → **SQL Editor**
2. Apri il file `/workspaces/CRM.AI/supabase/migrations/20250102000000_create_agents_and_integrations.sql`
3. Copia TUTTO il contenuto
4. Esegui in SQL Editor
5. Verifica con:
   ```sql
   SELECT COUNT(*) FROM automation_agents;
   ```

---

## 🧪 VERIFICA POST-FIX

Dopo aver popolato gli agenti:

### Test 1: Query Diretta
```sql
SELECT 
    id,
    name,
    type,
    is_active,
    status,
    created_at
FROM automation_agents
ORDER BY name;
```

**Risultato atteso**: 5 righe

### Test 2: Frontend
1. Vai su https://crm-ai-seo-cagliaris-projects-a561cd5b.vercel.app
2. Login: agenziaseocagliari@gmail.com / WebProSEO@1980#
3. Sidebar → **Agenti AI**
4. **Risultato atteso**: Vedi 5 card con gli agenti:
   - 🔋 Health Monitor
   - 💳 Payment/Revenue Agent
   - 🎫 Support/Ticket Agent
   - 👥 User Engagement Agent
   - 🛡️ Security Watcher

### Test 3: Toggle Attivazione
- Clicca sul toggle di un agente
- Verifica che lo stato cambi da "Attivo" a "Inattivo"
- Counter in alto dovrebbe aggiornarsi (es. "4 / 5 agenti attivi")

---

## 🔍 DEBUG - Se ancora non vedi gli agenti

### Verifica RLS Policy

```sql
-- Verifica il tuo profilo
SELECT 
    id,
    email,
    role  -- DEVE essere 'super_admin'
FROM profiles
WHERE email = 'agenziaseocagliari@gmail.com';

-- Verifica policy
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'automation_agents';
```

**Risultato atteso**:
- `role = 'super_admin'` ✅
- Policy "Super admins can view all agents" presente ✅

### Verifica Console Browser

1. Apri **DevTools** (F12)
2. Vai su tab **Console**
3. Cerca errori tipo:
   - `Failed to fetch agents`
   - `Permission denied for table automation_agents`
   - `new row violates row-level security policy`

### Verifica Network Tab

1. DevTools → **Network**
2. Ricarica pagina Agenti AI
3. Cerca chiamata a `automation_agents`
4. Verifica:
   - Status: 200 ✅
   - Response: array con 5 oggetti ✅
   - Se Status 401/403 → problema RLS
   - Se Response vuoto [] → problema INSERT

---

## 📊 COMPONENTE FRONTEND

Il componente `AutomationAgents.tsx` carica così:

```tsx
const loadAgents = async () => {
    const { data, error } = await supabase
        .from('automation_agents')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) throw error;
    setAgents(data || []);
};
```

**Non c'è filtro**, quindi dovrebbe recuperare TUTTI gli agenti.

Se `data` è vuoto, significa che:
1. ❌ La tabella è vuota (esegui INSERT)
2. ❌ RLS blocca (verifica `role = 'super_admin'`)
3. ❌ Query fallisce (verifica error in console)

---

## 🎯 PROSSIMI STEP

**Dopo fix**:
1. ✅ Verifica che i 5 agenti siano visibili
2. ✅ Test toggle attivazione
3. ✅ Test configurazione (click su "Configura")
4. ✅ Test visualizzazione log (click su "Log")

**Possibili estensioni**:
- Creare Edge Function per popolare automaticamente se tabella vuota
- Aggiungere UNIQUE constraint su `name` per evitare duplicati
- Migrare da RLS su `profiles.role` a JWT claims

---

**File Utili**:
- `POPULATE_AUTOMATION_AGENTS.sql` - Script step-by-step
- `CHECK_AUTOMATION_AGENTS.sql` - Verifica rapida
- `supabase/migrations/20250102000000_create_agents_and_integrations.sql` - Migration completa

---

**Autore**: GitHub Copilot  
**Data**: 10 Ottobre 2025  
**Issue**: Agenti AI mancanti (0/0 invece di 5)
