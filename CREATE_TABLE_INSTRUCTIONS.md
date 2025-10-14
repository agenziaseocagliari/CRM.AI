🚨 EMERGENCY: CREATE contact_notes TABLE MANUALLY

**Go to Supabase Dashboard NOW:**

1. Open: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi
2. Click "SQL Editor" (left sidebar)
3. Click "New Query"
4. Copy and paste this EXACT SQL:

```sql
-- Create contact_notes table
CREATE TABLE IF NOT EXISTS public.contact_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contact_notes_contact_id ON public.contact_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_notes_created_at ON public.contact_notes(created_at DESC);

-- Enable RLS
ALTER TABLE public.contact_notes ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies
CREATE POLICY "Enable read for authenticated users"
ON public.contact_notes FOR SELECT
TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON public.contact_notes FOR INSERT
TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable update for own notes"
ON public.contact_notes FOR UPDATE
TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "Enable delete for own notes"
ON public.contact_notes FOR DELETE
TO authenticated USING (auth.uid() = created_by);

-- Update trigger
CREATE OR REPLACE FUNCTION update_contact_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contact_notes_updated_at
    BEFORE UPDATE ON public.contact_notes
    FOR EACH ROW EXECUTE FUNCTION update_contact_notes_updated_at();
```

5. Click "RUN" (or press F5)
6. Should see: "Success. No rows returned"
7. Verify: Go to "Table Editor" → Should see "contact_notes" in the list

**CRITICAL**: Do this NOW before testing the fixes!

**After creating table, test:**

1. Open contact modal
2. Add note: "Test note 123"
3. Should see success toast
4. Note should appear in list

IF SUCCESSFUL: ✅ Bug 1 FIXED
IF FAILS: Check browser console for errors
