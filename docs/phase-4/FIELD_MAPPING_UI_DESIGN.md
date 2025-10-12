# Field Mapping UI - Design Specification

**Phase 4.1 - Task 3**: User Interface Design for CSV to Database Field Mapping

---

## OVERVIEW

**Purpose**: User-friendly interface for mapping CSV columns to database fields  
**User Type**: Business users, non-technical  
**Complexity**: Medium (drag & drop with auto-detection)  
**Platform**: Web (Desktop primary, Mobile responsive)

---

## USER FLOW

### 1. Entry Point

- User has uploaded CSV file (from Task 2)
- System has auto-detected field mappings
- User needs to review/adjust mappings

### 2. Mapping Process

```
User sees suggested mappings with confidence scores
    ↓
User can override/adjust mappings via drag & drop
    ↓
User previews mapped data to verify correctness
    ↓
User confirms and proceeds to import
```

### 3. Exit Points

- **Success**: All required fields mapped → Proceed to import
- **Cancel**: Return to file upload
- **Save Draft**: Save mappings for later completion

---

## COMPONENT BREAKDOWN

### Main Component: FieldMappingInterface

- **Purpose**: Parent container managing entire mapping process
- **Responsibilities**: State management, API calls, validation orchestration
- **Layout**: 4-panel layout with responsive behavior

---

## SUB-COMPONENTS SPECIFICATION

### 1. CSVColumnList (Left Panel)

**Purpose**: Display available CSV columns from uploaded file

**Visual Layout**:

```
┌─────────────────────────┐
│ CSV Columns (8)         │
├─────────────────────────┤
│ 🟢 📄 Email             │ ← Draggable, mapped
│   └ john@test.com       │   (preview)
│                         │
│ 🟢 📄 First Name        │ ← Draggable, mapped
│   └ John, Jane, Bob     │   (preview)
│                         │
│ 🟢 📄 Phone Number      │ ← Draggable, mapped
│   └ 555-0123, 555...   │   (preview)
│                         │
│ 🟡 📄 Company           │ ← Draggable, mapped
│   └ Acme, Test, Demo   │   (preview)
│                         │
│ ⚪ 📄 Notes             │ ← Draggable, unmapped
│   └ Important note...  │   (preview)
│                         │
│ ⚪ 📄 Department        │ ← Draggable, unmapped
│   └ Sales, Marketing   │   (preview)
└─────────────────────────┘
```

**Features**:

- ✅ **Column Header**: CSV column name with drag handle (⋮⋮)
- ✅ **Status Badge**: 🟢 Mapped / ⚪ Unmapped / 🟡 Mapped with warnings
- ✅ **Data Preview**: First 3 unique values from column
- ✅ **Row Count**: Number of non-empty values
- ✅ **Search Filter**: Find columns quickly in large CSVs
- ✅ **Bulk Actions**: Select multiple columns for batch operations

**Interactions**:

- **Drag**: Grab column to map to database field
- **Click**: Select column for dropdown mapping (accessibility)
- **Hover**: Show full preview tooltip with more values

---

### 2. DatabaseFieldList (Right Panel)

**Purpose**: Show available database fields with drop zones

**Visual Layout**:

```
┌─────────────────────────┐
│ Database Fields         │
├─────────────────────────┤
│ 📧 email (required)     │ ← Drop zone, mapped
│   ↳ ✅ Email            │   (CSV column mapped)
│   └ Clear mapping      │   (action link)
│                         │
│ 👤 first_name (required)│ ← Drop zone, mapped
│   ↳ ✅ First Name      │   (CSV column mapped)
│   └ Clear mapping      │   (action link)
│                         │
│ 👤 last_name (optional) │ ← Drop zone, empty
│   └ Drop CSV column    │   (help text)
│                         │
│ 📱 phone (optional)     │ ← Drop zone, mapped
│   ↳ ⚠️ Phone Number    │   (warning: format issues)
│   └ Clear mapping      │   (action link)
│                         │
│ 🏢 company (optional)   │ ← Drop zone, mapped
│   ↳ 🟡 Company         │   (low confidence)
│   └ Clear mapping      │   (action link)
└─────────────────────────┘
```

**Features**:

- ✅ **Field Type Icons**: 📧 Email, 👤 Name, 📱 Phone, 🏢 Company, 📝 Text, 📅 Date
- ✅ **Required Indicator**: Bold text + "(required)" label
- ✅ **Drop Zone**: Clear visual indicator when dragging
- ✅ **Current Mapping**: Show mapped CSV column with confidence
- ✅ **Mapping Actions**: Clear, edit, validation info
- ✅ **Field Description**: Tooltip with database field info

**Interactions**:

- **Drop**: Accept CSV column from drag operation
- **Clear**: Remove current mapping
- **Click**: Alternative dropdown selector for accessibility

---

### 3. MappingPreview (Bottom Panel)

**Purpose**: Show preview of mapped data with validation

**Visual Layout**:

```
┌──────────────────────────────────────────────────────────┐
│ Preview (First 5 Rows) - 🟢 145 valid, ⚠️ 3 warnings    │
├──────────────────┬───────────────┬────────────┬──────────┤
│ email (required) │ first_name    │ phone      │ company  │
│ ✅ Mapped        │ ❌ Missing    │ ⚠️ Mapped  │ ✅ Mapped│
├──────────────────┼───────────────┼────────────┼──────────┤
│ john@example.com │ ❌ (empty)    │ 123456     │ Acme Corp│
│ jane@company.org │ ❌ (empty)    │ 789012     │ Test Inc │
│ bob@demo.com     │ ❌ (empty)    │ ⚠️invalid │ Demo LLC │
│ alice@corp.com   │ ❌ (empty)    │ 555-0123   │ Corp Sol │
│ mike@start.com   │ ❌ (empty)    │ 555-0456   │ StartUp  │
├──────────────────┴───────────────┴────────────┴──────────┤
│ ⚠️ Warnings: first_name is required but not mapped       │
│ ⚠️ Data Issues: 1 invalid phone number in row 3         │
└──────────────────────────────────────────────────────────┘
```

**Features**:

- ✅ **Data Table**: First 5 rows of actual CSV data
- ✅ **Column Headers**: Database field names with mapping status
- ✅ **Cell Validation**: ✅ Valid, ⚠️ Warning, ❌ Error, ⚪ Empty
- ✅ **Summary Stats**: Total valid/warning/error counts
- ✅ **Issue Details**: List of specific validation problems
- ✅ **Pagination**: View more rows (5, 10, 25)

**Validation Indicators**:

- ✅ **Green**: Data valid, field mapped correctly
- ⚠️ **Yellow**: Data mapped, but format/quality warnings
- ❌ **Red**: Required field unmapped OR invalid data
- ⚪ **Gray**: Optional field unmapped

---

### 4. MappingSummary (Top Bar)

**Purpose**: Show mapping status at a glance with quick actions

**Visual Layout**:

```
┌──────────────────────────────────────────────────────────┐
│ Field Mapping Progress                                   │
│ ✅ 4 mapped  ⚠️ 1 warning  ❌ 1 required missing       │
│                                                          │
│ [🔄 Auto-Map Remaining] [↻ Reset All] [💾 Save Draft]  │
│                                                          │
│ Confidence: High (85%) • Estimated Import: ~2min        │
└──────────────────────────────────────────────────────────┘
```

**Features**:

- ✅ **Progress Summary**: Count of mapped/unmapped/problem fields
- ✅ **Quick Actions**: Auto-map, reset, save draft, help
- ✅ **Overall Confidence**: Average confidence score across mappings
- ✅ **Import Estimate**: Time estimate based on row count and complexity
- ✅ **Status Indicator**: Ready/Not Ready for import

**Action Buttons**:

- **Auto-Map Remaining**: Re-run auto-detection on unmapped fields
- **Reset All**: Clear all mappings, start fresh
- **Save Draft**: Save current state, continue later
- **Help**: Show mapping tips and examples

---

## LAYOUT SPECIFICATIONS

### Desktop Layout (≥1024px)

```
┌─────────────────────────────────────────────────────────┐
│                    MappingSummary                       │
├──────────────────┬──────────────────────────────────────┤
│                  │                                      │
│   CSV Columns    │        Database Fields              │
│     (Left)       │           (Right)                    │
│                  │                                      │
│  • Scrollable    │       • Drop zones                   │
│  • Search        │       • Current mappings             │
│  • Bulk select   │       • Validation status            │
│                  │                                      │
├──────────────────┴──────────────────────────────────────┤
│                  MappingPreview                         │
│              • Table view                               │
│              • Validation summary                       │
│              • Pagination                               │
└─────────────────────────────────────────────────────────┘
```

**Responsive Breakdowns**:

- **≥1400px**: Side panels 350px each, preview full width
- **1024-1399px**: Side panels 300px each, preview scrollable
- **768-1023px**: Switch to tablet layout

### Tablet Layout (768-1023px)

```
┌─────────────────────────────┐
│      MappingSummary         │
├─────────────────────────────┤
│      CSV Columns            │
│    (Horizontal scroll)      │
├─────────────────────────────┤
│    Database Fields          │
│    (Horizontal scroll)      │
├─────────────────────────────┤
│    MappingPreview           │
│   (Responsive table)        │
└─────────────────────────────┘
```

### Mobile Layout (≤767px)

```
┌─────────────────┐
│ MappingSummary  │
│  (Condensed)    │
├─────────────────┤
│  📱 Mapping     │
│   Mode Toggle   │
├─────────────────┤
│ Current Panel:  │
│ [CSV] [Fields]  │
│ [Preview]       │
├─────────────────┤
│ Panel Content   │
│   (Full width)  │
│                 │
│                 │
└─────────────────┘
```

**Mobile Interactions**:

- **Tap to Map**: Instead of drag & drop, tap CSV column then tap target field
- **Panel Navigation**: Tab between CSV/Database/Preview
- **Swipe**: Horizontal swipe between panels
- **Condensed View**: Show only essential information

---

## INTERACTION PATTERNS

### Drag & Drop (Primary)

**Desktop Experience**:

1. **Drag Start**:
   - Cursor changes to grab hand
   - CSV column becomes semi-transparent
   - Drop zones highlight with blue border
2. **Drag Over**:
   - Compatible drop zones glow green
   - Incompatible zones show red border
   - Show confidence preview tooltip
3. **Drop Success**:
   - Green flash animation
   - Mapping line draws from source to target
   - Preview updates immediately
4. **Drop Invalid**:
   - Red shake animation
   - Error message tooltip
   - Column returns to original position

**Visual Feedback**:

```
Drag State:     [📄 Email] ← Being dragged (50% opacity)
                    ↓
Drop Zone:      [📧 email] ← Highlighted (green border)
                    ↓
Success:        [📧 email] ← Mapped (✅ Email)
```

### Alternative Mapping (Accessibility)

**For users who can't drag & drop**:

1. Click CSV column → Selection mode
2. Click target database field → Mapping created
3. Or use dropdown selector on each database field

### Auto-Mapping Workflow

**Automatic Detection**:

1. **On Load**: Auto-map runs immediately
2. **Algorithm**: Exact match > Fuzzy match > ML prediction
3. **Confidence Scores**: High (90%+), Medium (70-89%), Low (<70%)
4. **User Review**: All auto-mappings flagged for review

**Manual Override**:

- User can always override auto-mappings
- System remembers user preferences for future uploads
- Confidence scores update based on user corrections

---

## VALIDATION SYSTEM

### Real-Time Validation

**Triggers**:

- On mapping change (debounced 500ms)
- On preview scroll/pagination
- On manual validation request

**Validation Types**:

1. **Required Fields**
   - Check: All required database fields have mappings
   - Error: "first_name is required but not mapped"
   - Action: Highlight unmapped required fields in red

2. **Data Type Validation**
   - Check: CSV data matches expected database field type
   - Email: Regex pattern validation
   - Phone: International format checking
   - Date: Format recognition and parsing
   - Error: "Column contains 3 invalid email addresses"

3. **Data Quality Warnings**
   - Empty values in required fields
   - Inconsistent formats within column
   - Outlier values (too long, special characters)
   - Warning: "Column has 15% empty values"

4. **Mapping Logic Validation**
   - No duplicate mappings (1 CSV → 1 DB field)
   - No orphaned mappings after column removal
   - Confidence threshold warnings

### Error Display Strategy

**Inline Errors**:

- Red border on problematic elements
- Icon indicators (❌, ⚠️) next to issues
- Tooltip with detailed error message

**Summary Errors**:

- Error panel at top with all issues listed
- Click error → jump to relevant field
- Progress indicator showing completion status

---

## COLOR CODING SYSTEM

### Status Colors

- **🟢 Green (#10B981)**: Successfully mapped, data valid
- **🟡 Yellow (#F59E0B)**: Mapped but has warnings/low confidence
- **🔴 Red (#EF4444)**: Error state - required field unmapped or invalid data
- **⚪ Gray (#6B7280)**: Unmapped optional field or neutral state
- **🔵 Blue (#3B82F6)**: Active drag state, selected elements

### Confidence Level Colors

- **High Confidence (90%+)**: Solid green background
- **Medium Confidence (70-89%)**: Yellow/amber background
- **Low Confidence (<70%)**: Light red background
- **Manual Override**: Blue accent border

### Interactive States

- **Hover**: Lighten background by 10%
- **Active/Selected**: Bold border, slight elevation shadow
- **Disabled**: 50% opacity, no interactions
- **Loading**: Subtle pulse animation

---

## ACCESSIBILITY REQUIREMENTS

### Keyboard Navigation

**Tab Order**:

1. Summary actions (Auto-map, Reset, Save)
2. CSV columns (left panel) - Arrow keys to navigate
3. Database fields (right panel) - Arrow keys to navigate
4. Preview controls (pagination, filters)

**Keyboard Shortcuts**:

- `Tab`: Next element
- `Shift + Tab`: Previous element
- `Space/Enter`: Select element for mapping
- `Escape`: Cancel current action
- `Arrow Keys`: Navigate within panels
- `Delete`: Clear selected mapping

### Screen Reader Support

**ARIA Labels**:

- `aria-label="CSV column Email, mapped to database field email"`
- `aria-describedby="mapping-status-email"` for status descriptions
- `role="button"` for interactive elements
- `aria-live="polite"` for status updates

**Announcements**:

- Mapping created: "Email column mapped to email field successfully"
- Validation error: "Warning: First name is required but not mapped"
- Progress updates: "4 of 6 required fields mapped"

### Visual Accessibility

- **High Contrast Mode**: All colors meet WCAG AA standards (4.5:1 ratio)
- **Focus Indicators**: 2px solid outline on keyboard focus
- **Text Size**: All text 14px+ with relative sizing support
- **Motion**: Respect `prefers-reduced-motion` setting

---

## ERROR STATES & EDGE CASES

### No CSV Uploaded

```
┌─────────────────────────────┐
│         📋 No Data          │
│                             │
│   Upload CSV file first     │
│   [← Back to Upload]        │
└─────────────────────────────┘
```

### No Columns Detected

```
┌─────────────────────────────┐
│      ⚠️ Invalid File        │
│                             │
│  No columns detected in     │
│  uploaded CSV file.         │
│                             │
│  [Try Different File]       │
└─────────────────────────────┘
```

### Large File Warning

```
┌─────────────────────────────┐
│     📊 Large Dataset        │
│                             │
│ This CSV has 10,000+ rows   │
│ Preview limited to first    │
│ 100 rows for performance    │
│                             │
│ [Continue] [Cancel]         │
└─────────────────────────────┘
```

### Validation Blocking Import

```
┌─────────────────────────────┐
│    ❌ Cannot Proceed        │
│                             │
│ Please fix these issues:    │
│ • Map required field: name  │
│ • Fix 3 email format errors │
│                             │
│ [Fix Issues] [Save Draft]   │
└─────────────────────────────┘
```

---

## SUCCESS STATES

### All Fields Mapped Successfully

```
┌─────────────────────────────┐
│      ✅ Ready to Import     │
│                             │
│ All required fields mapped  │
│ 150 rows ready to process   │
│ Estimated time: 2 minutes   │
│                             │
│ [🚀 Start Import] [Review]  │
└─────────────────────────────┘
```

### Auto-Mapping High Confidence

```
┌─────────────────────────────┐
│   🎯 Excellent Mapping      │
│                             │
│ Auto-detection: 95% match   │
│ 5/6 fields mapped with     │
│ high confidence            │
│                             │
│ [✅ Looks Good] [Review]    │
└─────────────────────────────┘
```

---

## ANIMATION & TRANSITIONS

### Micro-interactions

- **Hover Effects**: 150ms ease-in-out scale(1.02)
- **Button Press**: 100ms ease-in scale(0.98)
- **Drag Start**: 200ms ease-out opacity and transform
- **Drop Success**: 300ms ease-out green flash + scale pulse
- **Validation Update**: 250ms ease-in-out color transition

### Panel Transitions

- **Layout Changes**: 400ms ease-in-out for responsive breakpoints
- **Panel Slide**: 300ms ease-out for mobile panel switching
- **Preview Update**: 200ms fade-out old → fade-in new content

### Loading States

- **Skeleton Loading**: Subtle pulse animation for content placeholders
- **Progress Indication**: Smooth progress bar animation
- **Spinner**: 1s linear rotation for async operations

---

## PERFORMANCE CONSIDERATIONS

### Large Dataset Handling

- **Virtualization**: CSV columns list virtualizes after 50+ columns
- **Preview Pagination**: Show max 25 rows at once
- **Debounced Validation**: Wait 500ms after last mapping change
- **Lazy Loading**: Load field descriptions on hover/focus

### Memory Management

- **Preview Data**: Only keep current page in memory
- **Validation Cache**: Cache validation results, invalidate on change
- **Component Unmounting**: Clean up event listeners and timers

### Bundle Size Optimization

- **Code Splitting**: Lazy load drag & drop library
- **Tree Shaking**: Import only needed utilities
- **Icon Optimization**: Use icon font or optimized SVGs

---

## DESIGN SPECIFICATIONS SUMMARY

**Total Components**: 4 main + 4 sub-components = 8 components
**Interaction Methods**: Drag & drop (primary) + Click/dropdown (fallback)  
**Responsive Breakpoints**: 3 layouts (desktop/tablet/mobile)
**Accessibility Level**: WCAG 2.1 AA compliant
**Animation Duration**: 100-400ms range for all transitions
**Color System**: 5 status colors + confidence indicators
**Validation Types**: 4 categories (required, type, quality, logic)

**Next Phase**: Component Architecture Planning
