# Contact Export - Quick Design

**Phase 4.1 - Task 7**: Essential export functionality for contact data

---

## EXPORT FORMATS

### Primary Format: CSV
- **UTF-8 Encoding**: Universal compatibility
- **Excel Compatible**: Opens correctly in Excel/Sheets
- **All Fields**: Complete contact data export
- **Custom Selection**: User chooses specific fields
- **Streaming Support**: Large datasets handled efficiently

### Secondary Format: Excel XLSX
- **Multiple Sheets**: Contacts, Notes, Tags, Custom Fields
- **Formatted Headers**: Professional appearance with bold headers
- **Auto-Column Width**: Optimal column sizing for readability
- **Date Formatting**: Proper date/time display
- **Cell Types**: Text, numbers, dates properly formatted

### Future Format: vCard
- **Standard Format**: Industry standard for contacts
- **Import Compatibility**: Works with Outlook, Gmail, phones
- **Individual Files**: One vCard per contact or combined file

---

## EXPORT FLOW

### User Workflow
```
1. User selects contacts (all/filtered/selected)
2. Choose export format (CSV/Excel)  
3. Select fields to include/exclude
4. Configure export options
5. Generate and download file
```

### System Processing
```
1. Validate user permissions
2. Apply filters/selection criteria
3. Stream data in chunks (1000 contacts per chunk)
4. Generate file in selected format
5. Provide download link or direct download
```

---

## CSV EXPORT SPECIFICATIONS

### Field Selection
- **Standard Fields**: email, name, phone, company, title, address
- **Custom Fields**: User-defined contact fields
- **Relationship Data**: Tags, notes, interaction history
- **Metadata**: created_at, updated_at, import source

### Format Standards
```csv
"Email","Full Name","Phone","Company","Title","Created Date","Tags"
"john@example.com","John Smith","123-456-7890","Acme Corp","Manager","2025-10-13","lead,hot"
"jane@company.com","Jane Doe","987-654-3210","Tech Inc","Director","2025-10-12","customer,vip"
```

### Technical Requirements
- **UTF-8 BOM**: For Excel compatibility
- **Quoted Fields**: All fields wrapped in quotes
- **Escaped Quotes**: Double quotes in data escaped properly
- **Line Endings**: CRLF for Windows compatibility

---

## EXCEL EXPORT SPECIFICATIONS

### Workbook Structure
- **Sheet 1 - Contacts**: Main contact data
- **Sheet 2 - Notes**: Contact notes and interactions
- **Sheet 3 - Tags**: Contact tags and categories
- **Sheet 4 - Custom Fields**: Extended contact properties

### Formatting Standards
```typescript
interface ExcelFormatting {
  headers: {
    font: { bold: true, size: 12 };
    fill: { bgColor: { rgb: "E6E6FA" } };
    border: { style: "thin" };
  };
  data: {
    font: { size: 11 };
    alignment: { horizontal: "left", vertical: "top" };
  };
  dates: {
    format: "yyyy-mm-dd hh:mm";
  };
}
```

---

## API DESIGN

### Export Request Endpoint
```typescript
POST /api/contacts/export

Request Body:
{
  "format": "csv" | "xlsx" | "vcard",
  "fields": ["email", "name", "phone", "company", "tags"],
  "filters": {
    "tags": ["lead", "customer"],
    "dateRange": {
      "start": "2025-01-01",
      "end": "2025-12-31"
    },
    "search": "example.com"
  },
  "options": {
    "includeNotes": true,
    "includeTags": true,
    "includeCustomFields": false
  }
}

Response:
{
  "export_id": "uuid",
  "status": "processing" | "completed" | "failed",
  "download_url": "https://api/downloads/uuid.csv",
  "expires_at": "2025-10-14T10:00:00Z",
  "total_contacts": 1500,
  "estimated_completion": "2025-10-13T15:35:00Z"
}
```

### Download Status Endpoint
```typescript
GET /api/contacts/export/{export_id}/status

Response:
{
  "export_id": "uuid",
  "status": "completed",
  "download_url": "https://api/downloads/uuid.csv",
  "file_size": "2.5MB",
  "total_contacts": 1500,
  "created_at": "2025-10-13T15:30:00Z",
  "expires_at": "2025-10-14T15:30:00Z"
}
```

---

## PERFORMANCE REQUIREMENTS

### Small Exports (<1K contacts)
- **Processing Time**: <2 seconds
- **Response Type**: Direct download
- **Memory Usage**: <10MB
- **Format**: Any format supported

### Medium Exports (1K-10K contacts)
- **Processing Time**: <10 seconds  
- **Response Type**: Download link
- **Memory Usage**: <50MB
- **Streaming**: Chunked processing

### Large Exports (10K-100K contacts)
- **Processing Time**: <60 seconds
- **Response Type**: Email notification when ready
- **Memory Usage**: <100MB
- **Background Processing**: Queued job system

### Massive Exports (>100K contacts)
- **Processing Time**: <5 minutes
- **Response Type**: Email with download link
- **Memory Usage**: Streaming (constant <100MB)
- **File Splitting**: Multiple files if >50MB

---

## IMPLEMENTATION SUBTASKS

### Subtask 7.1: CSV Export Engine (40 min)
**Core CSV Generation**:
```typescript
class CSVExporter {
  async exportContacts(contacts: Contact[], fields: string[]): Promise<string>
  private formatCSVRow(contact: Contact, fields: string[]): string
  private escapeCSVField(value: string): string
  async streamLargeExport(query: ContactQuery): Promise<ReadableStream>
}
```

**Key Features**:
- UTF-8 BOM for Excel compatibility
- Streaming for large datasets
- Custom field selection
- Proper CSV escaping

### Subtask 7.2: Excel Export Engine (40 min)
**Excel Generation**:
```typescript
class ExcelExporter {
  async exportContacts(contacts: Contact[], options: ExportOptions): Promise<Buffer>
  private createWorkbook(contacts: Contact[]): ExcelJS.Workbook
  private formatContactSheet(worksheet: Worksheet, contacts: Contact[]): void
  private formatNotesSheet(worksheet: Worksheet, notes: Note[]): void
}
```

**Libraries Required**:
- `exceljs`: Excel file generation
- `stream`: Large file streaming

### Subtask 7.3: Field Selection UI (25 min)
**Export Configuration Interface**:
- Field selection checkboxes
- Export format radio buttons
- Preview of selected fields
- Export progress indicator

**UI Components**:
```typescript
interface ExportConfigurationProps {
  availableFields: ContactField[];
  onExport: (config: ExportConfig) => void;
  isExporting: boolean;
}
```

### Subtask 7.4: Integration & Testing (15 min)
**Testing Scenarios**:
- Small export (100 contacts)
- Medium export (5,000 contacts)  
- Large export (25,000 contacts)
- Unicode/special character handling
- Excel file opens correctly
- CSV imports back correctly

---

## INTEGRATION POINTS

### Database Integration
```typescript
// Efficient contact querying with selected fields
const exportQuery = db
  .select(selectedFields)
  .from(contactsTable)
  .where(filterCriteria)
  .orderBy(contactsTable.created_at)
  .limit(1000); // Chunked processing
```

### Frontend Integration  
```typescript
// Export trigger from contact list
const handleExport = async (config: ExportConfig) => {
  const result = await exportContacts(config);
  
  if (result.status === 'processing') {
    // Show progress indicator
    pollExportStatus(result.export_id);
  } else {
    // Direct download
    downloadFile(result.download_url);
  }
};
```

### Background Processing
```typescript
// Queue large exports
const queueExport = async (config: ExportConfig) => {
  const job = await exportQueue.add('contact-export', config);
  return { export_id: job.id, status: 'queued' };
};
```

---

## SUCCESS CRITERIA

### Functional Requirements ✅
- **Format Support**: CSV and Excel exports working correctly
- **Field Selection**: Users can choose which fields to export
- **Large Dataset**: Handle 100K+ contacts without memory issues
- **File Quality**: Exported files open correctly in target applications
- **Unicode Support**: Special characters and international names preserved

### Performance Requirements ✅
- **Small Exports**: <2 seconds for <1K contacts
- **Medium Exports**: <10 seconds for <10K contacts  
- **Large Exports**: <60 seconds for <100K contacts
- **Memory Efficiency**: <100MB regardless of export size
- **Streaming**: Constant memory usage for massive exports

### User Experience Requirements ✅
- **Intuitive Interface**: Clear field selection and format choices
- **Progress Feedback**: Real-time export progress for large files
- **Error Handling**: Clear error messages for failed exports
- **Download Management**: Easy access to completed export files
- **Mobile Support**: Export functionality works on mobile devices

---

**Export Functionality Design Complete - Ready for 2-Hour Implementation**