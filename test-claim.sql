-- Create a test claim
INSERT INTO insurance_claims (
  organization_id,
  contact_id,
  policy_id,
  claim_number,
  claim_type,
  status,
  incident_date,
  incident_location,
  incident_description,
  estimated_amount,
  report_date,
  timeline,
  notes
) 
SELECT 
  'dcfbec5c-6049-4d4d-ba80-a1c412a5861d',
  c.id,
  p.id,
  'CLM-2024-TEST1',
  'auto_damage',
  'reported',
  CURRENT_DATE - INTERVAL '2 days',
  'Via Roma 123, Milano',
  'Incidente stradale con danni alla carrozzeria anteriore. Scontro con altro veicolo in fase di sorpasso. Danni evidenti al paraurti e faro anteriore destro.',
  2500.00,
  CURRENT_DATE,
  '[{"status": "reported", "date": "2024-01-15T10:00:00Z", "note": "Sinistro segnalato dal cliente"}]',
  'Cliente molto collaborativo, ha fornito subito tutti i dettagli'
FROM contacts c
JOIN insurance_policies p ON p.contact_id = c.id
WHERE c.organization_id = 'dcfbec5c-6049-4d4d-ba80-a1c412a5861d'
  AND p.policy_type = 'Auto'
LIMIT 1;

-- Verify the claim was created and get its ID
SELECT 
  id,
  claim_number,
  claim_type,
  status,
  estimated_amount
FROM insurance_claims 
WHERE organization_id = 'dcfbec5c-6049-4d4d-ba80-a1c412a5861d'
ORDER BY created_at DESC
LIMIT 1;