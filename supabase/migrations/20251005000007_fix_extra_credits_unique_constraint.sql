-- ===================================================================
-- GUARDIAN AI CRM - FIX EXTRA CREDITS UNIQUE CONSTRAINT
-- Migration: Aggiunge constraint UNIQUE mancante su extra_credits_packages.name
-- Data: 2025-10-05
-- ===================================================================

-- Aggiungi constraint UNIQUE sulla colonna name della tabella extra_credits_packages
-- Questo è necessario per il funzionamento di "ON CONFLICT (name) DO NOTHING"
ALTER TABLE extra_credits_packages ADD CONSTRAINT unique_extra_credits_packages_name UNIQUE (name);

-- Commento per documentazione
COMMENT ON CONSTRAINT unique_extra_credits_packages_name ON extra_credits_packages 
IS 'Garantisce unicità del nome del pacchetto crediti, necessario per ON CONFLICT handling';