-- Check user roles and verticals
SELECT 
    email,
    role,
    organizations.name as organization_name,
    vertical
FROM profiles 
JOIN organizations ON profiles.organization_id = organizations.id
WHERE email IN ('webproseoid@gmail.com', 'primassicurazionibari@gmail.com');