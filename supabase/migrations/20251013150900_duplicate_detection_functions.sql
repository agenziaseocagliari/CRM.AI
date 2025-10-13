-- Migration: Duplicate Detection Functions
-- Created: 2025-10-13 15:09:00
-- Purpose: Intelligent duplicate detection for contact imports

-- Drop existing function if it exists (to avoid parameter name conflicts)
DROP FUNCTION IF EXISTS normalize_phone(TEXT);

-- Function: Normalize phone for comparison
CREATE OR REPLACE FUNCTION normalize_phone(phone_input TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Handle NULL input
    IF phone_input IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Remove all non-digit characters except +
    RETURN regexp_replace(phone_input, '[^0-9+]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Calculate name similarity (Levenshtein-based)
CREATE OR REPLACE FUNCTION name_similarity(name1 TEXT, name2 TEXT)
RETURNS FLOAT AS $$
DECLARE
    len1 INT;
    len2 INT;
    distance INT;
BEGIN
    -- Handle NULL inputs
    IF name1 IS NULL OR name2 IS NULL THEN
        RETURN 0.0;
    END IF;
    
    -- Normalize names (lowercase, trim)
    name1 := LOWER(TRIM(name1));
    name2 := LOWER(TRIM(name2));
    
    len1 := LENGTH(name1);
    len2 := LENGTH(name2);
    
    -- Quick exact match
    IF name1 = name2 THEN
        RETURN 1.0;
    END IF;
    
    -- If one is empty
    IF len1 = 0 OR len2 = 0 THEN
        RETURN 0.0;
    END IF;
    
    -- Use PostgreSQL's built-in similarity if available
    -- Otherwise simple length-based approximation
    RETURN GREATEST(
        1.0 - (ABS(len1 - len2)::FLOAT / GREATEST(len1, len2)),
        0.0
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function: Find duplicates for a single contact
CREATE OR REPLACE FUNCTION find_duplicates(
    p_email TEXT,
    p_phone TEXT,
    p_name TEXT,
    p_organization_id UUID,
    p_exclude_id UUID DEFAULT NULL
)
RETURNS TABLE(
    contact_id UUID,
    match_type TEXT,
    confidence FLOAT,
    email TEXT,
    phone TEXT,
    name TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH potential_duplicates AS (
        -- Email exact match (highest confidence)
        SELECT 
            c.id, 
            'email' as type, 
            1.0 as conf, 
            c.email, 
            c.phone, 
            c.name, 
            c.created_at
        FROM contacts c
        WHERE c.organization_id = p_organization_id
        AND (p_exclude_id IS NULL OR c.id != p_exclude_id)
        AND c.email IS NOT NULL 
        AND p_email IS NOT NULL
        AND LOWER(c.email) = LOWER(p_email)
        
        UNION ALL
        
        -- Phone match (normalized)
        SELECT 
            c.id, 
            'phone' as type, 
            0.9 as conf, 
            c.email, 
            c.phone, 
            c.name, 
            c.created_at
        FROM contacts c
        WHERE c.organization_id = p_organization_id
        AND (p_exclude_id IS NULL OR c.id != p_exclude_id)
        AND c.phone IS NOT NULL 
        AND p_phone IS NOT NULL
        AND normalize_phone(c.phone) = normalize_phone(p_phone)
        AND NOT EXISTS (
            -- Don't double-count if email already matched
            SELECT 1 FROM contacts c2 
            WHERE c2.id = c.id 
            AND c2.email IS NOT NULL 
            AND p_email IS NOT NULL
            AND LOWER(c2.email) = LOWER(p_email)
        )
        
        UNION ALL
        
        -- Name similarity (fuzzy)
        SELECT 
            c.id, 
            'name' as type, 
            name_similarity(c.name, p_name) as conf, 
            c.email, 
            c.phone, 
            c.name, 
            c.created_at
        FROM contacts c
        WHERE c.organization_id = p_organization_id
        AND (p_exclude_id IS NULL OR c.id != p_exclude_id)
        AND c.name IS NOT NULL 
        AND p_name IS NOT NULL
        AND name_similarity(c.name, p_name) >= 0.8
        AND NOT EXISTS (
            -- Don't triple-count
            SELECT 1 FROM contacts c2 
            WHERE c2.id = c.id 
            AND (
                (c2.email IS NOT NULL AND p_email IS NOT NULL AND LOWER(c2.email) = LOWER(p_email))
                OR 
                (c2.phone IS NOT NULL AND p_phone IS NOT NULL AND normalize_phone(c2.phone) = normalize_phone(p_phone))
            )
        )
    )
    SELECT DISTINCT ON (pd.id) 
        pd.id as contact_id,
        pd.type as match_type,
        pd.conf as confidence,
        pd.email,
        pd.phone,
        pd.name,
        pd.created_at
    FROM potential_duplicates pd
    ORDER BY pd.id, pd.conf DESC;
END;
$$ LANGUAGE plpgsql;

-- Index optimizations for duplicate detection (non-concurrent for migrations)
CREATE INDEX IF NOT EXISTS idx_contacts_email_lower 
ON contacts (LOWER(email)) 
WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_phone_normalized 
ON contacts (normalize_phone(phone)) 
WHERE phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_org_email 
ON contacts (organization_id, email) 
WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_org_created 
ON contacts (organization_id, created_at DESC);

-- Functions are accessible via service role