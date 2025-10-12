# Task 5 Implementation Plan - Import Preview & Validation

**Phase 4.1 - Task 5**: Complete implementation roadmap for import preview and validation system

---

## OVERVIEW

**Total Time**: 2 hours  
**Split into**: 5 detailed subtasks  
**Target**: Complete validation system with preview UI  
**Dependencies**: Task 1 (Database) ✅, Task 2 (CSV Parser) setup, Task 4 (Duplicates) setup

---

## SUBTASK BREAKDOWN

### Subtask 5.1: Validation Engine (30 min)

**Objective**: Create comprehensive validation utility functions

**Steps**:
1. **Create validation utility file** (10 min)
   - `src/lib/validation/importValidation.ts`
   - Export all validation functions
   - Define TypeScript interfaces

2. **Implement validation categories** (15 min)
   - Required field validation (email OR phone)
   - Format validation (email regex, phone digits)
   - Data type validation and coercion
   - Data quality warnings generation
   - Business rules framework

3. **Create validation orchestrator** (5 min)
   - Main validation function for row processing
   - Batch validation for performance
   - Result aggregation and summary stats

**Deliverables**:
- ✅ Validation engine with all 5 categories
- ✅ TypeScript interfaces for results
- ✅ Error classification (critical/high/medium/low)
- ✅ Performance optimized for large files

**Implementation Details**:
```typescript
// Core validation function
export async function validateImportData(
  rows: any[], 
  organizationRules?: BusinessRules
): Promise<ValidationSummary> {
  const results: ValidationResult[] = [];
  
  for (const [index, row] of rows.entries()) {
    const result = await validateRow(row, index + 1, organizationRules);
    results.push(result);
  }
  
  return aggregateValidationResults(results);
}

// Individual row validation
function validateRow(row: any, rowNumber: number, rules?: BusinessRules): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Category 1: Required fields
  const requiredErrors = validateRequiredFields(row);
  errors.push(...requiredErrors);
  
  // Category 2: Format validation
  const formatErrors = validateFormats(row);
  errors.push(...formatErrors);
  
  // Category 3: Data types & coercion
  const { warnings: typeWarnings, coercedData } = validateDataTypes(row);
  warnings.push(...typeWarnings);
  
  // Category 4: Quality warnings
  const qualityWarnings = generateDataQualityWarnings(coercedData);
  warnings.push(...qualityWarnings);
  
  // Category 5: Business rules
  if (rules) {
    const { errors: bizErrors, warnings: bizWarnings } = validateBusinessRules(coercedData, rules);
    errors.push(...bizErrors);
    warnings.push(...bizWarnings);
  }
  
  return {
    rowNumber,
    rawData: row,
    status: determineStatus(errors, warnings),
    errors,
    warnings,
    validatedData: coercedData,
    qualityScore: calculateQualityScore(errors, warnings)
  };
}
```

**Test Criteria**: All validation categories work correctly  
**Time**: 30 minutes

---

### Subtask 5.2: Preview Table Component (30 min)

**Objective**: React component for displaying validation results

**Steps**:
1. **Create PreviewTable component** (15 min)
   - Display first 50 rows with pagination
   - Status indicators (✅⚠️❌🔍)
   - Row selection and click handlers
   - Column sorting and filtering

2. **Add status indicators and styling** (10 min)
   - Color-coded status badges
   - Error/warning count displays
   - Hover effects and tooltips
   - Responsive table design

3. **Implement row interactions** (5 min)
   - Click to view row details
   - Select multiple rows for batch actions
   - Quick actions (fix/skip) buttons

**Deliverables**:
- ✅ Preview table showing validation results
- ✅ Status indicators with clear visual hierarchy
- ✅ Interactive row selection and actions
- ✅ Responsive design for mobile/desktop

**Component Structure**:
```typescript
interface PreviewTableProps {
  validationResults: ValidationResult[];
  onRowClick: (result: ValidationResult) => void;
  onBatchSelect: (results: ValidationResult[]) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function PreviewTable({ validationResults, onRowClick, ...props }: PreviewTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState<FilterOptions>({});
  
  const filteredResults = useMemo(() => 
    applyFilters(validationResults, filters), [validationResults, filters]);
  
  const paginatedResults = useMemo(() => 
    paginateResults(filteredResults, props.currentPage), [filteredResults, props.currentPage]);
  
  return (
    <div className="preview-table-container">
      <TableFilters filters={filters} onChange={setFilters} />
      
      <table className="preview-table">
        <TableHeader onSelectAll={handleSelectAll} />
        <tbody>
          {paginatedResults.map(result => (
            <TableRow 
              key={result.rowNumber}
              result={result}
              selected={selectedRows.has(result.rowNumber)}
              onSelect={handleRowSelect}
              onClick={() => onRowClick(result)}
            />
          ))}
        </tbody>
      </table>
      
      <TablePagination {...props} totalResults={filteredResults.length} />
    </div>
  );
}
```

**Test Criteria**: Table displays correctly with all interactions working  
**Time**: 30 minutes

---

### Subtask 5.3: Error Summary Dashboard (20 min)

**Objective**: Summary statistics and error breakdown

**Steps**:
1. **Create summary stats component** (10 min)
   - Total rows, valid/warning/error counts
   - Percentage breakdowns
   - Quality score calculation
   - Import readiness indicator

2. **Add error breakdown section** (5 min)
   - Error types with counts
   - Top issues list
   - Clickable filters
   - Trend indicators

3. **Implement action buttons** (5 min)
   - Export error report
   - Apply batch fixes
   - Proceed with import
   - Filter controls

**Deliverables**:
- ✅ Comprehensive summary dashboard
- ✅ Error breakdown by type and severity
- ✅ Action buttons for common operations
- ✅ Visual progress indicators

**Component Implementation**:
```typescript
interface SummaryDashboardProps {
  summary: ValidationSummary;
  onExportReport: () => void;
  onApplyBatchFix: (fixType: string) => void;
  onProceedImport: () => void;
  onFilterBy: (filter: FilterCriteria) => void;
}

export function SummaryDashboard({ summary, ...actions }: SummaryDashboardProps) {
  const qualityColor = getQualityColor(summary.qualityScore);
  
  return (
    <div className="summary-dashboard">
      <div className="summary-stats">
        <StatCard 
          title="Total Rows" 
          value={summary.totalRows} 
          icon="📊" 
        />
        <StatCard 
          title="Valid" 
          value={`${summary.validRows} (${getPercentage(summary.validRows, summary.totalRows)}%)`}
          color="green"
          icon="✅"
          onClick={() => actions.onFilterBy({ status: 'valid' })}
        />
        <StatCard 
          title="Warnings" 
          value={`${summary.warningRows} (${getPercentage(summary.warningRows, summary.totalRows)}%)`}
          color="yellow"
          icon="⚠️"
          onClick={() => actions.onFilterBy({ status: 'warning' })}
        />
        <StatCard 
          title="Errors" 
          value={`${summary.errorRows} (${getPercentage(summary.errorRows, summary.totalRows)}%)`}
          color="red"
          icon="❌"
          onClick={() => actions.onFilterBy({ status: 'error' })}
        />
      </div>
      
      <div className="quality-indicator">
        <div className={`quality-score ${qualityColor}`}>
          Quality Score: {summary.qualityScore}%
        </div>
        <div className="import-status">
          {summary.canProceed ? (
            <span className="ready">✅ Ready to Import</span>
          ) : (
            <span className="blocked">🚨 Fix Critical Issues First</span>
          )}
        </div>
      </div>
      
      <ErrorBreakdown 
        breakdown={summary.errorBreakdown}
        onFilterBy={actions.onFilterBy}
      />
      
      <div className="action-buttons">
        <button onClick={actions.onExportReport} className="btn-secondary">
          📄 Export Report
        </button>
        <button onClick={actions.onApplyBatchFix} className="btn-secondary">
          🔧 Batch Fix
        </button>
        {summary.canProceed && (
          <button onClick={actions.onProceedImport} className="btn-primary">
            🚀 Proceed to Import
          </button>
        )}
      </div>
    </div>
  );
}
```

**Test Criteria**: Dashboard shows accurate stats and actions work  
**Time**: 20 minutes

---

### Subtask 5.4: Inline Edit Functionality (25 min)

**Objective**: Allow users to fix errors directly in the preview

**Steps**:
1. **Create row detail modal** (10 min)
   - Modal/sidebar for detailed row view
   - Display all errors and warnings
   - Show suggestions for fixes
   - Form inputs for editing

2. **Implement inline editing** (10 min)
   - Editable form fields
   - Real-time validation as user types
   - Save/cancel functionality
   - Persist changes to validation state

3. **Add re-validation logic** (5 min)
   - Re-run validation after save
   - Update preview table
   - Recalculate summary stats
   - Show success feedback

**Deliverables**:
- ✅ Row detail modal with error display
- ✅ Inline editing with real-time validation
- ✅ Changes persist and update preview
- ✅ Smooth user experience

**Component Implementation**:
```typescript
interface RowDetailModalProps {
  result: ValidationResult;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedData: any) => void;
  onSkip: () => void;
}

export function RowDetailModal({ result, isOpen, onClose, onSave, onSkip }: RowDetailModalProps) {
  const [editedData, setEditedData] = useState(result.rawData);
  const [liveValidation, setLiveValidation] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  // Real-time validation as user types (debounced)
  const debouncedValidate = useMemo(
    () => debounce(async (data: any) => {
      setIsValidating(true);
      const validated = await validateRow(data, result.rowNumber);
      setLiveValidation(validated);
      setIsValidating(false);
    }, 300),
    [result.rowNumber]
  );
  
  useEffect(() => {
    if (editedData !== result.rawData) {
      debouncedValidate(editedData);
    }
  }, [editedData, debouncedValidate, result.rawData]);
  
  const handleSave = () => {
    if (liveValidation && liveValidation.errors.length === 0) {
      onSave(editedData);
      onClose();
    }
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="row-detail-modal">
        <header className="modal-header">
          <h2>📝 Row {result.rowNumber}: {result.rawData.name || 'Unnamed'}</h2>
          <button onClick={onClose} className="close-btn">✖️</button>
        </header>
        
        <div className="modal-body">
          <ErrorList errors={liveValidation?.errors || result.errors} />
          <WarningList warnings={liveValidation?.warnings || result.warnings} />
          
          <div className="edit-form">
            <h3>📋 Edit Data:</h3>
            <FormField
              label="Email"
              value={editedData.email || ''}
              onChange={(value) => setEditedData({...editedData, email: value})}
              error={getFieldError(liveValidation?.errors, 'email')}
              suggestions={getFieldSuggestions('email', result.errors)}
            />
            <FormField
              label="Phone"
              value={editedData.phone || ''}
              onChange={(value) => setEditedData({...editedData, phone: value})}
              error={getFieldError(liveValidation?.errors, 'phone')}
              suggestions={getFieldSuggestions('phone', result.errors)}
            />
            <FormField
              label="Name"
              value={editedData.name || ''}
              onChange={(value) => setEditedData({...editedData, name: value})}
              error={getFieldError(liveValidation?.errors, 'name')}
            />
            <FormField
              label="Company"
              value={editedData.company || ''}
              onChange={(value) => setEditedData({...editedData, company: value})}
            />
          </div>
        </div>
        
        <footer className="modal-footer">
          <button onClick={onSkip} className="btn-secondary">
            ⏭️ Skip Row
          </button>
          <button onClick={handleSave} className="btn-primary" disabled={isValidating || (liveValidation?.errors.length > 0)}>
            💾 Save Changes
          </button>
        </footer>
      </div>
    </Modal>
  );
}
```

**Test Criteria**: Inline editing works, re-validation updates preview  
**Time**: 25 minutes

---

### Subtask 5.5: Integration & Testing (15 min)

**Objective**: Integrate with other tasks and test complete flow

**Steps**:
1. **Integrate with CSV parser** (5 min)
   - Connect Task 2 output to validation input
   - Handle various CSV formats and edge cases
   - Pass parsed data through validation pipeline

2. **Integrate with duplicate detection** (5 min)
   - Call Task 4 duplicate detection for each row
   - Include duplicate results in validation summary
   - Show duplicates in preview with special status

3. **End-to-end testing** (5 min)
   - Test complete flow: Upload → Parse → Validate → Preview
   - Performance testing with large files
   - Error handling and edge cases
   - User experience validation

**Deliverables**:
- ✅ Seamless integration with Tasks 2 and 4
- ✅ Complete import validation flow working
- ✅ Performance optimized for large files
- ✅ Error handling robust

**Integration Points**:
```typescript
// Integration with Task 2 (CSV Parser)
export async function processCSVImport(
  file: File,
  organizationId: string,
  fieldMapping: FieldMapping
): Promise<ImportPreviewData> {
  // Step 1: Parse CSV (Task 2)
  const parseResult = await parseCSVFile(file, fieldMapping);
  
  if (!parseResult.success) {
    throw new Error(`CSV parsing failed: ${parseResult.error}`);
  }
  
  // Step 2: Validate data (Task 5)
  const validationSummary = await validateImportData(
    parseResult.rows,
    await getOrganizationRules(organizationId)
  );
  
  // Step 3: Check duplicates (Task 4) 
  const validationWithDuplicates = await addDuplicateDetection(
    validationSummary,
    organizationId
  );
  
  return {
    summary: validationWithDuplicates,
    previewRows: validationWithDuplicates.results.slice(0, 50),
    canProceed: validationWithDuplicates.canProceed
  };
}

// Integration with Task 4 (Duplicate Detection)
async function addDuplicateDetection(
  validationSummary: ValidationSummary,
  organizationId: string
): Promise<ValidationSummary> {
  const updatedResults = await Promise.all(
    validationSummary.results.map(async (result) => {
      if (result.status !== 'error') {
        const duplicates = await detectDuplicates(result.validatedData, organizationId);
        return {
          ...result,
          duplicates,
          status: duplicates.length > 0 ? 'warning' : result.status
        };
      }
      return result;
    })
  );
  
  return recalculateSummary(updatedResults);
}
```

**Test Criteria**: All integrations work, complete flow tested  
**Time**: 15 minutes

---

## IMPLEMENTATION SCHEDULE

### Tomorrow's Session Options

#### Option A: 2-Hour Continuous Block
```
09:00-09:30  Subtask 5.1 (Validation Engine)
09:30-10:00  Subtask 5.2 (Preview Table)  
10:00-10:20  Subtask 5.3 (Summary Dashboard)
10:20-10:30  Break
10:30-10:55  Subtask 5.4 (Inline Edit)
10:55-11:10  Subtask 5.5 (Integration & Testing)
11:10-11:20  Final polish and documentation
```

#### Option B: Split Sessions
**Session 1: Backend (1h)** 
- Subtask 5.1 (Validation Engine)
- Subtask 5.5 (Integration backend parts)

**Session 2: Frontend (1h)**
- Subtask 5.2 (Preview Table)  
- Subtask 5.3 (Summary Dashboard)
- Subtask 5.4 (Inline Edit)

---

## SUCCESS CRITERIA

### Functional Requirements ✅
- [ ] **All validation categories working** (5 categories implemented)
- [ ] **Error classification accurate** (4 severity levels)
- [ ] **Preview UI shows clear status** for all rows
- [ ] **Inline editing functional** with real-time validation
- [ ] **Summary dashboard accurate** with correct stats
- [ ] **Integration complete** with Tasks 2 and 4
- [ ] **Batch operations working** for efficiency

### Performance Requirements ✅
- [ ] **Validation speed**: <5 seconds for 10,000 rows
- [ ] **UI responsiveness**: <500ms for preview rendering
- [ ] **Inline edit**: <100ms validation response
- [ ] **Memory usage**: <50MB for large files
- [ ] **Export speed**: <3 seconds for error reports

### User Experience Requirements ✅
- [ ] **Clear error messages** with actionable suggestions
- [ ] **Intuitive status indicators** (✅⚠️❌🔍)
- [ ] **Smooth inline editing** with auto-save
- [ ] **Helpful batch operations** for common fixes
- [ ] **Responsive design** for all devices
- [ ] **Progress feedback** during operations

---

## RISK MITIGATION

### Technical Risks
**Risk**: Validation performance with large files  
**Mitigation**: Batch processing in chunks of 100 rows  
**Fallback**: Show processing indicator, paginate results

**Risk**: Complex inline editing state management  
**Mitigation**: Use controlled components with clear state flow  
**Fallback**: Simple modal edit instead of inline

**Risk**: Integration complexity with Tasks 2&4  
**Mitigation**: Define clear interfaces, test separately first  
**Fallback**: Mock integrations initially, add real ones incrementally

### Timeline Risks  
**Risk**: UI complexity taking longer than expected  
**Buffer**: Keep UI minimal first, add polish later  
**Mitigation**: Focus on functionality over visual design

**Risk**: Edge cases in validation rules  
**Buffer**: Start with core rules, add edge cases iteratively  
**Mitigation**: Comprehensive test data set prepared

---

## TESTING STRATEGY

### Unit Tests
- Individual validation functions
- Error classification logic
- Data coercion utilities
- Summary calculation accuracy

### Integration Tests  
- CSV parser → validation pipeline
- Validation → duplicate detection
- Preview table with various data sets
- Inline edit → re-validation flow

### Performance Tests
- Large file validation (10K rows)
- UI responsiveness benchmarks  
- Memory usage monitoring
- Batch operation efficiency

### Manual Tests
- Complete user workflow
- Edge cases and error scenarios
- Cross-browser compatibility
- Mobile responsiveness

---

## DEPENDENCIES

### Required ✅
- **Task 1**: Database schema (completed)
- **Task 2**: CSV parser interface (setup done)
- **Task 4**: Duplicate detection API (setup done)

### Optional 🔄
- **Task 3**: Field mapping UI (can work independently)
- **Task 6**: Import execution (this feeds into it)

---

## DELIVERABLES SUMMARY

By end of 2-hour implementation:

### Backend ✅
- Comprehensive validation engine (5 categories)
- TypeScript interfaces for all data structures  
- Error classification and severity handling
- Integration with duplicate detection

### Frontend ✅
- Preview table with status indicators
- Summary dashboard with statistics
- Inline edit modal with real-time validation
- Batch operations for common fixes

### Testing ✅
- Unit tests for validation logic
- Integration tests for complete flow
- Performance validation for large files
- User experience testing

**TOTAL**: 2 hours → Complete import validation system  
**Quality**: Production-ready with comprehensive error handling  
**Integration**: Seamlessly connects Tasks 2, 4, and 6  

---

**Implementation Plan Complete - Ready for 2-Hour Development Sprint**