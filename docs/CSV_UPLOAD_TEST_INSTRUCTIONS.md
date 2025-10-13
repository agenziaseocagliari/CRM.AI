# 📋 MANUAL TEST INSTRUCTIONS
## Test CSV Upload from Vercel Production

### Step 1: Access Test Page
**URL**: https://[your-vercel-url]/test-csv

### Step 2: Prepare Test CSV
**Option A**: Use sample file from project
- Download: https://[your-vercel-url]/sample-test.csv

**Option B**: Create your own CSV
```csv
Name,Email,Phone,Company
your-test@email.com,Your Name,555-1234,Test Company
another@test.com,Another User,555-5678,Another Co
```

### Step 3: Upload and Verify
1. Click "Choose File" and select CSV
2. Click "Upload CSV" 
3. Wait for response
4. Verify you see:
   - ✅ "Upload Successful!"
   - Import ID (UUID)
   - Total rows count
   - Fields detected
   - Processing time
   - Field mappings with confidence scores

### Step 4: Report Results
Copy the Import ID and report:
- Upload worked: ✅/❌
- Import ID: [paste UUID]  
- Total rows: [number]
- Fields detected: [number]
- Any errors: [describe]

### Expected Result
- ✅ Upload successful with green success message
- ✅ Import ID displayed (e.g., "550e8400-e29b-41d4-a716-446655440000")
- ✅ Field mappings show detected columns
- ✅ Processing time under 1000ms
- ✅ No errors in browser console

**If you see this → CSV Parser works perfectly from production! 🎉**

### Troubleshooting
If upload fails:
1. Check browser console for errors
2. Verify CSV format (comma-separated, proper headers)
3. Try the sample CSV file first
4. Report exact error message

### What This Verifies
- ✅ Frontend component works on Vercel
- ✅ Supabase Edge Function is accessible
- ✅ CSV parsing engine processes files
- ✅ Database integration stores records
- ✅ Complete end-to-end flow operational