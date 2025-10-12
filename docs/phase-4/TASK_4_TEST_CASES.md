# Task 4 Test Cases - Duplicate Detection

**Phase 4.1 - Task 4**: Comprehensive test scenarios for duplicate detection algorithm

---

## TEST OVERVIEW

**Total Test Cases**: 18 comprehensive scenarios  
**Coverage**: Exact matches, fuzzy matches, edge cases, performance  
**Test Types**: Unit, integration, manual, performance  
**Pass Criteria**: Defined for each scenario

---

## EXACT MATCH TESTS

### Test Case 1: Exact Email Match (100% Confidence)

**Input**:
```json
{
  "email": "john.doe@example.com",
  "first_name": "John", 
  "last_name": "Doe"
}
```

**Existing Contact**:
```json
{
  "email": "john.doe@example.com",
  "first_name": "John",
  "last_name": "Doe", 
  "phone": "123-456-7890"
}
```

**Expected Output**:
- Match found: ✅
- Confidence: 100%
- Reason: "Exact email match"
- Action: Recommend "Skip Import"

**Pass Criteria**: Detection returns 100% confidence match

---

### Test Case 2: Exact Phone Match (95% Confidence)

**Input**:
```json
{
  "phone": "123-456-7890",
  "first_name": "Jane",
  "last_name": "Smith"
}
```

**Existing Contact**:
```json
{
  "phone": "123-456-7890", 
  "first_name": "Jane",
  "last_name": "Smith",
  "email": "jane@company.com"
}
```

**Expected Output**:
- Match found: ✅
- Confidence: 95%
- Reason: "Exact phone match"
- Action: Recommend "Skip Import" or "Update Existing"

**Pass Criteria**: Detection returns 95% confidence match

---

### Test Case 3: Normalized Phone Match

**Input**:
```json
{
  "phone": "(123) 456-7890",
  "email": "test@example.com"
}
```

**Existing Contact**:
```json
{
  "phone": "123-456-7890",
  "email": "different@example.com"
}
```

**Expected Output**:
- Match found: ✅
- Confidence: 95%
- Reason: "Normalized phone match"
- Action: Recommend "Review" (email conflict)

**Pass Criteria**: Phone normalization works correctly

---

### Test Case 4: Both Email and Phone Match

**Input**:
```json
{
  "email": "john@example.com",
  "phone": "123-456-7890",
  "first_name": "John"
}
```

**Existing Contact**:
```json
{
  "email": "john@example.com",
  "phone": "123-456-7890", 
  "first_name": "John"
}
```

**Expected Output**:
- Match found: ✅
- Confidence: 100%
- Reason: "Email and phone exact match"
- Action: Recommend "Skip Import"

**Pass Criteria**: Highest confidence when both fields match

---

## FUZZY MATCH TESTS

### Test Case 5: Fuzzy Name Match (High Similarity)

**Input**:
```json
{
  "email": "jon.smith@company.com",
  "first_name": "Jon",
  "last_name": "Smith"
}
```

**Existing Contact**:
```json
{
  "email": "john.smith@company.com",
  "first_name": "John", 
  "last_name": "Smith"
}
```

**Expected Output**:
- Match found: ✅
- Confidence: 90%
- Reason: "Same domain + name 90% similar"
- Action: Recommend "Review"

**Pass Criteria**: Levenshtein distance calculates 90%+ similarity

---

### Test Case 6: Name Similarity (Medium)

**Input**:
```json
{
  "first_name": "Catherine",
  "last_name": "Johnson", 
  "city": "New York"
}
```

**Existing Contact**:
```json
{
  "first_name": "Katherine",
  "last_name": "Johnson",
  "city": "New York"
}
```

**Expected Output**:
- Match found: ✅
- Confidence: 85%
- Reason: "Name 80% similar + location match"
- Action: Recommend "Review"

**Pass Criteria**: Name similarity + location matching works

---

### Test Case 7: Email Domain + Name Match

**Input**:
```json
{
  "email": "j.smith@acme.com",
  "first_name": "John",
  "last_name": "Smith"
}
```

**Existing Contact**:
```json
{
  "email": "john.smith@acme.com",
  "first_name": "John",
  "last_name": "Smith"
}
```

**Expected Output**:
- Match found: ✅
- Confidence: 85%
- Reason: "Same domain + exact name match"
- Action: Recommend "Review"

**Pass Criteria**: Domain extraction and name matching works

---

### Test Case 8: Phone + Name Partial Match

**Input**:
```json
{
  "phone": "123-456-7890",
  "first_name": "Jane",
  "last_name": "Williams"
}
```

**Existing Contact**:
```json
{
  "phone": "123-456-7890",
  "first_name": "Jane", 
  "last_name": "Doe"
}
```

**Expected Output**:
- Match found: ✅
- Confidence: 75%
- Reason: "Exact phone + first name match"
- Action: Recommend "Review"

**Pass Criteria**: Detects potential name change (marriage, etc.)

---

## WEAK MATCH TESTS

### Test Case 9: Multi-Field Weak Match

**Input**:
```json
{
  "email": "john@gmail.com",
  "first_name": "John",
  "city": "Boston",
  "phone": "617-555-0001"
}
```

**Existing Contact**:
```json
{
  "email": "john@yahoo.com", 
  "first_name": "John",
  "city": "Boston",
  "phone": "617-555-9999"
}
```

**Expected Output**:
- Match found: ✅
- Confidence: 60%
- Reason: "Same username + first name + city + area code"
- Action: Flag for "Optional Review"

**Pass Criteria**: Multiple weak signals combined correctly

---

### Test Case 10: Low Confidence Match

**Input**:
```json
{
  "first_name": "John",
  "city": "New York"
}
```

**Existing Contact**:
```json
{
  "first_name": "John",
  "city": "New York"
}
```

**Expected Output**:
- Match found: ✅
- Confidence: 40%
- Reason: "Common name + location only" 
- Action: "Don't show" (below 50% threshold)

**Pass Criteria**: Low confidence matches filtered out

---

## NO MATCH TESTS

### Test Case 11: No Match Scenario

**Input**:
```json
{
  "email": "unique@example.com",
  "first_name": "Unique",
  "last_name": "Person",
  "phone": "999-888-7777"
}
```

**Existing Contacts**: Various other contacts with no similarities

**Expected Output**:
- Match found: ❌
- Confidence: 0%
- Reason: "No matches found"
- Action: "Import normally"

**Pass Criteria**: No false positives for genuinely unique contacts

---

## EDGE CASE TESTS

### Test Case 12: Empty Fields Handling

**Input**:
```json
{
  "email": "john@example.com",
  "phone": null,
  "first_name": "",
  "last_name": "Smith"
}
```

**Existing Contact**:
```json
{
  "email": "john@example.com",
  "phone": "123-456-7890",
  "first_name": "John",
  "last_name": "Smith"
}
```

**Expected Output**:
- Match found: ✅
- Confidence: 100%
- Reason: "Exact email match"
- Action: Recommend "Update Existing" (CSV has missing fields)

**Pass Criteria**: Empty fields don't break matching logic

---

### Test Case 13: Multiple Matches

**Input**:
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "city": "Boston"
}
```

**Existing Contacts**:
- Contact A: John Smith, Boston, john1@email.com
- Contact B: John Smith, Boston, john2@email.com  
- Contact C: John Smith, Boston, john3@email.com

**Expected Output**:
- Matches found: 3
- Confidences: [70%, 70%, 70%]
- Reason: "Common name + location"
- Action: Show all matches, let user choose

**Pass Criteria**: Multiple matches displayed with individual confidence scores

---

### Test Case 14: Common Names Edge Case

**Input**:
```json
{
  "first_name": "John",
  "last_name": "Smith"
}
```

**Existing Contacts**: 50+ contacts named "John Smith"

**Expected Output**:
- Matches found: 0 (filtered out)
- Reason: "Common name without additional identifying fields"
- Action: "Import normally"

**Pass Criteria**: Common names without strong signals don't trigger false positives

---

### Test Case 15: Company Contacts (Same Domain)

**Input**:
```json
{
  "email": "alice@company.com",
  "first_name": "Alice",
  "last_name": "Johnson"
}
```

**Existing Contact**:
```json
{
  "email": "bob@company.com",
  "first_name": "Bob", 
  "last_name": "Wilson"
}
```

**Expected Output**:
- Match found: ❌
- Confidence: 10%
- Reason: "Same domain but different names"
- Action: "Import normally"

**Pass Criteria**: Same company domain doesn't trigger false duplicate

---

### Test Case 16: Case Sensitivity & Whitespace

**Input**:
```json
{
  "email": "  JOHN.DOE@EXAMPLE.COM  ",
  "first_name": " John ",
  "last_name": " Doe "
}
```

**Existing Contact**:
```json
{
  "email": "john.doe@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Expected Output**:
- Match found: ✅
- Confidence: 100%
- Reason: "Exact email match (normalized)"
- Action: Recommend "Skip Import"

**Pass Criteria**: Normalization handles case and whitespace correctly

---

## PERFORMANCE TESTS

### Test Case 17: Single Contact Performance

**Input**: One contact with full data

**Test Process**:
1. Time hash lookup
2. Time fuzzy matching (if needed)
3. Time total API call

**Expected Performance**:
- Hash lookup: <5ms
- Fuzzy matching: <50ms  
- Total API call: <100ms

**Pass Criteria**: All performance targets met

---

### Test Case 18: Batch Performance Test

**Input**: 1000 unique contacts (no duplicates)

**Test Process**:
1. Process all 1000 contacts
2. Measure total time
3. Check memory usage
4. Verify all processed correctly

**Expected Performance**:
- Total time: <30 seconds
- Memory: <100MB increase
- All contacts processed: 100%

**Pass Criteria**: Batch processing within performance limits

---

## INTEGRATION TESTS

### Test Case 19: API Endpoint Integration

**Test Process**:
1. Call duplicate detection API with various inputs
2. Verify JSON response format
3. Test error handling (invalid input)
4. Test edge cases via API

**Expected Behavior**:
- Consistent JSON structure
- Proper error messages
- All test cases work via API
- Authentication/authorization working

**Pass Criteria**: All API calls return expected results

---

### Test Case 20: UI Component Integration  

**Test Process**:
1. Load duplicate preview component
2. Display various match scenarios
3. Test user interactions (buttons)
4. Verify responsive design

**Expected Behavior**:
- All matches display correctly
- Confidence scores visible
- Action buttons functional  
- Mobile layout works

**Pass Criteria**: UI displays all test scenarios correctly

---

## MANUAL TEST SCENARIOS

### Test Case 21: User Workflow Test

**Scenario**: User imports CSV with duplicates

**Steps**:
1. Upload CSV with known duplicates
2. Review duplicate preview
3. Choose actions for each duplicate
4. Complete import
5. Verify final results

**Expected Experience**:
- Duplicates clearly identified
- Actions intuitive
- Results match expectations
- No data loss or corruption

**Pass Criteria**: Smooth user experience from start to finish

---

## TEST DATA SETS

### Dataset A: Exact Matches
```json
[
  {"email": "test1@example.com", "name": "Test User 1"},
  {"email": "test2@example.com", "name": "Test User 2"},
  {"phone": "123-456-7890", "name": "Phone User"}
]
```

### Dataset B: Fuzzy Matches  
```json
[
  {"email": "jon@company.com", "name": "Jon Smith"},
  {"email": "catherine@email.com", "name": "Katherine Johnson"},
  {"phone": "(555) 123-4567", "name": "Jane Williams"}
]
```

### Dataset C: Edge Cases
```json
[
  {"name": "John Smith", "city": "Boston"},
  {"email": "", "phone": null, "name": "Empty Fields"},
  {"name": "JOHN DOE   ", "email": "  JOHN@EXAMPLE.COM  "}
]
```

---

## AUTOMATED TEST EXECUTION

### Unit Test Suite
```javascript
describe('Duplicate Detection', () => {
  test('Exact email match returns 100%', async () => {
    // Test Case 1 implementation
  });
  
  test('Fuzzy name matching works', async () => {
    // Test Case 5 implementation  
  });
  
  // ... all other test cases
});
```

### Performance Test Suite
```javascript
describe('Performance', () => {
  test('Hash lookup under 5ms', async () => {
    // Test Case 17 implementation
  });
  
  test('Batch processing under 30s', async () => {
    // Test Case 18 implementation
  });
});
```

---

## SUCCESS CRITERIA SUMMARY

### Functional Requirements ✅
- **18/18 test cases pass**: All scenarios work correctly
- **No false positives**: <5% incorrect duplicate detection
- **No false negatives**: >95% real duplicates caught
- **Edge cases handled**: No crashes or errors

### Performance Requirements ✅
- **Hash lookup**: <5ms per contact
- **Fuzzy matching**: <50ms per contact
- **API response**: <100ms total
- **Batch processing**: 1000 contacts in <30 seconds

### User Experience Requirements ✅
- **Intuitive UI**: Users understand duplicate previews
- **Clear actions**: Skip/Update/Merge options obvious  
- **No data loss**: All user choices respected
- **Responsive design**: Works on all devices

---

**Testing Strategy Complete - Ready for Implementation & Validation**