# CSV Upload Troubleshooting Guide

## 🚨 Common Issues & Solutions

### Issue: "CSV upload failed"

**Possible Causes:**
- Special characters in file (encoding issue)
- Markdown-formatted emails: `[email](mailto:...)`
- Empty rows or cells
- Headers with special characters or underscores
- Unsupported column names

---

## 🔧 Solutions

### Solution 1: Clean Your CSV (Recommended)

**In Excel/Google Sheets:**
1. Open your CSV file
2. Find & Replace all:
   - `[` → (empty)
   - `]` → (empty) 
   - `(mailto:` → (empty)
   - `)` → (empty)
3. Save As → **CSV UTF-8**

### Solution 2: Simplify Headers

**Change complex headers to simple ones:**
- `Full_Address` → `Address` (or remove if not supported)
- `Street_Address` → `Street` (or remove if not supported)  
- `Email_Address` → `Email`
- `Phone_Number` → `Phone`

**Supported Headers:**
- ✅ `Name`, `Email`, `Phone`, `Company`
- ❌ `Address`, `City`, `Street` (not supported in current schema)

### Solution 3: Remove Empty Rows
- Delete rows with all empty cells
- Ensure every row has at least **Name** OR **Email**
- Remove any trailing empty rows

### Solution 4: Fix Character Encoding
- Special characters like `â€"`, `Ã¨` indicate encoding issues
- **Fix:** Open in Excel → Save As → CSV UTF-8
- Or use a text editor that supports UTF-8

---

## 🧪 Test with Sample

**Download clean sample:**
```
https://crm-ai-rho.vercel.app/sample-test.csv
```

**If sample works** → Problem is in your CSV formatting  
**If sample fails** → Report to support

---

## ⚡ Quick Fix for Your CSV

**Your current CSV has:**
- ✅ Markdown emails: `[info@email.com](mailto:info@email.com)`
- ✅ Special chars: `â€"`, `Ã¨`
- ✅ Complex headers with underscores

**To fix:**
1. **Open in Excel/Google Sheets**
2. **Select email column**
3. **Find & Replace:**
   - Find: `[*](mailto:*)`
   - Replace with: Just the email address part
4. **Simplify headers:**
   - Remove underscores
   - Use: Name, Email, Phone, Company only
5. **Save as CSV UTF-8**
6. **Try upload again**

---

## 📋 Supported File Format

### ✅ Good CSV Example:
```csv
Name,Email,Phone,Company
John Smith,john@company.com,555-1234,Acme Corp
Jane Doe,jane@business.org,(555) 567-8900,Tech Inc
```

### ❌ Problematic CSV Example:
```csv
Full_Name,Email_Address,Phone_Number,Street_Address
John Smith,[john@company.com](mailto:john@company.com),555-1234,123 Main St
Jane Doe,,,(empty row issues)
```

---

## 🆘 Still Having Issues?

### Check Error Messages
The enhanced parser now provides detailed error messages:
- **File format errors**: Check commas, quotes, encoding
- **Field mapping errors**: Simplify headers  
- **Database errors**: Remove invalid data
- **Size errors**: Keep files under 10 MB

### Get Help
1. **Copy the exact error message**
2. **Try the troubleshooting steps above**
3. **Use our test URLs:**
   - Main: https://crm-ai-rho.vercel.app/csv-test
   - Direct: https://crm-ai-rho.vercel.app/test-csv-direct.html
4. **Report specific error details**

---

## 🎯 What This Verifies

When your CSV upload succeeds, you'll see:
- ✅ **Green success message**
- ✅ **Import ID** (UUID format)
- ✅ **Field mappings** with confidence scores
- ✅ **Row counts** (total, valid, invalid)
- ✅ **Processing time** (usually under 1000ms)

**Success means your CSV Parser works perfectly!** 🎉

---

## 🔍 Technical Details

### Enhanced Error Handling Includes:
- UTF-8 BOM removal
- Special character cleaning
- Markdown email extraction
- Detailed validation messages
- File size and type checking
- Encoding issue detection

### Supported Operations:
- File upload validation
- CSV parsing with error recovery
- Field auto-detection
- Data cleaning and normalization
- Database integration
- Comprehensive error reporting