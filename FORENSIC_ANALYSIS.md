# FORENSIC ANALYSIS - Code Comparison Analysis

## Opportunities Module (WORKING)

### Import statement:

```tsx
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useOutletContext } from 'react-router-dom';

import { useCrmData } from '../hooks/useCrmData';
import { supabase } from '../lib/supabaseClient';
import { OpportunitiesData, Opportunity, PipelineStage } from '../types';
```

### Data loading:

```tsx
// Uses useOutletContext to get data from useCrmData hook
const contextData = useOutletContext<ReturnType<typeof useCrmData>>();
const {
  opportunities: initialData,
  contacts,
  organization,
  refetch: refetchData,
} = contextData || {};

// Uses context-provided data directly
const [boardData, setBoardData] = useState<OpportunitiesData>(
  initialData || {}
);
```

### Organization ID:

```tsx
// Gets organization from context provided by useCrmData
const {
  opportunities: initialData,
  contacts,
  organization,
  refetch: refetchData,
} = contextData || {};
// Organization context is managed by parent layout/outlet
```

### Query:

```tsx
// Queries are handled by useCrmData hook in the context provider
// Uses Supabase queries with proper organization scoping in useCrmData.ts
```

---

## Reports Module (BROKEN)

### Import statement:

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tab } from '@headlessui/react';
// Missing React Router imports (useOutletContext)
// Missing useCrmData hook import

import { supabase } from '../../../lib/supabaseClient'; // Different path!
import { format } from 'date-fns';
import toast from 'react-hot-toast';
```

### Data loading:

```tsx
// Implements its own data loading instead of using context
async function getUserOrganizationId(): Promise<string | null> {
  // Custom authentication logic
}

const loadAllReportsData = useCallback(async () => {
  // Custom Supabase queries instead of using useCrmData
  const orgId = await getUserOrganizationId();
  const { data: opportunities, error: oppError } = await supabase
    .from('opportunities')
    .select('...')
    .eq('organization_id', orgId);
});
```

### Organization ID:

```tsx
// Custom getUserOrganizationId function instead of context
async function getUserOrganizationId(): Promise<string | null> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  const { data: userOrg, error: orgError } = await supabase
    .from('user_organizations')
    .select('organization_id')
    .eq('user_id', user.id)
    .single();
  return userOrg.organization_id;
}
```

### Query:

```tsx
// Direct Supabase queries instead of using useCrmData context
const { data: opportunities, error: oppError } = await supabase
  .from('opportunities')
  .select(
    `
    id,
    contact_name,
    value,
    stage,
    status,
    close_date,
    created_at,
    updated_at
  `
  )
  .eq('organization_id', orgId);
```

---

## DIFFERENCES IDENTIFIED

### 1. Architecture Pattern Mismatch

- **Opportunities**: Uses React Router context + useCrmData hook (shared state pattern)
- **Reports**: Uses Next.js 'use client' + custom data loading (isolated pattern)

### 2. Supabase Import Path Difference

- **Opportunities**: `import { supabase } from '../lib/supabaseClient';` (relative path)
- **Reports**: `import { supabase } from '../../../lib/supabaseClient';` (different relative path)

### 3. Data Loading Strategy Difference

- **Opportunities**: Leverages useCrmData hook context (tested and working)
- **Reports**: Implements custom getUserOrganizationId + direct queries (untested)

### 4. React Framework Mismatch

- **Opportunities**: Standard React component using React Router context
- **Reports**: Next.js 13+ App Router pattern with 'use client' directive

### 5. State Management Difference

- **Opportunities**: Uses shared context state via useOutletContext
- **Reports**: Uses isolated useState with custom loading functions

---

## HYPOTHESIS

**Based on differences, the failure is caused by:**

**PRIMARY CAUSE**: Architecture mismatch - Reports module was built as Next.js App Router page but the app uses React Router + context pattern.

**SECONDARY CAUSES**:

1. Wrong import path for supabase client
2. Custom authentication logic not matching the working pattern
3. Missing React Router context integration
4. Not using proven useCrmData hook that works in Opportunities

**ROOT ISSUE**: Reports page (`src/app/dashboard/reports/page.tsx`) is a Next.js App Router component but the rest of the app uses React Router + outlet context pattern. This explains why it can't access the working data context that Opportunities uses successfully.
