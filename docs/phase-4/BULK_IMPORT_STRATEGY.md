# Bulk Import Execution Strategy

**Phase 4.1 - Task 6**: Batch processing engine for efficient contact imports

---

## BATCH PROCESSING ARCHITECTURE

### Batch Configuration
- **Batch Size**: 100 contacts per batch
- **Rationale**: Optimal balance between performance and memory usage
- **Transaction Scope**: Per-batch transactions (not entire import)
- **Memory Target**: <100MB regardless of import size

### Processing Flow

```
User confirms import
    ↓
Split validated data into batches (100 contacts each)
    ↓
For each batch:
    1. Begin database transaction
    2. Insert contact records
    3. Apply duplicate strategy (skip/update/merge)
    4. Update progress tracking
    5. Commit transaction OR rollback on error
    6. Log batch results
    ↓
All batches processed
    ↓
Generate final import report
    ↓
Send completion notification
```

---

## PROGRESS TRACKING DESIGN

### Real-Time Metrics
- **Overall Progress**: 0-100% completion percentage  
- **Contacts Processed**: Current count / Total count
- **Batch Information**: Current batch number and batch count
- **Performance**: Estimated time remaining (ETA)
- **Status Counts**: Success/Failed/Skipped/Duplicate counts

### Progress Update Frequency
- **Real-time Updates**: Every 1 second during processing
- **Batch Completion**: Immediate update after each batch
- **WebSocket Stream**: Live progress updates to UI
- **Fallback Polling**: Every 2 seconds if WebSocket unavailable

### Progress Calculation
```typescript
interface ImportProgress {
  progress: number;          // 0-100 percentage
  processed: number;         // Contacts processed so far
  total: number;            // Total contacts to import
  success: number;          // Successfully imported
  failed: number;           // Failed to import
  skipped: number;          // Skipped (validation errors)
  duplicates: number;       // Duplicate contacts handled
  current_batch: number;    // Current batch being processed
  total_batches: number;    // Total number of batches
  eta_seconds: number;      // Estimated completion time
  speed_per_minute: number; // Contacts processed per minute
}
```

---

## ERROR HANDLING STRATEGY

### Batch-Level Error Recovery
- **Isolated Failures**: Batch errors don't fail entire import
- **Automatic Retry**: Failed batches retry up to 3 attempts
- **Continue Processing**: Skip failed batch, continue with next
- **Error Logging**: Detailed error logs with specific row information

### Transaction Management
```
For each batch:
  BEGIN TRANSACTION
    Try to insert 100 contacts
    If batch succeeds:
      COMMIT
      Log success
    If batch fails:
      ROLLBACK  
      Log error details
      Retry batch (max 3 times)
      If still fails: Skip and continue
  END TRANSACTION
```

### Error Categories
1. **Validation Errors**: Invalid data format (skip contact)
2. **Database Errors**: Constraint violations (retry batch)
3. **System Errors**: Memory/connection issues (retry batch)
4. **Business Logic Errors**: Duplicate handling failures (log and skip)

---

## ROLLBACK CAPABILITY

### Mid-Import Cancellation
- **User Cancel**: Stop processing immediately
- **Partial Rollback**: Remove only successfully imported contacts
- **Import Tracking**: Use `imported_from` field with unique import_id
- **Rollback Query**: `DELETE FROM contacts WHERE imported_from = ?`

### Rollback Strategy
```typescript
interface ImportSession {
  import_id: string;        // Unique identifier for this import
  imported_from: string;    // Import session identifier  
  rollback_possible: boolean; // Whether rollback is available
  imported_count: number;   // Contacts successfully imported
}

// Rollback function
async function rollbackImport(import_id: string): Promise<void> {
  await db.transaction(async (tx) => {
    // Remove imported contacts
    await tx.delete(contacts).where(eq(contacts.imported_from, import_id));
    
    // Update import log
    await tx.update(contact_imports)
      .set({ status: 'rolled_back', completed_at: new Date() })
      .where(eq(contact_imports.id, import_id));
  });
}
```

---

## PERFORMANCE TARGETS

### Speed Requirements
- **Small Batches** (100 contacts): <2 seconds per batch
- **Large Imports** (10,000 contacts): <3 minutes total
- **Throughput Target**: 50+ contacts per second sustained
- **Memory Efficiency**: <100MB regardless of import size

### Optimization Strategies
- **Bulk Insert Operations**: Use database bulk insert APIs
- **Connection Pooling**: Reuse database connections
- **Minimal Validation**: Pre-validated data from Task 5
- **Asynchronous Processing**: Non-blocking progress updates
- **Batch Size Tuning**: Adjust based on performance metrics

---

## DUPLICATE HANDLING INTEGRATION

### Strategy Application (from Task 4)
```typescript
enum DuplicateStrategy {
  SKIP = 'skip',           // Skip duplicate contacts
  UPDATE = 'update',       // Update existing contact  
  MERGE = 'merge'          // Merge contact data
}

// Per-batch duplicate processing
for (const contact of batch) {
  const duplicate = await findDuplicate(contact);
  
  if (duplicate) {
    switch (strategy) {
      case 'skip':
        duplicates_skipped++;
        continue;
      case 'update':
        await updateContact(duplicate.id, contact);
        duplicates_updated++;
        break;
      case 'merge':
        await mergeContacts(duplicate, contact);
        duplicates_merged++;
        break;
    }
  } else {
    await insertContact(contact);
    contacts_inserted++;
  }
}
```

---

## API DESIGN

### Import Execution Endpoint
```typescript
POST /api/imports/{import_id}/execute

Request Body:
{
  "import_id": "uuid-string",
  "duplicate_strategy": "skip" | "update" | "merge",
  "skip_errors": true,
  "batch_size": 100,
  "notification_email": "user@example.com"
}

Response (Server-Sent Events):
{
  "event": "progress",
  "data": {
    "progress": 45.5,
    "processed": 4550,
    "total": 10000,
    "success": 4500,
    "failed": 30,
    "skipped": 20,
    "duplicates": 50,
    "current_batch": 46,
    "total_batches": 100,
    "eta_seconds": 120,
    "speed_per_minute": 2250
  }
}
```

### Rollback Endpoint
```typescript
DELETE /api/imports/{import_id}/rollback

Response:
{
  "success": true,
  "contacts_removed": 4500,
  "rollback_completed_at": "2025-10-13T15:30:00Z"
}
```

---

## INTEGRATION POINTS

### Task Dependencies
- **Task 2 (CSV Parser)**: Receives validated contact data array
- **Task 4 (Duplicate Detection)**: Uses duplicate strategy and matching algorithm  
- **Task 5 (Validation)**: Processes pre-validated contact data
- **Database Schema**: Uses contacts, contact_imports, contact_import_logs tables

### Data Flow Integration
```typescript
// Input from previous tasks
interface ImportExecution {
  validatedContacts: Contact[];     // From Task 5 validation
  duplicateStrategy: DuplicateStrategy; // From Task 4 user choice
  importSession: ImportSession;     // From Task 2 parsing
}

// Output to completion
interface ImportResult {
  import_id: string;
  total_contacts: number;
  successfully_imported: number;
  failed_contacts: number;
  duplicate_contacts: number;
  import_duration_ms: number;
  error_log: ImportError[];
}
```

---

## IMPLEMENTATION SUBTASKS

### Overview (2 Hours Total)
1. **Subtask 6.1**: Batch Processing Engine (30 min)
2. **Subtask 6.2**: Progress Tracking System (20 min)
3. **Subtask 6.3**: Duplicate Handling Integration (25 min)
4. **Subtask 6.4**: Reporting & Notification (20 min)
5. **Subtask 6.5**: Rollback & Testing (25 min)

### Subtask 6.1: Batch Processing Engine (30 min)
**Core Functions**:
- Split contact array into 100-contact batches
- Database transaction management per batch
- Batch processing loop with error isolation
- Retry logic for failed batches (max 3 attempts)

**Key Components**:
```typescript
class BatchProcessor {
  async executeBatch(contacts: Contact[]): Promise<BatchResult>
  async processBatches(batches: Contact[][]): Promise<ImportResult>
  async retryFailedBatch(batch: Contact[], attempt: number): Promise<BatchResult>
}
```

### Subtask 6.2: Progress Tracking System (20 min)
**Real-Time Updates**:
- WebSocket connection for live progress
- Progress calculation and ETA estimation
- Batch completion notifications
- Performance metrics tracking

**Key Components**:
```typescript
class ProgressTracker {
  updateProgress(processed: number, total: number): void
  calculateETA(startTime: Date, processed: number, total: number): number
  emitProgress(progress: ImportProgress): void
}
```

### Subtask 6.3: Duplicate Handling Integration (25 min)
**Strategy Implementation**:
- Apply user-selected duplicate strategy per contact
- Integrate with Task 4 duplicate detection algorithm
- Log duplicate actions for reporting
- Performance optimization for duplicate checking

**Key Components**:
```typescript
class DuplicateHandler {
  async handleDuplicate(contact: Contact, strategy: DuplicateStrategy): Promise<DuplicateResult>
  async findExistingContact(contact: Contact): Promise<Contact | null>
  async mergeContacts(existing: Contact, new: Contact): Promise<Contact>
}
```

### Subtask 6.4: Reporting & Notification (20 min)
**Import Results**:
- Success/failure summary generation
- Detailed error log with row-specific information
- Email notification on import completion
- Downloadable import report (CSV/PDF)

**Key Components**:
```typescript
class ImportReporter {
  generateSummaryReport(result: ImportResult): ImportSummary
  generateDetailedLog(errors: ImportError[]): string
  sendCompletionNotification(email: string, summary: ImportSummary): void
}
```

### Subtask 6.5: Rollback & Testing (25 min)
**Rollback Implementation**:
- Mid-import cancellation capability
- Partial rollback of successfully imported contacts
- Import session cleanup and logging

**Testing Coverage**:
- Large import performance test (10,000+ contacts)
- Error handling and retry scenarios
- Rollback functionality verification
- Progress tracking accuracy validation

---

## SUCCESS CRITERIA

### Functional Requirements ✅
- **Batch Processing**: 100 contacts per batch with transaction isolation
- **Progress Tracking**: Real-time updates with accurate percentage and ETA
- **Error Handling**: Batch-level failures don't break entire import
- **Duplicate Integration**: Seamless application of user's duplicate strategy
- **Rollback Capability**: Clean removal of imported contacts on user request

### Performance Requirements ✅
- **Import Speed**: 10,000 contacts in <3 minutes
- **Batch Performance**: 100 contacts per batch in <2 seconds
- **Memory Efficiency**: <100MB usage regardless of import size
- **Progress Updates**: Real-time updates every 1 second
- **Throughput**: Sustained 50+ contacts per second

### Integration Requirements ✅
- **Task 2 Integration**: Seamless data flow from CSV parsing
- **Task 4 Integration**: Duplicate strategy application without performance loss
- **Task 5 Integration**: Pre-validated contact data processing
- **Database Integration**: Efficient bulk operations with proper logging

---

**Bulk Import Strategy Complete - Ready for 2-Hour Implementation**