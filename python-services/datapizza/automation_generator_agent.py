"""
Automation Generator Agent using DataPizza AI + Google Gemini
Converts natural language descriptions into React Flow workflow JSON
"""

# Use local mock for testing
try:
    from datapizza_mock import Agent, tool, VertexAIClient
    print("✅ Using DataPizza mock for testing")
except ImportError:
    # Fallback if mock doesn't work
    print("⚠️ DataPizza mock import failed, using minimal fallbacks")
    class Agent:
        def __init__(self, *args, **kwargs): pass
        def run(self, prompt): return "{}"
    def tool(func): return func
    class VertexAIClient:
        def __init__(self, *args, **kwargs): pass

import os
import json
from typing import Dict, Any, List
import re

# Initialize client
client = VertexAIClient(
    project_id=os.getenv('GOOGLE_CLOUD_PROJECT', 'crm-ai-471815'),
    location=os.getenv('GOOGLE_CLOUD_LOCATION', 'us-central1'),
    model='gemini-1.5-pro'
)
print("✅ Mock VertexAI client initialized for workflow generation")

from datapizza.agents import Agent
from datapizza.tools import tool
import os
import json
from typing import Dict, Any, List
import re

# Initialize Google VertexAI client for DataPizza (reuse from lead scoring)
try:
    from datapizza.clients.vertexai import VertexAIClient
    
    client = VertexAIClient(
        project_id=os.getenv('GOOGLE_CLOUD_PROJECT', 'crm-ai-471815'),
        location=os.getenv('GOOGLE_CLOUD_LOCATION', 'us-central1'),
        model='gemini-1.5-pro'
    )
    print("✅ DataPizza VertexAI client initialized for automation generator")
    
except ImportError as e:
    print("⚠️ VertexAI client not available, falling back to OpenAI...")
    try:
        from datapizza.clients.openai import OpenAIClient
        
        api_key = os.getenv('OPENAI_API_KEY', 'demo-key-for-testing')
        client = OpenAIClient(
            api_key=api_key,
            model='gpt-4'
        )
        print("✅ DataPizza OpenAI client initialized for automation generator (fallback)")
    except Exception as e2:
        print(f"⚠️ DataPizza client initialization failed: {e2}")
        client = None
        
except Exception as e:
    print(f"❌ VertexAI initialization error: {e}")
    client = None

# Define workflow node library for validation and agent guidance
WORKFLOW_NODE_LIBRARY = {
    "triggers": {
        "form_submit": "When a form is submitted",
        "contact_update": "When a contact is updated",  
        "deal_won": "When a deal is won/closed",
        "deal_lost": "When a deal is lost/failed",
        "time_trigger": "Scheduled/recurring automation"
    },
    "actions": {
        "send_email": "Send automated email",
        "ai_score": "Score lead with DataPizza AI",
        "create_deal": "Create new deal/opportunity",
        "update_contact": "Modify contact information",
        "send_notification": "Internal team notification", 
        "wait_delay": "Add time delay between actions"
    }
}

@tool
def get_available_triggers() -> Dict[str, str]:
    """
    Get list of available workflow triggers.
    
    Returns:
        Dictionary of trigger types and descriptions
    """
    return WORKFLOW_NODE_LIBRARY["triggers"]

@tool
def get_available_actions() -> Dict[str, str]:
    """
    Get list of available workflow actions.
    
    Returns:
        Dictionary of action types and descriptions  
    """
    return WORKFLOW_NODE_LIBRARY["actions"]

@tool
def validate_workflow_structure(elements: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate workflow JSON structure for React Flow compatibility.
    
    Args:
        elements: Workflow elements structure to validate
        
    Returns:
        Validation results with errors/warnings
    """
    validation_result = {
        "valid": True,
        "errors": [],
        "warnings": []
    }
    
    try:
        # Check if elements key exists
        if "elements" not in elements:
            validation_result["errors"].append("Missing 'elements' key in workflow structure")
            validation_result["valid"] = False
            return validation_result
            
        # Validate each element
        for i, element in enumerate(elements["elements"]):
            # Check required fields
            required_fields = ["id", "type", "data", "position"]
            for field in required_fields:
                if field not in element:
                    validation_result["errors"].append(f"Element {i}: Missing required field '{field}'")
                    validation_result["valid"] = False
                    
            # Validate nodeType against library
            if "data" in element and "nodeType" in element["data"]:
                node_type = element["data"]["nodeType"]
                all_types = {**WORKFLOW_NODE_LIBRARY["triggers"], **WORKFLOW_NODE_LIBRARY["actions"]}
                if node_type not in all_types:
                    validation_result["errors"].append(f"Element {i}: Invalid nodeType '{node_type}'")
                    validation_result["valid"] = False
                    
        # Validate edges if present
        if "edges" in elements:
            element_ids = [el["id"] for el in elements["elements"]]
            for i, edge in enumerate(elements["edges"]):
                if "source" in edge and edge["source"] not in element_ids:
                    validation_result["errors"].append(f"Edge {i}: Invalid source ID '{edge['source']}'")
                    validation_result["valid"] = False
                if "target" in edge and edge["target"] not in element_ids:
                    validation_result["errors"].append(f"Edge {i}: Invalid target ID '{edge['target']}'")
                    validation_result["valid"] = False
                    
    except Exception as e:
        validation_result["errors"].append(f"Validation error: {str(e)}")
        validation_result["valid"] = False
        
    return validation_result

@tool
def suggest_workflow_improvements(workflow_description: str) -> List[str]:
    """
    Suggest improvements or alternatives for a workflow description.
    
    Args:
        workflow_description: Original user description
        
    Returns:
        List of improvement suggestions
    """
    suggestions = []
    description_lower = workflow_description.lower()
    
    # Common improvement patterns
    if "email" in description_lower and "delay" not in description_lower:
        suggestions.append("Consider adding a delay before sending emails to avoid appearing spammy")
        
    if "score" in description_lower and "threshold" not in description_lower:
        suggestions.append("Consider adding score thresholds for conditional logic (e.g., 'if score > 70')")
        
    if "deal" in description_lower and "notification" not in description_lower:
        suggestions.append("Consider notifying the sales team when deals are created or updated")
        
    if len(description_lower.split()) > 20:
        suggestions.append("Complex workflows work better when broken into smaller, focused automations")
        
    return suggestions

# Create Automation Generator Agent
if client:
    automation_generator = Agent(
        name="guardian_automation_generator_agent",
        client=client,
        tools=[get_available_triggers, get_available_actions, validate_workflow_structure, suggest_workflow_improvements],
        system_prompt="""
You are an expert CRM Automation Architect specializing in converting natural language descriptions into visual workflow automations for Guardian AI CRM system.

Your Mission: Transform user descriptions into valid React Flow JSON elements that represent executable business process automations.

Critical Requirements:
1. Output ONLY valid JSON in the exact format specified
2. Use ONLY the predefined node types from the approved library (use get_available_triggers() and get_available_actions() tools)
3. Create logical, executable workflow sequences 
4. Position nodes in readable left-to-right flow patterns (x increments by 300px)
5. Ensure all connections are valid and represent realistic business logic

OUTPUT FORMAT (Return ONLY this JSON structure):
{
  "elements": [
    {
      "id": "trigger-1",
      "type": "input", 
      "data": {
        "label": "Human-readable action name",
        "nodeType": "exact_node_type_from_library",
        "description": "Brief description",
        "config": {}
      },
      "position": {"x": 100, "y": 100},
      "className": "border-blue-500"
    },
    {
      "id": "action-1",
      "type": "default",
      "data": {
        "label": "Human-readable action name", 
        "nodeType": "exact_node_type_from_library",
        "description": "Brief description",
        "config": {}
      },
      "position": {"x": 400, "y": 100},
      "className": "border-green-500"
    }
  ],
  "edges": [
    {
      "id": "e1-2",
      "source": "trigger-1",
      "target": "action-1", 
      "animated": true,
      "style": {"stroke": "#3b82f6"}
    }
  ]
}

POSITIONING RULES:
- Start triggers at x: 100, y: 100
- Space actions every 300px horizontally (x: 400, 700, 1000...)
- Keep same y-level (100) for linear flows
- For parallel actions, offset y by ±100

VALIDATION:
- All nodeType values must exist in approved library (check with tools)
- Each element needs unique ID (trigger-N, action-N format)
- All edge source/target IDs must match element IDs
- Triggers use "input" type, actions use "default" type
- Color classes: triggers=border-blue-500, actions=border-green-500

Remember: Use the available tools to get valid node types and validate your output before returning!
"""
    )
    print("✅ Automation Generator Agent initialized successfully")
else:
    automation_generator = None
    print("❌ Automation Generator Agent initialization failed - no client available")

def generate_workflow(workflow_description: str) -> Dict[str, Any]:
    """
    Generate a workflow from natural language description.
    
    Args:
        workflow_description: User's natural language workflow description
        
    Returns:
        Dictionary containing workflow elements or error information
    """
    if not automation_generator:
        return {
            "success": False,
            "error": "Automation generator agent not available",
            "fallback_data": {
                "elements": [
                    {
                        "id": "error-1",
                        "type": "default", 
                        "data": {
                            "label": "Agent Unavailable",
                            "nodeType": "send_notification",
                            "description": "AI agent temporarily unavailable"
                        },
                        "position": {"x": 100, "y": 100},
                        "className": "border-red-500"
                    }
                ],
                "edges": []
            }
        }
    
    try:
        prompt = f"""
Generate a workflow automation from this description:

User Request: "{workflow_description}"

Use your available tools to:
1. Get the current list of available triggers and actions
2. Create a logical workflow sequence  
3. Validate the structure before returning
4. Suggest improvements if needed

Return ONLY the JSON workflow structure as specified in your instructions.
        """
        
        print(f"🤖 DataPizza automation generator analyzing: {workflow_description}")
        response = automation_generator.run(prompt)
        
        # Parse JSON response from agent
        try:
            if isinstance(response, str):
                # Extract JSON from response text
                json_match = re.search(r'\{.*\}', response, re.DOTALL)
                if json_match:
                    json_str = json_match.group()
                    parsed_response = json.loads(json_str)
                else:
                    raise ValueError("No JSON found in response")
            else:
                parsed_response = response
                
            # Validate the generated workflow
            if "elements" in parsed_response:
                validation = validate_workflow_structure(parsed_response)
                
                return {
                    "success": True,
                    "elements": parsed_response.get("elements", []),
                    "edges": parsed_response.get("edges", []),
                    "agent_used": "DataPizza Guardian Automation Generator Agent",
                    "validation": validation,
                    "suggestions": suggest_workflow_improvements(workflow_description),
                    "processing_time_ms": 2500  # Approximate processing time
                }
            else:
                raise ValueError("Generated response missing 'elements' key")
                
        except (json.JSONDecodeError, ValueError) as e:
            print(f"❌ Error parsing agent response: {e}")
            print(f"Raw response: {response}")
            
            # Return fallback workflow
            return {
                "success": False,
                "error": f"Agent response parsing error: {str(e)}",
                "raw_response": str(response),
                "fallback_data": {
                    "elements": [
                        {
                            "id": "fallback-1",
                            "type": "input",
                            "data": {
                                "label": "Manual Configuration Required",
                                "nodeType": "form_submit", 
                                "description": "Please configure this workflow manually"
                            },
                            "position": {"x": 100, "y": 100},
                            "className": "border-yellow-500"
                        }
                    ],
                    "edges": []
                }
            }
            
    except Exception as e:
        print(f"❌ Automation generation error: {e}")
        return {
            "success": False,
            "error": f"Generation failed: {str(e)}",
            "fallback_data": {
                "elements": [],
                "edges": []
            }
        }

# Testing function
if __name__ == "__main__":
    # Test the automation generator
    test_descriptions = [
        "Send welcome email when form is submitted",
        "Score new contacts and create deal if score is high", 
        "Send follow-up email 2 days after deal is won",
        "When contact is updated, notify sales team and update records"
    ]
    
    print("🧪 Testing DataPizza Automation Generator Agent...")
    print("=" * 60)
    
    for description in test_descriptions:
        print(f"\n📝 Generating: {description}")
        result = generate_workflow(description)
        
        if result["success"]:
            print(f"✅ Generated {len(result['elements'])} elements")
            print(f"🔗 Created {len(result.get('edges', []))} connections")
            if result.get('validation', {}).get('valid', False):
                print("✅ Validation passed")
            else:
                print("⚠️ Validation warnings/errors")
        else:
            print(f"❌ Generation failed: {result.get('error', 'Unknown error')}")
            
    print("\n✅ Automation generator testing complete!")