"""
Test Google Cloud Authentication
Enhanced validation for DataPizza production configuration
"""

import os
from pathlib import Path
from google.auth import default, exceptions
from google.cloud import aiplatform
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set credentials path if not already set
if not os.getenv('GOOGLE_APPLICATION_CREDENTIALS'):
    creds_path = Path(__file__).parent / 'credentials' / 'service-account-key.json'
    if creds_path.exists():
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = str(creds_path)


def test_authentication():
    """Test all Google Cloud authentication components"""
    
    print("🔍 Testing Google Cloud Authentication...\n")
    
    # Check credentials file exists
    creds_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    print(f"1. Credentials path: {creds_path}")
    
    if creds_path and os.path.exists(creds_path):
        print("   ✅ Credentials file found\n")
    else:
        print("   ❌ Credentials file not found!\n")
        return False

    # Test authentication
    print("2. Testing Google Cloud authentication...")
    try:
        credentials, project = default()
        print(f"   ✅ Authentication successful!")
        print(f"   Project ID: {project}\n")
    except exceptions.DefaultCredentialsError as e:
        print(f"   ❌ Authentication failed: {e}\n")
        return False

    # Initialize Vertex AI
    print("3. Testing Vertex AI initialization...")
    try:
        aiplatform.init(
            project=os.getenv('GOOGLE_CLOUD_PROJECT', 'crm-ai-471815'),
            location=os.getenv('GOOGLE_CLOUD_LOCATION', 'us-central1')
        )
        print("   ✅ Vertex AI initialized successfully!\n")
    except Exception as e:
        print(f"   ❌ Vertex AI initialization failed: {e}\n")
        return False

    print("🎉 All Google Cloud tests passed!\n")
    return True


if __name__ == "__main__":
    success = test_authentication()
    
    if success:
        print("✅ READY FOR DATAPIZZA PRODUCTION INTEGRATION")
    else:
        print("❌ AUTHENTICATION ISSUES - CHECK CREDENTIALS")
        
    exit(0 if success else 1)