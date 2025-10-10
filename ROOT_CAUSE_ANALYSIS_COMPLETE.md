# ROOT CAUSE ANALYSIS - Custom Access Token Hook Non Funzionante

**Data**: 10 Ottobre 2025  
**Problema**: GoTrue non chiama `custom_access_token_hook` durante la generazione JWT  
**Impatto**: JWT manca di custom claims (user_role, organization_id, is_super_admin)

---

## 1. FATTI VERIFICATI

### ✅ Configurazione Hook (Management API)
- **Stato**: `hook_custom_access_token_enabled: true`
- **URI**: `pg-functions://postgres/public/custom_access_token_hook`
- **Secrets**: `null` (corretto)
- **Fonte**: Verificato via `curl https://api.supabase.com/v1/projects/qjtaqrlpronohgpfdxsi/config/auth`

### ✅ Funzione SQL
- **Exists**: Sì, in `public.custom_access_token_hook(event jsonb)`
- **Volatility**: `STABLE` (corretto per hook)
- **Security Definer**: `false` (rimosso - corretto)
- **Permissions**: 
  - `supabase_auth_admin`: `EXECUTE` ✅
  - `postgres`: `EXECUTE` ✅
  - `service_role`: `EXECUTE` ✅
- **Test Manuale**: Funziona ✅ (restituisce user_role correttamente)
- **Formato Return**: CORRETTO (restituisce evento completo con `user_id` + `claims`)

### ✅ Database
- **Profili**: Esistono con `user_role` popolato
- **Ruoli**: Tutti i 7 ruoli necessari esistono (incluso `supabase_auth_admin`)
- **Sessions**: Invalidate multiple volte

### ❌ JWT Generato
- **Top-level claims**: user_role MANCANTE
- **app_metadata**: user_role PRESENTE ✅
- **user_metadata**: user_role PRESENTE ✅ (dopo FIX_USER_METADATA_PROMOTION.sql)
- **Conclusione**: L'hook NON viene chiamato da GoTrue

---

## 2. IPOTESI ROOT CAUSE

### Ipotesi A: GoTrue Non Carica Configurazione dal Management API
**Evidenza**:
- Hook enabled=true in API
- Ma GoTrue potrebbe leggere config da variabili d'ambiente o file config
- GoTrue v2.179.0 potrebbe non supportare hot-reload config

**Test**:
```bash
# Verificare env vars del container GoTrue
SELECT name, setting FROM pg_settings WHERE name LIKE '%hook%';
```

### Ipotesi B: Incompatibilità Versione GoTrue con pg-functions Hooks
**Evidenza**:
- GoTrue v2.179.0 (verificato)
- `pg-functions://` URI potrebbe non essere supportato in questa versione
- Supabase potrebbe richiedere HTTP hooks invece di pg-functions

**Test**:
```bash
# Verificare release notes GoTrue v2.179.0
# Cercare documentazione Supabase su hook types supportati
```

### Ipotesi C: Hook Richiede HTTP Endpoint, Non Postgres Function
**Evidenza**:
- Alcuni progetti Supabase usano `https://` URI per hooks
- `pg-functions://` potrebbe essere deprecato o non supportato

**Test**:
```sql
-- Verificare documentazione ufficiale Supabase
-- Cercare progetti simili che usano custom access token hooks
```

### Ipotesi D: Missing JWT_SECRET o Configurazione Secrets
**Evidenza**:
- Hook secrets è `null`
- Alcuni hooks potrebbero richiedere secrets per firma JWT

**Test**:
```bash
# Verificare se JWT_SECRET deve essere configurato
curl -X PATCH https://api.supabase.com/v1/projects/qjtaqrlpronohgpfdxsi/config/auth \
  -H "Authorization: Bearer sbp_e07c1443bcf5bd2abc264b6e2740abb92ce411e3" \
  -d '{"hook_custom_access_token_secrets": "test_secret"}'
```

---

## 3. ARCHITETTURA ATTUALE vs FUNZIONANTE

### Come Dovrebbe Funzionare
```
Login → GoTrue → Chiama Hook → Hook Aggiunge Claims → JWT Generato con Claims
```

### Come Funziona Ora
```
Login → GoTrue → (Hook NON chiamato) → JWT Generato SENZA Custom Claims
```

### Cosa Funziona Già
```
Login → GoTrue → Legge app_metadata → JWT contiene app_metadata.user_role ✅
Login → GoTrue → Legge user_metadata → JWT contiene user_metadata.user_role ✅
```

---

## 4. SOLUZIONI POSSIBILI (IN ORDINE DI PREFERENZA)

### Soluzione 1: FIX Hook (SE POSSIBILE)
**Pro**:
- Architettura corretta
- Centralizza logica auth
- Facile manutenzione

**Contro**:
- Non funziona da ore di debugging
- Possibile incompatibilità Supabase

**Steps**:
1. Verificare documentazione Supabase ufficiale su custom access token hooks
2. Testare con HTTP endpoint invece di pg-functions
3. Verificare compatibilità GoTrue v2.179.0

### Soluzione 2: Trigger Database (ARCHITETTURALMENTE VALIDA)
**Descrizione**: Usare trigger PostgreSQL per auto-sync `app_metadata` → `user_metadata`

**Pro**:
- ✅ Soluzione nativa PostgreSQL
- ✅ Non dipende da GoTrue
- ✅ user_metadata viene SEMPRE promossa a JWT da Supabase (verificato)
- ✅ Automatica su INSERT/UPDATE auth.users

**Contro**:
- Richiede trigger maintenance

**Implementazione**:
```sql
CREATE OR REPLACE FUNCTION auth.sync_user_metadata()
RETURNS TRIGGER AS $$
BEGIN
  NEW.raw_user_meta_data := NEW.raw_user_meta_data || jsonb_build_object(
    'user_role', NEW.raw_app_meta_data->>'user_role',
    'organization_id', (SELECT organization_id::text FROM public.profiles WHERE id = NEW.id),
    'is_super_admin', (NEW.raw_app_meta_data->>'user_role' = 'super_admin')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_user_metadata_trigger
  BEFORE INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.sync_user_metadata();
```

### Soluzione 3: Frontend Type-Safe Adaptation (WORKAROUND TEMPORANEO)
**Descrizione**: Modificare frontend per leggere da user_metadata/app_metadata con types corretti

**Pro**:
- Rapido
- Type-safe

**Contro**:
- ❌ Workaround non architetturale
- ❌ Ogni componente deve sapere dove leggere

---

## 5. DECISIONE FINALE

**RACCOMANDAZIONE: Soluzione 2 (Trigger Database)**

**Motivo**:
1. Hook non funziona dopo 4 ore di debugging
2. Trigger è soluzione nativa PostgreSQL (non workaround)
3. `user_metadata` → JWT promotion è meccanismo GARANTITO da Supabase
4. Già verificato che funziona (JWT contiene user_metadata.user_role)
5. Auto-sync permanente, non richiede azioni manuali

**Implementazione**:
1. Creare trigger `sync_user_metadata_trigger`
2. Eseguire UPDATE manuale per utenti esistenti
3. Invalidare sessioni
4. Test login
5. Deploy

**Rollback Plan**:
Se trigger causa problemi:
```sql
DROP TRIGGER sync_user_metadata_trigger ON auth.users;
DROP FUNCTION auth.sync_user_metadata();
```

---

## 6. PROSSIMI STEP (ESECUZIONE)

1. ✅ Creare script SQL per trigger
2. ⏳ Eseguire su Supabase
3. ⏳ Testare con nuovo utente (INSERT trigger)
4. ⏳ Testare login esistente
5. ⏳ Verificare JWT contiene claims top-level
6. ⏳ Deploy frontend (non richiede modifiche)
7. ⏳ Test produzione

**Tempo stimato**: 15 minuti  
**Confidence**: 95% (user_metadata promotion verificata funzionante)
