# 🆘 Disaster Recovery Guide

## If Workspace Is Lost

### Quick Recovery (15 minutes)

#### 1. Clone Repository
```bash
git clone https://github.com/agenziaseocagliari/CRM.AI.git
cd CRM.AI
```

#### 2. Restore Environment
```bash
# Copy from backup (adjust path as needed)
cp /tmp/CRM-AI-Backups/latest/.env.backup .env
```

#### 3. Install Dependencies
```bash
npm install
npm install -g supabase@latest
```

#### 4. Link Supabase
```bash
npx supabase@latest link --project-ref qjtaqrlpronohgpfdxsi
```

#### 5. Verify Everything
```bash
npm run lint
npx supabase@latest functions list
node test-csv-upload-real.cjs
```

---

## Backup Locations

- **Local Backups**: `/tmp/CRM-AI-Backups/` (or `C:\Users\inves\CRM-AI-Backups\`)
- **GitHub Repository**: https://github.com/agenziaseocagliari/CRM.AI
- **Supabase Dashboard**: Database backups available

---

## Critical Files to Backup

### Essential Files
- `.env` (environment variables)
- `supabase/` (database schema, functions)
- `docs/` (all documentation)
- `src/` (application code)
- `package.json` (dependencies)

### Backup Strategy
- **Automatic**: Every 30 minutes (auto-sync.sh)
- **Manual**: Run `./scripts/backup-to-local.sh`
- **Git**: Auto-commit on changes
- **Scheduled**: Windows Task Scheduler (hourly)

---

## Recovery Scenarios

### Scenario 1: Workspace Corruption
```bash
# Use restore script
./scripts/restore-from-backup.sh

# Or specify backup
./scripts/restore-from-backup.sh /tmp/CRM-AI-Backups/crm-backup-20251013_093726.tar.gz
```

### Scenario 2: Complete Account Loss
```bash
# Clone from GitHub
git clone https://github.com/agenziaseocagliari/CRM.AI.git
cd CRM.AI

# Setup dependencies
npm install
curl -fsSL https://deno.land/install.sh | sh
export PATH="/home/codespace/.deno/bin:$PATH"

# Configure environment
echo 'SUPABASE_URL=https://qjtaqrlpronohgpfdxsi.supabase.co' > .env
echo 'SUPABASE_ANON_KEY=[ANON_KEY]' >> .env
echo 'SUPABASE_SERVICE_ROLE_KEY=[SERVICE_KEY]' >> .env

# Link Supabase
npx supabase@latest link --project-ref qjtaqrlpronohgpfdxsi
```

### Scenario 3: Database Corruption
```bash
# Reset database from schema
npx supabase@latest db reset

# Or import from backup
psql -f database-schema.sql
```

---

## Recovery Checklist

### Immediate Actions (0-5 min)
- [ ] Repository cloned
- [ ] .env restored/created
- [ ] Dependencies installed

### System Setup (5-10 min)
- [ ] Supabase linked
- [ ] Database schema verified
- [ ] Edge functions deployed

### Verification (10-15 min)
- [ ] Tests passing
- [ ] CSV parser working
- [ ] Authentication working
- [ ] All features functional

---

## Emergency Contacts & Resources

### Critical Information
- **Project ID**: qjtaqrlpronohgpfdxsi
- **Repository**: https://github.com/agenziaseocagliari/CRM.AI
- **Supabase Dashboard**: https://supabase.com/dashboard/project/qjtaqrlpronohgpfdxsi

### Recovery Commands Quick Reference
```bash
# Full setup from scratch
git clone https://github.com/agenziaseocagliari/CRM.AI.git
cd CRM.AI
npm install
curl -fsSL https://deno.land/install.sh | sh
export PATH="/home/codespace/.deno/bin:$PATH"
npx supabase@latest link --project-ref qjtaqrlpronohgpfdxsi

# Deploy all functions
npx supabase@latest functions deploy

# Test everything
npm test
node test-csv-upload-real.cjs
```

---

## Prevention Measures

### Automated Backups
- **Auto-sync**: Runs every 30 minutes
- **Git commits**: Automatic on file changes
- **Local backups**: Compressed and stored locally
- **Retention**: Last 10 backups kept

### Monitoring
```bash
# Check backup service status
ps aux | grep auto-sync

# View backup logs
tail -f /tmp/auto-sync.log

# List available backups
ls -lh /tmp/CRM-AI-Backups/
```

### Manual Backup Triggers
```bash
# Before major changes
./scripts/backup-to-local.sh

# Before deployments
git add . && git commit -m "pre-deploy backup"

# Weekly full backup
./scripts/backup-to-local.sh && git push origin main
```

---

## Recovery Time Estimates

- **From GitHub**: ~10 minutes
- **From local backup**: ~5 minutes  
- **From Supabase**: ~15 minutes
- **Complete rebuild**: ~20 minutes

---

## Success Verification

After recovery, verify these work:
1. ✅ Login system functional
2. ✅ CSV parser responds (200 status)
3. ✅ Database connections working
4. ✅ Edge functions deployed
5. ✅ All tests passing

---

## 🎯 **WORKSPACE STATUS**: Production Ready with Full Disaster Recovery