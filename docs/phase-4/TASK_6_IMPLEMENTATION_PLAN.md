# Task 6 Implementation Plan - Bulk Import Execution

**Phase 4.1 - Task 6**: Detailed 2-hour implementation roadmap for batch import processing engine

---

## IMPLEMENTATION OVERVIEW

**Total Duration**: 2 hours  
**Subtasks**: 5 focused implementation blocks  
**Integration**: Tasks 2, 4, 5 + Database schema  
**Performance Target**: 10K contacts in <3 minutes  

---

## SUBTASK 6.1: BATCH PROCESSING ENGINE (30 min)

### Implementation Steps

**Step 1: Core Batch Processor (10 min)**
```typescript
// src/lib/import/BatchProcessor.ts
class BatchProcessor {
  private batchSize = 100;
  private maxRetries = 3;
  
  async splitIntoBatches(contacts: Contact[]): Promise<Contact[][]> {
    const batches: Contact[][] = [];
    for (let i = 0; i < contacts.length; i += this.batchSize) {
      batches.push(contacts.slice(i, i + this.batchSize));
    }
    return batches;
  }
  
  async executeBatch(batch: Contact[], batchNumber: number): Promise<BatchResult> {
    const transaction = await db.transaction();
    try {
      const results = await this.insertContacts(transaction, batch);
      await transaction.commit();
      return { success: true, processed: results.length, errors: [] };
    } catch (error) {
      await transaction.rollback();
      return { success: false, processed: 0, errors: [error] };
    }
  }
}
```

**Step 2: Transaction Management (10 min)**
```typescript
async insertContacts(tx: Transaction, contacts: Contact[]): Promise<Contact[]> {
  return await tx.insert(contactsTable).values(
    contacts.map(contact => ({
      ...contact,
      imported_from: this.importId,
      created_at: new Date(),
      updated_at: new Date()
    }))
  ).returning();
}
```

**Step 3: Retry Logic (10 min)**
```typescript
async processBatchWithRetry(batch: Contact[], batchNumber: number): Promise<BatchResult> {
  for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
    const result = await this.executeBatch(batch, batchNumber);
    if (result.success) return result;
    
    console.log(`Batch ${batchNumber} failed, attempt ${attempt}/${this.maxRetries}`);
    if (attempt === this.maxRetries) {
      return { success: false, processed: 0, errors: result.errors };
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
  }
}
```

### Integration Points
- **Input**: Validated contacts from Task 5
- **Database**: Use contacts table with imported_from field
- **Logging**: contact_import_logs table for batch tracking

---

## SUBTASK 6.2: PROGRESS TRACKING SYSTEM (20 min)

### Implementation Steps

**Step 1: Progress Tracker Class (8 min)**
```typescript
// src/lib/import/ProgressTracker.ts
class ProgressTracker {
  private startTime: Date;
  private progressCallback: (progress: ImportProgress) => void;
  
  constructor(total: number, callback: (progress: ImportProgress) => void) {
    this.startTime = new Date();
    this.progressCallback = callback;
  }
  
  updateProgress(stats: ImportStats): void {
    const progress = this.calculateProgress(stats);
    this.progressCallback(progress);
  }
  
  private calculateProgress(stats: ImportStats): ImportProgress {
    const processed = stats.success + stats.failed + stats.skipped;
    const progressPercent = (processed / stats.total) * 100;
    const eta = this.calculateETA(processed, stats.total);
    
    return {
      progress: progressPercent,
      processed,
      total: stats.total,
      success: stats.success,
      failed: stats.failed,
      skipped: stats.skipped,
      duplicates: stats.duplicates,
      current_batch: stats.currentBatch,
      total_batches: stats.totalBatches,
      eta_seconds: eta,
      speed_per_minute: this.calculateSpeed(processed)
    };
  }
}
```

**Step 2: WebSocket Integration (7 min)**
```typescript
// src/lib/import/ImportWebSocket.ts
class ImportWebSocket {
  private ws: WebSocket;
  
  emitProgress(importId: string, progress: ImportProgress): void {
    const message = {
      type: 'import_progress',
      import_id: importId,
      data: progress
    };
    this.ws.send(JSON.stringify(message));
  }
  
  emitError(importId: string, error: string): void {
    const message = {
      type: 'import_error',
      import_id: importId,
      error: error
    };
    this.ws.send(JSON.stringify(message));
  }
}
```

**Step 3: ETA Calculation (5 min)**
```typescript
private calculateETA(processed: number, total: number): number {
  if (processed === 0) return 0;
  
  const elapsed = Date.now() - this.startTime.getTime();
  const rate = processed / elapsed; // contacts per ms
  const remaining = total - processed;
  
  return Math.round(remaining / rate / 1000); // seconds
}

private calculateSpeed(processed: number): number {
  const elapsed = (Date.now() - this.startTime.getTime()) / 1000 / 60; // minutes
  return Math.round(processed / elapsed);
}
```

---

## SUBTASK 6.3: DUPLICATE HANDLING INTEGRATION (25 min)

### Implementation Steps

**Step 1: Duplicate Handler Integration (10 min)**
```typescript
// src/lib/import/DuplicateHandler.ts
class DuplicateHandler {
  constructor(private strategy: DuplicateStrategy) {}
  
  async processBatchWithDuplicates(batch: Contact[]): Promise<DuplicateProcessResult> {
    const results: DuplicateProcessResult = {
      inserted: [],
      updated: [],
      skipped: [],
      merged: []
    };
    
    for (const contact of batch) {
      const existing = await this.findDuplicate(contact);
      
      if (existing) {
        const result = await this.handleDuplicate(contact, existing);
        this.categorizeResult(result, results);
      } else {
        const inserted = await this.insertNewContact(contact);
        results.inserted.push(inserted);
      }
    }
    
    return results;
  }
}
```

**Step 2: Strategy Application (10 min)**
```typescript
async handleDuplicate(newContact: Contact, existing: Contact): Promise<DuplicateResult> {
  switch (this.strategy) {
    case 'skip':
      return { action: 'skipped', contact: existing, reason: 'Duplicate found' };
      
    case 'update':
      const updated = await this.updateContact(existing.id, newContact);
      return { action: 'updated', contact: updated };
      
    case 'merge':
      const merged = await this.mergeContacts(existing, newContact);
      return { action: 'merged', contact: merged };
      
    default:
      throw new Error(`Unknown duplicate strategy: ${this.strategy}`);
  }
}
```

**Step 3: Performance Optimization (5 min)**
```typescript
// Batch duplicate detection for performance
async findDuplicatesInBatch(batch: Contact[]): Promise<Map<Contact, Contact | null>> {
  const duplicateMap = new Map();
  
  // Extract all emails and phones for batch lookup
  const emails = batch.map(c => c.email).filter(Boolean);
  const phones = batch.map(c => c.phone).filter(Boolean);
  
  // Single query to find all potential duplicates
  const existingContacts = await db
    .select()
    .from(contactsTable)
    .where(or(
      inArray(contactsTable.email, emails),
      inArray(contactsTable.phone, phones)
    ));
  
  // Map each contact to its duplicate (if any)
  for (const contact of batch) {
    const duplicate = existingContacts.find(existing => 
      this.isDuplicate(contact, existing)
    );
    duplicateMap.set(contact, duplicate || null);
  }
  
  return duplicateMap;
}
```

---

## SUBTASK 6.4: REPORTING & NOTIFICATION (20 min)

### Implementation Steps

**Step 1: Import Reporter (10 min)**
```typescript
// src/lib/import/ImportReporter.ts
class ImportReporter {
  generateSummaryReport(result: ImportResult): ImportSummary {
    return {
      import_id: result.import_id,
      total_contacts: result.total_contacts,
      successfully_imported: result.successfully_imported,
      failed_contacts: result.failed_contacts,
      duplicate_contacts: result.duplicate_contacts,
      import_duration: this.formatDuration(result.import_duration_ms),
      success_rate: (result.successfully_imported / result.total_contacts) * 100,
      completion_time: new Date()
    };
  }
  
  generateDetailedErrorLog(errors: ImportError[]): ImportErrorLog {
    return {
      total_errors: errors.length,
      errors_by_type: this.groupErrorsByType(errors),
      error_details: errors.map(error => ({
        row_number: error.row_number,
        contact_email: error.contact_email,
        error_type: error.error_type,
        error_message: error.error_message,
        batch_number: error.batch_number
      }))
    };
  }
}
```

**Step 2: Notification System (5 min)**
```typescript
async sendCompletionNotification(email: string, summary: ImportSummary): Promise<void> {
  const emailContent = `
    Import Complete!
    
    Total Contacts: ${summary.total_contacts}
    Successfully Imported: ${summary.successfully_imported}
    Failed: ${summary.failed_contacts}
    Duplicates Handled: ${summary.duplicate_contacts}
    Success Rate: ${summary.success_rate.toFixed(1)}%
    Duration: ${summary.import_duration}
  `;
  
  await sendEmail({
    to: email,
    subject: `Import Complete - ${summary.successfully_imported} contacts imported`,
    body: emailContent
  });
}
```

**Step 3: Export Functionality (5 min)**
```typescript
generateCSVReport(summary: ImportSummary, errors: ImportError[]): string {
  const csvRows = [
    ['Import Summary'],
    ['Total Contacts', summary.total_contacts],
    ['Successfully Imported', summary.successfully_imported],
    ['Failed', summary.failed_contacts],
    ['Success Rate', `${summary.success_rate.toFixed(1)}%`],
    [''],
    ['Error Details'],
    ['Row', 'Email', 'Error Type', 'Message']
  ];
  
  errors.forEach(error => {
    csvRows.push([
      error.row_number,
      error.contact_email,
      error.error_type,
      error.error_message
    ]);
  });
  
  return csvRows.map(row => row.join(',')).join('\n');
}
```

---

## SUBTASK 6.5: ROLLBACK & TESTING (25 min)

### Implementation Steps

**Step 1: Rollback Implementation (10 min)**
```typescript
// src/lib/import/ImportRollback.ts
class ImportRollback {
  async rollbackImport(importId: string): Promise<RollbackResult> {
    const transaction = await db.transaction();
    
    try {
      // Find all contacts from this import
      const importedContacts = await transaction
        .select()
        .from(contactsTable)
        .where(eq(contactsTable.imported_from, importId));
      
      // Delete imported contacts
      const deletedCount = await transaction
        .delete(contactsTable)
        .where(eq(contactsTable.imported_from, importId));
      
      // Update import status
      await transaction
        .update(contactImportsTable)
        .set({ 
          status: 'rolled_back', 
          completed_at: new Date(),
          rollback_reason: 'User requested rollback'
        })
        .where(eq(contactImportsTable.id, importId));
      
      await transaction.commit();
      
      return {
        success: true,
        contacts_removed: deletedCount,
        rollback_completed_at: new Date()
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
  
  async canRollback(importId: string): Promise<boolean> {
    const importRecord = await db
      .select()
      .from(contactImportsTable)
      .where(eq(contactImportsTable.id, importId))
      .limit(1);
    
    return importRecord.length > 0 && importRecord[0].status === 'completed';
  }
}
```

**Step 2: Mid-Import Cancellation (8 min)**
```typescript
class ImportCancellation {
  private cancelled = false;
  
  cancel(): void {
    this.cancelled = true;
  }
  
  async processBatchesWithCancellation(batches: Contact[][]): Promise<ImportResult> {
    for (let i = 0; i < batches.length; i++) {
      if (this.cancelled) {
        return {
          status: 'cancelled',
          processed_batches: i,
          total_batches: batches.length,
          message: 'Import cancelled by user'
        };
      }
      
      await this.processBatch(batches[i], i + 1);
    }
    
    return { status: 'completed' };
  }
}
```

**Step 3: Performance Testing (7 min)**
```typescript
// Test scenarios
const performanceTests = [
  {
    name: 'Small Import (100 contacts)',
    contactCount: 100,
    expectedDuration: 5000, // 5 seconds
    expectedMemory: 20 * 1024 * 1024 // 20MB
  },
  {
    name: 'Medium Import (1,000 contacts)', 
    contactCount: 1000,
    expectedDuration: 30000, // 30 seconds
    expectedMemory: 50 * 1024 * 1024 // 50MB
  },
  {
    name: 'Large Import (10,000 contacts)',
    contactCount: 10000,
    expectedDuration: 180000, // 3 minutes
    expectedMemory: 100 * 1024 * 1024 // 100MB
  }
];

async function runPerformanceTest(test: PerformanceTest): Promise<TestResult> {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;
  
  const contacts = generateTestContacts(test.contactCount);
  const processor = new BatchProcessor();
  
  const result = await processor.processBatches(
    await processor.splitIntoBatches(contacts)
  );
  
  const duration = Date.now() - startTime;
  const memoryUsed = process.memoryUsage().heapUsed - startMemory;
  
  return {
    passed: duration < test.expectedDuration && memoryUsed < test.expectedMemory,
    actualDuration: duration,
    actualMemory: memoryUsed,
    expectedDuration: test.expectedDuration,
    expectedMemory: test.expectedMemory
  };
}
```

---

## INTEGRATION STRATEGY

### Task 2 Integration (CSV Parser)
```typescript
// Receive parsed and validated data
interface ImportExecutionInput {
  parsedContacts: Contact[];      // From Task 2 CSV parsing
  validationResults: ValidationResult[]; // From Task 5 validation
  duplicateStrategy: DuplicateStrategy;  // From Task 4 user choice
  importSettings: ImportSettings;
}
```

### Task 4 Integration (Duplicate Detection)
```typescript
// Use duplicate detection algorithm
const duplicateDetector = new DuplicateDetector();
const duplicateHandler = new DuplicateHandler(userStrategy);

for (const contact of batch) {
  const duplicates = await duplicateDetector.findDuplicates(contact);
  if (duplicates.length > 0) {
    await duplicateHandler.handleDuplicate(contact, duplicates[0]);
  }
}
```

### Task 5 Integration (Validation)
```typescript
// Process pre-validated contacts
const validContacts = validationResults
  .filter(result => result.canProceed)
  .map(result => result.contact);

const contactsWithErrors = validationResults
  .filter(result => !result.canProceed);
```

---

## API ENDPOINTS

### Execute Import
```typescript
POST /api/imports/{import_id}/execute
Request: {
  duplicate_strategy: 'skip' | 'update' | 'merge',
  skip_errors: boolean,
  notification_email: string
}
Response: Server-Sent Events with progress updates
```

### Cancel Import
```typescript
DELETE /api/imports/{import_id}/cancel
Response: { cancelled: true, processed_batches: number }
```

### Rollback Import  
```typescript
DELETE /api/imports/{import_id}/rollback
Response: { contacts_removed: number, rollback_completed_at: string }
```

### Import Status
```typescript
GET /api/imports/{import_id}/status
Response: {
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'failed',
  progress: ImportProgress
}
```

---

## TESTING STRATEGY

### Unit Tests
- Batch processing logic
- Progress calculation accuracy
- Duplicate handling strategies
- Rollback functionality

### Integration Tests
- End-to-end import flow
- WebSocket progress updates
- Database transaction integrity
- Error recovery scenarios

### Performance Tests
- 10,000 contact import (<3 minutes)
- Memory usage monitoring
- Concurrent import handling
- Large file processing

### User Acceptance Tests
- Import cancellation workflow
- Progress tracking accuracy
- Error reporting completeness
- Rollback functionality

---

## SUCCESS METRICS

### Functional Metrics ✅
- **Batch Processing**: 100% of batches complete successfully or fail gracefully
- **Progress Tracking**: Real-time updates accurate within 1 second
- **Duplicate Handling**: User strategy applied to 100% of duplicates found
- **Error Recovery**: Failed batches retry up to 3 times before final failure
- **Rollback**: Complete removal of imported contacts within 30 seconds

### Performance Metrics ✅
- **Import Speed**: 10,000 contacts imported in <180 seconds
- **Batch Speed**: 100 contacts per batch in <2 seconds  
- **Memory Usage**: <100MB total regardless of import size
- **Throughput**: Sustained >50 contacts per second during processing
- **Progress Updates**: <1 second delay for WebSocket updates

### Integration Metrics ✅
- **Task 2 Integration**: 100% of parsed contacts processed correctly
- **Task 4 Integration**: Duplicate strategy applied with <5% performance impact
- **Task 5 Integration**: Pre-validated contacts processed without re-validation
- **Database Integration**: <1% transaction failure rate under normal conditions

---

**Implementation Plan Complete - Ready for 2-Hour Development Session**