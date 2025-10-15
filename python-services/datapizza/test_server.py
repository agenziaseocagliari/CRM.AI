"""
Simple FastAPI Server for Testing Workflow Generation
Standalone version without DataPizza framework dependencies
"""

import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import uvicorn

app = FastAPI(
    title="Guardian CRM Workflow Generator",
    description="AI Workflow generation for Guardian AI CRM - Test Server",
    version="1.0.0"
)

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",          # Vite dev server
        "http://localhost:3000",          # React dev server  
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response models
class WorkflowGenerationRequest(BaseModel):
    description: str = Field(..., description="Natural language description of the workflow")
    organization_id: str = Field(..., description="Organization ID for context")

class WorkflowElement(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]

class WorkflowGenerationResponse(BaseModel):
    success: bool
    elements: Optional[WorkflowElement]
    suggestions: List[str]
    agent_status: str
    error: Optional[str] = None

def generate_mock_workflow(description: str) -> Dict[str, Any]:
    """Generate a mock workflow based on description keywords"""
    
    # Analyze description for common workflow patterns
    desc_lower = description.lower()
    
    nodes = []
    edges = []
    
    # Start with a trigger based on description
    if "form" in desc_lower or "submit" in desc_lower:
        trigger_type = "form_submit"
        trigger_label = "Form Submission"
        trigger_desc = "Triggered when form is submitted"
    elif "deal" in desc_lower and "won" in desc_lower:
        trigger_type = "deal_won"
        trigger_label = "Deal Won"
        trigger_desc = "Triggered when deal is marked as won"
    elif "time" in desc_lower or "schedule" in desc_lower or "monday" in desc_lower:
        trigger_type = "time_trigger" 
        trigger_label = "Scheduled Trigger"
        trigger_desc = "Time-based trigger"
    else:
        trigger_type = "form_submit"
        trigger_label = "Form Submission" 
        trigger_desc = "General workflow trigger"
    
    # Add trigger node
    nodes.append({
        "id": "trigger_1",
        "type": "input",
        "data": {
            "label": trigger_label,
            "nodeType": trigger_type,
            "description": trigger_desc
        },
        "position": {"x": 100, "y": 100},
        "className": "border-blue-500"
    })
    
    node_count = 1
    last_node_id = "trigger_1"
    x_pos = 350
    
    # Add actions based on description keywords
    if "score" in desc_lower or "ai" in desc_lower:
        node_count += 1
        action_id = f"action_{node_count}"
        nodes.append({
            "id": action_id,
            "type": "default",
            "data": {
                "label": "AI Score Contact",
                "nodeType": "ai_score",
                "description": "Score lead quality with AI"
            },
            "position": {"x": x_pos, "y": 100},
            "className": "border-green-500"
        })
        edges.append({
            "id": f"edge_{len(edges) + 1}",
            "source": last_node_id,
            "target": action_id,
            "animated": True,
            "style": {"stroke": "#3b82f6"}
        })
        last_node_id = action_id
        x_pos += 250
    
    if "email" in desc_lower or "send" in desc_lower:
        node_count += 1
        action_id = f"action_{node_count}"
        
        if "welcome" in desc_lower:
            email_label = "Send Welcome Email"
        elif "thank" in desc_lower:
            email_label = "Send Thank You Email"
        else:
            email_label = "Send Email"
            
        nodes.append({
            "id": action_id,
            "type": "default",
            "data": {
                "label": email_label,
                "nodeType": "send_email",
                "description": "Send personalized email"
            },
            "position": {"x": x_pos, "y": 100},
            "className": "border-green-500"
        })
        edges.append({
            "id": f"edge_{len(edges) + 1}",
            "source": last_node_id,
            "target": action_id,
            "animated": True,
            "style": {"stroke": "#3b82f6"}
        })
        last_node_id = action_id
        x_pos += 250
    
    if "deal" in desc_lower and "create" in desc_lower:
        node_count += 1
        action_id = f"action_{node_count}"
        nodes.append({
            "id": action_id,
            "type": "default",
            "data": {
                "label": "Create Deal",
                "nodeType": "create_deal",
                "description": "Create new sales opportunity"
            },
            "position": {"x": x_pos, "y": 100},
            "className": "border-green-500"
        })
        edges.append({
            "id": f"edge_{len(edges) + 1}",
            "source": last_node_id,
            "target": action_id,
            "animated": True,
            "style": {"stroke": "#3b82f6"}
        })
        last_node_id = action_id
        x_pos += 250
    
    if "update" in desc_lower and "contact" in desc_lower:
        node_count += 1
        action_id = f"action_{node_count}"
        nodes.append({
            "id": action_id,
            "type": "default",
            "data": {
                "label": "Update Contact",
                "nodeType": "update_contact",
                "description": "Update contact information"
            },
            "position": {"x": x_pos, "y": 100},
            "className": "border-green-500"
        })
        edges.append({
            "id": f"edge_{len(edges) + 1}",
            "source": last_node_id,
            "target": action_id,
            "animated": True,
            "style": {"stroke": "#3b82f6"}
        })
        last_node_id = action_id
        x_pos += 250
        
    if "wait" in desc_lower or "delay" in desc_lower:
        node_count += 1
        action_id = f"action_{node_count}"
        nodes.append({
            "id": action_id,
            "type": "default",
            "data": {
                "label": "Wait Delay",
                "nodeType": "wait_delay",
                "description": "Wait for specified time period"
            },
            "position": {"x": x_pos, "y": 100},
            "className": "border-orange-500"
        })
        edges.append({
            "id": f"edge_{len(edges) + 1}",
            "source": last_node_id,
            "target": action_id,
            "animated": True,
            "style": {"stroke": "#3b82f6"}
        })
        last_node_id = action_id
        x_pos += 250

    # Generate suggestions based on the workflow
    suggestions = []
    if "score" in desc_lower:
        suggestions.append("Consider adding conditions based on AI score thresholds")
    if "email" in desc_lower:
        suggestions.append("You might want to personalize the email content based on contact data")
    if len(nodes) == 1:
        suggestions.append("This workflow is quite simple - consider adding more automation steps")
    suggestions.append("Test the workflow with sample data before activating")
    
    return {
        "nodes": nodes,
        "edges": edges,
        "suggestions": suggestions
    }

@app.get("/")
async def root():
    return {"message": "Guardian CRM Workflow Generator API", "status": "active"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": "2025-01-25T12:00:00Z"}

@app.get("/agent-status")
async def agent_status():
    return {
        "automation_generator": "active",
        "server_status": "running"
    }

@app.post("/generate-workflow", response_model=WorkflowGenerationResponse)
async def generate_workflow_endpoint(request: WorkflowGenerationRequest):
    try:
        print(f"🎯 Generating workflow: {request.description[:100]}...")
        
        # Validate input
        if not request.description.strip():
            return WorkflowGenerationResponse(
                success=False,
                elements=None,
                suggestions=["Please provide a clear description of your workflow needs"],
                agent_status="active",
                error="Description cannot be empty"
            )
        
        # Generate mock workflow
        workflow_data = generate_mock_workflow(request.description)
        
        # Return successful response
        return WorkflowGenerationResponse(
            success=True,
            elements=WorkflowElement(
                nodes=workflow_data["nodes"],
                edges=workflow_data["edges"]
            ),
            suggestions=workflow_data["suggestions"],
            agent_status="active"
        )
        
    except Exception as e:
        print(f"❌ Workflow generation error: {e}")
        
        # Return error with fallback workflow
        fallback_workflow = {
            "nodes": [{
                "id": "fallback_1",
                "type": "input",
                "data": {
                    "label": "Manual Trigger",
                    "nodeType": "form_submit",
                    "description": "Fallback workflow - please customize manually"
                },
                "position": {"x": 100, "y": 100},
                "className": "border-blue-500"
            }],
            "edges": []
        }
        
        return WorkflowGenerationResponse(
            success=False,
            elements=WorkflowElement(
                nodes=fallback_workflow["nodes"],
                edges=fallback_workflow["edges"]
            ),
            suggestions=["An error occurred during generation. Please try again or create workflow manually."],
            agent_status="active",
            error=str(e)
        )

if __name__ == "__main__":
    print("🚀 Starting Guardian CRM Workflow Generator Test Server...")
    print("📍 Server will be available at: http://localhost:8001")
    print("📖 API Documentation: http://localhost:8001/docs")
    print("❤️ Health Check: http://localhost:8001/health")
    
    uvicorn.run(app, host="0.0.0.0", port=8001)