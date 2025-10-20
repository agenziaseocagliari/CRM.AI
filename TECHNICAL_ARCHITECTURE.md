# 🏗️ Guardian AI CRM - Technical Architecture Guide

**Last Updated**: 20/10/2025, 21:39
**Version**: 1.0.0  
**Purpose**: Quick reference for new Claude sessions to avoid forensic analysis

---

## 📊 PROJECT STRUCTURE

### Key Directories
```
src/
├── features/ 🎯 Feature-based modules (insurance, shared)
├── components/ 🧩 Reusable UI components (60+)
├── pages/ 📄 Page components
├── hooks/ 🪝 Custom React hooks (useCrmData, useVertical, useAuth)
├── contexts/ 🌐 React contexts (AuthContext)
├── types/ 📝 TypeScript definitions
└── lib/ 🔧 Core utilities (supabaseClient)
```

### Insurance Module Location
```
src/features/insurance/
├── components/ (Phase 1.1: PoliciesList, PolicyForm, PolicyDetail)
├── hooks/ (usePolicies)
├── types/ (insurance.ts)
└── services/ (policiesService.ts)
```

---

## 🔌 INTEGRATION POINTS

### 1. Authentication
```typescript
import { useAuth } from '../contexts/AuthContext';

const { organizationId, session, userRole } = useAuth();
```

### 2. Vertical System
```typescript
import { useVertical } from '../hooks/useVertical';

const { vertical, hasModule } = useVertical();
const isInsurance = vertical === 'insurance';
```

### 3. Database Access
```typescript
import { supabase } from '../lib/supabaseClient';

const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('organization_id', organizationId);
```

---

## 🎨 UI PATTERNS

### CSS Framework
- **Tailwind CSS 3.4.3** (no CSS modules)
- Custom theme in `tailwind.config.js`
- Safelist with 100+ pre-approved classes

### Icon Library
```typescript
import { Plus, Edit, Trash2 } from 'lucide-react'; // v0.544.0
```

### Button Pattern
```jsx
<button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
  <Plus className="w-4 h-4 mr-2" />
  Action
</button>
```

### Card Pattern
```jsx
<div className="bg-white rounded-lg shadow border p-6">
  <h3 className="text-lg font-semibold mb-4">Title</h3>
  {/* Content */}
</div>
```

### Table Pattern
```jsx
<div className="overflow-x-auto">
  <table className="min-w-full bg-white">
    <thead className="bg-gray-50">...</thead>
    <tbody className="divide-y divide-gray-200">...</tbody>
  </table>
</div>
```

---

## 📝 FORM PATTERNS

### State Management
```typescript
const [formData, setFormData] = useState<FormType>({
  field1: '',
  field2: '',
});

const [errors, setErrors] = useState<Record<string, string>>({});
```

### Validation
```typescript
const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};
  
  if (!formData.field1.trim()) {
    newErrors.field1 = 'Campo obbligatorio';
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

### Submit Handler
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!validateForm()) return;
  
  try {
    setLoading(true);
    // Supabase call
    toast.success('Salvato!');
  } catch (error) {
    toast.error('Errore');
  } finally {
    setLoading(false);
  }
};
```

---

## 🗄️ DATABASE PATTERNS

### Table Creation
```sql
CREATE TABLE IF NOT EXISTS table_name (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    -- fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### RLS Policy Pattern
```sql
CREATE POLICY "Users can view their organization's data" 
ON table_name FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);
```

### Indexes
```sql
CREATE INDEX idx_table_org ON table_name(organization_id);
CREATE INDEX idx_table_created ON table_name(created_at DESC);
```

### Updated_at Trigger
```sql
CREATE TRIGGER update_table_updated_at_trigger
    BEFORE UPDATE ON table_name
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

---

## 📐 TYPESCRIPT CONVENTIONS

### Interface Pattern
```typescript
export interface EntityName {
  id: string;                    // UUID
  organization_id: string;       // Required for RLS
  field: string;
  optional_field?: string | null;
  created_at: string;           // ISO date string
  updated_at: string;
}
```

### Enums
```typescript
export enum StatusType {
  Active = 'active',
  Inactive = 'inactive',
}
```

### With Relations
```typescript
export interface EntityWithRelation extends Entity {
  relation: RelatedEntity;
}
```

---

## 🛣️ ROUTING PATTERNS

### Protected Routes
```tsx
<Route
  path="/insurance/*"
  element={
    session ? (
      <InsuranceOnlyGuard>
        <Routes>
          <Route path="policies" element={<PoliciesPage />} />
        </Routes>
      </InsuranceOnlyGuard>
    ) : (
      <Navigate to="/login" replace />
    )
  }
/>
```

### Navigation
```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/path');
navigate('/path', { state: { data } });
```

---

## 🚫 ANTI-PATTERNS (DO NOT)

❌ DO NOT use external state management (Redux, Zustand)  
❌ DO NOT use form libraries (React Hook Form, Formik)  
❌ DO NOT use CSS modules or styled-components  
❌ DO NOT bypass RLS policies  
❌ DO NOT use different icon libraries  
❌ DO NOT create custom routing patterns  

---

## ✅ NAMING CONVENTIONS

- **Files**: PascalCase.tsx
- **Functions**: handleSubmit, fetchData, validateForm
- **Variables**: contacts, isLoading, formData
- **Components**: export default ComponentName
- **Enums**: PascalCase values

---

## 📦 DEPENDENCIES

```json
{
  "react": "19.1.1",
  "typescript": "5.9.3",
  "@supabase/supabase-js": "2.75.0",
  "react-router-dom": "6.23.1",
  "lucide-react": "0.544.0",
  "tailwindcss": "3.4.3"
}
```

---

## 🔗 QUICK LINKS

- [Roadmap](./MASTER_ROADMAP_OCT_2025.md)
- [Prompt Template](./docs/PROMPT_TEMPLATE_LEVEL6.md)
- [Forensic Analysis](./docs/FORENSIC_ANALYSIS_17OCT2025.md)

---

**END OF TECHNICAL ARCHITECTURE**