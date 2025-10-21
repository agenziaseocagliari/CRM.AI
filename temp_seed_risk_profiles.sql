-- Seed Insurance Risk Profiles Demo Data
-- Organization ID: dcfbec5c-6049-4d4d-ba80-a1c412a5861d

BEGIN;

-- Profile 1: Mario Rossi - Medium Risk
INSERT INTO insurance_risk_profiles (
  contact_id,
  organization_id,
  age,
  gender,
  profession,
  marital_status,
  height_cm,
  weight_kg,
  smoking_status,
  alcohol_consumption,
  preexisting_conditions,
  physical_activity_level,
  annual_income_eur,
  employment_status,
  homeowner,
  travel_frequency_per_year,
  driving_record,
  health_score,
  financial_score,
  lifestyle_score,
  total_risk_score,
  risk_category,
  recommended_products,
  is_active
) VALUES (
  'd8de6728-3a32-4d69-9e24-660be7c0dae9',
  'dcfbec5c-6049-4d4d-ba80-a1c412a5861d',
  45,
  'male',
  'Imprenditore',
  'married',
  178,
  82,
  'former',
  'moderate',
  '[]'::jsonb,
  'moderate',
  65000,
  'self_employed',
  true,
  4,
  'clean',
  75,
  80,
  70,
  75,
  'medium',
  '["Auto", "Casa", "Vita"]'::jsonb,
  true
);

-- Profile 2: Luigi Bianchi - Low Risk
INSERT INTO insurance_risk_profiles (
  contact_id,
  organization_id,
  age,
  gender,
  profession,
  marital_status,
  height_cm,
  weight_kg,
  smoking_status,
  alcohol_consumption,
  preexisting_conditions,
  physical_activity_level,
  annual_income_eur,
  employment_status,
  homeowner,
  travel_frequency_per_year,
  driving_record,
  health_score,
  financial_score,
  lifestyle_score,
  total_risk_score,
  risk_category,
  recommended_products,
  is_active
) VALUES (
  '15f4bc6e-6ff5-4d3f-a31c-cb9059ff839a',
  'dcfbec5c-6049-4d4d-ba80-a1c412a5861d',
  38,
  'male',
  'Consulente',
  'single',
  175,
  78,
  'never',
  'occasional',
  '[]'::jsonb,
  'intense',
  55000,
  'employed',
  false,
  2,
  'clean',
  85,
  70,
  80,
  78,
  'low',
  '["Auto", "Salute"]'::jsonb,
  true
);

COMMIT;

-- Verify
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN risk_category = 'low' THEN 1 END) as low_risk,
  COUNT(CASE WHEN risk_category = 'medium' THEN 1 END) as medium_risk,
  COUNT(CASE WHEN risk_category = 'high' THEN 1 END) as high_risk
FROM insurance_risk_profiles
WHERE organization_id = 'dcfbec5c-6049-4d4d-ba80-a1c412a5861d'
  AND is_active = true;
