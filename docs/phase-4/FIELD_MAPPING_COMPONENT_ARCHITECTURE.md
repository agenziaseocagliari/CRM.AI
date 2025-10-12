# Field Mapping UI - Component Architecture

**Phase 4.1 - Task 3**: Technical architecture for React component implementation

---

## FILE STRUCTURE

```
src/components/contacts/
├── FieldMappingInterface.tsx          (main component - 200 lines)
├── components/
│   ├── CSVColumnList.tsx              (left panel - 150 lines)
│   ├── DatabaseFieldList.tsx          (right panel - 180 lines)
│   ├── MappingPreview.tsx             (bottom panel - 200 lines)
│   ├── MappingSummary.tsx             (top bar - 100 lines)
│   ├── DraggableColumn.tsx            (single CSV column - 80 lines)
│   ├── DropZoneField.tsx              (single DB field drop zone - 120 lines)
│   └── MappingValidation.tsx          (validation feedback - 60 lines)
├── hooks/
│   ├── useFieldMapping.ts             (mapping state logic - 150 lines)
│   ├── useDragAndDrop.ts              (drag & drop logic - 100 lines)
│   └── useMappingValidation.ts        (validation logic - 120 lines)
├── types/
│   └── fieldMapping.types.ts          (TypeScript interfaces - 80 lines)
└── utils/
    ├── autoDetectMapping.ts           (auto-mapping algorithm - 200 lines)
    ├── validateMapping.ts             (validation rules - 150 lines)
    └── mappingHelpers.ts              (utility functions - 100 lines)

Total: 15 files, ~1,590 lines estimated
```

---

## COMPONENT HIERARCHY

```
FieldMappingInterface (main container)
├── MappingSummary (top bar)
│   ├── Progress stats display
│   ├── Confidence score indicator
│   └── Action buttons (auto-map, reset, save)
├── div.mapping-panels (main content)
│   ├── CSVColumnList (left panel)
│   │   ├── SearchInput (filter CSV columns)
│   │   ├── BulkActions (select all, clear all)
│   │   └── DraggableColumn[] (multiple instances)
│   │       ├── ColumnHeader (name + drag handle)
│   │       ├── StatusBadge (mapped/unmapped)
│   │       ├── DataPreview (first 3 values)
│   │       └── MappingInfo (target field if mapped)
│   └── DatabaseFieldList (right panel)
│       ├── FieldCategories (group by type)
│       └── DropZoneField[] (multiple instances)
│           ├── FieldHeader (name + type icon)
│           ├── RequiredIndicator (if required)
│           ├── DropZone (accepts CSV columns)
│           ├── CurrentMapping (shows mapped CSV column)
│           ├── MappingActions (clear, edit)
│           └── ValidationStatus (warnings/errors)
└── MappingPreview (bottom panel)
    ├── PreviewControls (pagination, row count)
    ├── PreviewTable (data table)
    │   ├── TableHeader (database field names)
    │   └── TableRow[] (multiple instances)
    │       └── TableCell[] with MappingValidation
    └── ValidationSummary (errors and warnings list)
```

---

## STATE MANAGEMENT ARCHITECTURE

### Main State Interface
```typescript
interface FieldMappingState {
  // CSV Data
  csvColumns: CSVColumn[];
  csvPreviewRows: Record<string, any>[];
  csvRowCount: number;
  
  // Database Schema
  databaseFields: DatabaseField[];
  fieldCategories: FieldCategory[];
  
  // Mapping Configuration
  mappings: FieldMapping[];
  autoMappings: AutoMapping[];
  userOverrides: UserOverride[];
  
  // UI State
  isDragging: boolean;
  draggedColumn: CSVColumn | null;
  selectedColumn: CSVColumn | null;
  activePanel: 'csv' | 'database' | 'preview';
  
  // Validation State
  validationResults: ValidationResult[];
  validationErrors: ValidationError[];
  validationWarnings: ValidationWarning[];
  isValid: boolean;
  
  // Loading State
  isLoading: boolean;
  loadingOperations: LoadingOperation[];
  
  // Configuration
  previewRowCount: number;
  previewCurrentPage: number;
  searchFilter: string;
  showOnlyUnmapped: boolean;
}
```

### Action Types
```typescript
type FieldMappingAction =
  // Mapping Actions
  | { type: 'SET_MAPPING'; csvColumn: CSVColumn; dbField: DatabaseField }
  | { type: 'REMOVE_MAPPING'; csvColumn: CSVColumn }
  | { type: 'CLEAR_ALL_MAPPINGS' }
  | { type: 'APPLY_AUTO_MAPPINGS'; mappings: AutoMapping[] }
  | { type: 'OVERRIDE_MAPPING'; mapping: FieldMapping; reason: string }
  
  // Data Loading Actions
  | { type: 'LOAD_CSV_DATA'; columns: CSVColumn[]; previewRows: any[] }
  | { type: 'LOAD_DATABASE_SCHEMA'; fields: DatabaseField[] }
  | { type: 'SET_LOADING'; operation: string; isLoading: boolean }
  
  // UI Actions
  | { type: 'SET_DRAG_STATE'; isDragging: boolean; draggedColumn?: CSVColumn }
  | { type: 'SET_SELECTED_COLUMN'; column: CSVColumn | null }
  | { type: 'SET_ACTIVE_PANEL'; panel: 'csv' | 'database' | 'preview' }
  | { type: 'SET_SEARCH_FILTER'; filter: string }
  | { type: 'SET_PREVIEW_PAGE'; page: number }
  
  // Validation Actions
  | { type: 'SET_VALIDATION_RESULTS'; results: ValidationResult[] }
  | { type: 'ADD_VALIDATION_ERROR'; error: ValidationError }
  | { type: 'CLEAR_VALIDATION_ERRORS' };
```

### State Management Pattern
**Using useReducer + Context for complex state**:
```typescript
// Context for global state
const FieldMappingContext = createContext<{
  state: FieldMappingState;
  dispatch: Dispatch<FieldMappingAction>;
} | null>(null);

// Main component uses useReducer
const [state, dispatch] = useReducer(fieldMappingReducer, initialState);

// Sub-components consume via context
const { state, dispatch } = useContext(FieldMappingContext);
```

---

## COMPONENT PROPS INTERFACES

### FieldMappingInterface Props
```typescript
interface FieldMappingInterfaceProps {
  // From Task 2 CSV Upload
  importId: string;
  csvData?: {
    columns: CSVColumn[];
    previewRows: any[];
    rowCount: number;
  };
  
  // Callbacks
  onMappingComplete: (mappings: FieldMapping[]) => void;
  onCancel: () => void;
  onSaveDraft: (mappings: FieldMapping[]) => void;
  
  // Configuration
  organizationId: string;
  initialMappings?: FieldMapping[];
  validationRules?: ValidationRule[];
  
  // UI Options
  allowSaveDraft?: boolean;
  showAdvancedOptions?: boolean;
  maxPreviewRows?: number;
}
```

### Sub-component Props
```typescript
// CSV Column List
interface CSVColumnListProps {
  columns: CSVColumn[];
  mappings: FieldMapping[];
  draggedColumn: CSVColumn | null;
  searchFilter: string;
  showOnlyUnmapped: boolean;
  onDragStart: (column: CSVColumn) => void;
  onDragEnd: () => void;
  onColumnSelect: (column: CSVColumn) => void;
  onSearchChange: (filter: string) => void;
}

// Database Field List  
interface DatabaseFieldListProps {
  fields: DatabaseField[];
  mappings: FieldMapping[];
  validationResults: ValidationResult[];
  isDragging: boolean;
  onDrop: (csvColumn: CSVColumn, dbField: DatabaseField) => void;
  onClearMapping: (csvColumn: CSVColumn) => void;
  onFieldSelect: (field: DatabaseField) => void;
}

// Mapping Preview
interface MappingPreviewProps {
  previewRows: any[];
  mappings: FieldMapping[];
  validationResults: ValidationResult[];
  currentPage: number;
  rowsPerPage: number;
  totalRows: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
}

// Mapping Summary
interface MappingSummaryProps {
  mappings: FieldMapping[];
  validationResults: ValidationResult[];
  autoMappingConfidence: number;
  isValid: boolean;
  onAutoMap: () => void;
  onReset: () => void;
  onSaveDraft: () => void;
}
```

---

## CUSTOM HOOKS SPECIFICATION

### 1. useFieldMapping Hook
```typescript
interface UseFieldMappingReturn {
  // State
  mappings: FieldMapping[];
  autoMappings: AutoMapping[];
  isValid: boolean;
  confidence: number;
  
  // Actions
  setMapping: (csvColumn: CSVColumn, dbField: DatabaseField) => void;
  removeMapping: (csvColumn: CSVColumn) => void;
  clearAllMappings: () => void;
  autoMapFields: () => Promise<void>;
  resetMappings: () => void;
  
  // Utilities
  getMappingForColumn: (column: CSVColumn) => FieldMapping | null;
  getMappingForField: (field: DatabaseField) => FieldMapping | null;
  getUnmappedColumns: () => CSVColumn[];
  getUnmappedRequiredFields: () => DatabaseField[];
}

const useFieldMapping = (
  csvColumns: CSVColumn[],
  databaseFields: DatabaseField[],
  initialMappings?: FieldMapping[]
): UseFieldMappingReturn => {
  // Implementation handles mapping logic, auto-detection, validation
}
```

### 2. useDragAndDrop Hook
```typescript
interface UseDragAndDropReturn {
  // Drag State
  isDragging: boolean;
  draggedItem: CSVColumn | null;
  dragOverTarget: DatabaseField | null;
  
  // Event Handlers
  handleDragStart: (column: CSVColumn, event: DragEvent) => void;
  handleDragOver: (field: DatabaseField, event: DragEvent) => void;
  handleDragEnter: (field: DatabaseField, event: DragEvent) => void;
  handleDragLeave: (field: DatabaseField, event: DragEvent) => void;
  handleDrop: (field: DatabaseField, event: DragEvent) => void;
  handleDragEnd: (event: DragEvent) => void;
  
  // Utilities
  canDropOn: (field: DatabaseField) => boolean;
  getDropEffect: (field: DatabaseField) => 'copy' | 'move' | 'none';
}

const useDragAndDrop = (
  onMapping: (csvColumn: CSVColumn, dbField: DatabaseField) => void,
  mappings: FieldMapping[]
): UseDragAndDropReturn => {
  // Implementation handles HTML5 drag & drop API
}
```

### 3. useMappingValidation Hook
```typescript
interface UseMappingValidationReturn {
  // Validation Results
  errors: ValidationError[];
  warnings: ValidationWarning[];
  isValid: boolean;
  fieldValidation: Record<string, ValidationResult>;
  
  // Validation Methods
  validateMapping: (mapping: FieldMapping) => ValidationResult;
  validateAllMappings: () => ValidationResult[];
  validateRequiredFields: () => ValidationError[];
  validateDataTypes: (previewRows: any[]) => ValidationResult[];
  
  // Utilities
  getFieldErrors: (fieldName: string) => ValidationError[];
  getFieldWarnings: (fieldName: string) => ValidationWarning[];
  hasErrors: () => boolean;
  hasWarnings: () => boolean;
}

const useMappingValidation = (
  mappings: FieldMapping[],
  databaseFields: DatabaseField[],
  previewRows: any[]
): UseMappingValidationReturn => {
  // Implementation handles all validation logic
}
```

---

## TYPE DEFINITIONS

### Core Types
```typescript
// CSV Column from uploaded file
interface CSVColumn {
  id: string;
  name: string;
  originalName: string;
  index: number;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'mixed';
  sampleValues: any[];
  uniqueValues: number;
  emptyValues: number;
  totalValues: number;
  detectedFormat?: string;
}

// Database field definition
interface DatabaseField {
  id: string;
  name: string;
  displayName: string;
  type: 'email' | 'text' | 'phone' | 'number' | 'date' | 'boolean' | 'json';
  isRequired: boolean;
  maxLength?: number;
  format?: string;
  validation?: ValidationRule[];
  category: 'contact' | 'company' | 'custom' | 'system';
  icon: string;
  description?: string;
}

// Mapping between CSV column and database field
interface FieldMapping {
  id: string;
  csvColumn: CSVColumn;
  databaseField: DatabaseField;
  confidence: number;
  isAutoMapped: boolean;
  isUserOverride: boolean;
  createdAt: Date;
  validationStatus: 'valid' | 'warning' | 'error';
}

// Auto-mapping result
interface AutoMapping {
  csvColumn: CSVColumn;
  databaseField: DatabaseField;
  confidence: number;
  algorithm: 'exact' | 'fuzzy' | 'semantic' | 'pattern';
  reasons: string[];
}

// Validation result for mapping or data
interface ValidationResult {
  id: string;
  type: 'error' | 'warning' | 'info';
  field?: string;
  message: string;
  details?: string;
  affectedRows?: number[];
  suggestions?: string[];
}

// User override for auto-mapping
interface UserOverride {
  csvColumn: CSVColumn;
  originalMapping: DatabaseField;
  newMapping: DatabaseField;
  reason?: string;
  timestamp: Date;
}
```

### UI State Types
```typescript
interface LoadingOperation {
  id: string;
  type: 'loading_csv' | 'auto_mapping' | 'validation' | 'saving';
  message: string;
  progress?: number;
}

interface FieldCategory {
  id: string;
  name: string;
  icon: string;
  fields: DatabaseField[];
  isRequired: boolean;
}

interface ValidationError extends ValidationResult {
  type: 'error';
  blocking: boolean;
}

interface ValidationWarning extends ValidationResult {
  type: 'warning';
  severity: 'low' | 'medium' | 'high';
}
```

---

## DATA FLOW & INTEGRATION POINTS

### Integration with Task 2 (CSV Parser)
```typescript
// API call to get CSV data from importId
const fetchCSVData = async (importId: string) => {
  const response = await fetch(`/api/imports/${importId}`);
  return {
    columns: CSVColumn[],
    previewRows: any[],
    rowCount: number,
    filename: string
  };
};
```

### Integration with Task 4 (Duplicate Detection)
```typescript
// Pass mappings to duplicate detection
const proceedToValidation = (mappings: FieldMapping[]) => {
  onMappingComplete({
    mappings,
    nextStep: 'duplicate-detection',
    config: {
      compareFields: mappings
        .filter(m => m.databaseField.type === 'email' || m.databaseField.type === 'text')
        .map(m => m.databaseField.name)
    }
  });
};
```

### Integration with Task 6 (Bulk Import)
```typescript
// Final mappings for import execution
interface ImportMapping {
  csvColumn: string;
  databaseField: string;
  transformation?: (value: any) => any;
  validation?: (value: any) => boolean;
}

const generateImportMappings = (mappings: FieldMapping[]): ImportMapping[] => {
  return mappings.map(mapping => ({
    csvColumn: mapping.csvColumn.name,
    databaseField: mapping.databaseField.name,
    transformation: getTransformationFunction(mapping),
    validation: getValidationFunction(mapping)
  }));
};
```

---

## PERFORMANCE OPTIMIZATIONS

### Component Optimization
```typescript
// Memoize heavy calculations
const memoizedAutoDetection = useMemo(() => {
  return autoDetectMappings(csvColumns, databaseFields);
}, [csvColumns, databaseFields]);

// Memoize validation results
const memoizedValidation = useMemo(() => {
  return validateMappings(mappings, previewRows);
}, [mappings, previewRows]);

// Optimize list rendering
const MemoizedDraggableColumn = memo(DraggableColumn, (prev, next) => {
  return prev.column.id === next.column.id && 
         prev.isDragging === next.isDragging;
});
```

### Virtualization for Large Datasets
```typescript
// Use react-window for large CSV column lists
import { FixedSizeList } from 'react-window';

const CSVColumnVirtualizedList = ({ columns, ...props }) => {
  return (
    <FixedSizeList
      height={400}
      itemCount={columns.length}
      itemSize={80}
      itemData={{ columns, ...props }}
    >
      {({ index, style, data }) => (
        <div style={style}>
          <DraggableColumn column={data.columns[index]} {...data} />
        </div>
      )}
    </FixedSizeList>
  );
};
```

### Debounced Operations
```typescript
// Debounce validation and auto-mapping
const debouncedValidation = useCallback(
  debounce((mappings: FieldMapping[]) => {
    const results = validateMappings(mappings, previewRows);
    setValidationResults(results);
  }, 300),
  [previewRows]
);

const debouncedAutoMapping = useCallback(
  debounce((columns: CSVColumn[], fields: DatabaseField[]) => {
    const autoMappings = autoDetectMappings(columns, fields);
    setAutoMappings(autoMappings);
  }, 500),
  []
);
```

---

## ERROR BOUNDARIES & ERROR HANDLING

### Component Error Boundaries
```typescript
class FieldMappingErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('FieldMapping Error:', error, errorInfo);
    // Report to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return <FieldMappingErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### Async Error Handling
```typescript
const useAsyncError = () => {
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((error: Error) => {
    setError(error);
    // Log to error service
    console.error('Async Error:', error);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
};
```

---

## TESTING STRATEGY

### Component Testing Hierarchy
```typescript
// Unit Tests (hooks and utilities)
describe('useFieldMapping', () => {
  test('should create mapping correctly');
  test('should handle auto-mapping');
  test('should validate mappings');
});

// Component Tests (individual components)
describe('DraggableColumn', () => {
  test('should render column information');
  test('should handle drag events');
  test('should show mapping status');
});

// Integration Tests (component interactions)
describe('FieldMappingInterface', () => {
  test('should complete full mapping flow');
  test('should handle drag and drop');
  test('should validate and show errors');
});

// E2E Tests (full user workflows)
describe('Field Mapping Workflow', () => {
  test('should map all required fields');
  test('should handle validation errors');
  test('should save and restore draft');
});
```

### Mock Data Strategy
```typescript
// Test data factories
const createMockCSVColumn = (overrides?: Partial<CSVColumn>): CSVColumn => ({
  id: 'col-1',
  name: 'Email',
  originalName: 'Email Address',
  index: 0,
  dataType: 'string',
  sampleValues: ['john@test.com', 'jane@example.org'],
  uniqueValues: 150,
  emptyValues: 0,
  totalValues: 150,
  ...overrides
});

const createMockDatabaseField = (overrides?: Partial<DatabaseField>): DatabaseField => ({
  id: 'field-email',
  name: 'email',
  displayName: 'Email Address',
  type: 'email',
  isRequired: true,
  category: 'contact',
  icon: '📧',
  ...overrides
});
```

---

## ACCESSIBILITY IMPLEMENTATION

### Focus Management
```typescript
const useFocusManagement = () => {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const captureFocus = () => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  };

  const restoreFocus = () => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  };

  return { captureFocus, restoreFocus };
};
```

### Screen Reader Announcements
```typescript
const useScreenReaderAnnouncements = () => {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  return { announce };
};
```

---

## COMPONENT ARCHITECTURE SUMMARY

**Total Files**: 15 files across 4 directories  
**Estimated Lines**: 1,590 lines of TypeScript/React code  
**Custom Hooks**: 3 specialized hooks for state management  
**Type Definitions**: 12 primary interfaces + helper types  
**Integration Points**: 3 major (CSV Parser, Duplicate Detection, Import)  
**Performance Features**: Virtualization, memoization, debouncing  
**Accessibility Level**: WCAG 2.1 AA with full keyboard navigation  
**Testing Coverage**: Unit, component, integration, and E2E tests planned

**Next Phase**: Library Selection & Evaluation