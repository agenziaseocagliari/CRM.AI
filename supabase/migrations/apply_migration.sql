-- Funzione RPC per applicare SQL dinamico
create or replace function apply_migration(sql text)
returns void as $$
begin
  execute sql;
end;
$$ language plpgsql security definer;
-- Ricorda: questa funzione va creata su Supabase tramite SQL editor o API