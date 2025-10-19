# 🔧 Supabase Nested Query Fix - Errore 400 Bad Request

## 🚨 DIAGNOSI DEL PROBLEMA

### Schema Database Analysis

```sql
-- insurance_policies table
contact_id        | uuid (FK → contacts.id)
created_by        | uuid (FK → auth.users.id)

-- contacts table
id               | uuid (PK)
name, email, phone, company | text

-- profiles table
id               | uuid (FK → auth.users.id)
email            | text (NOTA: profiles non ha colonna email!)
full_name        | text
```

### ❌ Query Problematica Attuale

```typescript
.select(`
  *,
  contact:contacts(id, name, email, phone, company),
  created_by_user:profiles(email)
`)
```

**Errori identificati:**

1. **Sintassi Alias Errata**: `contact:contacts` dovrebbe essere solo `contacts`
2. **Campo Email Mancante**: `profiles` non ha una colonna `email`
3. **Relationship Name**: L'alias `created_by_user` non corrisponde al foreign key `created_by`

## ✅ SOLUZIONI

### 1. Query Corretta per Supabase JS

```typescript
const { data, error } = await supabase
  .from('insurance_policies')
  .select(
    `
    *,
    contacts!contact_id(id, name, email, phone, company),
    profiles!created_by(id, full_name)
  `
  )
  .eq('id', policy_id)
  .single();
```

### 2. Query REST API Corretta

```http
GET /rest/v1/insurance_policies?select=*,contacts!contact_id(id,name,email,phone,company),profiles!created_by(id,full_name)&id=eq.<policy_id>&organization_id=eq.<org_id>
```

### 3. Query Alternativa con Nomi Semplici

```typescript
const { data, error } = await supabase
  .from('insurance_policies')
  .select(
    `
    *,
    contacts(id, name, email, phone, company),
    profiles(id, full_name)
  `
  )
  .eq('id', policy_id)
  .single();
```

## 🔐 RLS POLICIES VERIFICATION

### Policies Attuali (già configurate)

```sql
-- insurance_policies: ✅ OK
POLICY "Users can view their organization's policies" FOR SELECT
USING ((organization_id IN ( SELECT profiles.organization_id
       FROM profiles WHERE (profiles.id = auth.uid()))))

-- contacts: ✅ OK
POLICY "Users can see contacts of their own organization" FOR SELECT
USING ((organization_id = get_my_organization_id()))

-- profiles: ✅ OK
POLICY "Users can view their own profile" FOR SELECT
USING ((auth.uid() = id))
```

### ⚠️ Possibile Problema con created_by

Il campo `created_by` in `insurance_policies` punta a `auth.users.id`, ma l'RLS policy di `profiles` permette solo di vedere il proprio profilo. Se il `created_by` è diverso dall'utente corrente, la query fallirà.

**Soluzione RLS per profiles:**

```sql
-- Permetti agli utenti di vedere profili della stessa organizzazione
CREATE POLICY "Users can view organization profiles" ON profiles
FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT organization_id
    FROM profiles
    WHERE id = auth.uid()
  )
);
```

## 🛠️ IMPLEMENTAZIONE NEL CODICE

### File: src/features/insurance/components/PolicyDetail.tsx

```typescript
// Vecchia query (ERRATA)
let query = supabase
  .from('insurance_policies')
  .select(
    `
    *,
    contact:contacts(id, name, email, phone, company),
    created_by_user:profiles(email)
  `
  )
  .eq('id', id);

// Nuova query (CORRETTA)
let query = supabase
  .from('insurance_policies')
  .select(
    `
    *,
    contacts!contact_id(id, name, email, phone, company),
    profiles!created_by(id, full_name)
  `
  )
  .eq('id', id);
```

### Aggiornamento Type Interface

```typescript
interface PolicyDetail {
  // ... altri campi
  contacts?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
  };
  profiles?: {
    id: string;
    full_name?: string;
  };
}
```

## 🎯 QUERY ALTERNATIVE

### Opzione 1: Query Semplificata (Più Sicura)

```typescript
// Prima fetch della policy
const { data: policy, error: policyError } = await supabase
  .from('insurance_policies')
  .select('*')
  .eq('id', id)
  .single();

// Poi fetch separata del contact
const { data: contact } = await supabase
  .from('contacts')
  .select('id, name, email, phone, company')
  .eq('id', policy.contact_id)
  .single();

// Poi fetch separata del user profile
const { data: creator } = await supabase
  .from('profiles')
  .select('id, full_name')
  .eq('id', policy.created_by)
  .single();
```

### Opzione 2: Edge Function

Se le query nested continuano a dare problemi, creare una Edge Function:

```typescript
// supabase/functions/get-policy-detail/index.ts
const { data: result } = await supabase
  .from('insurance_policies')
  .select(
    `
    *,
    contacts!contact_id(*),
    profiles!created_by(*)
  `
  )
  .eq('id', policyId)
  .single();

return new Response(JSON.stringify(result));
```

## 🧪 TEST DELLE QUERY

### 1. Test REST API via curl

```bash
curl -X GET \
  "https://qjtaqrlpronohgpfdxsi.supabase.co/rest/v1/insurance_policies?select=*,contacts!contact_id(id,name,email,phone,company),profiles!created_by(id,full_name)&id=eq.YOUR_UUID" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_JWT"
```

### 2. Test in Browser Console

```javascript
const { data, error } = await supabase
  .from('insurance_policies')
  .select(
    '*,contacts!contact_id(id,name,email,phone,company),profiles!created_by(id,full_name)'
  )
  .eq('id', 'YOUR_POLICY_UUID')
  .single();

console.log('Result:', { data, error });
```

## 📋 CHECKLIST IMPLEMENTAZIONE

- [ ] Aggiorna query in PolicyDetail.tsx
- [ ] Aggiorna interface TypeScript
- [ ] Testa query in browser console
- [ ] Verifica RLS policies per profiles
- [ ] Aggiorna rendering component per usare `full_name` invece di `email`
- [ ] Test completo navigazione policy detail
- [ ] Deploy e test in produzione

## 🚀 RISULTATO ATTESO

```json
{
  "id": "uuid",
  "policy_number": "POL001",
  "contacts": {
    "id": "uuid",
    "name": "Mario Rossi",
    "email": "mario@email.com",
    "phone": "+39 333 1234567",
    "company": "Azienda Auto"
  },
  "profiles": {
    "id": "uuid",
    "full_name": "Admin User"
  }
}
```
