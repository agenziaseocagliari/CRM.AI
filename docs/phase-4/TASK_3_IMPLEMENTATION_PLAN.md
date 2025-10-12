# Task 3 Implementation Plan - Field Mapping UI

**Phase 4.1 - Task 3**: Detailed 4-Hour Implementation Schedule

---

## EXECUTIVE SUMMARY

**Total Implementation Time**: 4 hours (240 minutes)  
**Complexity Level**: Medium-High  
**Dependencies**: Task 2 (CSV Parser) completed  
**Components to Build**: 8 components + 3 hooks + utilities  
**Risk Level**: Low (comprehensive planning completed)

---

## IMPLEMENTATION SCHEDULE

### SESSION 1: Foundation & Core Components (2 hours)

#### Subtask 3.1: Project Setup & Types (20 min)

**Objective**: Create file structure and TypeScript interfaces  
**Time**: 09:00 - 09:20

**Steps**:

1. **Create directory structure** (5 min)

   ```bash
   mkdir -p src/components/contacts/FieldMappingInterface/{components,hooks,types,utils}
   ```

2. **Install dependencies** (3 min)

   ```bash
   npm install @dnd-kit/core @dnd-kit/utilities
   ```

3. **Create type definitions** (10 min)
   - File: `types/fieldMapping.types.ts`
   - Define all interfaces: CSVColumn, DatabaseField, FieldMapping, etc.
   - Export type definitions

4. **Create basic component files** (2 min)
   - Create empty component files with basic structure
   - Add proper imports and exports

**Deliverables**:

- ✅ Directory structure created
- ✅ Dependencies installed
- ✅ TypeScript interfaces defined (12 interfaces)
- ✅ Basic component files created (8 files)

**Test Criteria**: TypeScript compiles with no errors

**Potential Issues**:

- Import path conflicts → Use absolute imports
- Type definition errors → Start simple, add complexity gradually

---

#### Subtask 3.2: Main Component Shell (30 min)

**Objective**: Create FieldMappingInterface component with layout  
**Time**: 09:20 - 09:50

**Steps**:

1. **Setup main component structure** (10 min)
   - Create FieldMappingInterface component
   - Define props interface
   - Setup basic JSX structure with 4 panels

2. **Implement state management** (15 min)
   - Setup useReducer for complex state
   - Create reducer function with action handlers
   - Initialize state with mock data for development

3. **Add responsive layout** (5 min)
   - Implement CSS Grid/Flexbox layout
   - Add responsive breakpoints
   - Basic styling for panel structure

**Code Structure**:

```typescript
interface FieldMappingInterfaceProps {
  importId: string;
  onMappingComplete: (mappings: FieldMapping[]) => void;
  onCancel: () => void;
}

const FieldMappingInterface: React.FC<FieldMappingInterfaceProps> = ({
  importId,
  onMappingComplete,
  onCancel
}) => {
  const [state, dispatch] = useReducer(fieldMappingReducer, initialState);

  return (
    <div className="field-mapping-interface">
      <MappingSummary />
      <div className="mapping-panels">
        <CSVColumnList />
        <DatabaseFieldList />
      </div>
      <MappingPreview />
    </div>
  );
};
```

**Deliverables**:

- ✅ Main component renders without errors
- ✅ Layout structure visible (4 panels)
- ✅ State management working
- ✅ Responsive design basics implemented

**Test Criteria**: Component renders and shows placeholder content

---

#### Subtask 3.3: CSV Column List Component (30 min)

**Objective**: Build left panel displaying CSV columns  
**Time**: 09:50 - 10:20

**Steps**:

1. **Create CSVColumnList component** (15 min)
   - Map over CSV columns from state
   - Display column name, type, and preview
   - Add search/filter functionality
   - Show mapping status badges

2. **Create DraggableColumn sub-component** (15 min)
   - Individual column with drag handle
   - Show column preview (first 3 values)
   - Status indicator (mapped/unmapped)
   - Hover effects and interactions

**Component Structure**:

```typescript
const CSVColumnList: React.FC<CSVColumnListProps> = ({
  columns,
  mappings,
  searchFilter,
  onDragStart
}) => {
  const filteredColumns = columns.filter(col =>
    col.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="csv-column-list">
      <div className="column-header">
        <h3>CSV Columns ({filteredColumns.length})</h3>
        <SearchInput value={searchFilter} onChange={setSearchFilter} />
      </div>
      <div className="column-items">
        {filteredColumns.map(column => (
          <DraggableColumn
            key={column.id}
            column={column}
            isMapped={!!mappings.find(m => m.csvColumn.id === column.id)}
            onDragStart={onDragStart}
          />
        ))}
      </div>
    </div>
  );
};
```

**Deliverables**:

- ✅ CSV columns display correctly
- ✅ Search functionality working
- ✅ Column previews show sample data
- ✅ Status badges indicate mapping state

**Test Criteria**: All CSV columns visible with correct information

---

#### Subtask 3.4: Database Field List Component (40 min)

**Objective**: Build right panel with drop zones  
**Time**: 10:20 - 11:00

**Steps**:

1. **Create DatabaseFieldList component** (20 min)
   - Map over database fields
   - Group by categories (required/optional)
   - Show field type icons and descriptions
   - Display current mappings

2. **Create DropZoneField sub-component** (20 min)
   - Individual field with drop zone styling
   - Show field info (name, type, required status)
   - Display current mapping if exists
   - Clear mapping action button

**Component Structure**:

```typescript
const DatabaseFieldList: React.FC<DatabaseFieldListProps> = ({
  fields,
  mappings,
  validationResults,
  onClearMapping
}) => {
  const requiredFields = fields.filter(f => f.isRequired);
  const optionalFields = fields.filter(f => !f.isRequired);

  return (
    <div className="database-field-list">
      <div className="field-section">
        <h4>Required Fields</h4>
        {requiredFields.map(field => (
          <DropZoneField
            key={field.id}
            field={field}
            mapping={mappings.find(m => m.databaseField.id === field.id)}
            validation={validationResults.find(v => v.field === field.name)}
            onClearMapping={onClearMapping}
          />
        ))}
      </div>
      <div className="field-section">
        <h4>Optional Fields</h4>
        {optionalFields.map(field => (
          <DropZoneField key={field.id} field={field} {...props} />
        ))}
      </div>
    </div>
  );
};
```

**Deliverables**:

- ✅ Database fields organized by required/optional
- ✅ Field information displays correctly
- ✅ Current mappings shown
- ✅ Clear mapping actions working

**Test Criteria**: All database fields visible with proper categorization

---

### SESSION 2: Interactions & Validation (2 hours)

#### Subtask 3.5: Drag & Drop Implementation (45 min)

**Objective**: Implement @dnd-kit drag & drop functionality  
**Time**: 11:00 - 11:45

**Steps**:

1. **Setup DndContext** (10 min)
   - Install and configure @dnd-kit
   - Setup sensors (pointer, keyboard, touch)
   - Configure collision detection

2. **Make CSV columns draggable** (15 min)
   - Add useDraggable hook to DraggableColumn
   - Configure drag data payload
   - Add visual feedback during drag

3. **Make DB fields droppable** (15 min)
   - Add useDroppable hook to DropZoneField
   - Handle drop zone highlighting
   - Process drop events

4. **Handle drag events** (5 min)
   - onDragStart, onDragEnd, onDragOver
   - Update mapping state on successful drop
   - Handle invalid drops with feedback

**Implementation**:

```typescript
const FieldMappingInterface = () => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    }),
    useSensor(KeyboardSensor),
    useSensor(TouchSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.data.current?.column && over.data.current?.field) {
      const csvColumn = active.data.current.column;
      const dbField = over.data.current.field;

      dispatch({
        type: 'SET_MAPPING',
        csvColumn,
        dbField
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements: {
          onDragStart: ({ active }) => `Started dragging ${active.data.current?.column.name}`,
          onDragEnd: ({ active, over }) => {
            if (over) {
              return `${active.data.current?.column.name} was mapped to ${over.data.current?.field.displayName}`;
            }
          }
        }
      }}
    >
      {/* Components */}
    </DndContext>
  );
};
```

**Deliverables**:

- ✅ Drag & drop working smoothly
- ✅ Visual feedback during interactions
- ✅ Mapping state updates correctly
- ✅ Keyboard accessibility working

**Test Criteria**: Can drag CSV column to database field and create mapping

---

#### Subtask 3.6: Auto-Mapping Algorithm (30 min)

**Objective**: Implement automatic field detection  
**Time**: 11:45 - 12:15

**Steps**:

1. **Create auto-detection utility** (15 min)
   - Exact match algorithm (case-insensitive)
   - Fuzzy matching using Levenshtein distance
   - Common alias mapping (email variations)

2. **Implement confidence scoring** (10 min)
   - Calculate match confidence (0-1)
   - Consider data sample analysis
   - Factor in field type compatibility

3. **Apply auto-mappings** (5 min)
   - Run on component mount
   - Allow manual re-trigger
   - Respect user overrides

**Algorithm Implementation**:

```typescript
const autoDetectMappings = (
  csvColumns: CSVColumn[],
  databaseFields: DatabaseField[]
): AutoMapping[] => {
  const mappings: AutoMapping[] = [];

  csvColumns.forEach(column => {
    const matches = databaseFields
      .map(field => {
        // Exact match (highest confidence)
        if (column.name.toLowerCase() === field.name.toLowerCase()) {
          return { field, confidence: 1.0, algorithm: 'exact' };
        }

        // Alias matching
        const aliases = getFieldAliases(field.name);
        if (aliases.includes(column.name.toLowerCase())) {
          return { field, confidence: 0.9, algorithm: 'alias' };
        }

        // Fuzzy matching
        const similarity = calculateSimilarity(column.name, field.displayName);
        if (similarity > 0.7) {
          return { field, confidence: similarity, algorithm: 'fuzzy' };
        }

        // Data type matching
        const dataTypeMatch = analyzeDataTypeMatch(column, field);
        if (dataTypeMatch.isMatch) {
          return {
            field,
            confidence: dataTypeMatch.confidence,
            algorithm: 'pattern',
          };
        }

        return null;
      })
      .filter(Boolean);

    // Take highest confidence match
    if (matches.length > 0) {
      const bestMatch = matches.reduce((a, b) =>
        a.confidence > b.confidence ? a : b
      );
      if (bestMatch.confidence > 0.6) {
        mappings.push({
          csvColumn: column,
          databaseField: bestMatch.field,
          confidence: bestMatch.confidence,
          algorithm: bestMatch.algorithm,
          reasons: [
            `${bestMatch.algorithm} match with ${bestMatch.confidence}% confidence`,
          ],
        });
      }
    }
  });

  return mappings;
};
```

**Deliverables**:

- ✅ Auto-mapping runs on load
- ✅ Confidence scores calculated
- ✅ Common fields mapped automatically (email, name, phone)
- ✅ User can trigger re-mapping

**Test Criteria**: 80%+ accuracy on common CSV formats

---

#### Subtask 3.7: Mapping Preview & Validation (40 min)

**Objective**: Show data preview and validate mappings  
**Time**: 12:15 - 12:55

**Steps**:

1. **Create MappingPreview component** (20 min)
   - Display preview table with first 5-10 rows
   - Show mapped data transformation
   - Handle empty/unmapped fields
   - Add pagination controls

2. **Implement validation logic** (15 min)
   - Required field validation
   - Data type validation (email format, phone format)
   - Data quality warnings
   - Mapping logic validation

3. **Display validation results** (5 min)
   - Inline error indicators
   - Validation summary panel
   - Color coding for status

**Validation Implementation**:

```typescript
const validateMappings = (
  mappings: FieldMapping[],
  databaseFields: DatabaseField[],
  previewRows: any[]
): ValidationResult[] => {
  const results: ValidationResult[] = [];

  // Check required fields
  const requiredFields = databaseFields.filter(f => f.isRequired);
  requiredFields.forEach(field => {
    const mapping = mappings.find(m => m.databaseField.id === field.id);
    if (!mapping) {
      results.push({
        id: `required-${field.id}`,
        type: 'error',
        field: field.name,
        message: `${field.displayName} is required but not mapped`,
        blocking: true,
      });
    }
  });

  // Validate data types
  mappings.forEach(mapping => {
    const csvColumn = mapping.csvColumn;
    const dbField = mapping.databaseField;

    if (dbField.type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = previewRows
        .map((row, index) => ({ value: row[csvColumn.name], rowIndex: index }))
        .filter(({ value }) => value && !emailRegex.test(value))
        .slice(0, 5); // First 5 errors

      if (invalidEmails.length > 0) {
        results.push({
          id: `email-${csvColumn.id}`,
          type: 'warning',
          field: dbField.name,
          message: `${invalidEmails.length} invalid email format(s) detected`,
          details: `Rows: ${invalidEmails.map(e => e.rowIndex + 1).join(', ')}`,
          affectedRows: invalidEmails.map(e => e.rowIndex),
        });
      }
    }
  });

  return results;
};
```

**Deliverables**:

- ✅ Preview table shows mapped data
- ✅ Validation runs on mapping changes
- ✅ Errors and warnings display clearly
- ✅ Validation summary shows overall status

**Test Criteria**: Preview shows accurate data transformation, validation catches issues

---

#### Subtask 3.8: Polish & Final Integration (25 min)

**Objective**: Final touches and comprehensive testing  
**Time**: 12:55 - 13:20

**Steps**:

1. **Add loading states** (5 min)
   - Loading indicators for async operations
   - Skeleton loading for data fetching
   - Progress indicators

2. **Improve accessibility** (10 min)
   - ARIA labels and descriptions
   - Keyboard navigation improvements
   - Screen reader announcements
   - Focus management

3. **Mobile responsive adjustments** (5 min)
   - Touch-friendly interactions
   - Responsive layout tweaks
   - Mobile-specific UI adaptations

4. **Testing and bug fixes** (5 min)
   - Test all user workflows
   - Fix any discovered issues
   - Verify cross-browser compatibility

**Accessibility Enhancements**:

```typescript
// Screen reader announcements
const useScreenReaderAnnouncements = () => {
  const announce = (message: string) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);
    setTimeout(() => document.body.removeChild(announcement), 1000);
  };

  return { announce };
};

// Keyboard shortcuts
const useKeyboardShortcuts = (mappings: FieldMapping[], dispatch: Dispatch) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            dispatch({ type: 'UNDO_LAST_MAPPING' });
            break;
          case 'a':
            e.preventDefault();
            dispatch({ type: 'AUTO_MAP_REMAINING' });
            break;
          case 'r':
            e.preventDefault();
            dispatch({ type: 'CLEAR_ALL_MAPPINGS' });
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);
};
```

**Deliverables**:

- ✅ Loading states implemented
- ✅ Accessibility features complete
- ✅ Mobile responsive
- ✅ No critical bugs
- ✅ Performance optimized

**Test Criteria**: Full user flow works smoothly on desktop and mobile

---

## SUCCESS CRITERIA CHECKLIST

### Functional Requirements

- [ ] **Drag & Drop**: Smooth drag and drop from CSV columns to database fields
- [ ] **Auto-Mapping**: 85%+ accuracy on common field types (email, name, phone)
- [ ] **Validation**: Catches all required field issues and data format problems
- [ ] **Preview**: Shows accurate data transformation with mapped fields
- [ ] **Responsive**: Works on desktop (primary) and mobile devices
- [ ] **Accessibility**: Full keyboard navigation and screen reader support

### Technical Requirements

- [ ] **Performance**: No lag with up to 100 CSV columns
- [ ] **Memory**: Efficient handling of preview data (virtualization if needed)
- [ ] **Error Handling**: Graceful error states and user feedback
- [ ] **Integration**: Properly integrates with Task 2 (CSV Parser) data
- [ ] **Type Safety**: Full TypeScript coverage with no `any` types

### User Experience Requirements

- [ ] **Intuitive**: First-time users can complete mapping without help
- [ ] **Visual Feedback**: Clear indication of mapping status and validation issues
- [ ] **Efficiency**: Power users can map 20+ fields in under 2 minutes
- [ ] **Recovery**: Users can undo/redo mappings and save drafts
- [ ] **Guidance**: Auto-suggestions help users make correct mappings

---

## RISK MITIGATION

### High Risk Items

1. **Drag & Drop Complexity**
   - **Risk**: Library integration issues, touch device problems
   - **Mitigation**: Comprehensive testing, fallback to dropdown interface
   - **Contingency**: 30 min buffer for drag & drop troubleshooting

2. **Auto-Mapping Accuracy**
   - **Risk**: Poor auto-detection leads to user frustration
   - **Mitigation**: Extensive testing with real CSV samples
   - **Contingency**: Manual mapping always available, clear confidence indicators

### Medium Risk Items

1. **Performance with Large CSVs**
   - **Risk**: UI lag with 500+ columns
   - **Mitigation**: Virtualization, pagination, search filtering
   - **Contingency**: Limit preview to first 100 columns

2. **Mobile Responsiveness**
   - **Risk**: Poor touch experience
   - **Mitigation**: Touch sensors, alternative UI for small screens
   - **Contingency**: Desktop-first approach, mobile as enhancement

---

## TOMORROW'S EXECUTION SCHEDULE

### Session 1: 09:00 - 11:00 (2 hours)

```
09:00 - 09:20  Subtask 3.1: Setup & Types
09:20 - 09:50  Subtask 3.2: Main Component Shell
09:50 - 10:20  Subtask 3.3: CSV Column List
10:20 - 11:00  Subtask 3.4: Database Field List
```

### Session 2: 11:00 - 13:00 (2 hours)

```
11:00 - 11:45  Subtask 3.5: Drag & Drop Implementation
11:45 - 12:15  Subtask 3.6: Auto-Mapping Algorithm
12:15 - 12:55  Subtask 3.7: Preview & Validation
12:55 - 13:20  Subtask 3.8: Polish & Testing
```

### Buffer Time

- **Built-in**: 5 min per subtask (40 min total)
- **Emergency**: 20 min contingency for critical issues
- **Testing**: Final 30 min for comprehensive testing

---

## TESTING STRATEGY

### During Development (Incremental)

- **Subtask 3.1**: TypeScript compilation, no errors
- **Subtask 3.2**: Component renders, layout visible
- **Subtask 3.3**: CSV columns display with data
- **Subtask 3.4**: Database fields show with status
- **Subtask 3.5**: Drag & drop creates mappings
- **Subtask 3.6**: Auto-mapping maps common fields
- **Subtask 3.7**: Preview shows transformed data
- **Subtask 3.8**: Full user flow works end-to-end

### Final Integration Testing

```typescript
describe('FieldMapping Integration', () => {
  test('Complete mapping workflow', async () => {
    // 1. Load component with CSV data
    render(<FieldMappingInterface importId="test-123" />);

    // 2. Verify auto-mapping ran
    expect(screen.getByText('3 mapped')).toBeInTheDocument();

    // 3. Manually map remaining field
    const emailColumn = screen.getByText('Email');
    const emailField = screen.getByText('email (required)');

    // Simulate drag & drop
    fireEvent.dragStart(emailColumn);
    fireEvent.dragEnter(emailField);
    fireEvent.drop(emailField);

    // 4. Verify mapping created
    expect(screen.getByText('4 mapped')).toBeInTheDocument();

    // 5. Check preview updates
    expect(screen.getByText('john@test.com')).toBeInTheDocument();

    // 6. Verify validation passes
    expect(screen.getByText('Ready to import')).toBeInTheDocument();

    // 7. Complete workflow
    fireEvent.click(screen.getByText('Proceed to Import'));
    expect(onMappingComplete).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          csvColumn: expect.objectContaining({ name: 'Email' }),
          databaseField: expect.objectContaining({ name: 'email' })
        })
      ])
    );
  });
});
```

---

## POST-IMPLEMENTATION TASKS

### Immediate (Tomorrow Evening)

- [ ] **Documentation**: Update component documentation
- [ ] **Screenshots**: Capture UI for documentation
- [ ] **Performance**: Run performance profiling
- [ ] **Accessibility**: Test with screen readers

### Week 1 Follow-up

- [ ] **User Testing**: Get feedback from real users
- [ ] **Analytics**: Implement usage tracking
- [ ] **Optimization**: Address any performance issues
- [ ] **Bug Fixes**: Resolve user-reported issues

### Future Enhancements

- [ ] **Advanced Auto-Mapping**: ML-based field detection
- [ ] **Mapping Templates**: Save/load common mapping patterns
- [ ] **Batch Operations**: Multi-select column operations
- [ ] **Visual Improvements**: Enhanced animations and feedback

---

## IMPLEMENTATION READINESS SUMMARY

**Total Estimated Time**: 4 hours (240 minutes)  
**Subtasks Defined**: 8 detailed subtasks  
**Success Criteria**: 15 specific checkpoints  
**Risk Mitigation**: High/Medium risks identified with contingencies  
**Testing Strategy**: Incremental + final integration testing  
**Dependencies**: @dnd-kit library, Task 2 CSV data format

**Confidence Level**: 95% (comprehensive planning completed)  
**Implementation Ready**: ✅ YES - detailed step-by-step plan available  
**Tomorrow's Success Probability**: Very High (thorough preparation)

**Next Phase**: Styling Guide & Design Tokens
