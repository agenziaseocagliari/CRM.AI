-- Emergency fix: Ensure profiles table doesn't have email column constraint
-- The error mentions email constraint but profiles table should not have email column
-- Email is managed by auth.users table

-- First, ensure there's no email column in profiles (in case remote DB has it)
DO $$
BEGIN
    -- Check if email column exists in profiles and remove it if present
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'email'
        AND table_schema = 'public'
    ) THEN
        -- Remove NOT NULL constraint first if it exists
        BEGIN
            ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;
        EXCEPTION WHEN OTHERS THEN
            -- Ignore error if constraint doesn't exist
            NULL;
        END;
        
        -- Drop the email column entirely
        ALTER TABLE public.profiles DROP COLUMN email;
        
        -- Log the change
        RAISE NOTICE 'Removed email column from profiles table - email managed by auth.users';
    ELSE
        RAISE NOTICE 'No email column found in profiles table - this is correct';
    END IF;
END $$;

-- Ensure all required columns exist with proper nullability
-- Make sure updated_at is NOT NULL (required for our trigger)
DO $$
BEGIN
    -- Ensure updated_at exists and is NOT NULL
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'updated_at'
        AND is_nullable = 'YES'
    ) THEN
        -- Make updated_at NOT NULL with default
        ALTER TABLE public.profiles 
        ALTER COLUMN updated_at SET NOT NULL,
        ALTER COLUMN updated_at SET DEFAULT NOW();
        
        RAISE NOTICE 'Made updated_at NOT NULL with default';
    END IF;
END $$;

-- Double-check our table structure is correct
DO $$
DECLARE
    col_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_name = 'profiles' 
    AND table_schema = 'public'
    AND column_name = 'email';
    
    IF col_count > 0 THEN
        RAISE EXCEPTION 'ERROR: profiles table still has email column after cleanup';
    ELSE
        RAISE NOTICE 'SUCCESS: profiles table has no email column - constraint issue should be resolved';
    END IF;
END $$;

COMMENT ON TABLE public.profiles IS 'User profiles - email managed by auth.users, not stored here';