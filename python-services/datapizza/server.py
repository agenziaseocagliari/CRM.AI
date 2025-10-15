"""
DataPizza Agent API Server
FastAPI server exposing CRM AI agents with fallback system
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import uvicorn
import time
from datetime import datetime

# Import our DataPizza lead scoring agent
from lead_scoring_agent import score_lead

app = FastAPI(
    title="Guardian CRM DataPizza Agents",
    description="AI Agent orchestration for Guardian AI CRM using DataPizza framework",
    version="1.0.0"
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",          # Vite dev server
        "http://localhost:3000",          # React dev server  
        "https://crm-ai-rho.vercel.app",  # Production frontend
        "https://*.vercel.app"            # All Vercel deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class ContactData(BaseModel):
    name: str = Field(..., description="Contact's full name")
    email: str = Field(..., description="Contact's email address") 
    company: Optional[str] = Field(None, description="Company name")
    phone: Optional[str] = Field(None, description="Phone number")
    organization_id: Optional[str] = Field(None, description="CRM organization ID")

class ScoringResponse(BaseModel):
    score: int = Field(..., ge=0, le=100, description="Lead score from 0-100")
    category: str = Field(..., description="Score category: hot, warm, or cold")
    reasoning: str = Field(..., description="AI explanation of the score")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence level")
    agent_used: str = Field(..., description="Which agent/algorithm was used")
    breakdown: Dict[str, int] = Field(..., description="Score breakdown by category")
    tools_available: list[str] = Field(..., description="Tools used by the agent")
    processing_time_ms: int = Field(..., description="Processing time in milliseconds")
    model_used: Optional[str] = Field(None, description="AI model used")
    timestamp: str = Field(..., description="When the scoring was performed")

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: str
    datapizza_available: bool
    fallback_available: bool

class AgentStatusResponse(BaseModel):
    agents: list[str]
    models: list[str] 
    tools: list[str]
    status: str

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint to verify service status
    """
    return HealthResponse(
        status="healthy",
        service="datapizza-agents",
        version="1.0.0",
        timestamp=datetime.now().isoformat(),
        datapizza_available=True,  # Will be updated based on actual tests
        fallback_available=True
    )

# Lead scoring endpoint  
@app.post("/score-lead", response_model=ScoringResponse)
async def score_lead_endpoint(contact: ContactData):
    """
    Score a lead using DataPizza AI agent with fallback system
    
    Args:
        contact: Contact information to analyze
        
    Returns:
        Detailed scoring analysis with reasoning and breakdown
        
    Raises:
        HTTPException: If scoring fails completely
    """
    try:
        start_time = time.time()
        
        # Convert Pydantic model to dict for processing
        contact_dict = {
            "name": contact.name,
            "email": contact.email, 
            "company": contact.company or "",
            "phone": contact.phone or "",
            "organization_id": contact.organization_id or ""
        }
        
        # Call our DataPizza scoring function
        result = score_lead(contact_dict)
        
        # Calculate processing time
        processing_time_ms = int((time.time() - start_time) * 1000)
        
        # Update result with timing
        result["processing_time_ms"] = processing_time_ms
        result["timestamp"] = datetime.now().isoformat()
        
        # Ensure all required fields are present
        if "tools_available" not in result:
            result["tools_available"] = []
            
        return ScoringResponse(**result)
        
    except Exception as e:
        # Log error and return HTTP exception
        error_msg = f"Lead scoring failed: {str(e)}"
        print(f"❌ API Error: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

# Contact analysis endpoint (extended scoring)
@app.post("/analyze-contact")
async def analyze_contact_endpoint(contact: ContactData):
    """
    Perform extended contact analysis (uses same agent as scoring for MVP)
    """
    try:
        # For MVP, this uses the same scoring logic
        # In production, this could use a different agent for deeper analysis
        scoring_result = await score_lead_endpoint(contact)
        
        # Add analysis-specific metadata
        analysis_result = scoring_result.dict()
        analysis_result.update({
            "analysis_type": "extended_contact_profile",
            "recommendations": [
                f"Contact category: {scoring_result.category}",
                f"Suggested next action: {'Immediate outreach' if scoring_result.score >= 80 else 'Nurture campaign' if scoring_result.score >= 50 else 'Long-term follow-up'}",
                f"Best contact method: {'Phone' if contact.phone else 'Email'}"
            ]
        })
        
        return analysis_result
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        error_msg = f"Contact analysis failed: {str(e)}"
        print(f"❌ Analysis Error: {error_msg}")
        raise HTTPException(status_code=500, detail=error_msg)

# Agent status endpoint
@app.get("/agents/status", response_model=AgentStatusResponse)
async def get_agent_status():
    """
    Get status of available agents and tools
    """
    return AgentStatusResponse(
        agents=["guardian_lead_scoring_agent"],
        models=["gpt-4", "fallback_algorithm"],
        tools=["get_contact_history", "get_company_info", "analyze_email_quality"],
        status="operational"
    )

# Root endpoint
@app.get("/")
async def root():
    """
    Root endpoint with service information
    """
    return {
        "service": "Guardian CRM DataPizza Agents",
        "version": "1.0.0", 
        "status": "operational",
        "endpoints": {
            "health": "/health",
            "score_lead": "/score-lead",
            "analyze_contact": "/analyze-contact",
            "agent_status": "/agents/status"
        },
        "documentation": "/docs"
    }

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {"error": "Endpoint not found", "available_endpoints": ["/health", "/score-lead", "/analyze-contact", "/agents/status"]}

@app.exception_handler(500) 
async def internal_error_handler(request, exc):
    return {"error": "Internal server error", "message": "Please check logs for details"}

if __name__ == "__main__":
    print("🚀 Starting Guardian CRM DataPizza Agent Server...")
    print("📍 Server will be available at: http://localhost:8001")
    print("📖 API Documentation: http://localhost:8001/docs")
    print("❤️ Health Check: http://localhost:8001/health")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8001,
        log_level="info",
        reload=False  # Set to True for development
    )