-- RPC Function to retrieve migration history
-- This allows REST API access to schema_migrations table

CREATE OR REPLACE FUNCTION public.get_migration_history()
RETURNS TABLE (
  version text,
  name text,
  inserted_at timestamp with time zone
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    version::text,
    name,
    inserted_at
  FROM supabase_migrations.schema_migrations
  ORDER BY version ASC;
$$;

-- Grant execute permission to public (all users)
-- Note: Function uses SECURITY DEFINER so it runs with creator's privileges
GRANT EXECUTE ON FUNCTION public.get_migration_history() TO public;

COMMENT ON FUNCTION public.get_migration_history() IS 
  'Returns the complete migration history from schema_migrations table. Used by CI/CD for migration synchronization.';
