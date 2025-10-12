# CSV Parser Edge Function API

**Phase 4.1 - Task 2**: Complete API specification for CSV upload and parsing

---

## Endpoint

```
POST https://[project-ref].supabase.co/functions/v1/parse-csv-upload
```

---

## Authentication

**Requires**: Bearer token (Supabase Auth)
- User must be authenticated 
- User must belong to an organization
- Organization isolation enforced via RLS policies

---

## Request

### Headers
```
Content-Type: multipart/form-data
Authorization: Bearer [token]
```

### Body (multipart/form-data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | ✅ Yes | CSV file to parse (max 10MB) |
| `organization_id` | UUID | ✅ Yes | Organization ID for multi-tenant isolation |
| `duplicate_strategy` | String | ❌ No | How to handle duplicates: "skip", "update", "merge" (default: "skip") |
| `field_mapping_template_id` | UUID | ❌ No | Saved field mapping template to apply |

### Example Request
```bash
curl -X POST \
  https://qjtaqrlpronohgpfdxsi.supabase.co/functions/v1/parse-csv-upload \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "file=@contacts.csv" \
  -F "organization_id=550e8400-e29b-41d4-a716-446655440000" \
  -F "duplicate_strategy=skip"
```

---

## Response

### Success (200)
```json
{
  "success": true,
  "import_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "preview": {
    "headers": ["Email", "Nome", "Telefono", "Azienda"],
    "rows": [
      {
        "Email": "mario.rossi@example.com",
        "Nome": "Mario Rossi",
        "Telefono": "+39 123 456 7890",
        "Azienda": "ACME Corp"
      },
      {
        "Email": "giulia.bianchi@example.com", 
        "Nome": "Giulia Bianchi",
        "Telefono": "347-1234567",
        "Azienda": "TechStart SRL"
      }
      // ... max 10 rows for preview
    ],
    "total_rows": 1250,
    "detected_mappings": {
      "Email": "email",
      "Nome": "full_name", 
      "Telefono": "phone",
      "Azienda": "company"
    }
  },
  "validation": {
    "errors": [
      {
        "row": 15,
        "field": "email",
        "column": "Email", 
        "message": "Invalid email format",
        "value": "notanemail",
        "errorType": "INVALID_EMAIL_FORMAT"
      }
    ],
    "warnings": [
      {
        "row": 23,
        "field": "phone",
        "column": "Telefono",
        "message": "Phone number seems short",
        "value": "123",
        "suggestion": "Add country code or more digits"
      }
    ],
    "stats": {
      "totalRows": 1250,
      "validRows": 1245,
      "errorRows": 3,
      "warningRows": 7,
      "duplicateEmails": 2,
      "duplicatePhones": 0
    }
  }
}
```

### Error Responses

#### File Too Large (413)
```json
{
  "success": false,
  "error": "File size exceeds maximum limit of 10MB",
  "code": "FILE_TOO_LARGE"
}
```

#### Invalid File Type (400)
```json
{
  "success": false,
  "error": "Only CSV files are supported",
  "code": "INVALID_FILE_TYPE"
}
```

#### Malformed CSV (400)
```json
{
  "success": false,
  "error": "CSV file is malformed: unclosed quoted field at line 45",
  "code": "MALFORMED_CSV",
  "details": {
    "line": 45,
    "column": 3
  }
}
```

#### Unauthorized (401)
```json
{
  "success": false,
  "error": "Authentication required",
  "code": "UNAUTHORIZED"
}
```

#### Organization Not Found (404)
```json
{
  "success": false,
  "error": "Organization not found or access denied",
  "code": "ORGANIZATION_NOT_FOUND"
}
```

#### Empty File (400)
```json
{
  "success": false,
  "error": "CSV file is empty or contains no data rows",
  "code": "EMPTY_FILE"
}
```

#### Database Error (500)
```json
{
  "success": false,
  "error": "Failed to save import record to database",
  "code": "DATABASE_ERROR"
}
```

---

## Processing Flow

```
1. REQUEST VALIDATION
   ├── Check authentication (Bearer token)
   ├── Validate organization access
   ├── Check file presence and size
   └── Validate file type (CSV only)

2. FILE UPLOAD PROCESSING  
   ├── Parse multipart/form-data
   ├── Extract file content 
   ├── Detect encoding (prefer UTF-8)
   └── Validate file size limits

3. CSV PARSING
   ├── Auto-detect delimiter (, ; \t)
   ├── Parse headers (first row)
   ├── Parse data rows (limit to 50K)
   ├── Handle quoted fields and escapes
   └── Collect parsing errors

4. FIELD DETECTION
   ├── Analyze CSV column names
   ├── Match against known DB fields
   ├── Apply fuzzy matching for typos
   ├── Score confidence levels
   └── Suggest unmapped fields

5. DATA VALIDATION
   ├── Validate emails (format + uniqueness)
   ├── Validate phones (format + length)
   ├── Check required fields
   ├── Detect duplicates within file
   └── Collect errors and warnings

6. DATABASE STORAGE
   ├── Create contact_imports record
   ├── Store field mappings
   ├── Set status = 'preview'
   └── Return import_id

7. RESPONSE ASSEMBLY
   ├── Build preview (first 10 rows)
   ├── Include detected mappings
   ├── Include validation results
   └── Return structured JSON
```

---

## Performance Characteristics

| Metric | Limit | Rationale |
|--------|-------|-----------|
| **Max File Size** | 10MB | Balance usability vs. performance |
| **Max Rows** | 50,000 | Prevent timeout and memory issues |
| **Timeout** | 30 seconds | Edge Function limit |
| **Memory Usage** | ~128MB | Estimated peak usage |
| **Preview Rows** | 10 | Fast response time |
| **Concurrent Uploads** | 5 per org | Rate limiting |

### Expected Performance
- **Small files** (<1MB, <1K rows): 2-5 seconds
- **Medium files** (1-5MB, 1K-10K rows): 5-15 seconds  
- **Large files** (5-10MB, 10K-50K rows): 15-30 seconds

---

## Security

### Multi-Tenant Isolation
- All operations scoped to `organization_id`
- RLS policies enforce data isolation
- Import records linked to organization
- User authorization checked via JWT

### File Validation
- **File Type**: Only CSV accepted (MIME type + extension)
- **File Size**: Hard limit at 10MB
- **Content**: Scan for malicious patterns
- **Encoding**: Validate UTF-8 or convertible encodings

### Input Sanitization  
- CSV content parsed safely (no eval/exec)
- Column names sanitized for SQL injection
- File names sanitized for path traversal
- Organization ID validated as UUID

### Rate Limiting
- **Per Organization**: Max 10 uploads per hour
- **Per User**: Max 5 uploads per hour
- **Concurrent**: Max 5 active uploads per org
- **File Size**: Counted toward quotas

---

## Field Mapping Intelligence

### Auto-Detection Algorithms

1. **Exact Match** (Confidence: 1.0)
   ```
   "email" → "email"
   "phone" → "phone"
   ```

2. **Case-Insensitive Match** (Confidence: 0.9)
   ```
   "Email" → "email"
   "PHONE" → "phone"
   ```

3. **Common Aliases** (Confidence: 0.8)
   ```
   "E-mail" → "email"
   "Tel" → "phone"  
   "Company" → "company"
   "Full Name" → "full_name"
   ```

4. **Fuzzy Matching** (Confidence: 0.6-0.7)
   ```
   "Emial" → "email" (typo)
   "Telefono" → "phone" (Italian)
   "Nome" → "full_name" (Italian)
   ```

5. **Pattern Recognition** (Confidence: 0.5-0.7)
   ```
   Contains "@" → likely "email"
   Numeric with +/- → likely "phone"
   "First Name" + "Last Name" → "full_name"
   ```

### Supported Languages
- **English**: Standard field names
- **Italian**: Business-common translations
- **Mixed**: Handle multilingual headers

---

## Error Handling Strategy

### Graceful Degradation
- **Parsing Errors**: Skip malformed rows, continue processing
- **Validation Errors**: Collect all errors, don't stop on first
- **Field Detection**: Partial mappings acceptable
- **Encoding Issues**: Attempt conversion, report if failed

### User-Friendly Messages
- Clear error descriptions in user's language
- Specific row/column references
- Actionable suggestions for fixes
- Examples of correct formats

### Logging and Monitoring
- Performance metrics per file size
- Error rates by type
- Field detection accuracy
- User success patterns

---

## Integration Points

### Database Tables
- `contact_imports`: Store import metadata
- `contact_import_logs`: Row-level results (Task 3)
- `contact_field_mappings`: Saved templates
- `contacts`: Target table for final import

### Next Steps (Task 3)
- Manual field mapping UI
- Template save/load
- Conflict resolution interface
- Preview with corrections

### Webhook Events (Future)
- Import started
- Import completed
- Import failed
- Validation warnings

---

## Testing Checklist

### Happy Path Tests
- ✅ Standard CSV with common headers
- ✅ Italian headers with auto-detection
- ✅ Large file (5MB, 25K rows)
- ✅ Perfect data with no errors

### Edge Cases
- ✅ Empty file
- ✅ Headers only (no data)
- ✅ Malformed CSV (unclosed quotes)
- ✅ Mixed delimiters
- ✅ Non-UTF8 encoding
- ✅ Excel CSV quirks (BOM)

### Error Conditions
- ✅ File too large (>10MB)
- ✅ Invalid file type
- ✅ Corrupted file
- ✅ Network timeout
- ✅ Database connection failure

### Security Tests
- ✅ Unauthorized access
- ✅ Organization isolation
- ✅ Malicious file content
- ✅ SQL injection in headers
- ✅ Rate limiting enforcement

---

## API Changelog

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | 2025-10-12 | Initial specification |

---

**Status**: ✅ Ready for implementation  
**Estimated Implementation**: 3 hours  
**Dependencies**: CSV parser, validation libraries  
**Next**: Task 2 full implementation