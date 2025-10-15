# DataPizza AI Agent - Status & Documentation

**Service Name**: DataPizza Workflow Generation Agent  
**Purpose**: AI-powered workflow generation from natural language descriptions  
**Technology**: Custom AI agent with LLM backend  
**Integration**: Primary generation method with intelligent fallback

---

## Agent Overview

### What is DataPizza?

DataPizza is an AI-powered agent service that analyzes natural language descriptions and generates structured workflow elements. It understands complex automation requirements, including:

- **Triggers**: Events that start workflows (form submissions, deal updates, schedules, etc.)
- **Actions**: Operations to perform (send emails, score leads, create deals, etc.)
- **Branching Logic**: Conditional paths based on data or AI scores
- **Timing**: Delays and scheduled actions
- **Integrations**: External systems and webhooks

### Architecture

```
┌──────────────────────────────────────────────────┐
│            CRM.AI Application                    │
│                                                  │
│  ┌────────────────────────────────────┐         │
│  │   GenerateWorkflowModal.tsx        │         │
│  │   (User Interface)                 │         │
│  └────────────┬───────────────────────┘         │
│               │                                  │
│               │ User Description                 │
│               ↓                                  │
│  ┌────────────────────────────────────┐         │
│  │ workflowGenerationService.ts       │         │
│  │ ┌────────────────────────────────┐ │         │
│  │ │  generateWorkflow()            │ │         │
│  │ │  - 10s Timeout                 │ │         │
│  │ │  - AbortController             │ │         │
│  │ └────────────────────────────────┘ │         │
│  └────────────┬───────────────────────┘         │
└───────────────┼──────────────────────────────────┘
                │
                │ HTTP POST
                ↓
   ┌────────────────────────────────────────┐
   │   DataPizza AI Agent Service           │
   │   (http://localhost:8001)              │
   │                                        │
   │   ┌──────────────────────────────┐    │
   │   │  /generate-workflow          │    │
   │   │  - NLP Analysis              │    │
   │   │  - Workflow Synthesis        │    │
   │   │  - Element Generation        │    │
   │   └──────────────────────────────┘    │
   │                                        │
   │   ┌──────────────────────────────┐    │
   │   │  /health                     │    │
   │   │  - Service Status            │    │
   │   └──────────────────────────────┘    │
   │                                        │
   │   ┌──────────────────────────────┐    │
   │   │  /agents/status              │    │
   │   │  - Available Agents          │    │
   │   └──────────────────────────────┘    │
   └────────────────────────────────────────┘
                │
                │ Success (200 OK)
                ↓
   Return WorkflowGenerationResponse
   {
     method: 'ai',
     confidence: 0.9,
     elements: [...nodes],
     edges: [...edges],
     success: true
   }

   OR (on timeout/error)
                │
                ↓
   Fallback Generator Activates
   {
     method: 'fallback',
     confidence: 0.5-0.7,
     elements: [...nodes],
     edges: [...edges],
     success: true
   }
```

---

## API Endpoints

### Production Endpoint

```
Base URL: https://datapizza-production.railway.app
```

### Development Endpoint (Local)

```
Base URL: http://localhost:8001
```

---

## Endpoint Documentation

### 1. Generate Workflow

**POST** `/generate-workflow`

Generates a workflow from a natural language description.

#### Request

**Headers**:

```
Content-Type: application/json
```

**Body**:

```json
{
  "description": "Send welcome email when form is submitted, then score the lead with AI",
  "organization_id": "optional-org-id-uuid"
}
```

**Parameters**:

- `description` (string, required): Natural language workflow description
- `organization_id` (string, optional): Organization context for workflow generation

#### Response

**Success (200 OK)**:

```json
{
  "success": true,
  "elements": [
    {
      "id": "trigger-1",
      "type": "input",
      "position": { "x": 100, "y": 100 },
      "data": {
        "label": "Form Submission Trigger",
        "nodeType": "form_submit",
        "description": "Triggered when a form is submitted"
      }
    },
    {
      "id": "action-1",
      "type": "default",
      "position": { "x": 400, "y": 100 },
      "data": {
        "label": "Send Email",
        "nodeType": "send_email",
        "description": "Send welcome email to contact"
      }
    },
    {
      "id": "action-2",
      "type": "default",
      "position": { "x": 700, "y": 100 },
      "data": {
        "label": "AI Score Contact",
        "nodeType": "ai_score",
        "description": "Score the lead quality using AI"
      }
    }
  ],
  "edges": [
    {
      "id": "e-1",
      "source": "trigger-1",
      "target": "action-1",
      "animated": true,
      "style": { "stroke": "#3b82f6" }
    },
    {
      "id": "e-2",
      "source": "action-1",
      "target": "action-2",
      "animated": true,
      "style": { "stroke": "#3b82f6" }
    }
  ],
  "agent_used": "DataPizza AI Agent v2.1",
  "validation": {
    "valid": true,
    "errors": []
  },
  "suggestions": [
    "Consider adding a delay between email and scoring",
    "You might want to add a condition after AI scoring"
  ],
  "processing_time_ms": 287
}
```

**Error (4xx/5xx)**:

```json
{
  "success": false,
  "error": "Failed to analyze workflow description",
  "details": "LLM service unavailable"
}
```

#### curl Example

```bash
curl -X POST http://localhost:8001/generate-workflow \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Form submission triggers welcome email and AI scoring",
    "organization_id": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

#### TypeScript Example

```typescript
import { generateWorkflow } from './services/workflowGenerationService';

const result = await generateWorkflow(
  'Send welcome email when form is submitted',
  'org-123'
);

console.log(result.method); // 'ai' or 'fallback'
console.log(result.elements.length); // Number of nodes
console.log(result.confidence); // 0.5-0.9
```

---

### 2. Health Check

**GET** `/health`

Check if the DataPizza service is running.

#### Request

```bash
curl -X GET http://localhost:8001/health
```

#### Response

```json
{
  "status": "healthy",
  "service": "DataPizza AI Agent",
  "version": "2.1.0",
  "uptime_seconds": 3456
}
```

---

### 3. Agent Status

**GET** `/agents/status`

Get list of available AI agents and their status.

#### Request

```bash
curl -X GET http://localhost:8001/agents/status
```

#### Response

```json
{
  "connected": true,
  "agents": ["workflow-generator", "nlp-analyzer", "element-synthesizer"],
  "capabilities": [
    "workflow_generation",
    "branching_logic",
    "timing_detection",
    "action_chaining"
  ]
}
```

---

## Timeout & Fallback Behavior

### Primary: AI Generation (10s Timeout)

The CRM.AI application attempts AI generation first with a **10-second timeout**:

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => {
  controller.abort();
  console.warn('⏱️ AI request timeout (10s exceeded)');
}, 10000);

const response = await fetch(`${DATAPIZZA_BASE_URL}/generate-workflow`, {
  signal: controller.signal,
  // ... other options
});

clearTimeout(timeoutId);
```

### Fallback Trigger Conditions

The intelligent fallback generator activates when:

1. **Network Timeout** (>10s): AbortController triggers after 10 seconds
2. **Connection Refused**: DataPizza service is not running
3. **HTTP Errors**: 4xx or 5xx status codes
4. **Invalid Response**: JSON parsing errors or malformed data
5. **Service Unavailable**: Agent status returns `connected: false`

### Fallback Generator

When AI is unavailable, the system uses a **keyword-based template generator**:

**Features**:

- Italian & English keyword matching
- 6 trigger types (form, deal, contact, schedule, webhook, update)
- 8 action types (email, score, wait, deal, notify, tag, update, assign)
- Multi-action support (sequential workflows)
- Default workflow (Form → Email) if no keywords match

**Response Structure**:

```json
{
  "success": true,
  "method": "fallback",
  "confidence": 0.6,
  "elements": [...nodes],
  "edges": [...edges],
  "agent_used": "Keyword Fallback Generator",
  "suggestions": [
    "Workflow generated using keyword-based templates",
    "For better results, ensure DataPizza AI is available"
  ]
}
```

---

## Running the Agent

### Option 1: Local Development

#### Start Agent Server

```bash
cd datapizza-agent
npm install
npm start
# Agent starts on http://localhost:8001
```

#### Verify Agent is Running

```bash
curl http://localhost:8001/health
# Expected: {"status": "healthy", ...}
```

### Option 2: Production (Railway)

The agent is deployed on Railway at:

```
https://datapizza-production.railway.app
```

**Environment Variables**:

- `PORT`: 8001
- `LLM_API_KEY`: OpenAI/Anthropic API key
- `NODE_ENV`: production

---

## Troubleshooting

### Issue 1: "AI Agent Not Available"

**Symptoms**:

- Toast notification: "📋 Workflow generato con template"
- Yellow fallback warning box appears
- Workflow generated using keywords

**Diagnosis**:

```bash
# Check if agent is running
curl http://localhost:8001/health

# If no response:
# - Agent is not started
# - Wrong port (should be 8001)
# - Network firewall blocking connection
```

**Solution**:

```bash
# Start the agent locally
cd datapizza-agent
npm start

# Or use production endpoint
# Update DATAPIZZA_BASE_URL in workflowGenerationService.ts:
const DATAPIZZA_BASE_URL = 'https://datapizza-production.railway.app';
```

---

### Issue 2: "Timeout After 10 Seconds"

**Symptoms**:

- Console: `⏱️ AI request timeout (10s exceeded)`
- Fallback activates automatically
- Toast shows fallback message

**Diagnosis**:

- Agent is slow (high load, cold start, slow LLM response)
- Network latency (production endpoint far away)
- Agent stuck processing complex description

**Solutions**:

1. **Simplify Description**: Use shorter, clearer workflow descriptions
2. **Increase Timeout**: Change timeout value in `workflowGenerationService.ts`:
   ```typescript
   setTimeout(() => controller.abort(), 15000); // 15s instead of 10s
   ```
3. **Use Local Agent**: Local development agent is faster than production
4. **Check Agent Logs**: Look for errors in agent server logs

---

### Issue 3: "Invalid Workflow Response"

**Symptoms**:

- Console: `❌ AI unavailable - using intelligent fallback...`
- Fallback activates even though agent responded
- JSON parsing errors

**Diagnosis**:

- Agent returned malformed JSON
- Agent response missing required fields (`elements`, `edges`, `success`)
- API version mismatch

**Solution**:

```bash
# Check agent response format
curl -X POST http://localhost:8001/generate-workflow \
  -H "Content-Type: application/json" \
  -d '{"description": "test"}' | jq

# Ensure response includes:
# - elements: Node[]
# - edges: Edge[]
# - success: boolean
```

---

### Issue 4: "Network Error / CORS Issues"

**Symptoms**:

- Console: `fetch failed: TypeError: Failed to fetch`
- CORS policy errors in browser console
- Fallback activates immediately

**Diagnosis**:

- Agent server not configured for CORS
- Wrong endpoint URL (typo in DATAPIZZA_BASE_URL)
- Agent behind firewall/VPN

**Solution**:

```javascript
// Add CORS headers to agent server (Express example):
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
```

---

## Performance Optimization

### Best Practices

1. **Clear Descriptions**:
   - ✅ "Send email when form is submitted, then score with AI"
   - ❌ "Do something when stuff happens"

2. **Use Keywords**:
   - Include specific triggers: "form", "deal", "contact", "schedule"
   - Include specific actions: "email", "score", "wait", "notify"

3. **Avoid Complexity**:
   - Break very complex workflows into smaller workflows
   - Keep descriptions under 200 characters for best results

4. **Test Agent Connection**:
   ```typescript
   const { connected } = await testAgentConnection();
   if (!connected) {
     console.warn('Agent unavailable - fallback will be used');
   }
   ```

### Caching Strategy

The agent does **not** cache results by default. Each request is processed fresh. To add caching:

```typescript
// Simple in-memory cache (client-side)
const workflowCache = new Map<string, WorkflowGenerationResponse>();

export async function generateWorkflow(description: string) {
  const cacheKey = description.toLowerCase().trim();

  if (workflowCache.has(cacheKey)) {
    console.log('✅ Using cached workflow');
    return workflowCache.get(cacheKey)!;
  }

  const result = await generateWorkflow(description);
  workflowCache.set(cacheKey, result);
  return result;
}
```

---

## Monitoring & Analytics

### Key Metrics to Track

1. **AI Success Rate**:

   ```typescript
   const successRate = (aiCount / (aiCount + fallbackCount)) * 100;
   console.log(`AI Success Rate: ${successRate}%`);
   ```

2. **Average Response Time**:

   ```typescript
   console.log(`Processing Time: ${result.processing_time_ms}ms`);
   ```

3. **Timeout Frequency**:

   ```typescript
   if (error.name === 'AbortError') {
     analytics.track('ai_timeout');
   }
   ```

4. **Fallback Usage**:
   ```typescript
   if (result.method === 'fallback') {
     analytics.track('fallback_used', {
       confidence: result.confidence,
       elements: result.elements.length,
     });
   }
   ```

### Logging Examples

**AI Success**:

```
🤖 Attempting AI workflow generation with DataPizza...
✅ AI workflow generation successful: {
  success: true,
  elements: 5,
  edges: 4,
  processing_time: 267
}
```

**AI Timeout**:

```
🤖 Attempting AI workflow generation with DataPizza...
⏱️ AI request timeout (10s exceeded)
⏱️ AI timeout - using intelligent fallback... AbortError: The operation was aborted
🔄 Using fallback workflow generator with keyword matching...
✅ Fallback workflow generated: 4 nodes, 3 edges, confidence: 0.7
```

**AI Unavailable**:

```
🤖 Attempting AI workflow generation with DataPizza...
❌ AI unavailable - using intelligent fallback... Error: fetch failed
🔄 Using fallback workflow generator with keyword matching...
✅ Fallback workflow generated: 2 nodes, 1 edges, confidence: 0.5
```

---

## API Version Compatibility

| CRM.AI Version | DataPizza Agent Version | Compatibility           |
| -------------- | ----------------------- | ----------------------- |
| v1.0.x         | v1.x                    | ⚠️ Deprecated           |
| v2.0.x         | v2.0.x                  | ✅ Compatible           |
| v2.1.x         | v2.1.x                  | ✅ Recommended          |
| v2.1.x         | v2.0.x                  | ✅ Backward Compatible  |
| v2.0.x         | v2.1.x                  | ⚠️ Missing new features |

---

## Security Considerations

### API Key Management

If the agent requires authentication:

```typescript
// Add Authorization header
const response = await fetch(`${DATAPIZZA_BASE_URL}/generate-workflow`, {
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.DATAPIZZA_API_KEY}`,
  },
  // ... other options
});
```

### Rate Limiting

The agent may implement rate limiting:

- Default: 100 requests/hour per IP
- Authenticated: 1000 requests/hour per API key

**Error Response**:

```json
{
  "error": "Rate limit exceeded",
  "retry_after_seconds": 3600
}
```

### Input Validation

The agent validates:

- Description length: 1-1000 characters
- No SQL injection patterns
- No malicious code patterns
- Valid organization_id format (UUID)

---

## Contact & Support

**Agent Maintainer**: DataPizza Development Team  
**Documentation**: https://datapizza.dev/docs  
**Support**: support@datapizza.dev  
**Status Page**: https://status.datapizza.dev

---

## Changelog

### v2.1.0 (Current)

- ✅ Added 10-second timeout with AbortController
- ✅ Intelligent keyword-based fallback system
- ✅ Method tracking (`ai` vs `fallback`)
- ✅ Confidence scoring (0.5-0.9)
- ✅ Italian & English keyword support
- ✅ Multi-action detection
- ✅ UI transparency (toast + warning box)

### v2.0.0

- Initial AI-powered workflow generation
- Basic error handling
- Element and edge generation
- Validation system

### v1.0.0 (Deprecated)

- Basic template-based generation
- No AI integration

---

**Last Updated**: 2025-01-XX  
**Status**: ✅ Production Ready  
**Agent Version**: v2.1.0
