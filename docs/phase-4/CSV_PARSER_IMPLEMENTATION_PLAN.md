# CSV Parser Implementation Plan

**Phase 4.1 - Task 2**: 3-Hour Implementation Schedule for Tomorrow

---

## EXECUTIVE SUMMARY

**Total Time**: 180 minutes (3 hours)  
**Complexity**: Medium-High  
**Functions to Implement**: 7 core + 5 helpers  
**Risk Level**: Low (foundation prepared)  

---

## IMPLEMENTATION SCHEDULE

### HOUR 1: CORE PARSING (60 min)

#### Task 1A: Request Handling & Validation (20 min)
**File**: `supabase/functions/parse-csv-upload/index.ts`  
**Function**: `handleCSVUpload()`

**Implementation Steps**:
```typescript
// 1. Extract form data (5 min)
const formData = await request.formData()
const file = formData.get('file') as File
const configStr = formData.get('config') as string
const config = JSON.parse(configStr) as ParseConfig

// 2. Validate file (10 min)  
if (!file) throw new Error('No file provided')
if (file.size > MAX_FILE_SIZE) throw new Error('File too large')
if (!file.type.includes('csv') && !file.name.endsWith('.csv')) {
  throw new Error('Invalid file type')
}

// 3. Validate config (5 min)
if (!config.organizationId) throw new Error('Organization ID required')
```

**Test Cases**:
- Valid CSV file upload ✓
- Missing file error ✓  
- File too large error ✓
- Invalid organization ID ✓

---

#### Task 1B: CSV Parsing Engine (25 min)  
**Function**: `parseCSVFile()`

**Implementation Steps**:
```typescript
// 1. Read file content (5 min)
const content = await file.text()
const decoder = new TextDecoder('utf-8')

// 2. Parse with Deno CSV (10 min)
import { parse } from "https://deno.land/std@0.208.0/csv/mod.ts"
const rawData = parse(content, {
  skipFirstRow: true, // Use first row as headers
  columns: null // Let parser determine columns
})

// 3. Extract headers and validate structure (10 min)
const headers = Object.keys(rawData[0] || {})
if (headers.length === 0) throw new Error('No headers detected')
if (rawData.length === 0) throw new Error('No data rows found')
```

**Test Cases**:
- Standard CSV with headers ✓
- CSV with special characters ✓  
- Malformed CSV error handling ✓
- Empty file handling ✓

---

#### Task 1C: Field Detection & Mapping (15 min)
**Function**: `detectFields()`

**Implementation Steps**:
```typescript
// 1. Define field patterns (5 min)  
const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\d\s\-\+\(\)\.]{7,15}$/,  
  name: /^[a-zA-Z\s\-\'\.]{2,50}$/
}

// 2. Analyze sample data (5 min)
const sampleSize = Math.min(10, rows.length)
const samples = rows.slice(0, sampleSize)

// 3. Generate confidence scores (5 min)
const fieldMappings = headers.map(header => ({
  csvHeader: header,
  detectedType: detectFieldType(samples, header),
  confidence: calculateConfidence(samples, header),
  suggestedMapping: suggestCRMField(header)
}))
```

**Expected Output**:
```typescript
[
  { csvHeader: "Email", detectedType: "email", confidence: 0.95, suggestedMapping: "email" },
  { csvHeader: "First Name", detectedType: "text", confidence: 0.90, suggestedMapping: "first_name" },
  { csvHeader: "Phone", detectedType: "phone", confidence: 0.85, suggestedMapping: "phone_number" }
]
```

---

### HOUR 2: VALIDATION & PROCESSING (60 min)

#### Task 2A: Data Validation Engine (25 min)
**Function**: `validateRowData()`

**Implementation Steps**:
```typescript
// 1. Email validation (8 min)
function validateEmail(email: string): ValidationResult {
  const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!basicRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' }
  }
  // Additional checks: length, TLD validation
  return { isValid: true }
}

// 2. Phone validation (8 min)  
function validatePhone(phone: string): ValidationResult {
  const normalized = phone.replace(/[^\d+]/g, '')
  if (normalized.length < 7 || normalized.length > 15) {
    return { isValid: false, error: 'Invalid phone length' }
  }
  return { isValid: true, normalizedValue: normalized }
}

// 3. Text field validation (9 min)
function validateTextField(value: string, field: string): ValidationResult {
  const maxLengths = { first_name: 50, last_name: 50, company: 100 }
  const maxLength = maxLengths[field] || 255
  
  if (value.length > maxLength) {
    return { isValid: false, error: `${field} too long (max ${maxLength})` }
  }
  return { isValid: true }
}
```

**Test Cases**:
- Valid data passes ✓
- Invalid emails caught ✓
- Invalid phones caught ✓  
- Long text fields caught ✓

---

#### Task 2B: Duplicate Detection (20 min)
**Function**: `detectDuplicates()`

**Implementation Steps**:
```typescript
// 1. Email-based detection (10 min)
const emailMap = new Map<string, number>()
const duplicates: DuplicateRecord[] = []

processedRows.forEach((row, index) => {
  const email = row.email?.toLowerCase().trim()
  if (email && emailMap.has(email)) {
    duplicates.push({
      rowIndex: index,
      duplicateOf: emailMap.get(email)!,
      matchType: 'email',
      confidence: 1.0
    })
  } else if (email) {
    emailMap.set(email, index)
  }
})

// 2. Name-based fuzzy matching (10 min)
// Use Levenshtein distance for similar names
function calculateSimilarity(name1: string, name2: string): number {
  // Simple implementation for MVP
  const cleaned1 = name1.toLowerCase().trim()
  const cleaned2 = name2.toLowerCase().trim()
  if (cleaned1 === cleaned2) return 1.0
  // Add fuzzy logic here
  return 0.0
}
```

**Expected Output**:
```typescript
{
  totalRows: 150,
  duplicates: [
    { rowIndex: 45, duplicateOf: 12, matchType: 'email', confidence: 1.0 },
    { rowIndex: 89, duplicateOf: 23, matchType: 'name', confidence: 0.85 }
  ],
  uniqueRecords: 148
}
```

---

#### Task 2C: Error Collection & Reporting (15 min)  
**Function**: `generateProcessingReport()`

**Implementation Steps**:
```typescript
// 1. Categorize errors (5 min)
const errorCategories = {
  validation: validationErrors,
  duplicates: duplicateRecords,  
  parsing: parsingErrors,
  mapping: mappingIssues
}

// 2. Generate statistics (5 min)
const stats = {
  totalRows: processedRows.length,
  validRows: validRows.length,
  errorRows: errorRows.length,
  duplicateRows: duplicateRecords.length,
  successRate: (validRows.length / processedRows.length) * 100
}

// 3. Create summary report (5 min)
const report = {
  importId: uuid(),
  timestamp: new Date().toISOString(),
  filename: file.name,
  statistics: stats,
  errors: errorCategories,
  fieldMappings: finalMappings
}
```

---

### HOUR 3: DATABASE & INTEGRATION (60 min)

#### Task 3A: Database Operations (20 min)
**Function**: `saveImportRecord()`

**Implementation Steps**:
```typescript
// 1. Initialize Supabase client (5 min)
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// 2. Insert import record (10 min)
const { data: importRecord, error: importError } = await supabase
  .from('contact_imports')
  .insert({
    id: report.importId,
    organization_id: config.organizationId,
    filename: file.name,
    status: 'completed',
    total_rows: stats.totalRows,
    valid_rows: stats.validRows,
    error_rows: stats.errorRows,
    field_mappings: finalMappings,
    processing_errors: errorCategories,
    created_at: new Date().toISOString()
  })
  .select()
  .single()

// 3. Error handling (5 min)
if (importError) {
  console.error('Database insert failed:', importError)
  throw new Error('Failed to save import record')
}
```

---

#### Task 3B: Response Formatting (15 min)
**Function**: `formatSuccessResponse()`

**Implementation Steps**:
```typescript
// 1. Success response structure (8 min)
const successResponse: ParseCSVResponse = {
  success: true,
  data: {
    importId: report.importId,
    summary: {
      totalRows: stats.totalRows,
      validRows: stats.validRows,  
      errorRows: stats.errorRows,
      duplicateRows: stats.duplicateRows,
      successRate: stats.successRate
    },
    fieldMappings: finalMappings,
    errors: errorCategories.validation.slice(0, 10), // First 10 errors
    duplicates: errorCategories.duplicates.slice(0, 5) // First 5 duplicates
  }
}

// 2. Error response structure (7 min) 
const errorResponse: ParseCSVResponse = {
  success: false,
  error: {
    code: 'PROCESSING_FAILED',
    message: error.message,
    details: {
      filename: file?.name,
      stage: currentStage,
      timestamp: new Date().toISOString()
    }
  }
}
```

---

#### Task 3C: Integration Testing (25 min)

**Test Suite Implementation**:
```typescript
// 1. Happy path test (10 min)
const testValidCSV = `
Email,First Name,Last Name,Phone
john@example.com,John,Doe,555-0123  
jane@example.com,Jane,Smith,555-0456
`

// 2. Error condition tests (10 min)
const testInvalidCSV = `
Invalid,Headers,Here
not-an-email,TooLongNameThatExceedsMaximumLength,LastName,invalid-phone
`

// 3. Edge case tests (5 min)  
const testEdgeCases = `
Email,Name,Phone
duplicate@test.com,User One,555-1111
DUPLICATE@TEST.COM,User Two,555-2222  
`
```

**Manual Testing Checklist**:
- [ ] Upload valid CSV file
- [ ] Verify field detection  
- [ ] Check validation errors
- [ ] Confirm duplicate detection
- [ ] Validate database insertion
- [ ] Test error responses
- [ ] Verify CORS headers
- [ ] Test authentication

---

## HELPER FUNCTIONS TO IMPLEMENT

### 1. `calculateConfidence()` (5 min)
```typescript
function calculateConfidence(samples: any[], header: string): number {
  // Analyze data quality and type consistency
  let matches = 0
  const total = samples.length
  
  samples.forEach(row => {
    const value = row[header]
    if (isValidForDetectedType(value)) matches++
  })
  
  return matches / total
}
```

### 2. `suggestCRMField()` (5 min)  
```typescript
function suggestCRMField(csvHeader: string): string {
  const mappings = {
    'email': 'email',
    'first name': 'first_name', 
    'last name': 'last_name',
    'phone': 'phone_number',
    'company': 'company_name'
  }
  
  const normalized = csvHeader.toLowerCase()
  return mappings[normalized] || 'custom_field'
}
```

### 3. `detectFieldType()` (8 min)
```typescript  
function detectFieldType(samples: any[], header: string): FieldType {
  const values = samples.map(row => row[header]).filter(Boolean)
  
  // Test email pattern
  const emailMatches = values.filter(v => EMAIL_REGEX.test(v)).length
  if (emailMatches / values.length > 0.8) return 'email'
  
  // Test phone pattern  
  const phoneMatches = values.filter(v => PHONE_REGEX.test(v)).length
  if (phoneMatches / values.length > 0.8) return 'phone'
  
  return 'text'
}
```

### 4. `normalizePhoneNumber()` (3 min)
```typescript
function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^\d+]/g, '')
    .replace(/^1/, '') // Remove US country code
    .replace(/^\+1/, '')
}
```

### 5. `sanitizeText()` (4 min)
```typescript
function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s\-\.@]/g, '') // Remove special chars (keep email chars)
}
```

---

## ERROR HANDLING STRATEGY

### Expected Error Types
1. **File Upload Errors**
   - File too large (>10MB)
   - Invalid file type  
   - Missing file

2. **CSV Parsing Errors**
   - Malformed CSV structure
   - Encoding issues
   - Empty file

3. **Validation Errors**
   - Invalid email formats
   - Invalid phone numbers
   - Required fields missing

4. **Database Errors**  
   - Connection failures
   - Permission errors
   - Constraint violations

### Error Response Format
```typescript
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'Human readable message',
    details: {
      field?: 'specific_field',
      row?: 42,
      value?: 'invalid_value'
    }
  }
}
```

---

## TESTING STRATEGY

### Unit Tests (During Implementation)
- Test each helper function independently
- Validate error conditions  
- Check edge cases

### Integration Tests (Hour 3)
- Full CSV upload flow
- Database integration
- API response format

### Manual Testing Checklist  
- [ ] Small CSV (10 rows)
- [ ] Large CSV (1000 rows)  
- [ ] Invalid CSV format
- [ ] Missing headers
- [ ] Special characters
- [ ] Duplicate detection
- [ ] Error responses
- [ ] CORS functionality

---

## DEPLOYMENT CHECKLIST

### Pre-Deploy
- [ ] All functions implemented
- [ ] Unit tests passing
- [ ] Integration tests passing  
- [ ] Error handling tested
- [ ] CORS headers configured

### Deploy Command
```bash
npx supabase functions deploy parse-csv-upload --project-ref qjtaqrlpronohgpfdxsi
```

### Post-Deploy Testing
- [ ] Function accessible via URL
- [ ] Authentication working
- [ ] Database writes successful
- [ ] Error responses proper
- [ ] Performance acceptable

---

## RISK ASSESSMENT & MITIGATION

### High Risk (Likelihood: Medium, Impact: High)
**Risk**: Large file processing timeout  
**Mitigation**: Implement streaming, add progress tracking

**Risk**: Memory usage exceeding limits  
**Mitigation**: Process in chunks, garbage collect aggressively

### Medium Risk (Likelihood: Low, Impact: Medium)
**Risk**: CSV parsing failures on edge formats  
**Mitigation**: Comprehensive test cases, fallback parsing

**Risk**: Database connection issues  
**Mitigation**: Connection retry logic, proper error handling

### Low Risk (Likelihood: Low, Impact: Low)  
**Risk**: Field detection inaccuracy  
**Mitigation**: User can override mappings in UI

---

## PERFORMANCE TARGETS

### Processing Speed
- **Small files** (<1MB): <2 seconds
- **Medium files** (1-5MB): <10 seconds  
- **Large files** (5-10MB): <30 seconds

### Memory Usage
- **Peak memory**: <50MB (under 128MB limit)
- **Steady state**: <20MB

### Success Rates
- **Valid CSV processing**: >99%
- **Field detection accuracy**: >85%
- **Duplicate detection**: >95%

---

## SUCCESS CRITERIA

### MVP Completion
- ✅ Handles standard CSV formats
- ✅ Detects common field types
- ✅ Validates email/phone formats
- ✅ Identifies obvious duplicates  
- ✅ Saves to database correctly
- ✅ Returns structured responses
- ✅ Proper error handling

### Quality Gates
- ✅ All test cases pass
- ✅ Error handling comprehensive
- ✅ Performance meets targets  
- ✅ Security requirements met
- ✅ Documentation complete

---

## POST-IMPLEMENTATION TASKS

### Immediate (Tomorrow Evening)
- [ ] Create comprehensive test suite
- [ ] Document API endpoints  
- [ ] Update project documentation
- [ ] Commit and push changes

### Week 1 Follow-up  
- [ ] Monitor production usage
- [ ] Collect user feedback
- [ ] Performance optimization
- [ ] Bug fixes as needed

### Future Enhancements
- [ ] Advanced duplicate detection
- [ ] Progress tracking for large files
- [ ] Custom field mapping UI
- [ ] Batch processing optimization

---

**IMPLEMENTATION READY** ✅  
**Estimated Completion**: 3 hours  
**Complexity**: Medium-High  
**Success Probability**: 95%  

**Next Action**: Begin Hour 1 implementation with request handling and validation functions.