# Import Preview & Validation - Rules Specification

**Phase 4.1 - Task 5**: Comprehensive validation system to catch data quality issues before import

---

## OVERVIEW

### Purpose
**Pre-import validation system** that analyzes CSV data to identify errors, warnings, and quality issues before committing to database. Provides users with clear feedback and options to fix issues or proceed with warnings.

### Business Goals
- **Prevent bad data** from entering the system
- **User-friendly error reporting** with clear action steps  
- **Flexible import options** (fix, skip, or override)
- **Performance optimization** for large CSV files
- **Integration** with duplicate detection (Task 4)

---

## VALIDATION CATEGORIES

### Category 1: Required Field Validation
**Priority**: CRITICAL (blocks import)

#### Rules:
- **Contact Method Required**: `email` OR `phone` must be present (at least one)
- **Email Format**: If email present, must be valid format
- **Phone Digits**: If phone present, must have minimum 7 digits

#### Error Messages:
```
"Missing contact method: Provide email or phone number"
"Invalid email format: Expected format like example@domain.com"  
"Invalid phone: Must contain at least 7 digits"
```

#### Implementation:
```javascript
function validateRequiredFields(row) {
  const hasEmail = row.email && row.email.trim().length > 0;
  const hasPhone = row.phone && extractDigits(row.phone).length >= 7;
  
  if (!hasEmail && !hasPhone) {
    return {
      severity: 'critical',
      code: 'MISSING_CONTACT_METHOD',
      message: 'Missing contact method: Provide email or phone number'
    };
  }
  
  return null; // Valid
}
```

---

### Category 2: Format Validation  
**Priority**: HIGH (shows errors, allows override)

#### Email Format Rules:
- Must contain `@` symbol
- Must have domain (after @)  
- Domain must have extension (.com, .it, etc.)
- No spaces allowed
- Valid characters only

**Regex**: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

**Examples**:
```
✅ Valid: john@example.com, user.name@domain.co.uk
❌ Invalid: invalid-email, @domain.com, user@, user name@domain.com
```

#### Phone Format Rules:
- Extract only digits for validation
- Minimum 7 digits (local numbers)
- Maximum 15 digits (international format)
- Allow +, -, (), spaces (removed during normalization)

**Valid formats**:
```
✅ 1234567, (123) 456-7890, +39 123 456 7890, 123-456-7890
❌ 123456 (too short), abc-def-ghij (no digits)
```

#### Name Format Rules:
- Minimum 2 characters
- Maximum 100 characters  
- Allow letters, spaces, hyphens, apostrophes
- Numbers trigger warning (not error)

**Implementation**:
```javascript
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS_REGEX = /\d/g;

function validateEmail(email) {
  if (!email) return null;
  
  const trimmed = email.trim();
  if (!EMAIL_REGEX.test(trimmed)) {
    return {
      severity: 'high',
      code: 'INVALID_EMAIL_FORMAT',
      message: `Invalid email format: Expected format like example@domain.com`,
      suggestion: 'Check for missing @ or domain extension'
    };
  }
  
  return null;
}

function validatePhone(phone) {
  if (!phone) return null;
  
  const digits = (phone.match(PHONE_DIGITS_REGEX) || []).join('');
  if (digits.length < 7) {
    return {
      severity: 'high', 
      code: 'INVALID_PHONE_FORMAT',
      message: 'Invalid phone: Must contain at least 7 digits',
      suggestion: 'Example: (123) 456-7890 or +1-123-456-7890'
    };
  }
  
  if (digits.length > 15) {
    return {
      severity: 'medium',
      code: 'PHONE_TOO_LONG',
      message: 'Phone number very long: May be invalid',
      suggestion: 'Check for extra digits or formatting'
    };
  }
  
  return null;
}
```

---

### Category 3: Data Type Validation
**Priority**: MEDIUM (warnings)

#### Field Type Checks:
- `email` → must be string, email format
- `phone` → string or number, extract digits  
- `name` → string, text only
- `company` → string
- `notes` → string, any length
- `tags` → array of strings or comma-separated string

#### Type Coercion:
- Numbers in name field → warning but allow
- Extra whitespace → auto-trim
- Mixed case email → auto-lowercase
- Tags as string → split by comma and trim

**Implementation**:
```javascript
function validateDataTypes(row) {
  const warnings = [];
  const coercedData = { ...row };
  
  // Email normalization
  if (row.email) {
    coercedData.email = row.email.trim().toLowerCase();
  }
  
  // Phone normalization  
  if (row.phone) {
    const digits = (row.phone.match(/\d/g) || []).join('');
    coercedData.phone_normalized = digits;
  }
  
  // Name validation
  if (row.name && /\d/.test(row.name)) {
    warnings.push({
      field: 'name',
      severity: 'medium',
      code: 'NAME_CONTAINS_NUMBERS',
      message: 'Name contains numbers: May be data entry error',
      suggestion: 'Review name field for accuracy'
    });
  }
  
  // Tags normalization
  if (row.tags && typeof row.tags === 'string') {
    coercedData.tags = row.tags.split(',').map(tag => tag.trim()).filter(Boolean);
  }
  
  return { warnings, coercedData };
}
```

---

### Category 4: Data Quality Warnings
**Priority**: LOW (informational)

#### Warning Scenarios:
- **Free email providers** (gmail, yahoo, hotmail, etc.)
- **Very long names** (>50 characters)  
- **Missing optional fields** (company, address)
- **Suspicious patterns** (all caps, repeated characters)
- **Potential duplicates** (handled by Task 4)

#### Actions:
- Show warnings but allow import
- User can review and proceed
- Log warnings for later review

**Implementation**:
```javascript
const FREE_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];

function generateDataQualityWarnings(row) {
  const warnings = [];
  
  // Free email provider
  if (row.email) {
    const domain = row.email.split('@')[1]?.toLowerCase();
    if (FREE_EMAIL_DOMAINS.includes(domain)) {
      warnings.push({
        field: 'email',
        severity: 'low',
        code: 'FREE_EMAIL_PROVIDER',
        message: `Free email provider: ${domain}`,
        suggestion: 'Consider asking for business email'
      });
    }
  }
  
  // Very long name
  if (row.name && row.name.length > 50) {
    warnings.push({
      field: 'name',
      severity: 'medium', 
      code: 'NAME_VERY_LONG',
      message: `Name is very long (${row.name.length} chars)`,
      suggestion: 'Check for data entry errors'
    });
  }
  
  // All caps name (aggressive)
  if (row.name && row.name === row.name.toUpperCase() && row.name.length > 5) {
    warnings.push({
      field: 'name',
      severity: 'low',
      code: 'NAME_ALL_CAPS',
      message: 'Name is in ALL CAPS',
      suggestion: 'Consider proper case formatting'
    });
  }
  
  // Missing company for business context
  if (!row.company && row.email && !FREE_EMAIL_DOMAINS.some(domain => 
      row.email.toLowerCase().includes(domain))) {
    warnings.push({
      field: 'company',
      severity: 'low', 
      code: 'MISSING_COMPANY',
      message: 'Company name missing for business email',
      suggestion: 'Consider adding company information'
    });
  }
  
  return warnings;
}
```

---

### Category 5: Business Rules
**Priority**: CUSTOM (configurable)

#### Configurable Rules (Future Enhancement):
- **Email domain whitelist/blacklist**
- **Required custom fields** per organization
- **Phone number country validation**  
- **Company name standardization**
- **Tag validation** (from predefined list)

**Implementation Framework**:
```javascript
function validateBusinessRules(row, organizationRules) {
  const errors = [];
  const warnings = [];
  
  // Example: Required custom fields
  if (organizationRules.requiredFields) {
    organizationRules.requiredFields.forEach(fieldName => {
      if (!row[fieldName]) {
        errors.push({
          field: fieldName,
          severity: 'high',
          code: 'CUSTOM_FIELD_REQUIRED',
          message: `${fieldName} is required for this organization`
        });
      }
    });
  }
  
  // Example: Email domain restrictions
  if (organizationRules.allowedEmailDomains && row.email) {
    const domain = row.email.split('@')[1]?.toLowerCase();
    if (!organizationRules.allowedEmailDomains.includes(domain)) {
      warnings.push({
        field: 'email',
        severity: 'medium',
        code: 'EMAIL_DOMAIN_NOT_PREFERRED',
        message: `Email domain ${domain} not in preferred list`
      });
    }
  }
  
  return { errors, warnings };
}
```

---

## VALIDATION EXECUTION FLOW

```
CSV Upload (Task 2)
    ↓
Parse rows into array
    ↓
For each row (batch of 100):
    ↓
1. Check required fields (Category 1)
    ↓
2. Validate formats (Category 2) 
    ↓
3. Check data types & coerce (Category 3)
    ↓  
4. Generate quality warnings (Category 4)
    ↓
5. Apply business rules (Category 5)
    ↓
6. Run duplicate detection (Task 4 integration)
    ↓
7. Calculate overall validation score
    ↓
Aggregate results by status
    ↓
Show preview with errors/warnings summary
    ↓
User decides: Fix, Skip, or Proceed
```

---

## VALIDATION RESULT STRUCTURE

### TypeScript Interfaces

```typescript
interface ValidationResult {
  rowNumber: number;
  rawData: Record<string, any>;
  
  status: 'valid' | 'warning' | 'error' | 'critical';
  
  errors: ValidationError[];
  warnings: ValidationWarning[];
  
  validatedData: {
    email?: string;
    phone?: string;
    phone_normalized?: string;
    name?: string;
    company?: string;
    tags?: string[];
    // ... other fields
  };
  
  duplicates?: DuplicateMatch[]; // From Task 4
  qualityScore: number; // 0-100
}

interface ValidationError {
  field: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  code: string; // e.g., 'MISSING_REQUIRED', 'INVALID_FORMAT'
  suggestion?: string;
}

interface ValidationWarning {
  field: string;
  message: string;
  severity: 'medium' | 'low';
  code: string;
  suggestion?: string;
}

interface ValidationSummary {
  totalRows: number;
  validRows: number;
  warningRows: number; 
  errorRows: number;
  criticalRows: number;
  duplicateRows: number;
  
  errorBreakdown: {
    [code: string]: number;
  };
  
  canProceed: boolean; // false if critical errors exist
  recommendations: string[];
}
```

---

## ERROR SEVERITY LEVELS

### Critical Errors (Block Import)
**Characteristics**: Prevent successful data import
- Missing required fields (email AND phone both empty)
- Invalid data structure (unparseable)  
- Duplicate rows in CSV (identical data)

**Action**: Must fix before import allowed  
**UI**: Red background, block icon, "Fix Required" button

### High Errors (Recommend Fix)  
**Characteristics**: Data quality issues that should be addressed
- Invalid email format
- Invalid phone format
- Data type mismatch

**Action**: Show error, allow override with confirmation  
**UI**: Orange background, warning icon, "Fix" or "Ignore" buttons

### Medium Warnings (Inform User)
**Characteristics**: Potential issues worth reviewing
- Missing optional fields
- Data quality concerns
- Suspicious patterns

**Action**: Show warning, allow proceed normally  
**UI**: Yellow background, info icon, dismissible

### Low Warnings (FYI)
**Characteristics**: Informational notices  
- Free email provider
- Very long text fields
- Unusual formatting

**Action**: Informational only, no action required  
**UI**: Light blue background, info icon, auto-dismiss option

---

## PREVIEW UI REQUIREMENTS

### Summary Stats Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ 📊 Import Preview: 1,250 rows                              │
├─────────────────────────────────────────────────────────────┤
│ ✅ Valid: 1,180 (94.4%)        🔍 Duplicates: 12 (1.0%)   │
│ ⚠️  Warnings: 65 (5.2%)        📈 Quality Score: 89%      │  
│ ❌ Errors: 5 (0.4%)                                        │
│                                                             │
│ 🚨 Critical Issues: 0 → ✅ Ready to Import                 │
│                                                             │
│ Top Issues:                                                 │
│ • Invalid email format: 3 rows                            │
│ • Missing phone: 2 rows                                   │
│ • Free email provider: 45 rows                            │
└─────────────────────────────────────────────────────────────┘

[📊 Show All] [❌ Errors Only] [⚠️ Warnings Only] [📄 Export Report]
```

### Preview Table (First 50 Rows)

```
┌────┬───────┬──────────────────┬──────────────┬──────────────────┐
│ #  │Status │ Email            │ Name         │ Issues           │
├────┼───────┼──────────────────┼──────────────┼──────────────────┤
│ 1  │ ✅    │john@example.com  │John Smith    │ None             │
│ 2  │ ⚠️     │jane@gmail.com    │Jane Doe      │Free email        │
│ 3  │ ❌    │invalid-email     │Bob Jones     │Invalid format    │
│ 4  │ ✅    │alice@company.com │Alice Wonder  │ None             │
│ 5  │ 🔍    │john@example.com  │John Smith    │Possible duplicate│
│ 6  │ ⚠️     │MIKE@LOUD.COM     │MIKE JACKSON  │All caps, long    │
│... │ ...   │ ...              │ ...          │ ...              │
└────┴───────┴──────────────────┴──────────────┴──────────────────┘

[⬅️ Previous 50] [➡️ Next 50] [🔍 Search] [⚙️ Filters]
```

### Row Detail View (Modal/Sidebar)

```
┌─────────────────────────────────────────────────────────────┐
│ 📝 Row 3: Bob Jones                               [✖️ Close] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ❌ Errors (1):                                              │
│  • Email: Invalid format "invalid-email"                   │
│    💡 Expected: email@domain.com                           │
│    [🔧 Fix Inline] [⏭️ Skip Row]                            │
│                                                             │
│ ⚠️ Warnings (2):                                            │
│  • Phone: Missing phone number                             │ 
│    💡 Suggestion: Add phone for better contact options     │
│  • Company: Missing company name                           │
│    💡 Suggestion: Add company for business context        │
│                                                             │
│ 📋 Raw CSV Data:                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Email:   [invalid-email            ] 🔧               │ │
│ │ Name:    [Bob Jones                 ]                  │ │  
│ │ Phone:   [123-456-7890             ]                  │ │
│ │ Company: [                         ]                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [💾 Save Changes] [🔄 Re-validate] [❌ Cancel]              │
└─────────────────────────────────────────────────────────────┘
```

### Batch Operations Panel

```
┌─────────────────────────────────────────────────────────────┐
│ 🔧 Batch Actions                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Apply to all error rows (5 rows):                          │ 
│ ○ Skip all error rows                                       │
│ ○ Fix common issues automatically                           │
│ ○ Download error report for manual fixes                   │
│                                                             │
│ Apply to all warning rows (65 rows):                       │
│ ○ Import all with warnings                                  │
│ ○ Review warnings individually                              │  
│ ○ Skip rows with specific warning types                     │
│                                                             │
│ [🚀 Apply Actions] [💾 Save Fixes] [📄 Export Report]      │
└─────────────────────────────────────────────────────────────┘
```

---

## IMPORT DECISION FLOW

```
Preview shows validation results
    ↓
User reviews summary stats
    ↓
Options based on validation results:
    
    🟢 All Valid:
    → [Import All] button enabled
    
    🟡 Warnings Only:
    → [Import with Warnings] (proceed)
    → [Review Warnings] (detailed view)
    
    🔴 Has Errors:
    → [Fix Errors] (inline editing)
    → [Skip Error Rows] (import valid only) 
    → [Download Report] (fix offline)
    
    🚨 Critical Errors:
    → [Fix Required] (blocking, must resolve)
    ↓
User confirms final action
    ↓
Apply fixes/skips/overrides
    ↓
Re-validate processed data
    ↓
Proceed to import execution (Task 6)
```

---

## TESTING SCENARIOS

### Test Scenario 1: All Rows Valid
**Data**: 100 rows with perfect email/phone/name format  
**Expected**: Green summary, "Ready to Import", no issues shown  
**Actions**: Import button enabled immediately

### Test Scenario 2: Email Format Errors
**Data**: 10 rows with invalid emails (missing @, no domain, etc.)  
**Expected**: Error count shown, rows highlighted, fix suggestions provided  
**Actions**: Inline edit working, re-validation after fix

### Test Scenario 3: Phone Format Errors  
**Data**: 5 rows with invalid phones (too short, letters only, etc.)  
**Expected**: High severity errors, clear error messages  
**Actions**: Format examples provided, normalization working

### Test Scenario 4: Missing Required Fields
**Data**: 3 rows with both email AND phone empty  
**Expected**: Critical errors, import blocked until fixed  
**Actions**: Must provide at least one contact method

### Test Scenario 5: Mixed Valid/Warning/Error
**Data**: 50 valid, 20 warnings, 5 errors  
**Expected**: Accurate summary stats, proper status indicators  
**Actions**: Can proceed with warnings, must fix errors

### Test Scenario 6: Large File Performance
**Data**: 10,000 rows  
**Expected**: Validation completes in <5 seconds, preview responsive  
**Actions**: Pagination working, batch operations available

### Test Scenario 7: Inline Edit Flow
**Data**: Row with invalid email  
**Expected**: Edit modal opens, validation on save, preview updates  
**Actions**: Fix persists, re-validation working, UI responsive

### Test Scenario 8: Download Error Report  
**Data**: File with multiple error types  
**Expected**: CSV export with error descriptions and suggestions  
**Actions**: File downloads correctly, issues clearly marked

### Test Scenario 9: Proceed with Warnings
**Data**: Rows with free email providers, missing optional fields  
**Expected**: Warning summary shown, proceed option available  
**Actions**: User can accept warnings and continue

### Test Scenario 10: Skip Error Rows
**Data**: Mix of valid and error rows  
**Expected**: Option to import only valid rows  
**Actions**: Error rows excluded, summary updated, import continues

---

## PERFORMANCE REQUIREMENTS

### Validation Performance
- **Small files (< 1,000 rows)**: <1 second validation
- **Medium files (1,000-5,000 rows)**: <3 seconds validation  
- **Large files (5,000-10,000 rows)**: <8 seconds validation
- **Memory usage**: <50MB for 10,000 rows

### UI Performance
- **Preview table render**: <500ms for 50 rows
- **Inline edit modal**: Opens in <100ms
- **Re-validation after fix**: <200ms per row
- **Summary stats update**: <100ms
- **Filter/search**: <300ms response

### Batch Operations  
- **Apply batch fixes**: <2 seconds for 1,000 rows
- **Export error report**: <3 seconds for 10,000 rows
- **Skip multiple rows**: <1 second for any quantity

---

## SUCCESS CRITERIA

### Functional Requirements ✅
- **All validation categories implemented** (5 categories)
- **Error classification working** (4 severity levels)  
- **Preview UI shows all information clearly**
- **Inline editing functional** with re-validation
- **Batch operations available** for efficiency
- **Integration with duplicate detection** (Task 4)
- **Export functionality** for offline fixes

### Performance Requirements ✅  
- **Validation speed meets targets** (<8s for 10K rows)
- **UI responsiveness maintained** (<500ms renders)
- **Memory usage within limits** (<50MB for 10K rows)
- **Batch operations efficient** (<3s for large operations)

### User Experience Requirements ✅
- **Clear error messaging** with actionable suggestions
- **Intuitive status indicators** (✅⚠️❌🔍)
- **Flexible import options** (fix/skip/proceed)  
- **Progress feedback** during validation
- **Responsive design** for all screen sizes

---

**Validation Rules Design Complete - Ready for Implementation**