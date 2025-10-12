# Task 4 Implementation Plan - Duplicate Detection

**Phase 4.1 - Task 4**: Complete implementation roadmap for duplicate detection system

---

## OVERVIEW

**Total Time**: 3 hours  
**Split into**: 6 detailed subtasks  
**Target**: Complete duplicate detection with UI and testing  
**Dependencies**: Task 1 (Database schema) ✅ completed

---

## SUBTASK BREAKDOWN

### Subtask 4.1: Database Functions Setup (30 min)

**Objective**: Create utility functions for duplicate matching

**Steps**:

1. **Create `detect_duplicates` database function** (15 min)
   - Input: contact data + organization_id
   - Hash-based lookup first (fast path)
   - Return array of potential matches
   - Include confidence scores

2. **Implement normalized field comparison** (10 min)
   - Email normalization (lowercase, trim)
   - Phone normalization (remove formatting)
   - Name normalization (lowercase, special chars)

3. **Test database functions** (5 min)
   - Insert test data
   - Verify function returns correct matches
   - Performance check (<5ms for hash lookup)

**Deliverables**:

- ✅ Database function `detect_duplicates()` operational
- ✅ Tested with sample data
- ✅ Fast hash-based matching working

**Test Criteria**: Function returns correct matches for test cases  
**Time**: 30 minutes

---

### Subtask 4.2: Fuzzy Matching Implementation (45 min)

**Objective**: Implement Levenshtein distance for name matching

**Steps**:

1. **Add Levenshtein library** (5 min)
   - Install `fastest-levenshtein` for Deno
   - Test import and basic functionality

2. **Create name similarity function** (15 min)
   - Normalize names before comparison
   - Calculate similarity percentage
   - Return confidence score (0-100%)

3. **Implement multi-field scoring** (20 min)
   - Email match scoring (exact/domain)
   - Phone match scoring (exact/area code)
   - Name similarity scoring
   - Location match scoring
   - Combined confidence calculation

4. **Test fuzzy matching** (5 min)
   - "Jon Smith" vs "John Smith" = 90%+
   - Domain matches with name similarity
   - Edge cases (empty fields, common names)

**Deliverables**:

- ✅ Fuzzy matching working with Levenshtein
- ✅ Multi-field confidence scores calculated
- ✅ Scoring algorithm tuned and tested

**Test Criteria**: "Jon Smith" matches "John Smith" with 90%+ confidence  
**Time**: 45 minutes

---

### Subtask 4.3: Duplicate Detection API (30 min)

**Objective**: Expose duplicate detection via Edge Function or RPC

**Steps**:

1. **Create API endpoint** (10 min)
   - Supabase Edge Function or RPC call
   - Accept: contact data + organization_id
   - Validate input parameters

2. **Implement detection logic** (15 min)
   - Call database `detect_duplicates()` function
   - Run fuzzy matching for non-hash matches
   - Format response with metadata
   - Include confidence scores and reasons

3. **Test API endpoint** (5 min)
   - Test with various contact data
   - Verify JSON response format
   - Performance check (<50ms per contact)

**Deliverables**:

- ✅ API endpoint operational
- ✅ Returns JSON with matches and scores
- ✅ Error handling for invalid input

**Test Criteria**: API call returns duplicates correctly with confidence scores  
**Time**: 30 minutes

---

### Subtask 4.4: Frontend Duplicate Preview Component (45 min)

**Objective**: UI to show duplicates during import preview

**Steps**:

1. **Create DuplicatePreview React component** (20 min)
   - Display matches in comparison table
   - Show confidence scores with color coding
   - Highlight conflicting fields
   - Responsive design for mobile/desktop

2. **Add action buttons** (15 min)
   - Skip Import button
   - Update Existing button
   - Merge Data button
   - Import Anyway button
   - Batch action options

3. **Integrate with import flow** (10 min)
   - Call duplicate detection API
   - Show preview before final import
   - Handle user action selections
   - Update UI state accordingly

**Deliverables**:

- ✅ Component renders duplicate matches
- ✅ User can see field comparisons
- ✅ Action buttons functional
- ✅ Integrated with import workflow

**Test Criteria**: Component displays duplicate correctly with all actions working  
**Time**: 45 minutes

---

### Subtask 4.5: Merge Logic Implementation (30 min)

**Objective**: Implement field-by-field merge functionality

**Steps**:

1. **Create merge utility function** (15 min)
   - Field-by-field merge rules
   - Prefer non-empty values
   - Prefer newer data (CSV over existing)
   - Handle array fields (tags, notes)

2. **Implement conflict detection** (10 min)
   - Identify conflicting fields
   - Flag for manual review
   - Provide resolution options
   - Store conflict metadata

3. **Test merge functionality** (5 min)
   - Test empty field handling
   - Test conflict detection
   - Verify merged data structure
   - Performance check

**Deliverables**:

- ✅ Merge function working correctly
- ✅ Conflicts detected and flagged
- ✅ Manual resolution UI ready
- ✅ Data integrity maintained

**Test Criteria**: Merge combines data correctly and flags conflicts  
**Time**: 30 minutes

---

### Subtask 4.6: Testing & Edge Cases (30 min)

**Objective**: Test all scenarios and edge cases thoroughly

**Steps**:

1. **Test exact matches** (5 min)
   - Email exact match (100% confidence)
   - Phone exact match (95% confidence)
   - Both fields match (100% confidence)

2. **Test fuzzy matches** (5 min)
   - Name similarity at various levels
   - Domain + name matches
   - Phone + name partial matches

3. **Test edge cases** (10 min)
   - Multiple matches (1 contact → 3 existing)
   - Empty fields handling
   - Common names ("John Smith")
   - Company contacts (same domain)

4. **Performance testing** (5 min)
   - Test with 1000 contacts
   - Measure response times
   - Check memory usage
   - Optimize if needed

5. **Bug fixes and polish** (5 min)
   - Fix any issues found
   - Improve error messages
   - Polish UI interactions

**Deliverables**:

- ✅ All test scenarios pass
- ✅ Edge cases handled gracefully
- ✅ Performance meets targets (<50ms/contact)
- ✅ Bug-free implementation

**Test Criteria**: Complete test suite passes, performance acceptable  
**Time**: 30 minutes

---

## IMPLEMENTATION SCHEDULE

### Tomorrow's Session Options

#### Option A: 3-Hour Continuous Block

```
09:00-09:30  Subtask 4.1 (Database Functions)
09:30-10:15  Subtask 4.2 (Fuzzy Matching)
10:15-10:45  Subtask 4.3 (API Endpoint)
10:45-11:00  Break
11:00-11:45  Subtask 4.4 (Frontend UI)
11:45-12:15  Subtask 4.5 (Merge Logic)
12:15-12:45  Subtask 4.6 (Testing & Polish)
12:45-13:00  Final review & documentation
```

#### Option B: Split Sessions (2h + 1h)

**Session 1: Backend (2h)**

- Subtasks 4.1-4.3 (Database + API + Fuzzy matching)
- Core duplicate detection engine
- API testing and validation

**Session 2: Frontend + Testing (1h)**

- Subtask 4.4 (UI Component)
- Subtask 4.5 (Merge Logic)
- Subtask 4.6 (Comprehensive Testing)

---

## SUCCESS CRITERIA

### Technical Requirements ✅

- [ ] **Hash-based matching**: <5ms per contact
- [ ] **Fuzzy matching**: <50ms per contact
- [ ] **API response**: <100ms total
- [ ] **UI responsiveness**: <200ms interactions
- [ ] **Batch processing**: 1000 contacts in <30 seconds

### Functionality Requirements ✅

- [ ] **Exact email duplicates detected** (100% confidence)
- [ ] **Exact phone duplicates detected** (95% confidence)
- [ ] **Fuzzy name matching working** (80%+ accuracy)
- [ ] **Multi-field scoring accurate**
- [ ] **Confidence thresholds functional**
- [ ] **User can choose actions** (skip/update/merge/import)
- [ ] **Merge functionality operational**
- [ ] **Conflict resolution working**

### User Experience Requirements ✅

- [ ] **Duplicates visible in preview**
- [ ] **Confidence scores clear**
- [ ] **Field comparisons obvious**
- [ ] **Actions intuitive**
- [ ] **Batch operations available**
- [ ] **Mobile responsive**
- [ ] **Error handling graceful**

---

## RISK MITIGATION

### Technical Risks

**Risk**: Fuzzy matching performance  
**Mitigation**: Start with simple Levenshtein, optimize later  
**Fallback**: Hash-only matching if performance issues

**Risk**: Complex UI interactions  
**Mitigation**: Build simple comparison table first  
**Fallback**: Basic list view with actions

**Risk**: Database function complexity  
**Mitigation**: Break into smaller functions  
**Fallback**: Application-level matching

### Timeline Risks

**Risk**: Underestimating fuzzy matching complexity  
**Buffer**: 45min allocated vs typical 30min  
**Mitigation**: Have exact-match-only fallback ready

**Risk**: UI polish taking too long  
**Buffer**: Keep UI minimal, focus on functionality  
**Mitigation**: Defer advanced styling

---

## TESTING STRATEGY

### Unit Tests

- Duplicate detection function
- Confidence scoring algorithm
- Merge logic utility
- Name normalization

### Integration Tests

- API endpoint with various inputs
- UI component with mock data
- End-to-end import flow
- Performance benchmarks

### Manual Tests

- Edge cases (empty fields, multiple matches)
- User workflow (preview → action → result)
- Mobile responsiveness
- Error scenarios

---

## DEPENDENCIES

### Required ✅

- **Task 1**: Database schema (completed)
- **Supabase setup**: Edge Functions capability
- **React components**: Basic import UI structure

### Optional 🔄

- **Task 2**: CSV Parser (can work with mock data)
- **Task 3**: Field Mapping UI (independent systems)

---

## DELIVERABLES SUMMARY

By end of 3-hour implementation:

### Backend ✅

- Database duplicate detection function
- Fuzzy matching with Levenshtein
- API endpoint returning JSON matches
- Confidence scoring system

### Frontend ✅

- React duplicate preview component
- Action buttons (skip/update/merge)
- Field comparison table
- Batch operation options

### Testing ✅

- Comprehensive test scenarios
- Edge case handling
- Performance validation
- Bug-free functionality

**TOTAL**: 3 hours → Complete duplicate detection system  
**Quality**: Production-ready with full testing  
**Integration**: Ready for Tasks 2&3 connection

---

**Implementation Plan Complete - Ready for 3-Hour Development Sprint**
