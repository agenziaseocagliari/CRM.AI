# Guardian AI CRM - Project Context

## Quick Reference
- **Project:** Guardian AI CRM - Insurance vertical specialization
- **Repo:** https://github.com/agenziaseocagliari/CRM.AI
- **Stack:** React 18 + TypeScript + Vite + Supabase

## Database Access
```
Connection String (Supabase PostgreSQL):
postgresql://postgres.qjtaqrlpronohgpfdxsi:WebProSEO%401980%23@aws-1-eu-west-3.pooler.supabase.com:6543/postgres

Key Tables:
- vertical_configurations
- insurance_policies
- insurance_claims  
- insurance_commissions
- contacts
- forms
```

## Test Users
- **Standard CRM:** webproseoid@gmail.com
- **Insurance CRM:** primassicurazionibari@gmail.com
- **Production:** https://crm-ai-rho.vercel.app

## Recent Achievements (Oct 18, 2025)
✅ Successfully cloned Forms.tsx → FormsInsurance.tsx  
✅ Implemented vertical-aware routing in App.tsx  
✅ Fixed VerticalProvider order error  
✅ Verified in production: Standard uses Forms, Insurance uses FormsInsurance  
✅ Added "Moduli" to Insurance sidebar
✅ Cleaned debug visual indicators

## Current Sprint: Dashboard Insurance
**Status:** Ready to start Dashboard Insurance development

## Architecture Patterns
### Vertical Isolation
```typescript
// Standard components: src/components/
// Insurance components: src/components/insurance/

// Routing pattern:
vertical === 'insurance' ? <InsuranceComponent /> : <StandardComponent />
```

### Component Naming
- **Standard:** ComponentName.tsx
- **Insurance:** ComponentNameInsurance.tsx

## Critical Rules
- NEVER modify Standard components directly
- CLONE for Insurance customization  
- Use vertical context from useVertical()
- Test both verticals after changes

## Next Phase: Dashboard Insurance
Ready to start with KPI cards, charts, and activity feed development.