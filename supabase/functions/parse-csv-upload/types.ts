// ===== CSV PARSER TYPES =====
// Phase 4.1 - Task 2: TypeScript Interface Definitions
// All types needed for CSV parsing and upload functionality

// ===== REQUEST TYPES =====

export interface ParseCSVRequest {
  // Multipart form data fields
  file: File                              // The CSV file to parse
  organization_id: string                 // UUID - for multi-tenant isolation
  duplicate_strategy?: 'skip' | 'update' | 'merge'  // How to handle duplicates
  field_mapping_template_id?: string      // UUID - optional saved template
}

export interface FileUploadResult {
  filename: string                        // Original filename
  file_size: number                       // Size in bytes
  content: string                         // File content as text
  organization_id: string                 // Extracted from form
  duplicate_strategy: 'skip' | 'update' | 'merge'
  field_mapping_template_id?: string
}

// ===== CSV PARSING TYPES =====

export interface CSVRow {
  [columnName: string]: string | null     // Raw CSV data, column name -> value
}

export interface CSVParseResult {
  headers: string[]                       // Column names from first row
  rows: CSVRow[]                         // Parsed data rows
  totalRows: number                      // Total number of data rows
  delimiter: ',' | ';' | '\t'           // Detected delimiter
  encoding: string                       // Detected encoding (utf-8, etc.)
  parseErrors: ParseError[]              // Any parsing issues encountered
}

export interface ParseError {
  row: number                            // Row number (1-indexed)
  column?: string                        // Column name if known
  message: string                        // Error description
  rawData?: string                       // Raw problematic data
}

// ===== FIELD MAPPING TYPES =====

export interface FieldMapping {
  mappings: Record<string, string>       // CSV column -> DB field mapping
  unmapped: string[]                     // CSV columns with no mapping
  confidence: Record<string, number>     // Confidence scores (0-1)
  suggestions: Record<string, string[]>  // Alternative mapping suggestions
}

export interface DetectedField {
  csvColumn: string                      // Original CSV column name
  dbField: string                        // Target database field
  confidence: number                     // Match confidence (0-1)
  matchType: 'exact' | 'case-insensitive' | 'fuzzy' | 'alias'
}

// Database field names we can map to
export type DatabaseField = 
  | 'email' 
  | 'phone' 
  | 'full_name' 
  | 'first_name' 
  | 'last_name'
  | 'company' 
  | 'job_title' 
  | 'address' 
  | 'city' 
  | 'country' 
  | 'notes'

// ===== VALIDATION TYPES =====

export interface ValidationResult {
  errors: ValidationError[]              // Blocking errors
  warnings: ValidationWarning[]          // Non-blocking issues
  stats: ValidationStats                 // Summary statistics
}

export interface ValidationError {
  row: number                           // Row number (1-indexed)
  field: string                         // Database field name
  column: string                        // CSV column name
  message: string                       // Error description
  value: string | null                  // Invalid value
  errorType: ValidationErrorType
}

export interface ValidationWarning {
  row: number                           // Row number (1-indexed)
  field: string                         // Database field name
  column: string                        // CSV column name
  message: string                       // Warning description
  value: string | null                  // Problematic value
  suggestion?: string                   // Suggested fix
}

export type ValidationErrorType = 
  | 'REQUIRED_FIELD_MISSING'
  | 'INVALID_EMAIL_FORMAT'
  | 'INVALID_PHONE_FORMAT'
  | 'VALUE_TOO_LONG'
  | 'INVALID_DATA_TYPE'
  | 'DUPLICATE_EMAIL'
  | 'DUPLICATE_PHONE'

export interface ValidationStats {
  totalRows: number                     // Total rows validated
  validRows: number                     // Rows with no errors
  errorRows: number                     // Rows with blocking errors
  warningRows: number                   // Rows with warnings only
  duplicateEmails: number               // Count of duplicate emails found
  duplicatePhones: number               // Count of duplicate phones found
}

// ===== RESPONSE TYPES =====

export interface ParseCSVResponse {
  success: boolean
  import_id?: string                    // UUID for tracking this import
  preview?: CSVPreview                  // Preview of parsed data
  validation?: ValidationResult         // Validation results
  error?: string                        // Error message if success=false
  code?: string                         // Error code for programmatic handling
}

export interface CSVPreview {
  headers: string[]                     // Column names
  rows: CSVRow[]                       // First 10 rows for preview
  total_rows: number                    // Total number of rows in file
  detected_mappings: Record<string, string>  // Auto-detected field mappings
}

// ===== DATABASE TYPES =====

export interface ContactImportRecord {
  id: string                            // UUID
  organization_id: string               // UUID
  uploaded_by: string                   // UUID - user who uploaded
  filename: string                      // Original filename
  file_size: number                     // Size in bytes
  file_type: 'csv'                     // Always CSV for this function
  total_rows: number                    // Number of data rows
  status: 'preview' | 'processing' | 'completed' | 'failed'
  field_mapping: Record<string, string> // Column mappings used
  duplicate_strategy: 'skip' | 'update' | 'merge'
  started_at: string                    // ISO timestamp
  created_at: string                    // ISO timestamp
  updated_at: string                    // ISO timestamp
}

// ===== ERROR TYPES =====

export class CSVParserError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 400,
    public details?: any
  ) {
    super(message)
    this.name = 'CSVParserError'
  }
}

export type CSVErrorCode = 
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_TYPE'
  | 'EMPTY_FILE'
  | 'MALFORMED_CSV'
  | 'ENCODING_ERROR'
  | 'NO_HEADERS'
  | 'NO_DATA_ROWS'
  | 'ORGANIZATION_NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'DATABASE_ERROR'
  | 'VALIDATION_FAILED'

// ===== CONFIGURATION TYPES =====

export interface CSVParserConfig {
  maxFileSize: number                   // Max file size in bytes (10MB)
  maxRows: number                       // Max rows to process (50,000)
  previewRows: number                   // Rows to include in preview (10)
  timeout: number                       // Function timeout in ms (30,000)
  supportedDelimiters: string[]         // [',', ';', '\t']
  requiredFields: DatabaseField[]       // Fields that must be present
  emailValidationRegex: RegExp          // Email validation pattern
  phoneValidationRegex: RegExp          // Phone validation pattern
}

// Default configuration
export const DEFAULT_CONFIG: CSVParserConfig = {
  maxFileSize: 10 * 1024 * 1024,       // 10MB
  maxRows: 50000,                       // 50,000 rows
  previewRows: 10,                      // 10 rows preview
  timeout: 30000,                       // 30 seconds
  supportedDelimiters: [',', ';', '\t'], // Common delimiters
  requiredFields: ['email'],            // Email is required
  emailValidationRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Basic email regex
  phoneValidationRegex: /^[\d\s\-\+\(\)\.]{7,}$/     // Basic phone regex
}

// ===== UTILITY TYPES =====

export type ProcessingStep = 
  | 'upload'
  | 'parse'
  | 'detect'
  | 'validate'
  | 'save'
  | 'response'

export interface ProcessingProgress {
  step: ProcessingStep
  progress: number                      // 0-100
  message: string                       // Human readable status
  startTime: number                     // Timestamp
  endTime?: number                      // Timestamp when step completed
}