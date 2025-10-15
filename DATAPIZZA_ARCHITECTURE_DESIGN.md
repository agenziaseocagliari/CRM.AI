# DataPizza Integration Architecture Design

## 🎯 INTEGRATION CHALLENGE & SOLUTION

### Challenge Analysis

- **DataPizza**: Python framework for AI agent orchestration
- **Guardian CRM**: TypeScript/React application with existing Google Gemini AI
- **Need**: Seamless integration without disrupting current functionality

### Recommended Solution: **OPTION A - Python Backend Service**

**Architecture Pattern**: Microservice Integration with Fallback System

## 📐 ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    GUARDIAN AI CRM (React/TypeScript)           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌──────────────┐ │
│  │ Contact Detail  │    │ Lead Scoring    │    │ AI Agents    │ │
│  │ Modal           │    │ Dashboard       │    │ Panel        │ │
│  └─────────────────┘    └─────────────────┘    └──────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                      API CLIENT LAYER                          │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  dataPizzaClient.ts (TypeScript)                            │ │
│  │  ┌─────────────────┐  ┌─────────────────┐                  │ │
│  │  │ scoreLead()     │  │ Fallback to     │                  │ │
│  │  │ analyzeContact()│  │ existing AI     │                  │ │
│  │  │ generateInsights│  │ if DataPizza    │                  │ │
│  │  │                 │  │ unavailable     │                  │ │
│  │  └─────────────────┘  └─────────────────┘                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                    │ HTTP
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│               DATAPIZZA PYTHON SERVICE                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                   FastAPI Server                            │ │
│  │  ┌─────────────────┐  ┌─────────────────┐                  │ │
│  │  │ /score-lead     │  │ /analyze-contact│                  │ │
│  │  │ /health         │  │ /generate-insights                │ │
│  │  └─────────────────┘  └─────────────────┘                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                  DATAPIZZA AGENT LAYER                         │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  lead_scoring_agent.py                                      │ │
│  │  ┌─────────────────┐  ┌─────────────────┐                  │ │
│  │  │ @tool           │  │ @tool           │                  │ │
│  │  │ get_contact_    │  │ get_company_    │                  │ │
│  │  │ history()       │  │ info()          │                  │ │
│  │  └─────────────────┘  └─────────────────┘                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GOOGLE VERTEXAI                              │
│               (Gemini Models via DataPizza)                    │
└─────────────────────────────────────────────────────────────────┘
```

## 🏗️ IMPLEMENTATION PLAN

### Phase 1: Python Service Foundation

1. **Environment Setup**: `python-services/datapizza/` directory
2. **Virtual Environment**: Isolated Python environment with DataPizza
3. **FastAPI Server**: REST API exposing DataPizza agents
4. **Health Monitoring**: Service availability checking

### Phase 2: DataPizza Agent Creation

1. **Lead Scoring Agent**: Replace basic scoring with structured agent
2. **Custom Tools**: CRM-specific tools for Supabase data access
3. **VertexAI Client**: Use Google VertexAI (not OpenAI) for consistency
4. **Structured Output**: JSON responses for TypeScript integration

### Phase 3: TypeScript Integration

1. **Service Client**: `dataPizzaClient.ts` with error handling
2. **Fallback System**: Graceful degradation to existing AI service
3. **UI Components**: Enhanced AI scoring buttons and displays
4. **Type Safety**: Full TypeScript interfaces for all responses

### Phase 4: Production Deployment

1. **Containerization**: Docker container for Python service
2. **Environment Variables**: Secure credential management
3. **Health Checks**: Production monitoring and alerting
4. **Scaling**: Auto-scaling based on usage patterns

## 📂 FILE STRUCTURE

```
/workspaces/CRM.AI/
├── python-services/
│   └── datapizza/
│       ├── venv/                     # Python virtual environment
│       ├── requirements.txt          # DataPizza + dependencies
│       ├── server.py                 # FastAPI application
│       ├── lead_scoring_agent.py     # Main scoring agent
│       ├── tools.py                  # CRM custom tools
│       ├── config.py                 # Environment configuration
│       └── __init__.py
├── src/
│   ├── services/
│   │   └── datapizzaClient.ts        # TypeScript API client
│   ├── lib/ai/
│   │   └── enhancedAIService.ts      # Existing service (fallback)
│   └── components/
│       └── contacts/
│           └── ContactDetailModal.tsx # Updated with AI scoring
└── README_DATAPIZZA.md               # Integration documentation
```

## 🔌 API CONTRACT

### TypeScript → Python Service

```typescript
// Request Interface
interface ContactScoringRequest {
  contact: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    organization_id: string;
  };
  context?: {
    interaction_history?: any[];
    previous_scores?: number[];
  };
}

// Response Interface
interface DataPizzaResponse {
  score: number; // 0-100 lead score
  category: 'hot' | 'warm' | 'cold'; // Score category
  reasoning: string; // AI explanation
  confidence: number; // 0-1 confidence level
  agent_used: string; // "datapizza_gemini"
  tools_used: string[]; // ["get_contact_history", "get_company_info"]
  processing_time_ms: number; // Performance metric
}
```

### Python Service Endpoints

```python
# Health Check
GET /health
Response: {"status": "healthy", "service": "datapizza-agents"}

# Lead Scoring
POST /score-lead
Request: ContactScoringRequest
Response: DataPizzaResponse

# Contact Analysis
POST /analyze-contact
Request: ContactScoringRequest
Response: DataPizzaResponse + additional insights

# Agent Status
GET /agents/status
Response: {"agents": ["lead_scorer"], "models": ["gemini-1.5-pro"]}
```

## 🔄 INTEGRATION BENEFITS

### 1. **Enhanced AI Orchestration**

- **Before**: Custom agent management in TypeScript
- **After**: DataPizza's robust agent framework with tool system

### 2. **Better Tool Integration**

- **Before**: Direct API calls mixed with AI logic
- **After**: Structured tools with clear separation of concerns

### 3. **Improved Debugging**

- **Before**: Custom logging and error handling
- **After**: DataPizza's built-in tracing and monitoring

### 4. **Scalable Architecture**

- **Before**: Single AI service handling all requests
- **After**: Specialized agents with load balancing capability

### 5. **Production Reliability**

- **Before**: Single point of failure
- **After**: Fallback system + health monitoring + auto-recovery

## ⚡ FALLBACK STRATEGY

### Graceful Degradation System

```typescript
async function scoreLead(contact: ContactData): Promise<ScoringResult> {
  try {
    // Try DataPizza service first
    const dataPizzaResult = await dataPizzaClient.scoreLead(contact);
    console.log('✅ DataPizza AI scoring successful');
    return dataPizzaResult;
  } catch (error) {
    console.warn('⚠️ DataPizza unavailable, using fallback:', error);

    // Fallback to existing Google Gemini service
    const fallbackResult = await enhancedAIService.processAIRequest({
      organizationId: contact.organization_id,
      actionType: 'lead_scoring',
      input: contact,
    });

    return {
      score: extractScore(fallbackResult),
      category: categorizeScore(score),
      reasoning: 'Scored using backup AI system',
      agent_used: 'fallback_gemini',
    };
  }
}
```

## 🚀 DEPLOYMENT OPTIONS

### Development Environment

- **Local Development**: Python service on `localhost:8001`
- **React Dev Server**: `localhost:5173` calling Python service
- **Environment Variable**: `VITE_DATAPIZZA_API_URL=http://localhost:8001`

### Production Environment

#### Option A: Railway/Render (Recommended)

- **Python Service**: Deploy to Railway with auto-scaling
- **Environment Variables**: Set in Vercel pointing to Railway URL
- **Benefits**: Simple deployment, automatic SSL, health monitoring

#### Option B: Docker Container

- **Containerization**: Docker image with DataPizza + FastAPI
- **Deployment**: Deploy container to cloud provider
- **Benefits**: Consistent environment, easy scaling

#### Option C: Serverless (Advanced)

- **Function Deployment**: AWS Lambda or Google Cloud Functions
- **Cold Start**: Manage DataPizza initialization time
- **Benefits**: Pay-per-use, automatic scaling

## ⏱️ IMPLEMENTATION TIMELINE

### Phase 1: Foundation (30 min)

- Python environment setup
- DataPizza installation
- Basic FastAPI server
- Health check endpoint

### Phase 2: Agent Development (45 min)

- Lead scoring agent creation
- CRM tools implementation
- VertexAI client setup
- Testing and validation

### Phase 3: Integration (30 min)

- TypeScript client creation
- UI component updates
- Fallback system implementation
- End-to-end testing

### Phase 4: Production Prep (20 min)

- Deployment configuration
- Environment variable setup
- Documentation completion
- Performance verification

**Total Estimated Time**: 2 hours 5 minutes

---

**Architecture Status**: ✅ DESIGNED - Ready for implementation  
**Next Phase**: Begin Python environment setup and DataPizza installation  
**Risk Level**: LOW - Fallback system ensures zero downtime
