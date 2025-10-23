# 🧪 POST-DEPLOYMENT TEST CHECKLIST

## Company Knowledge Base - Part 1

**Deployment Info:**

- Commit: `ef64170`
- Date: 2025-10-23
- Status: ✅ Deployed to Vercel

---

## ⏳ WAIT TIME

**⏱️ Wait 2-3 minutes after git push for Vercel deployment to complete**

Check deployment status:

1. Open: https://vercel.com/dashboard
2. Find project: `guardian-ai-crm` (or your project name)
3. Check 'Deployments' tab
4. Wait for status: `Building` → `Ready` ✅

---

## 🚀 PRE-TEST STEPS

### 1. Clear Browser Cache

- **Chrome/Edge**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- **Firefox**: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
- **Or**: Open DevTools (F12) → Network tab → Check "Disable cache"

### 2. Open Browser Console

- Press `F12` to open DevTools
- Click on "Console" tab
- Keep it open during testing to catch errors

### 3. Navigate to Production URL

- Open: **https://your-crm-domain.vercel.app** (replace with your actual URL)
- Login with your credentials
- Verify you're logged in successfully

---

## ✅ TEST 1: SETTINGS PAGE ACCESS

**Steps:**

1. [ ] Click on Settings icon (⚙️) in sidebar
2. [ ] Verify Settings page loads
3. [ ] Check tabs are visible at top

**Expected Result:**

- Settings page opens without errors
- Multiple tabs visible (Integrations, Billing, Security, etc.)
- **NEW TAB**: "🧠 Base Conoscenza" is visible

**If Fails:**

- Check console for errors
- Screenshot the error
- Report: "Settings page not loading"

---

## ✅ TEST 2: COMPANY KNOWLEDGE TAB

**Steps:**

1. [ ] Click on "🧠 Base Conoscenza" tab
2. [ ] Wait 1-2 seconds for component to load
3. [ ] Observe page layout

**Expected Result:**

- Page loads without blank screen
- See 4 stat cards at top:
  - 📊 Fonti Totali: 0
  - 📄 File Caricati: 0
  - 🔗 URL Aggiunte: 0
  - 🤖 Profilo IA: Non Generato
- See 3 sub-tabs: "Carica Fonti" | "Fonti (0)" | "Profilo Aziendale"
- See 3 upload type buttons: "📄 Carica File" | "🔗 Aggiungi URL" | "✍️ Testo Manuale"

**If Fails:**

- Blank screen → Check console for import errors
- 404 error → Component not deployed, wait 2 more minutes
- Screenshot + console errors

---

## ✅ TEST 3: FILE UPLOAD UI

**Steps:**

1. [ ] Click "📄 Carica File" button
2. [ ] Observe file upload interface

**Expected Result:**

- Upload interface expands below button
- See drag & drop area with:
  - "Trascina file qui o clicca per selezionare"
  - "Formati supportati: PDF, DOC, DOCX, PPT, PPTX, TXT"
  - "Dimensione massima: 10 MB per file"
- "Carica X file" button visible (disabled if no files selected)

**If Fails:**

- UI doesn't expand → JavaScript error (check console)
- Missing elements → CSS not loaded

---

## ✅ TEST 4: FILE SELECTION (QUICK TEST)

**Steps:**

1. [ ] Click on drag & drop area OR click "Sfoglia file" button
2. [ ] Select a small PDF file from your computer (< 5 MB recommended)
3. [ ] Observe file appears in preview list

**Expected Result:**

- File appears with:
  - File name
  - File size (e.g., "2.5 MB")
  - File type icon
  - Red "X" button to remove
- "Carica 1 file" button becomes enabled and blue

**If Fails:**

- File not appearing → Console error
- Button stays disabled → State management issue

---

## ✅ TEST 5: FILE UPLOAD EXECUTION (CRITICAL)

**Steps:**

1. [ ] With file selected, click "Carica 1 file" button
2. [ ] Observe loading state
3. [ ] Wait for response

**Expected Result:**

- Button shows "Caricamento..." with spinner
- After 1-3 seconds:
  - ✅ Alert: "File caricati con successo!"
  - File preview clears
  - Stats card updates: "📄 File Caricati: 1"
  - Console: No errors (except maybe favicon 404 - harmless)

**If Fails - Common Issues:**

### Issue A: "Invalid API key" or "Unauthorized"

**Cause:** Supabase RLS policy blocking anonymous uploads
**Fix:** Migration already includes RLS policies, check:

```sql
-- Verify in Supabase SQL Editor:
SELECT * FROM company_knowledge_sources WHERE organization_id = 'YOUR_ORG_ID';
```

### Issue B: "Storage bucket not found"

**Cause:** Migration not run or bucket not created
**Fix:** Check Supabase Dashboard:

- Storage → Buckets
- Verify "company-knowledge" bucket exists
- If missing, re-run migration SQL

### Issue C: "Failed to upload: 500"

**Cause:** Backend error (database constraint, missing table)
**Fix:** Check Supabase Logs:

- Project → Logs → Database
- Look for INSERT errors
- Verify table exists: `company_knowledge_sources`

**Report:**

- Exact error message
- Console screenshot
- Network tab (F12 → Network) - check failed request details

---

## ✅ TEST 6: URL INPUT

**Steps:**

1. [ ] Click "🔗 Aggiungi URL" button
2. [ ] Select URL type: "Website"
3. [ ] Enter: `https://example.com`
4. [ ] Click "Aggiungi URL" button

**Expected Result:**

- Loading state appears
- ✅ Alert: "URL aggiunto con successo!"
- Stats update: "🔗 URL Aggiunte: 1"

**If Fails:**

- Same troubleshooting as Test 5
- Check database insert: `source_type='url'`

---

## ✅ TEST 7: TEXT INPUT

**Steps:**

1. [ ] Click "✍️ Testo Manuale" button
2. [ ] Enter title: "Company Values"
3. [ ] Enter text: "We value integrity, innovation, and customer satisfaction."
4. [ ] Click "Salva Testo" button

**Expected Result:**

- Loading state appears
- ✅ Alert: "Testo salvato con successo!"
- Character counter updates as you type
- Stats update: "📊 Fonti Totali: 3" (file + URL + text)

**If Fails:**

- Check database: `source_type='text'`
- Verify `original_content` and `extracted_text` columns populated

---

## ✅ TEST 8: SOURCES TAB

**Steps:**

1. [ ] Click "Fonti (3)" tab (number should match total sources)
2. [ ] Observe sources list

**Expected Result:**

- See 3 sources in list:
  - File with PDF icon, status badge "In Attesa" (orange/yellow)
  - URL with link icon, status badge "In Attesa"
  - Text with document icon, status badge "Completato" (green)
- Each source shows:
  - Source name
  - Type icon
  - Status badge
  - Date/time
  - Eye icon (preview)
  - Trash icon (delete)

**If Fails:**

- Empty list → Check database:
  ```sql
  SELECT * FROM company_knowledge_sources
  WHERE organization_id = 'YOUR_ORG_ID'
  ORDER BY created_at DESC;
  ```

---

## ✅ TEST 9: SOURCE PREVIEW

**Steps:**

1. [ ] Click eye icon (👁️) on any source
2. [ ] Observe preview modal

**Expected Result:**

- Modal opens with:
  - Source name as title
  - Content preview (extracted_text or original_content)
  - Close button (X)
  - Dark overlay background
- Click X or outside modal → Modal closes

**If Fails:**

- Modal doesn't open → JavaScript error
- No content shown → Check `extracted_text` column (may be null for files - Part 2 will populate)

---

## ✅ TEST 10: SOURCE DELETE

**Steps:**

1. [ ] Click trash icon (🗑️) on any source
2. [ ] Confirm deletion (browser confirm dialog)
3. [ ] Observe source removed from list

**Expected Result:**

- Browser confirm: "Sei sicuro di voler eliminare questa fonte?"
- Click OK → Source disappears from list
- Stats update (total decreases by 1)
- Alert: "Fonte eliminata con successo"

**If Fails:**

- Source not deleted → Check RLS policies allow DELETE
- Database: Verify DELETE permission in policy

---

## ✅ TEST 11: PROFILE TAB (PLACEHOLDER)

**Steps:**

1. [ ] Click "Profilo Aziendale" tab

**Expected Result:**

- See placeholder message:
  - "Il profilo aziendale verrà generato automaticamente"
  - "Carica almeno 3 fonti..."
  - Note: "Questo è un placeholder - verrà implementato in Parte 2"
- Stats card still shows: "🤖 Profilo IA: Non Generato"

**If Fails:**

- Tab crashes → Component import error

---

## ✅ TEST 12: CONSOLE CHECK (CRITICAL)

**Steps:**

1. [ ] Keep DevTools console open (F12)
2. [ ] Review all console messages

**Expected Result:**

- ✅ **Zero red errors** (except favicon 404 - harmless)
- May see blue info logs (harmless)
- May see orange warnings (acceptable if not breaking)

**If Fails:**

- **Red errors present:**
  - Screenshot all errors
  - Copy exact error text
  - Note which action triggered the error
  - Check error types:
    - `Uncaught ReferenceError` → Import issue
    - `401 Unauthorized` → RLS/auth issue
    - `404 Not Found` → API endpoint missing
    - `500 Internal Server Error` → Database issue

---

## 📊 SUCCESS CRITERIA

### ✅ ALL TESTS PASS IF:

- [x] Settings page loads
- [x] "🧠 Base Conoscenza" tab visible and clickable
- [x] All 3 upload methods work (file, URL, text)
- [x] Sources appear in "Fonti" tab
- [x] Preview modal works
- [x] Delete function works
- [x] Stats cards update correctly
- [x] **Zero console errors** (except favicon 404)

### 🟨 PARTIAL SUCCESS IF:

- Main UI works but minor issues:
  - Styling off (CSS issue)
  - Slow load (performance, not critical)
  - Preview modal missing content (expected for files - Part 2)

### ❌ FAILURE IF:

- Component doesn't load (blank screen)
- File upload fails (401/403/500 errors)
- Database inserts fail
- Console full of errors

---

## 🐛 TROUBLESHOOTING GUIDE

### Problem: "company_knowledge_sources" table doesn't exist

**Solution:**

1. Open Supabase Dashboard
2. SQL Editor → New Query
3. Copy entire `supabase/migrations/20251023112000_company_knowledge_base.sql`
4. Execute
5. Refresh browser, test again

---

### Problem: "company-knowledge" bucket not found

**Solution:**

1. Supabase Dashboard → Storage → Buckets
2. Click "New bucket"
3. Name: `company-knowledge`
4. Public: OFF (private)
5. Apply RLS policy from migration file

---

### Problem: 401 Unauthorized on uploads

**Solution:**

1. Verify you're logged in (check AuthContext)
2. Check RLS policies:

```sql
SELECT * FROM company_knowledge_sources; -- Should show your data
```

3. If empty, check `organization_id` matches your profile:

```sql
SELECT id, organization_id FROM profiles WHERE id = auth.uid();
```

---

### Problem: Files upload but don't appear in list

**Solution:**

1. Check database directly:

```sql
SELECT id, source_name, source_type, created_at
FROM company_knowledge_sources
WHERE organization_id = 'YOUR_ORG_ID'
ORDER BY created_at DESC;
```

2. If data exists → Frontend fetch error (check console)
3. If no data → Insert failed (check Supabase logs)

---

### Problem: Component loads but UI looks broken

**Solution:**

1. Hard refresh: `Ctrl+Shift+R`
2. Check CSS loaded: DevTools → Network → Filter "CSS" → Should see `style.*.css` loaded
3. Verify Tailwind classes working (check Elements tab)

---

## 📝 REPORTING RESULTS

### ✅ If All Tests Pass:

**Reply with:**

```
✅ PART 1 CONFIRMED WORKING

All 12 tests passed:
- File upload: ✅
- URL input: ✅
- Text input: ✅
- Sources display: ✅
- Preview modal: ✅
- Delete function: ✅
- Zero console errors: ✅

Ready for Part 2: AI Ingestion Pipeline
Proceed when ready.
```

---

### 🐛 If Issues Found:

**Reply with:**

```
❌ ISSUES FOUND

Failed Test: [Test number and name]
Error Message: [Exact error from console]
Screenshot: [Attach screenshot]
What I see: [Describe what's on screen]

Console errors:
[Copy/paste red errors from console]

Need: Debug assistance
```

---

## 🎯 NEXT STEPS AFTER SUCCESS

Once all tests pass, you can proceed to **Part 2**:

### FASE 0: Company Knowledge Base - Part 2/3 (6 hours)

1. **Text Extraction Service** (2h)
   - Install `pdf-parse`, `mammoth`, `cheerio`
   - Extract text from PDFs
   - Extract text from DOC/DOCX
   - Scrape content from URLs
   - Update `extracted_text` column
   - Change `processing_status` from 'pending' → 'completed'

2. **AI Processing Pipeline** (2h)
   - Integrate Google Gemini API
   - Analyze all sources collectively
   - Extract: company name, specializations, tone, values, USPs
   - Generate AI summary paragraph
   - Create/update `company_profiles` record
   - Display in "Profilo Aziendale" tab

3. **Vector Embeddings & RAG** (2h)
   - Enable pgvector extension in Supabase
   - Create `company_knowledge_embeddings` table
   - Chunk text into 512-token segments
   - Generate embeddings via Gemini API
   - Store in vector database
   - Create semantic search function
   - Integrate with AI agents (WhatsApp, Email, LeadScorer)

**Estimated Timeline:**

- Part 1 (UI): ✅ Complete
- Part 2 (AI Ingestion): 6 hours
- Part 3 (Agent Integration): 2 hours
- **Total**: 8 hours remaining

---

## 📚 DOCUMENTATION

- **Quick Start**: `QUICK_START_COMPANY_KNOWLEDGE.md`
- **Full Report**: `COMPANY_KNOWLEDGE_IMPLEMENTATION_REPORT.md`
- **Setup Guide**: `COMPANY_KNOWLEDGE_PART1_COMPLETE.md`
- **This Checklist**: `POST_DEPLOYMENT_TEST_CHECKLIST.md`

---

**Deployment Date:** 2025-10-23  
**Commit:** ef64170  
**Status:** ✅ Deployed & Ready for Testing
