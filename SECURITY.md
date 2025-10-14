# Security Guidelines for CRM.AI

## Environment Variables Security
All sensitive credentials MUST be stored in environment variables, never hardcoded in files.

### Required Environment Variables:
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key  
- `VITE_SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `SUPABASE_ACCESS_TOKEN`: Supabase CLI access token

### Setup:
1. Copy `.env.template` to `.env.local`
2. Fill in your actual credentials in `.env.local`
3. Never commit `.env.local` to version control
4. Use `source .env.local` before running deployment scripts

### Files Updated for Security:
- All deploy-*.cjs files now use environment variables
- All deploy-*.ps1 files now use environment variables  
- All deploy-*.js files now use environment variables
- All deploy-*.sh files now use environment variables

### Deployment Commands:
```bash
# Load environment variables
source .env.local

# Deploy functions
node deploy-api-direct.cjs

# Run migrations  
npm run db:migrate
```

## Supported Versions

Use this section to tell people about which versions of your project are
currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 5.1.x   | :white_check_mark: |
| 5.0.x   | :x:                |
| 4.0.x   | :white_check_mark: |
| < 4.0   | :x:                |

## Reporting a Vulnerability

Use this section to tell people how to report a vulnerability.

Tell them where to go, how often they can expect to get an update on a
reported vulnerability, what to expect if the vulnerability is accepted or
declined, etc.
