# Duplicate Detection Algorithm - Design Specification

**Phase 4.1 - Task 4**: Intelligent duplicate detection system with multi-field matching, fuzzy logic, and confidence scoring.

---

## OVERVIEW

### Business Requirements

#### Goals
- **Prevent duplicate contacts** during CSV import
- **Identify existing duplicates** in database  
- **Provide merge/update strategies** for user decision
- **Allow manual review** for uncertain matches
- **Maintain data integrity** while reducing duplicates

#### User Experience
- **Auto-detect duplicates** during import preview
- **Show confidence scores** (0-100%) for each match
- **Allow user to choose action**: skip, update, or merge
- **Highlight conflicting data** for manual resolution
- **Batch operations** for multiple duplicates

---

## MATCHING STRATEGIES

### Strategy 1: Exact Match (Highest Priority)

**Fields**: Normalized email OR normalized phone

**Logic**:
- If `normalized_email` matches exactly → **100% duplicate**
- If `normalized_phone` matches exactly → **95% duplicate**  
- If both match → **100% duplicate** (same person confirmed)

**Examples**:
```
"john@example.com" = "JOHN@EXAMPLE.COM" → Match ✅
"123-456-7890" = "(123) 456.7890" → Match ✅ (after normalization)
```

**Confidence**: 95-100%  
**Action**: Recommend skip or update

### Strategy 2: Email Domain + Name Match

**Fields**: Email domain + Normalized name

**Logic**:
- Extract domain from email address
- Normalize name (lowercase, trim, remove special chars)
- If domain matches AND name similar (>80% similarity) → **Likely duplicate**

**Examples**:
```
"john.smith@company.com" vs "j.smith@company.com" + names match → 85% duplicate
Same domain, similar names → Likely same person or family
```

**Confidence**: 70-90%  
**Action**: Recommend review

### Strategy 3: Fuzzy Name + Location Match

**Fields**: Full name + City/State

**Logic**:
- Use Levenshtein distance for name similarity
- If name >85% similar AND location matches → **Potential duplicate**

**Examples**:
```
"John Smith" vs "Jon Smith" in "New York" → 80% duplicate
Typos in name but same location → Likely duplicate
```

**Confidence**: 60-85%  
**Action**: Recommend manual review

### Strategy 4: Phone + Name Partial Match

**Fields**: Phone number + First name

**Logic**:
- Phone matches AND first name matches → **High probability duplicate**
- Useful when last name different (marriage, legal changes, etc.)

**Examples**:
```
Same phone, "Jane Doe" vs "Jane Williams" → 75% duplicate
Phone number is strong signal for identity
```

**Confidence**: 70-80%  
**Action**: Recommend review

### Strategy 5: Multi-Field Weak Match

**Fields**: Combination of partial matches

**Logic**:
- Email similar (same username, different domain)
- Phone area code same + name similar  
- Multiple weak signals combined

**Examples**:
```
"john@gmail.com" vs "john@yahoo.com" + same phone area → 50% duplicate
Weak signals but worth flagging for review
```

**Confidence**: 40-60%  
**Action**: Flag for optional review

---

## CONFIDENCE SCORING SYSTEM

### Score Calculation

**Base Formula**:
```
Confidence = (EmailMatch * 0.4) + (PhoneMatch * 0.3) + (NameMatch * 0.2) + (LocationMatch * 0.1)
```

**Field Weights**:
- Email exact match: **100 points**
- Phone exact match: **80 points**  
- Name exact match: **60 points**
- Location match: **30 points**

**Fuzzy Match Points**:
- Email domain match: **50 points**
- Phone area code match: **40 points**
- Name >90% similar: **50 points**
- Name 80-90% similar: **35 points**
- Name 70-80% similar: **20 points**

**Total Score → Confidence %**:
- **90-100**: High confidence duplicate
- **70-89**: Probable duplicate  
- **50-69**: Possible duplicate
- **30-49**: Low confidence
- **<30**: Not a duplicate

### Confidence Thresholds

**Auto-Action Thresholds**:
- **≥95%**: Auto-flag as duplicate (user can override)
- **70-94%**: Recommend review
- **50-69%**: Optional review
- **<50%**: Ignore (don't show)

---

## MATCHING ALGORITHM FLOW

### Step-by-Step Process

```
1. Normalize incoming contact data
   ↓
2. Generate duplicate_check_hash
   ↓  
3. Quick hash lookup (O(1) performance)
   ↓
4. If hash match → 100% duplicate
   ↓
5. If no hash match → Run fuzzy matching
   ↓
6. Email exact match check
   ↓
7. Phone exact match check
   ↓
8. Fuzzy name matching
   ↓
9. Multi-field scoring
   ↓
10. Calculate confidence score
    ↓
11. Classify: High/Probable/Possible/No match
    ↓
12. Return matches with confidence scores
```

---

## DUPLICATE ACTIONS (User Choice)

### Action 1: Skip Import
**When**: High confidence duplicate  
**Effect**: Don't import this contact, keep existing  
**Use Case**: Data is identical, no new information

### Action 2: Update Existing  
**When**: Duplicate but CSV has newer data  
**Effect**: Update existing contact with new data  
**Use Case**: Contact info changed (new phone, address)

### Action 3: Merge Data
**When**: Both have unique information  
**Effect**: Combine data from both records  

**Logic**:
- Take non-empty fields from CSV
- Preserve existing data where CSV is empty
- Flag conflicts for manual resolution

### Action 4: Import Anyway
**When**: User confirms it's not a duplicate  
**Effect**: Create new contact despite match  
**Use Case**: False positive, actually different people

---

## FUZZY MATCHING ALGORITHMS

### Levenshtein Distance (Name Matching)

**Purpose**: Calculate similarity between two strings

**Example**:
```
"John Smith" vs "Jon Smith"
- Distance: 1 (one character different)  
- Max length: 10
- Similarity: (10-1)/10 = 90%
```

**Implementation**:
- Use well-tested library (fastest-levenshtein for Deno)
- Normalize strings first (lowercase, trim)
- Calculate percentage similarity
- Threshold: >80% = similar

### Soundex/Metaphone (Phonetic Matching)

**Purpose**: Match names that sound similar

**Example**:
```
"Smith" sounds like "Smyth"
"Catherine" sounds like "Katherine"
```

**Use Case**: Catch spelling variations  
**Implementation**: Optional enhancement (Phase 2)

---

## PERFORMANCE OPTIMIZATION

### Database Index Strategy
Already created in Task 1:
- `idx_contacts_normalized_email` ✅
- `idx_contacts_normalized_phone` ✅  
- `idx_contacts_duplicate_check_hash` ✅

### Query Optimization
- **Fast Path**: Hash lookup first (milliseconds)
- **Slow Path**: Fuzzy matching only if no hash match
- **Batch Processing**: Check duplicates in batches of 100

### Expected Performance
- Hash match: **<5ms per contact**
- Fuzzy match: **<50ms per contact**  
- Batch of 1000 contacts: **<30 seconds**

---

## EDGE CASES & HANDLING

### Edge Case 1: Empty Fields
**Scenario**: Contact has email but no phone  
**Handling**: Only match on available fields, adjust confidence

### Edge Case 2: Multiple Matches  
**Scenario**: CSV contact matches 2+ existing contacts  
**Handling**: Show all matches, let user choose or merge all

### Edge Case 3: Partial Data
**Scenario**: Only first name and city (weak signals)  
**Handling**: Low confidence, don't auto-flag

### Edge Case 4: Common Names
**Scenario**: "John Smith" matches 50 contacts  
**Handling**: Require additional field match (phone/email)

### Edge Case 5: Company Contacts
**Scenario**: Multiple people at same company, same domain  
**Handling**: Don't flag as duplicate if names different

---

## USER INTERFACE MOCKUP

### Duplicate Preview Panel

```
┌─────────────────────────────────────────────────┐
│ ⚠️  3 Potential Duplicates Found                │
├─────────────────────────────────────────────────┤
│                                                  │
│ Row 5: john.smith@company.com                   │
│ Matches: John Smith (existing contact)          │
│ Confidence: 95% (High)                          │
│                                                  │
│ Comparison:                                     │
│ Field        │ CSV Value      │ Existing       │
│ ─────────────┼────────────────┼────────────────│
│ Email        │ john.smith@... │ john@company...│
│ Phone        │ 123-456-7890   │ (123) 456-7890 │ ← Normalized match
│ Name         │ John Smith     │ John Smith     │
│ Company      │ Acme Corp      │ Acme Inc.      │ ⚠️ Conflict
│                                                  │
│ [Skip Import] [Update Existing] [Merge] [Import]│
└─────────────────────────────────────────────────┘
```

### Batch Action Options

```
┌─────────────────────────────────────────────────┐
│ Apply to all high-confidence duplicates:        │
│ ○ Skip all duplicates                           │
│ ○ Update all with CSV data                      │
│ ○ Review each individually (recommended)        │
└─────────────────────────────────────────────────┘
```

---

## TESTING SCENARIOS

### Test 1: Exact Email Match
**Input**: CSV has "test@example.com"  
**Existing**: Contact with "test@example.com"  
**Expected**: 100% match, recommend skip

### Test 2: Normalized Phone Match
**Input**: CSV has "(123) 456-7890"  
**Existing**: Contact with "123-456-7890"  
**Expected**: 95% match, recommend skip or update

### Test 3: Fuzzy Name Match
**Input**: CSV has "Jon Smith"  
**Existing**: Contact with "John Smith"  
**Expected**: 85% match (if location/domain match), recommend review

### Test 4: Multi-Field Weak Match
**Input**: CSV has "john@gmail.com", "John", "NYC"  
**Existing**: Contact with "john@yahoo.com", "John", "NYC"  
**Expected**: 60% match, flag for optional review

### Test 5: No Match
**Input**: Completely different contact  
**Expected**: 0% match, import normally

### Test 6: Multiple Matches
**Input**: "John Smith" matches 3 existing contacts  
**Expected**: Show all 3 with confidence scores, let user choose

---

## MERGE STRATEGY DETAILS

### Field-by-Field Merge Logic

**Rule 1: Prefer Non-Empty**
- If CSV has value and existing is empty → Use CSV value
- If CSV is empty and existing has value → Keep existing value

**Rule 2: Prefer Newer**
- If both have values → Use CSV value (assumed newer)
- Flag as conflict for user review

**Rule 3: Concatenate Arrays**
- Tags, notes, custom fields → Combine both
- Remove duplicates from combined list

**Rule 4: Preserve Metadata**
- `created_at` → Keep from existing (older date)
- `updated_at` → Set to NOW()
- `imported_from` → Update to new import_id

### Conflict Resolution UI

```
Field "Company" has conflict:
CSV: "Acme Corp"
Existing: "Acme Inc."

Choose:
○ Use CSV value (Acme Corp)
○ Keep existing (Acme Inc.)  
○ Manual entry: [___________]
```

---

## IMPLEMENTATION ROADMAP

### Phase 1 (Tomorrow - 3 hours)
- [ ] Implement hash-based exact matching
- [ ] Implement normalized email/phone matching
- [ ] Build confidence scoring function
- [ ] Create duplicate preview UI
- [ ] Basic merge logic

### Phase 2 (Future Enhancement)  
- [ ] Advanced fuzzy matching (Soundex)
- [ ] Machine learning scoring
- [ ] Duplicate resolution history
- [ ] Bulk merge operations
- [ ] Duplicate prevention rules

---

## SUCCESS CRITERIA

### Minimum Viable:
- ✅ Detect exact email duplicates (100%)
- ✅ Detect exact phone duplicates (95%)  
- ✅ Show duplicates in preview UI
- ✅ Allow user to skip duplicates
- ✅ Performance: <5ms per contact for hash match

### Ideal State:
- ✅ Fuzzy name matching (85%+ accuracy)
- ✅ Multi-field scoring
- ✅ Confidence thresholds working
- ✅ Merge functionality  
- ✅ Manual conflict resolution

---

**Algorithm Design Complete - Ready for Implementation**