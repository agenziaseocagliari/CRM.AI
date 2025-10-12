# Task 7 Implementation Plan - Export Functionality

**Phase 4.1 - Task 7**: 2-hour implementation plan for contact export system

---

## IMPLEMENTATION OVERVIEW

**Total Duration**: 2 hours  
**Subtasks**: 4 focused blocks  
**Primary Format**: CSV (universal compatibility)  
**Secondary Format**: Excel XLSX (advanced formatting)  
**Performance Target**: 10K contacts exported in <10 seconds  

---

## SUBTASK 7.1: CSV EXPORT ENGINE (40 min)

### Core Implementation (25 min)
```typescript
// src/lib/export/CSVExporter.ts
class CSVExporter {
  private readonly BOM = '\uFEFF'; // UTF-8 BOM for Excel
  
  async exportContacts(contacts: Contact[], fields: string[]): Promise<string> {
    const headers = this.formatCSVRow(fields);
    const rows = contacts.map(contact => this.formatContactRow(contact, fields));
    
    return this.BOM + [headers, ...rows].join('\r\n');
  }
  
  private formatContactRow(contact: Contact, fields: string[]): string {
    const values = fields.map(field => {
      const value = contact[field] || '';
      return this.escapeCSVField(String(value));
    });
    
    return values.join(',');
  }
  
  private escapeCSVField(value: string): string {
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (value.includes('"')) {
      value = value.replace(/"/g, '""');
    }
    
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value}"`;
    }
    
    return `"${value}"`; // Always quote for consistency
  }
}
```

### Streaming Implementation (15 min)
```typescript
async streamLargeExport(query: ContactQuery): Promise<ReadableStream> {
  const stream = new ReadableStream({
    async start(controller) {
      // Send UTF-8 BOM and headers
      controller.enqueue(this.BOM + this.formatHeaders(query.fields) + '\r\n');
      
      let offset = 0;
      const batchSize = 1000;
      
      while (true) {
        const batch = await this.fetchContactBatch(query, offset, batchSize);
        
        if (batch.length === 0) break;
        
        const csvRows = batch.map(contact => 
          this.formatContactRow(contact, query.fields)
        ).join('\r\n');
        
        controller.enqueue(csvRows + '\r\n');
        offset += batchSize;
      }
      
      controller.close();
    }
  });
  
  return stream;
}
```

---

## SUBTASK 7.2: EXCEL EXPORT ENGINE (40 min)

### Libraries Setup (5 min)
```bash
npm install exceljs
npm install @types/node  # For Buffer support
```

### Excel Generation Implementation (30 min)
```typescript
// src/lib/export/ExcelExporter.ts
import ExcelJS from 'exceljs';

class ExcelExporter {
  async exportContacts(contacts: Contact[], options: ExportOptions): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    // Main contacts sheet
    const contactSheet = workbook.addWorksheet('Contacts');
    this.formatContactSheet(contactSheet, contacts, options.fields);
    
    // Optional additional sheets
    if (options.includeNotes) {
      const notesSheet = workbook.addWorksheet('Notes');
      this.formatNotesSheet(notesSheet, contacts);
    }
    
    if (options.includeTags) {
      const tagsSheet = workbook.addWorksheet('Tags');
      this.formatTagsSheet(tagsSheet, contacts);
    }
    
    return await workbook.xlsx.writeBuffer();
  }
  
  private formatContactSheet(worksheet: ExcelJS.Worksheet, contacts: Contact[], fields: string[]): void {
    // Add headers with formatting
    const headerRow = worksheet.addRow(fields);
    headerRow.font = { bold: true, size: 12 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6E6FA' } };
    
    // Add data rows
    contacts.forEach(contact => {
      const values = fields.map(field => contact[field] || '');
      const row = worksheet.addRow(values);
      
      // Format dates
      values.forEach((value, index) => {
        if (value instanceof Date) {
          row.getCell(index + 1).numFmt = 'yyyy-mm-dd hh:mm';
        }
      });
    });
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 15; // Default width
    });
  }
}
```

### Performance Optimization (5 min)
```typescript
async exportLargeDataset(query: ContactQuery): Promise<Buffer> {
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({
    filename: '/tmp/export.xlsx',
    useStyles: true
  });
  
  const worksheet = workbook.addWorksheet('Contacts');
  
  // Process in batches to control memory
  let offset = 0;
  const batchSize = 5000;
  
  while (true) {
    const batch = await this.fetchContactBatch(query, offset, batchSize);
    if (batch.length === 0) break;
    
    batch.forEach(contact => {
      const row = worksheet.addRow(this.formatContactForExcel(contact, query.fields));
      row.commit();
    });
    
    offset += batchSize;
  }
  
  await workbook.commit();
  return fs.readFileSync('/tmp/export.xlsx');
}
```

---

## SUBTASK 7.3: FIELD SELECTION UI (25 min)

### Export Configuration Component (15 min)
```typescript
// src/components/ExportDialog.tsx
interface ExportDialogProps {
  contacts: Contact[];
  isOpen: boolean;
  onClose: () => void;
  onExport: (config: ExportConfig) => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ contacts, isOpen, onClose, onExport }) => {
  const [selectedFields, setSelectedFields] = useState<string[]>(['email', 'name', 'phone']);
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');
  const [includeNotes, setIncludeNotes] = useState(false);
  const [includeTags, setIncludeTags] = useState(true);
  
  const availableFields = [
    { key: 'email', label: 'Email', required: true },
    { key: 'name', label: 'Full Name', required: true },
    { key: 'phone', label: 'Phone', required: false },
    { key: 'company', label: 'Company', required: false },
    { key: 'title', label: 'Job Title', required: false },
    { key: 'address', label: 'Address', required: false },
    { key: 'created_at', label: 'Created Date', required: false },
    { key: 'updated_at', label: 'Last Updated', required: false }
  ];
  
  const handleExport = () => {
    const config: ExportConfig = {
      format,
      fields: selectedFields,
      options: {
        includeNotes,
        includeTags,
        includeCustomFields: false
      }
    };
    
    onExport(config);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Contacts</DialogTitle>
          <DialogDescription>
            Select fields and format for {contacts.length} contacts
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Format Selection */}
          <div>
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={setFormat}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv">CSV (Excel Compatible)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="xlsx" id="xlsx" />
                <Label htmlFor="xlsx">Excel (.xlsx)</Label>
              </div>
            </RadioGroup>
          </div>
          
          {/* Field Selection */}
          <div>
            <Label>Fields to Export</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableFields.map(field => (
                <div key={field.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={field.key}
                    checked={selectedFields.includes(field.key)}
                    disabled={field.required}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedFields([...selectedFields, field.key]);
                      } else {
                        setSelectedFields(selectedFields.filter(f => f !== field.key));
                      }
                    }}
                  />
                  <Label htmlFor={field.key}>
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Additional Options */}
          {format === 'xlsx' && (
            <div>
              <Label>Additional Data</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notes"
                    checked={includeNotes}
                    onCheckedChange={setIncludeNotes}
                  />
                  <Label htmlFor="notes">Include Notes (separate sheet)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="tags"
                    checked={includeTags}
                    onCheckedChange={setIncludeTags}
                  />
                  <Label htmlFor="tags">Include Tags (separate sheet)</Label>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleExport}>Export {contacts.length} Contacts</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
```

### Export Progress Component (10 min)
```typescript
const ExportProgress: React.FC<{ exportId: string }> = ({ exportId }) => {
  const [status, setStatus] = useState<ExportStatus>('processing');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  
  useEffect(() => {
    const pollStatus = async () => {
      const response = await fetch(`/api/contacts/export/${exportId}/status`);
      const data = await response.json();
      
      setStatus(data.status);
      if (data.download_url) {
        setDownloadUrl(data.download_url);
      }
      
      if (data.status === 'processing') {
        setTimeout(pollStatus, 2000);
      }
    };
    
    pollStatus();
  }, [exportId]);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        {status === 'processing' && <Loader2 className="w-4 h-4 animate-spin" />}
        {status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
        <span>Export Status: {status}</span>
      </div>
      
      {downloadUrl && (
        <Button asChild>
          <a href={downloadUrl} download>Download Export</a>
        </Button>
      )}
    </div>
  );
};
```

---

## SUBTASK 7.4: INTEGRATION & TESTING (15 min)

### API Integration (8 min)
```typescript
// src/lib/api/export.ts
export async function exportContacts(config: ExportConfig): Promise<ExportResponse> {
  const response = await fetch('/api/contacts/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  
  if (!response.ok) {
    throw new Error('Export failed');
  }
  
  const result = await response.json();
  
  // Handle direct download for small exports
  if (result.download_url && result.status === 'completed') {
    const link = document.createElement('a');
    link.href = result.download_url;
    link.download = `contacts.${config.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  return result;
}
```

### Testing Checklist (7 min)
```typescript
describe('Export Functionality', () => {
  test('CSV Export - Small Dataset', async () => {
    const contacts = generateTestContacts(100);
    const csv = await CSVExporter.exportContacts(contacts, ['email', 'name']);
    
    expect(csv).toContain('\uFEFF'); // UTF-8 BOM
    expect(csv.split('\n')).toHaveLength(101); // Headers + 100 rows
    expect(csv).toMatch(/^"Email","Name"/); // Proper headers
  });
  
  test('Excel Export - Multiple Sheets', async () => {
    const contacts = generateTestContacts(50);
    const buffer = await ExcelExporter.exportContacts(contacts, {
      fields: ['email', 'name'],
      includeNotes: true,
      includeTags: true
    });
    
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    
    expect(workbook.worksheets).toHaveLength(3); // Contacts, Notes, Tags
    expect(workbook.getWorksheet('Contacts').rowCount).toBe(51); // Headers + 50 rows
  });
  
  test('Large Export Performance', async () => {
    const startTime = Date.now();
    const contacts = generateTestContacts(10000);
    
    const csv = await CSVExporter.exportContacts(contacts, ['email', 'name', 'phone']);
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(10000); // <10 seconds
    expect(csv.split('\n')).toHaveLength(10001); // Headers + 10k rows
  });
  
  test('Unicode Handling', async () => {
    const contacts = [
      { email: 'test@example.com', name: 'José García', company: 'Café München' },
      { email: 'user@test.com', name: '田中太郎', company: '株式会社テスト' }
    ];
    
    const csv = await CSVExporter.exportContacts(contacts, ['email', 'name', 'company']);
    
    expect(csv).toContain('José García');
    expect(csv).toContain('田中太郎');
    expect(csv).toContain('Café München');
  });
});
```

---

## LIBRARIES & DEPENDENCIES

### Required Packages
```json
{
  "dependencies": {
    "exceljs": "^4.4.0",
    "csv-stringify": "^6.4.4",
    "@types/node": "^20.0.0"
  }
}
```

### Import Statements
```typescript
import ExcelJS from 'exceljs';
import { stringify } from 'csv-stringify/sync';
import { Readable } from 'stream';
```

---

## SUCCESS CRITERIA

### Functional ✅
- **CSV Export**: Generates proper CSV with UTF-8 BOM
- **Excel Export**: Creates formatted XLSX with multiple sheets
- **Field Selection**: Users can choose which fields to export
- **Large Datasets**: Handles 100K+ contacts without memory issues

### Performance ✅
- **Small Exports**: <2s for <1K contacts
- **Medium Exports**: <10s for <10K contacts
- **Memory Usage**: <100MB regardless of dataset size
- **File Quality**: Opens correctly in Excel/Sheets

### Integration ✅
- **UI Components**: Intuitive export dialog and progress tracking
- **API Endpoints**: RESTful export and status checking
- **Error Handling**: Graceful failure with user feedback
- **Download Management**: Secure file delivery and cleanup

---

**Task 7 Implementation Plan Complete - Ready for Final 2-Hour Sprint!**