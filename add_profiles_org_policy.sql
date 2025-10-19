-- RLS Policy per permettere agli utenti di vedere profili della stessa organizzazione
CREATE POLICY "Users can view organization profiles" ON profiles
FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);