-- Check sidebar configurations for both verticals
SELECT 
    vertical,
    name,
    sidebar_config
FROM vertical_configurations 
WHERE vertical IN ('standard', 'insurance')
ORDER BY vertical;