# 🔧 View Migration Best Practices

**Data**: 2025-01-24  
**Tipo**: Best Practices Documentation  
**Stato**: ✅ Attivo

---

## 🎯 Obiettivo

Questa guida documenta le best practices per la gestione delle VIEW nelle migration PostgreSQL per evitare errori comuni durante il deploy, in particolare l'errore `SQLSTATE 42P16: cannot drop columns from view`.

---

## 🚨 Problema Comune: SQLSTATE 42P16

### Errore Tipico
```
ERROR: cannot drop columns from view (SQLSTATE 42P16)
```

### Causa
Questo errore si verifica quando si usa `CREATE OR REPLACE VIEW` e si tenta di:
- ✗ Aggiungere nuove colonne
- ✗ Rimuovere colonne esistenti
- ✗ Cambiare i nomi delle colonne (anche con alias)
- ✗ Cambiare l'ordine delle colonne
- ✗ Cambiare il tipo di dato delle colonne

PostgreSQL non permette di modificare la struttura di una VIEW esistente usando `CREATE OR REPLACE VIEW`. Questo comando funziona solo quando la nuova definizione mantiene la stessa struttura di colonne.

---

## ✅ Soluzione: Pattern Idempotente DROP-CREATE

### Pattern Corretto

**SEMPRE** seguire questo pattern nelle migration:

```sql
-- Note: DROP VIEW first to prevent SQLSTATE 42P16 error when changing view structure
DROP VIEW IF EXISTS view_name CASCADE;

CREATE VIEW view_name AS
SELECT
  column1,
  column2,
  column3
FROM table_name;
```

### ❌ Pattern Errato (Da NON Usare)

```sql
-- ERRATO: Può causare SQLSTATE 42P16 se la struttura cambia
CREATE OR REPLACE VIEW view_name AS
SELECT
  column1,
  column2,
  new_column3  -- ❌ Questa modifica causerà errore
FROM table_name;
```

---

## 📋 Checklist per Migration con VIEW

Prima di deployare una migration che crea o modifica VIEW:

- [ ] ✅ Ho aggiunto `DROP VIEW IF EXISTS view_name CASCADE;` prima del CREATE
- [ ] ✅ Ho usato `CREATE VIEW` invece di `CREATE OR REPLACE VIEW`
- [ ] ✅ Ho aggiunto un commento che spiega il pattern idempotente
- [ ] ✅ Ho verificato che eventuali VIEW dipendenti siano gestite correttamente dal CASCADE
- [ ] ✅ Ho testato la migration in ambiente staging/test

---

## 🔍 Dettagli Tecnici

### Perché usare CASCADE?

Il modificatore `CASCADE` assicura che:
- Eventuali VIEW dipendenti vengano eliminate automaticamente
- Trigger o funzioni che dipendono dalla VIEW vengano gestiti correttamente
- Non ci siano errori di dipendenze durante il DROP

### Quando NON usare CASCADE?

Se hai VIEW dipendenti che NON vuoi eliminare automaticamente, puoi:
1. Usare `DROP VIEW IF EXISTS view_name;` (senza CASCADE) e gestire manualmente le dipendenze
2. O ricreare esplicitamente tutte le VIEW dipendenti nella stessa migration

---

## 📝 Esempi di Implementazione

### Esempio 1: VIEW Semplice

```sql
-- Sistema di monitoraggio indici
-- Note: DROP VIEW first to prevent SQLSTATE 42P16 error when changing view structure
DROP VIEW IF EXISTS v_index_usage_stats CASCADE;

CREATE VIEW v_index_usage_stats AS
SELECT
  schemaname,
  relname as tablename,
  indexrelname as indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

COMMENT ON VIEW v_index_usage_stats IS 
  'Provides statistics on index usage for performance monitoring';
```

### Esempio 2: VIEW con JOIN Complessi

```sql
-- Recent alerts summary
-- Note: DROP VIEW first to prevent SQLSTATE 42P16 error when changing view structure
DROP VIEW IF EXISTS v_recent_alerts CASCADE;

CREATE VIEW v_recent_alerts AS
SELECT
  ar.rule_name,
  ar.severity,
  ah.alert_message,
  ah.status,
  ah.triggered_at,
  ah.acknowledged_at,
  ah.resolved_at,
  EXTRACT(EPOCH FROM (COALESCE(ah.resolved_at, NOW()) - ah.triggered_at)) / 60 as duration_minutes
FROM alert_history ah
JOIN alert_rules ar ON ah.alert_rule_id = ar.id
WHERE ah.triggered_at > NOW() - INTERVAL '24 hours'
ORDER BY ah.triggered_at DESC;

COMMENT ON VIEW v_recent_alerts IS 
  'Shows recent alert history with duration calculation';
```

### Esempio 3: VIEW con Aggregazioni

```sql
-- System health overview
-- Note: DROP VIEW first to prevent SQLSTATE 42P16 error when changing view structure
DROP VIEW IF EXISTS v_system_health_overview CASCADE;

CREATE VIEW v_system_health_overview AS
SELECT
  check_type,
  COUNT(*) as total_checks,
  COUNT(*) FILTER (WHERE status = 'healthy') as healthy_count,
  COUNT(*) FILTER (WHERE status = 'degraded') as degraded_count,
  COUNT(*) FILTER (WHERE status = 'down') as down_count,
  AVG(response_time_ms) as avg_response_time_ms,
  MAX(checked_at) as last_check_time
FROM system_health_checks
WHERE checked_at > NOW() - INTERVAL '1 hour'
GROUP BY check_type;

COMMENT ON VIEW v_system_health_overview IS 
  'Real-time system health overview with aggregated statistics';
```

---

## 🎓 Best Practices Summary

### Regole d'Oro

1. ✅ **SEMPRE** usare `DROP VIEW IF EXISTS ... CASCADE;` prima di creare una VIEW in una migration
2. ✅ **SEMPRE** usare `CREATE VIEW` (non `CREATE OR REPLACE VIEW`) quando la struttura potrebbe cambiare
3. ✅ **SEMPRE** aggiungere un commento che spiega il pattern idempotente
4. ✅ **SEMPRE** aggiungere un `COMMENT ON VIEW` per documentare lo scopo della VIEW
5. ✅ **SEMPRE** testare la migration in staging prima del deploy in produzione

### Quando Usare CREATE OR REPLACE VIEW

`CREATE OR REPLACE VIEW` può essere usato **SOLO** quando:
- La VIEW esiste già con esattamente la stessa struttura di colonne (stesso numero, stesso ordine, stessi nomi)
- Si sta solo modificando la query interna senza cambiare l'output
- Si è assolutamente certi che la struttura non cambierà

Tuttavia, per massima sicurezza e idempotenza, **si raccomanda sempre di usare il pattern DROP-CREATE**.

---

## 🔗 Riferimenti

### File Migration Corretti

Questi file seguono il pattern corretto e possono essere usati come riferimento:

- `supabase/migrations/20250123000000_phase3_performance_indexes.sql`
  - ✅ `v_index_usage_stats`
  - ✅ `v_table_stats`

- `supabase/migrations/20250123000001_phase3_system_health_monitoring.sql`
  - ✅ `v_system_health_overview`
  - ✅ `v_recent_alerts`
  - ✅ `v_metric_trends_hourly`

### Documentazione Correlata

- `MIGRATION_ROBUSTNESS_GUIDE.md` - Guida generale per migration robuste
- `MIGRATION_FIX_SUMMARY.md` - Best practices per idempotenza
- `RISOLUZIONE_ERRORE_VIEW_IT.md` - Fix specifico per v_index_usage_stats

---

## 🚀 Deploy Checklist

Prima di ogni deploy con VIEW:

1. ✅ Verifica che tutte le VIEW usino il pattern DROP-CREATE
2. ✅ Testa la migration in staging
3. ✅ Verifica che le VIEW dipendenti siano gestite correttamente
4. ✅ Conferma che i COMMENT sulle VIEW siano presenti
5. ✅ Esegui il deploy in produzione
6. ✅ Verifica post-deploy che le VIEW funzionino correttamente

### Query di Verifica Post-Deploy

```sql
-- Verifica che la VIEW esista
SELECT viewname, definition 
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname = 'your_view_name';

-- Testa che la VIEW restituisca dati
SELECT * FROM your_view_name LIMIT 5;

-- Verifica il commento sulla VIEW
SELECT 
    schemaname,
    viewname,
    obj_description(
        (schemaname || '.' || viewname)::regclass, 
        'pg_class'
    ) as comment
FROM pg_views
WHERE schemaname = 'public'
AND viewname = 'your_view_name';
```

---

## 📞 Supporto

Per domande o problemi relativi alle VIEW migrations:
1. Consulta questa guida
2. Verifica gli esempi nei file migration esistenti
3. Controlla la documentazione PostgreSQL ufficiale
4. Crea un issue nel repository con tag `database-migration`

---

**Importante**: Questa è una best practice enterprise-level per garantire deploy sicuri e idempotenti. Seguire sempre questi pattern per evitare interruzioni di servizio.
