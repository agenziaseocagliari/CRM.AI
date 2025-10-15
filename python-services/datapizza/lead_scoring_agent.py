"""
Lead Scoring Agent using DataPizza AI + Google Gemini
Enhanced CRM lead scoring with structured agent framework
"""

from datapizza.agents import Agent
from datapizza.tools import tool
import os
import json
from typing import Dict, Any

# Initialize Google VertexAI client for DataPizza
try:
    # Try to import VertexAI client first
    from datapizza.clients.vertexai import VertexAIClient
    
    client = VertexAIClient(
        project_id=os.getenv('GOOGLE_CLOUD_PROJECT', 'crm-ai-471815'),
        location=os.getenv('GOOGLE_CLOUD_LOCATION', 'us-central1'),
        model='gemini-1.5-pro'
    )
    print("✅ DataPizza VertexAI client initialized successfully")
    
except ImportError as e:
    print("⚠️ VertexAI client not available, falling back to OpenAI...")
    try:
        from datapizza.clients.openai import OpenAIClient
        
        api_key = os.getenv('OPENAI_API_KEY', 'demo-key-for-testing')
        client = OpenAIClient(
            api_key=api_key,
            model='gpt-4'
        )
        print("✅ DataPizza OpenAI client initialized (fallback)")
    except Exception as e2:
        print(f"⚠️ DataPizza client initialization failed: {e2}")
        print("Using fallback configuration for testing...")
        client = None
        
except Exception as e:
    print(f"❌ VertexAI initialization error: {e}")
    print("Using fallback configuration...")
    client = None

# Define custom tools for CRM operations
@tool
def get_contact_history(email: str) -> Dict[str, Any]:
    """
    Get contact interaction history from CRM database.
    This would query Supabase in production.
    
    Args:
        email: Contact's email address
        
    Returns:
        Dictionary with interaction statistics
    """
    # Mock implementation for MVP - in production, query Supabase
    # TODO: Integrate with actual Supabase queries
    
    # Simulate realistic data based on email domain
    domain = email.split('@')[1].lower() if '@' in email else 'unknown.com'
    
    if 'gmail.com' in domain or 'yahoo.com' in domain:
        # Personal email - lower engagement
        return {
            "interactions": 2,
            "last_contact": "2024-10-08",
            "emails_opened": 1,
            "links_clicked": 0,
            "meetings_attended": 0,
            "response_rate": 0.3
        }
    else:
        # Business email - higher engagement potential
        return {
            "interactions": 7,
            "last_contact": "2024-10-12", 
            "emails_opened": 5,
            "links_clicked": 3,
            "meetings_attended": 1,
            "response_rate": 0.7
        }

@tool
def get_company_info(company_name: str) -> Dict[str, Any]:
    """
    Get company information for lead qualification.
    Could integrate with external APIs or CRM database.
    
    Args:
        company_name: Name of the company
        
    Returns:
        Dictionary with company details
    """
    # Mock implementation - in production, integrate with company APIs
    # TODO: Add LinkedIn API, Clearbit, or similar integrations
    
    if not company_name or company_name.lower() in ['', 'none', 'unknown']:
        return {
            "size": "Unknown",
            "industry": "Not specified", 
            "revenue_estimate": "Unknown",
            "growth_stage": "Unknown",
            "technology_stack": [],
            "funding_info": "Unknown"
        }
    
    # Simulate data based on company name patterns
    company_lower = company_name.lower()
    
    if any(tech in company_lower for tech in ['tech', 'soft', 'digital', 'ai', 'data']):
        return {
            "size": "50-200 employees",
            "industry": "Technology",
            "revenue_estimate": "$5M-$25M", 
            "growth_stage": "Scale-up",
            "technology_stack": ["React", "Python", "AWS"],
            "funding_info": "Series A funded"
        }
    elif any(service in company_lower for service in ['consulting', 'agency', 'marketing', 'seo']):
        return {
            "size": "10-50 employees", 
            "industry": "Professional Services",
            "revenue_estimate": "$1M-$10M",
            "growth_stage": "Growing",
            "technology_stack": ["WordPress", "Google Analytics"],
            "funding_info": "Bootstrapped"
        }
    else:
        return {
            "size": "25-100 employees",
            "industry": "General Business", 
            "revenue_estimate": "$2M-$15M",
            "growth_stage": "Established",
            "technology_stack": ["Standard business tools"],
            "funding_info": "Unknown"
        }

@tool 
def analyze_email_quality(email: str) -> Dict[str, Any]:
    """
    Analyze email quality indicators for lead scoring.
    
    Args:
        email: Email address to analyze
        
    Returns:
        Dictionary with email quality metrics
    """
    if not email or '@' not in email:
        return {
            "quality_score": 0,
            "domain_type": "invalid",
            "is_business_email": False,
            "domain_reputation": "unknown"
        }
    
    domain = email.split('@')[1].lower()
    
    # Business email domains get higher scores
    business_domains = ['company.com', 'corp.com', 'inc.com', 'ltd.com']
    common_business = ['.it', '.co.uk', '.de', '.fr', '.es']
    personal_domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
    
    if domain in personal_domains:
        return {
            "quality_score": 30,
            "domain_type": "personal", 
            "is_business_email": False,
            "domain_reputation": "good"
        }
    elif any(bd in domain for bd in business_domains) or any(cbd in domain for cbd in common_business):
        return {
            "quality_score": 85,
            "domain_type": "business",
            "is_business_email": True, 
            "domain_reputation": "excellent"
        }
    else:
        # Assume other domains are business emails
        return {
            "quality_score": 70,
            "domain_type": "business",
            "is_business_email": True,
            "domain_reputation": "good" 
        }

# Create Lead Scoring Agent
if client:
    lead_scorer = Agent(
        name="guardian_lead_scoring_agent",
        client=client,
        tools=[get_contact_history, get_company_info, analyze_email_quality],
        system_prompt="""
You are an expert lead scoring agent for Guardian AI CRM system.

Your task: Analyze contact information and interaction history to assign a lead score (0-100).

Scoring criteria:
- Email quality and domain: 0-20 points
- Company size and industry fit: 0-30 points  
- Interaction history and engagement: 0-30 points
- Overall qualification and buying signals: 0-20 points

Use the available tools to gather context:
1. analyze_email_quality() - Check email domain and business indicators
2. get_company_info() - Research company size, industry, revenue
3. get_contact_history() - Review past interactions and engagement

Return ONLY a JSON response with this exact structure:
{
  "score": <number 0-100>,
  "category": "<hot|warm|cold>",
  "reasoning": "<brief 2-3 sentence explanation>",
  "breakdown": {
    "email_quality": <0-20>,
    "company_fit": <0-30>, 
    "engagement": <0-30>,
    "qualification": <0-20>
  },
  "confidence": <0.0-1.0>
}

Categories:
- "hot": score 80-100 (high priority, likely to convert)
- "warm": score 50-79 (medium priority, needs nurturing)  
- "cold": score 0-49 (low priority, long-term prospect)
        """
    )
else:
    print("⚠️ DataPizza agent not initialized - using fallback mode")
    lead_scorer = None

def score_lead(contact_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Score a lead using the DataPizza agent.
    
    Args:
        contact_data: Dict with name, email, company, phone, etc.
        
    Returns:
        Dict with score, category, reasoning, and metadata
    """
    if not lead_scorer:
        # Fallback scoring when DataPizza unavailable
        print("🔄 Using fallback scoring - DataPizza agent unavailable")
        return fallback_scoring(contact_data)
    
    try:
        prompt = f"""
Analyze this contact and provide a lead score:

Name: {contact_data.get('name', 'Unknown')}
Email: {contact_data.get('email', '')}
Company: {contact_data.get('company', 'Not specified')}
Phone: {contact_data.get('phone', 'N/A')}

Use the available tools to get additional context, then provide your scoring analysis.
Remember to return ONLY the JSON response format specified in your instructions.
        """
        
        print(f"🤖 DataPizza agent analyzing: {contact_data.get('name', 'Unknown')}")
        response = lead_scorer.run(prompt)
        
        # Parse JSON response from agent
        try:
            if isinstance(response, str):
                # Extract JSON from response text
                import re
                json_match = re.search(r'\{.*\}', response, re.DOTALL)
                if json_match:
                    json_str = json_match.group()
                    parsed_response = json.loads(json_str)
                else:
                    raise ValueError("No JSON found in response")
            else:
                parsed_response = response
                
            # Add metadata
            parsed_response.update({
                "agent_used": "datapizza_openai_mvp",
                "tools_available": ["get_contact_history", "get_company_info", "analyze_email_quality"],
                "processing_time_ms": 0,  # TODO: Add timing
                "model_used": "gpt-4"
            })
            
            return parsed_response
            
        except (json.JSONDecodeError, ValueError) as e:
            print(f"⚠️ Failed to parse agent response as JSON: {e}")
            print(f"Raw response: {response}")
            return fallback_scoring(contact_data)
            
    except Exception as e:
        print(f"❌ DataPizza agent error: {e}")
        return fallback_scoring(contact_data)

def fallback_scoring(contact_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Fallback scoring algorithm when DataPizza is unavailable.
    """
    score = 0
    breakdown = {"email_quality": 0, "company_fit": 0, "engagement": 0, "qualification": 0}
    
    # Email scoring
    email = contact_data.get('email', '')
    if email and '@' in email:
        domain = email.split('@')[1].lower()
        if domain in ['gmail.com', 'yahoo.com', 'hotmail.com']:
            breakdown["email_quality"] = 10  # Personal email
        else:
            breakdown["email_quality"] = 18  # Business email
    
    # Company scoring  
    company = contact_data.get('company', '')
    if company and company.lower() != 'unknown':
        breakdown["company_fit"] = 20
    else:
        breakdown["company_fit"] = 5
        
    # Basic engagement (placeholder)
    breakdown["engagement"] = 15
    breakdown["qualification"] = 10
    
    total_score = sum(breakdown.values())
    
    category = "hot" if total_score >= 80 else "warm" if total_score >= 50 else "cold"
    
    return {
        "score": total_score,
        "category": category, 
        "reasoning": f"Fallback scoring based on email domain and company information. Limited analysis available.",
        "breakdown": breakdown,
        "confidence": 0.6,
        "agent_used": "fallback_basic_algorithm",
        "tools_available": [],
        "processing_time_ms": 0
    }

# Test the agent
if __name__ == "__main__":
    # Test contacts from Guardian CRM
    test_contacts = [
        {
            "name": "Silvestro Sanna",
            "email": "webproseoid@gmail.com", 
            "company": "SEO Cagliari",
            "phone": "+393922147809"
        },
        {
            "name": "Maria Rossi",
            "email": "maria@techsolution.it",
            "company": "TechSolution Italia",
            "phone": "+390123456789"
        },
        {
            "name": "Giuseppe Bianchi", 
            "email": "g.bianchi@yahoo.com",
            "company": "",
            "phone": ""
        }
    ]
    
    print("🧪 Testing DataPizza Lead Scoring Agent...")
    print("=" * 50)
    
    for contact in test_contacts:
        print(f"\n📊 Scoring: {contact['name']}")
        result = score_lead(contact)
        
        print(f"Score: {result['score']}/100 ({result['category'].upper()})")
        print(f"Reasoning: {result['reasoning']}")
        print(f"Agent: {result['agent_used']}")
        
        if 'breakdown' in result:
            print(f"Breakdown: {result['breakdown']}")
            
    print("\n✅ Agent testing complete!")