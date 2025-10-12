# Task 5 Test Cases - Import Preview & Validation

**Phase 4.1 - Task 5**: Comprehensive test scenarios for import validation and preview system

---

## TEST OVERVIEW

**Total Test Cases**: 15 comprehensive scenarios  
**Coverage**: All validation categories, UI interactions, performance, integrations  
**Test Types**: Unit, integration, manual, performance, user experience  
**Pass Criteria**: Defined for each scenario with measurable outcomes

---

## VALIDATION ENGINE TESTS

### Test Case 1: All Valid Rows

**Input Data**:

```json
[
  {
    "email": "john@example.com",
    "name": "John Smith",
    "phone": "123-456-7890"
  },
  { "email": "jane@company.com", "name": "Jane Doe", "phone": "987-654-3210" },
  {
    "email": "bob@business.org",
    "name": "Bob Wilson",
    "phone": "+1-555-123-4567"
  }
]
```

**Expected Output**:

- Total rows: 3
- Valid rows: 3 (100%)
- Warning rows: 0
- Error rows: 0
- Quality score: 100%
- Can proceed: true

**Pass Criteria**: All rows validate successfully with no errors or warnings

---

### Test Case 2: Email Format Errors

**Input Data**:

```json
[
  { "email": "invalid-email", "name": "Test User 1", "phone": "123-456-7890" },
  { "email": "missing@", "name": "Test User 2", "phone": "987-654-3210" },
  { "email": "@nodomain.com", "name": "Test User 3", "phone": "555-123-4567" },
  {
    "email": "spaces in@email.com",
    "name": "Test User 4",
    "phone": "444-555-6666"
  },
  {
    "email": "valid@example.com",
    "name": "Valid User",
    "phone": "777-888-9999"
  }
]
```

**Expected Output**:

- Total rows: 5
- Valid rows: 1 (20%)
- Error rows: 4 (80%)
- Errors detected:
  - Row 1: "Invalid email format" (INVALID_EMAIL_FORMAT)
  - Row 2: "Invalid email format" (INVALID_EMAIL_FORMAT)
  - Row 3: "Invalid email format" (INVALID_EMAIL_FORMAT)
  - Row 4: "Invalid email format" (INVALID_EMAIL_FORMAT)
- Can proceed: false (high severity errors)

**Pass Criteria**: Email validation correctly identifies all invalid formats

---

### Test Case 3: Phone Format Errors

**Input Data**:

```json
[
  { "email": "test1@example.com", "phone": "123456", "name": "Too Short" },
  {
    "email": "test2@example.com",
    "phone": "abc-def-ghij",
    "name": "No Digits"
  },
  {
    "email": "test3@example.com",
    "phone": "123456789012345678",
    "name": "Too Long"
  },
  {
    "email": "test4@example.com",
    "phone": "(555) 123-4567",
    "name": "Valid Format"
  },
  {
    "email": "test5@example.com",
    "phone": "+1-800-555-1234",
    "name": "International"
  }
]
```

**Expected Output**:

- Total rows: 5
- Valid rows: 2 (40%)
- Error rows: 2 (40%)
- Warning rows: 1 (20%)
- Specific errors:
  - Row 1: "Invalid phone: Must contain at least 7 digits"
  - Row 2: "Invalid phone: Must contain at least 7 digits"
  - Row 3: "Phone number very long: May be invalid" (warning)

**Pass Criteria**: Phone validation correctly handles various formats and edge cases

---

### Test Case 4: Missing Required Fields

**Input Data**:

```json
[
  { "name": "No Contact Method", "company": "Test Corp" },
  { "email": "", "phone": "", "name": "Empty Fields" },
  { "email": "   ", "phone": "   ", "name": "Whitespace Only" },
  { "email": "valid@example.com", "name": "Has Email" },
  { "phone": "123-456-7890", "name": "Has Phone" }
]
```

**Expected Output**:

- Total rows: 5
- Valid rows: 2 (40%)
- Critical errors: 3 (60%)
- Error messages:
  - Rows 1-3: "Missing contact method: Provide email or phone number"
- Can proceed: false (critical errors block import)

**Pass Criteria**: Required field validation correctly identifies missing contact methods

---

### Test Case 5: Mixed Valid/Warning/Error

**Input Data**:

```json
[
  { "email": "john@gmail.com", "name": "John Smith", "phone": "123-456-7890" },
  { "email": "jane@company.com", "name": "Jane Doe" },
  { "email": "invalid-email", "name": "Bob Wilson", "phone": "987-654-3210" },
  { "email": "alice@yahoo.com", "name": "ALICE WONDERLAND", "company": "" },
  { "phone": "555-123-4567", "name": "Charlie Brown" }
]
```

**Expected Output**:

- Total rows: 5
- Valid rows: 2 (40%)
- Warning rows: 2 (40%)
- Error rows: 1 (20%)
- Quality score: ~75%
- Warnings include: Free email provider, all caps name, missing company
- Can proceed: true (no critical errors)

**Pass Criteria**: Correctly classifies each row and provides accurate summary

---

## UI COMPONENT TESTS

### Test Case 6: Preview Table Display

**Input**: ValidationResult array with 100 rows (various statuses)

**Test Process**:

1. Render PreviewTable component
2. Verify first 50 rows displayed
3. Check status indicators (✅⚠️❌🔍)
4. Test pagination controls
5. Verify sorting and filtering

**Expected Behavior**:

- Table renders within 500ms
- Status icons correctly match row status
- Pagination shows "Page 1 of 2"
- Filters work correctly (errors only, warnings only, etc.)
- Click handlers fire for row selection

**Pass Criteria**: Table displays correctly with all interactions functional

---

### Test Case 7: Summary Dashboard Accuracy

**Input**: ValidationSummary with mixed results

**Test Process**:

1. Render SummaryDashboard component
2. Verify all statistics accurate
3. Check quality score calculation
4. Test action button states
5. Verify error breakdown display

**Expected Behavior**:

- Statistics match validation results exactly
- Quality score reflects error severity correctly
- Import button enabled/disabled based on critical errors
- Error breakdown clickable for filtering
- Export button always available

**Pass Criteria**: Dashboard shows accurate data and all buttons work

---

### Test Case 8: Inline Edit Functionality

**Input**: ValidationResult with email format error

**Test Process**:

1. Click on error row in preview table
2. Row detail modal opens
3. Edit email field to valid format
4. Save changes and verify re-validation
5. Check preview table updates

**Expected Behavior**:

- Modal opens within 100ms
- Error clearly displayed with suggestions
- Real-time validation as user types (debounced)
- Save button enabled when errors resolved
- Preview table updates after save
- Summary stats recalculated

**Pass Criteria**: Inline editing works smoothly with immediate feedback

---

## PERFORMANCE TESTS

### Test Case 9: Large File Validation (10,000 rows)

**Input**: CSV data with 10,000 rows (mix of valid/warning/error)

**Test Process**:

1. Start validation timer
2. Process all 10,000 rows
3. Measure memory usage
4. Check UI responsiveness
5. Verify result accuracy

**Expected Performance**:

- Validation completes in <8 seconds
- Memory usage <50MB increase
- UI remains responsive (no freezing)
- All rows processed correctly
- Summary statistics accurate

**Pass Criteria**: Performance targets met without accuracy loss

---

### Test Case 10: Preview Table Performance

**Input**: 10,000 validation results

**Test Process**:

1. Render preview table
2. Test pagination performance
3. Test filtering performance
4. Test sorting performance
5. Measure render times

**Expected Performance**:

- Initial render <500ms
- Page changes <200ms
- Filter application <300ms
- Sorting <400ms
- Smooth scrolling maintained

**Pass Criteria**: UI remains responsive with large datasets

---

## INTEGRATION TESTS

### Test Case 11: CSV Parser Integration

**Input**: CSV file with various data quality issues

**Test Process**:

1. Upload CSV through Task 2 parser
2. Pass parsed data to validation engine
3. Verify field mapping applied correctly
4. Check error handling for parse failures
5. Test complete pipeline

**Expected Behavior**:

- Parsed data flows seamlessly to validation
- Field mapping preserved in validation results
- Parse errors handled gracefully
- Complete workflow functional

**Pass Criteria**: Seamless integration without data loss or errors

---

### Test Case 12: Duplicate Detection Integration

**Input**: CSV with potential duplicates

**Test Process**:

1. Validate CSV data (Task 5)
2. Run duplicate detection (Task 4)
3. Merge duplicate results into validation
4. Verify preview shows duplicate indicators
5. Test duplicate resolution workflow

**Expected Behavior**:

- Duplicates identified and flagged
- Duplicate status shows in preview table (🔍)
- Confidence scores displayed
- User can choose duplicate actions
- Integration doesn't affect performance significantly

**Pass Criteria**: Duplicate detection integrated without breaking validation flow

---

## EDGE CASE TESTS

### Test Case 13: Empty File Handling

**Input**: Empty CSV file (0 rows)

**Expected Behavior**:

- Validation completes without errors
- Summary shows 0 rows processed
- Preview table shows "No data" message
- Import button disabled with clear message
- No JavaScript errors or crashes

**Pass Criteria**: Empty file handled gracefully with appropriate messaging

---

### Test Case 14: Malformed Data Handling

**Input**: CSV with various malformed entries

**Data Examples**:

```json
[
  { "email": null, "name": null, "phone": undefined },
  { "email": 12345, "name": ["array", "instead", "of", "string"] },
  { "extra_field": "unexpected", "missing_expected": true },
  {}
]
```

**Expected Behavior**:

- Type coercion attempts made where possible
- Clear error messages for unrecoverable data
- No application crashes
- Graceful degradation for unexpected fields
- Validation results clearly indicate issues

**Pass Criteria**: Malformed data doesn't break the system

---

## USER EXPERIENCE TESTS

### Test Case 15: Complete User Workflow

**Scenario**: User imports CSV with errors, fixes them, and proceeds

**Steps**:

1. Upload CSV with known validation issues
2. Review validation summary and preview
3. Use inline edit to fix several errors
4. Apply batch action to skip remaining errors
5. Export error report for offline fixes
6. Proceed with import of valid rows

**Expected Experience**:

- Each step clear and intuitive
- Progress feedback provided throughout
- Error messages helpful and actionable
- Actions complete without confusion
- Final result matches user expectations

**Pass Criteria**: Complete workflow feels natural and efficient

---

## AUTOMATED TEST EXAMPLES

### Unit Test: Email Validation

```javascript
describe('Email Validation', () => {
  test('should accept valid email formats', () => {
    expect(validateEmail('test@example.com')).toBe(null);
    expect(validateEmail('user.name+tag@domain.co.uk')).toBe(null);
  });

  test('should reject invalid email formats', () => {
    const result = validateEmail('invalid-email');
    expect(result).toHaveProperty('severity', 'high');
    expect(result).toHaveProperty('code', 'INVALID_EMAIL_FORMAT');
  });
});
```

### Integration Test: Complete Validation Flow

```javascript
describe('Validation Flow', () => {
  test('should process CSV data end-to-end', async () => {
    const csvData = [
      { email: 'valid@example.com', name: 'Valid User' },
      { email: 'invalid-email', name: 'Invalid User' },
    ];

    const result = await validateImportData(csvData);

    expect(result.totalRows).toBe(2);
    expect(result.validRows).toBe(1);
    expect(result.errorRows).toBe(1);
    expect(result.canProceed).toBe(true);
  });
});
```

### Performance Test: Large Dataset

```javascript
describe('Performance', () => {
  test('should validate 10k rows within time limit', async () => {
    const largeDataset = generateTestData(10000);
    const startTime = performance.now();

    const result = await validateImportData(largeDataset);

    const duration = performance.now() - startTime;
    expect(duration).toBeLessThan(8000); // 8 seconds
    expect(result.totalRows).toBe(10000);
  });
});
```

---

## TEST DATA SETS

### Dataset A: Perfect Data

```json
[
  {
    "email": "perfect1@example.com",
    "name": "Perfect User 1",
    "phone": "123-456-7890",
    "company": "Example Corp"
  },
  {
    "email": "perfect2@business.com",
    "name": "Perfect User 2",
    "phone": "987-654-3210",
    "company": "Business Inc"
  }
]
```

### Dataset B: Common Errors

```json
[
  { "email": "invalid-email", "name": "Error User 1", "phone": "123456" },
  { "email": "missing@", "name": "Error User 2", "phone": "abc-def-ghij" },
  { "name": "Error User 3", "company": "No Contact Info" }
]
```

### Dataset C: Edge Cases

```json
[
  {
    "email": "   TRIMME@EXAMPLE.COM   ",
    "name": " Whitespace User ",
    "phone": "  123-456-7890  "
  },
  {
    "email": "unicode@exämple.com",
    "name": "Üñíçødé Ñámé",
    "phone": "+1-800-555-CALL"
  },
  {
    "email": "very.long.email.address@extremely.long.domain.name.example.com",
    "name": "Very Long Name That Exceeds Reasonable Limits",
    "phone": "1234567890123456789"
  }
]
```

### Dataset D: Performance Test (Generated)

```javascript
function generatePerformanceDataset(count) {
  return Array.from({ length: count }, (_, i) => ({
    email: `user${i}@example.com`,
    name: `Test User ${i}`,
    phone: `555-${String(i).padStart(7, '0')}`,
    company: `Company ${i % 100}`,
  }));
}
```

---

## SUCCESS CRITERIA SUMMARY

### Functional Requirements ✅

- **15/15 test cases pass**: All scenarios work correctly
- **No critical bugs**: System handles edge cases gracefully
- **Accurate validation**: <2% false positives/negatives
- **Complete UI coverage**: All components tested

### Performance Requirements ✅

- **Large file validation**: <8 seconds for 10K rows
- **UI responsiveness**: <500ms render times
- **Memory efficiency**: <50MB for large datasets
- **Integration speed**: <200ms between components

### User Experience Requirements ✅

- **Intuitive workflow**: Users complete tasks without confusion
- **Clear error messaging**: Issues actionable and understandable
- **Smooth interactions**: No jarring delays or confusing states
- **Responsive design**: Works well on all screen sizes

---

**Testing Strategy Complete - Ready for Implementation & Validation**
