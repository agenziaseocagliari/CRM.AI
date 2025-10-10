#!/usr/bin/env python3
"""
ADVANCED JWT INTERCEPTOR - Engineering Fellow Level 5
Questo script fa login e cattura il JWT raw per analisi forense
"""

import requests
import json
import base64
from datetime import datetime

# Configurazione
PROJECT_REF = "qjtaqrlpronohgpfdxsi"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Mzg2NjQsImV4cCI6MjA3MzAxNDY2NH0.4bCc8vk1qtxLs90xsYaGOs-envRmASVGL9fYtESgY6k"

def decode_jwt(token):
    """Decodifica JWT senza validazione firma"""
    try:
        # Header
        header_b64 = token.split('.')[0]
        header_padding = 4 - len(header_b64) % 4
        if header_padding and header_padding != 4:
            header_b64 += '=' * header_padding
        header = json.loads(base64.urlsafe_b64decode(header_b64))
        
        # Payload
        payload_b64 = token.split('.')[1]
        payload_padding = 4 - len(payload_b64) % 4
        if payload_padding and payload_padding != 4:
            payload_b64 += '=' * payload_padding
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))
        
        return header, payload
    except Exception as e:
        return None, {"error": str(e)}

def test_auth_endpoints():
    """Testa TUTTI gli endpoint auth per capire quale funziona"""
    
    print("=" * 80)
    print("ADVANCED AUTH ENDPOINT TESTING")
    print("=" * 80)
    
    # Credenziali Super Admin
    email = "agenziaseocagliari@gmail.com"
    password = "WebProSEO@1980#"
    print(f"Email: {email}")
    print(f"Password: {password}")
    print()
    
    # Lista di TUTTI i possibili endpoint auth
    endpoints = [
        {
            "name": "Token with grant_type",
            "method": "POST",
            "url": f"https://{PROJECT_REF}.supabase.co/auth/v1/token?grant_type=password",
            "body": {"email": email, "password": password}
        },
        {
            "name": "Sign In Password",
            "method": "POST", 
            "url": f"https://{PROJECT_REF}.supabase.co/auth/v1/signup",
            "body": {"email": email, "password": password}
        }
    ]
    
    for endpoint in endpoints:
        print(f"\n{'=' * 80}")
        print(f"Testing: {endpoint['name']}")
        print(f"URL: {endpoint['url']}")
        print("=" * 80)
        
        try:
            response = requests.request(
                method=endpoint['method'],
                url=endpoint['url'],
                headers={
                    "apikey": ANON_KEY,
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {ANON_KEY}"
                },
                json=endpoint['body'],
                timeout=10
            )
            
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                if 'access_token' in data:
                    print("\n✅ SUCCESS - JWT OTTENUTO!")
                    
                    token = data['access_token']
                    header, payload = decode_jwt(token)
                    
                    print("\n" + "=" * 80)
                    print("JWT HEADER:")
                    print("=" * 80)
                    print(json.dumps(header, indent=2))
                    
                    print("\n" + "=" * 80)
                    print("JWT PAYLOAD (CLAIMS):")
                    print("=" * 80)
                    print(json.dumps(payload, indent=2))
                    
                    print("\n" + "=" * 80)
                    print("ANALISI CUSTOM CLAIMS:")
                    print("=" * 80)
                    
                    has_user_role = 'user_role' in payload
                    has_is_super_admin = 'is_super_admin' in payload
                    has_org_id = 'organization_id' in payload
                    
                    print(f"{'✅' if has_user_role else '❌'} user_role: {payload.get('user_role', 'MANCANTE')}")
                    print(f"{'✅' if has_is_super_admin else '❌'} is_super_admin: {payload.get('is_super_admin', 'MANCANTE')}")
                    print(f"{'✅' if has_org_id else '❌'} organization_id: {payload.get('organization_id', 'MANCANTE')}")
                    
                    print("\n" + "=" * 80)
                    print("TUTTI I CLAIMS:")
                    print("=" * 80)
                    for key, value in payload.items():
                        print(f"  {key}: {value}")
                    
                    if not has_user_role:
                        print("\n" + "=" * 80)
                        print("❌ DIAGNOSI: HOOK NON CHIAMATO")
                        print("=" * 80)
                        print("Il JWT non contiene custom claims.")
                        print("Questo significa che custom_access_token_hook NON è stato chiamato.")
                        print("\nPossibili cause:")
                        print("1. Hook non abilitato in GoTrue")
                        print("2. URI dell'hook sbagliato")
                        print("3. Funzione SQL ha errori runtime che GoTrue ignora")
                        print("4. GoTrue non ha caricato la configurazione")
                    
                    return True
                else:
                    print(f"❌ No access_token in response")
                    print(f"Response: {json.dumps(data, indent=2)}")
            else:
                print(f"❌ Error: {response.text}")
                
        except Exception as e:
            print(f"❌ Exception: {str(e)}")
    
    return False

if __name__ == "__main__":
    test_auth_endpoints()
