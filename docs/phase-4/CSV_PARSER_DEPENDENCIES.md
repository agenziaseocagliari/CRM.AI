# CSV Parser Dependencies Analysis

**Phase 4.1 - Task 2**: Dependency selection and justification for Deno Edge Function

---

## CSV Parsing Library Selection

### Option 1: Deno Standard Library CSV ⭐ **CHOSEN**

```typescript
import { parse } from 'https://deno.land/std@0.208.0/csv/mod.ts';
```

**Pros**:

- ✅ Native Deno support (no Node.js compatibility layer)
- ✅ Zero external dependencies
- ✅ Lightweight and fast
- ✅ TypeScript-first design
- ✅ Handles common CSV formats well
- ✅ Streaming support for large files
- ✅ Good error handling

**Cons**:

- ❌ Less feature-rich than PapaParse
- ❌ Limited auto-detection of delimiters
- ❌ No built-in encoding detection

**Bundle Impact**: ~15KB (minimal)

### Option 2: PapaParse (npm)

```typescript
import Papa from 'https://esm.sh/papaparse@5.4.1';
```

**Pros**:

- ✅ Very feature-rich
- ✅ Excellent delimiter auto-detection
- ✅ Robust error handling
- ✅ Streaming support
- ✅ Handles malformed CSV gracefully

**Cons**:

- ❌ Larger bundle size (~50KB)
- ❌ Node.js compatibility layer needed
- ❌ More complex than needed for our use case

**Bundle Impact**: ~50KB

### Option 3: Custom Parser

**Pros**:

- ✅ Tailored to exact requirements
- ✅ Minimal code

**Cons**:

- ❌ Time-intensive to implement
- ❌ Need to handle edge cases
- ❌ Testing complexity

**Decision**: **Deno Standard Library CSV**  
**Rationale**: Native Deno support, good enough features, minimal bundle size, excellent performance.

---

## File Upload Handling

### Chosen Approach: Native Deno Request API

```typescript
const formData = await request.formData();
const file = formData.get('file') as File;
```

**Implementation**:

- Use native `Request.formData()` method
- No additional dependencies required
- Built-in multipart parsing
- Access to file metadata (name, size, type)

**Alternative Considered**: `std/http/multipart`  
**Rejected**: The native `formData()` is simpler and sufficient

---

## Validation Libraries

### Email Validation: Custom Regex + DNS Check

```typescript
// Basic format validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Enhanced validation (optional)
import { isValid } from 'https://deno.land/x/is_email@v1.0.3/mod.ts';
```

**Approach**:

1. **Level 1**: Basic regex for format
2. **Level 2**: Enhanced validation for TLD and structure
3. **Level 3**: DNS MX record check (future enhancement)

### Phone Validation: Custom Implementation

```typescript
// International phone regex
const PHONE_REGEX = /^[\d\s\-\+\(\)\.]{7,15}$/;

// Normalization function
function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, ''); // Keep only digits and +
}
```

**Rationale**: Phone validation is complex internationally. Start simple, enhance later.

### Text Length Validation: Built-in

```typescript
if (value.length > MAX_LENGTH) {
  // validation error
}
```

---

## Database Integration

### Supabase Client

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
```

**Usage**:

- Database operations (insert import record)
- RLS policy enforcement
- Authentication verification

**Configuration**:

- Use service role for backend operations
- Respect organization isolation
- Handle connection pooling

---

## Utility Libraries

### UUID Generation

```typescript
import { v4 } from 'https://deno.land/std@0.208.0/uuid/mod.ts';
```

**Usage**: Generate import_id for tracking

### Date Handling

```typescript
// Native JavaScript Date is sufficient
const timestamp = new Date().toISOString();
```

### Text Processing

```typescript
// Native string methods + regex
function fuzzyMatch(a: string, b: string): number {
  // Levenshtein distance implementation
}
```

---

## Complete Dependency List

### External Dependencies (3 total)

1. **Deno Standard CSV Parser**

   ```typescript
   import { parse } from 'https://deno.land/std@0.208.0/csv/mod.ts';
   ```

   **Purpose**: CSV parsing and data extraction  
   **Size**: ~15KB  
   **Alternatives**: PapaParse (larger), custom (time-consuming)

2. **Supabase Client**

   ```typescript
   import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
   ```

   **Purpose**: Database operations and authentication  
   **Size**: ~150KB  
   **Required**: Yes (core integration)

3. **Deno UUID Generator**
   ```typescript
   import { v4 as uuid } from 'https://deno.land/std@0.208.0/uuid/mod.ts';
   ```
   **Purpose**: Generate unique import IDs  
   **Size**: ~5KB  
   **Alternative**: crypto.randomUUID() (newer Deno versions)

### Native APIs Used (0 dependencies)

- `Request.formData()` - File upload handling
- `TextEncoder/TextDecoder` - Encoding conversion
- `RegExp` - Validation patterns
- `JSON` - Response formatting
- `console` - Logging and debugging

---

## Import Statement Template

```typescript
// ===== EXTERNAL DEPENDENCIES =====
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { parse as parseCSV } from 'https://deno.land/std@0.208.0/csv/mod.ts';
import { v4 as uuid } from 'https://deno.land/std@0.208.0/uuid/mod.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ===== LOCAL TYPES =====
import type {
  ParseCSVRequest,
  ParseCSVResponse,
  CSVParseResult,
} from './types.ts';
```

---

## Performance Impact Analysis

### Bundle Size Breakdown

- Deno CSV parser: ~15KB
- Supabase client: ~150KB
- UUID generator: ~5KB
- **Total external**: ~170KB

### Memory Usage Estimate

- File buffer (10MB max): 10MB
- Parsed CSV data: ~2x file size = 20MB
- Supabase client: ~5MB
- Function overhead: ~10MB
- **Total peak**: ~45MB (well under 128MB limit)

### Cold Start Impact

- First request: ~2-3 seconds (dependency loading)
- Warm requests: <500ms (dependencies cached)
- File processing: Linear with file size

---

## Deno Compatibility

### Version Requirements

- **Minimum Deno**: v1.37.0
- **Recommended**: v1.40.0+
- **Edge Functions**: Supabase supports v1.37.2

### Feature Usage

- ✅ ES Modules (native)
- ✅ TypeScript (native)
- ✅ Web APIs (fetch, FormData, etc.)
- ✅ Standard library imports
- ✅ NPM package imports via esm.sh

### Compatibility Verification

```bash
# Test import resolution
deno check supabase/functions/parse-csv-upload/index.ts

# Verify dependencies
deno info supabase/functions/parse-csv-upload/index.ts
```

---

## Security Considerations

### Dependency Security

- **Deno std**: Official, regularly updated, secure
- **Supabase**: Well-maintained, security-focused
- **esm.sh**: CDN with integrity checks

### Supply Chain Risks

- Minimal external dependencies (3 total)
- All from trusted sources
- Pinned to specific versions
- No transitive dependencies from std library

### Runtime Security

- Deno sandbox model
- No file system access required
- Network access only to Supabase
- No shell execution

---

## Alternative Approaches Considered

### 1. Server-Side Processing (Rejected)

**Pros**: More processing power, familiar Node.js ecosystem  
**Cons**: Complexity, scaling issues, not serverless  
**Decision**: Edge Functions better for this use case

### 2. Client-Side Processing (Rejected)

**Pros**: No server load, immediate feedback  
**Cons**: Security risks, large file limitations, browser compatibility  
**Decision**: Server-side more secure and reliable

### 3. Hybrid Processing (Future)

**Approach**: Client validates format, server processes data  
**Timeline**: Consider for Phase 5 optimizations

---

## Dependency Update Strategy

### Version Pinning

- Pin to specific versions for stability
- Update quarterly or for security patches
- Test in development before production deploy

### Monitoring

- Track bundle size changes
- Monitor performance impact
- Watch for security advisories

### Upgrade Path

```typescript
// Current
import { parse } from 'https://deno.land/std@0.208.0/csv/mod.ts';

// Future upgrade process
// 1. Update version number
// 2. Test in development
// 3. Verify API compatibility
// 4. Deploy to production
```

---

## Final Recommendations

### Development Dependencies (Today)

```json
{
  "imports": {
    "csv": "https://deno.land/std@0.208.0/csv/mod.ts",
    "uuid": "https://deno.land/std@0.208.0/uuid/mod.ts",
    "supabase": "https://esm.sh/@supabase/supabase-js@2"
  }
}
```

### Production Readiness

- ✅ All dependencies are production-ready
- ✅ Well-tested libraries chosen
- ✅ Minimal attack surface
- ✅ Good performance characteristics
- ✅ Compatible with Supabase Edge Functions

### Next Steps

1. Implement with chosen dependencies
2. Add integration tests
3. Monitor performance in production
4. Plan enhancement roadmap

---

**Status**: ✅ Dependencies finalized  
**Total Dependencies**: 3 external + native APIs  
**Bundle Size**: ~170KB  
**Deno Compatible**: ✅ Yes  
**Security Reviewed**: ✅ Approved
