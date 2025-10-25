-- =====================================================
-- DEBUG: Check and Reset Knowledge Sources Status
-- Date: 25 October 2025
-- =====================================================

-- Check current status of sources
SELECT
    id,
    source_name,
    source_type,
    processing_status,
    organization_id,
    created_at,
    last_processed_at,
    LENGTH(extracted_text) as text_length
FROM company_knowledge_sources
WHERE
    organization_id = 'dcfbec5c-6049-4d4d-ba80-a1c412a5861d'
ORDER BY created_at DESC;

-- Reset sources to 'pending' status for testing
UPDATE company_knowledge_sources
SET
    processing_status = 'pending',
    extracted_text = NULL,
    error_message = NULL,
    last_processed_at = NULL
WHERE
    organization_id = 'dcfbec5c-6049-4d4d-ba80-a1c412a5861d';

-- Verify reset
SELECT
    id,
    source_name,
    source_type,
    processing_status,
    organization_id
FROM company_knowledge_sources
WHERE
    organization_id = 'dcfbec5c-6049-4d4d-ba80-a1c412a5861d'
ORDER BY created_at DESC;