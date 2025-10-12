-- ===== PHASE 3: ENHANCE EXISTING CONTACTS TABLE =====
-- Adding import tracking and duplicate detection to existing contacts

-- Check if columns already exist (run this first)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'contacts' 
  AND table_schema = 'public'
  AND column_name IN ('imported_from', 'import_row_number', 'last_import_update', 'import_metadata', 'normalized_email', 'normalized_phone', 'duplicate_check_hash');

-- ===== ADD IMPORT TRACKING COLUMNS =====

-- Add import tracking columns to contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS imported_from UUID REFERENCES contact_imports(id) ON DELETE SET NULL;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS import_row_number INTEGER;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_import_update TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS import_metadata JSONB DEFAULT '{}'::jsonb;

-- Create index on imported_from for finding all contacts from an import
CREATE INDEX IF NOT EXISTS idx_contacts_imported_from ON contacts(imported_from) WHERE imported_from IS NOT NULL;

-- ===== ADD DUPLICATE DETECTION COLUMNS =====

-- Add normalized fields for duplicate detection
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS normalized_email TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS normalized_phone TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS duplicate_check_hash TEXT;

-- Create indexes for duplicate detection
CREATE INDEX IF NOT EXISTS idx_contacts_normalized_email ON contacts(normalized_email) WHERE normalized_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_normalized_phone ON contacts(normalized_phone) WHERE normalized_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_contacts_duplicate_hash ON contacts(duplicate_check_hash) WHERE duplicate_check_hash IS NOT NULL;

-- ===== HELPER FUNCTIONS =====

-- Function to normalize email addresses
CREATE OR REPLACE FUNCTION normalize_email(email_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF email_input IS NULL OR trim(email_input) = '' THEN
        RETURN NULL;
    END IF;
    
    RETURN lower(trim(email_input));
END;
$$;

-- Function to normalize phone numbers (extract digits only)
CREATE OR REPLACE FUNCTION normalize_phone(phone_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF phone_input IS NULL OR trim(phone_input) = '' THEN
        RETURN NULL;
    END IF;
    
    -- Extract only digits from phone number
    RETURN regexp_replace(phone_input, '[^0-9]', '', 'g');
END;
$$;

-- Function to calculate duplicate detection hash
CREATE OR REPLACE FUNCTION calculate_duplicate_hash(email_input TEXT, phone_input TEXT, name_input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    normalized_email_val TEXT;
    normalized_phone_val TEXT;
    normalized_name_val TEXT;
    hash_input TEXT;
BEGIN
    -- Normalize inputs
    normalized_email_val = normalize_email(email_input);
    normalized_phone_val = normalize_phone(phone_input);
    normalized_name_val = CASE 
        WHEN name_input IS NOT NULL THEN lower(trim(regexp_replace(name_input, '\s+', ' ', 'g')))
        ELSE NULL
    END;
    
    -- Create hash input (use coalesce to handle NULLs)
    hash_input = COALESCE(normalized_email_val, '') || '|' || 
                 COALESCE(normalized_phone_val, '') || '|' || 
                 COALESCE(normalized_name_val, '');
    
    -- Return MD5 hash
    RETURN md5(hash_input);
END;
$$;

-- ===== TRIGGER TO AUTO-UPDATE NORMALIZED FIELDS =====

-- Function to update normalized fields on insert/update
CREATE OR REPLACE FUNCTION update_contact_normalized_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update normalized fields
    NEW.normalized_email = normalize_email(NEW.email);
    NEW.normalized_phone = normalize_phone(NEW.phone);
    NEW.duplicate_check_hash = calculate_duplicate_hash(NEW.email, NEW.phone, NEW.name);
    
    RETURN NEW;
END;
$$;

-- Create trigger to automatically update normalized fields
DROP TRIGGER IF EXISTS trigger_update_contact_normalized_fields ON contacts;
CREATE TRIGGER trigger_update_contact_normalized_fields
    BEFORE INSERT OR UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_normalized_fields();

-- ===== UPDATE EXISTING CONTACTS =====

-- Update existing contacts to populate normalized fields
UPDATE contacts 
SET 
    normalized_email = normalize_email(email),
    normalized_phone = normalize_phone(phone),
    duplicate_check_hash = calculate_duplicate_hash(email, phone, name)
WHERE 
    normalized_email IS NULL 
    OR normalized_phone IS NULL 
    OR duplicate_check_hash IS NULL;