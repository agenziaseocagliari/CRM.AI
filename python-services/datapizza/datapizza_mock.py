"""
Simple DataPizza Framework Mock for Testing
"""

import json
from typing import Dict, Any, List, Callable
import os

# Mock DataPizza classes
class VertexAIClient:
    def __init__(self, project_id: str, location: str, model: str):
        self.project_id = project_id
        self.location = location
        self.model = model
        print(f"Mock VertexAI Client initialized: {project_id}/{location}/{model}")
    
    def generate_text(self, prompt: str, **kwargs) -> str:
        # Return a mock workflow response for testing
        return '''{
  "nodes": [
    {
      "id": "trigger_1",
      "type": "input",
      "data": {
        "label": "Form Submission",
        "nodeType": "form_submit",
        "description": "Triggers when contact form is submitted"
      },
      "position": {"x": 100, "y": 100},
      "className": "border-blue-500"
    },
    {
      "id": "action_1",
      "type": "default",
      "data": {
        "label": "AI Score Contact",
        "nodeType": "ai_score",
        "description": "Score lead quality with DataPizza AI"
      },
      "position": {"x": 350, "y": 100},
      "className": "border-green-500"
    },
    {
      "id": "action_2",
      "type": "default",
      "data": {
        "label": "Send Welcome Email",
        "nodeType": "send_email",
        "description": "Send personalized welcome email to new lead"
      },
      "position": {"x": 600, "y": 100},
      "className": "border-green-500"
    }
  ],
  "edges": [
    {
      "id": "edge_1",
      "source": "trigger_1",
      "target": "action_1",
      "animated": true,
      "style": {"stroke": "#3b82f6"}
    },
    {
      "id": "edge_2", 
      "source": "action_1",
      "target": "action_2",
      "animated": true,
      "style": {"stroke": "#3b82f6"}
    }
  ]
}'''

class Agent:
    def __init__(self, name: str, client, tools: List = None, system_message: str = ""):
        self.name = name
        self.client = client
        self.tools = tools or []
        self.system_message = system_message
        print(f"Mock DataPizza Agent '{name}' initialized with {len(self.tools)} tools")
    
    def run(self, prompt: str) -> str:
        # Simulate agent processing
        print(f"Agent {self.name} processing: {prompt[:100]}...")
        return self.client.generate_text(prompt)

# Mock tool decorator
def tool(func: Callable) -> Callable:
    func.is_tool = True
    return func

# Mock module structure
class MockDataPizza:
    class agents:
        Agent = Agent
    
    class tools:
        tool = staticmethod(tool)
    
    class clients:
        class vertexai:
            VertexAIClient = VertexAIClient

# Create global mock object
datapizza = MockDataPizza()

# Export classes directly for easier import
__all__ = ['Agent', 'tool', 'VertexAIClient', 'datapizza']