#!/usr/bin/env python3
"""
Test diretto del Custom Access Token Hook tramite API Supabase Auth
Questo script simula un login e verifica se l'hook viene chiamato
"""

import requests
import json
import jwt
from datetime import datetime

# Credentials
PROJECT_REF = "qjtaqrlpronohgpfdxsi"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2NDM1NTUsImV4cCI6MjA1MzIxOTU1NX0.hUq-y_vGcl_ER72mQDI0Rri0RxuKS4uK_Y2swPmT42Y"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqdGFxcmxwcm9ub2hncGZkeHNpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQzODY2NCwiZXhwIjoyMDczMDE0NjY0fQ.Z5i-lxQGKtKtVbATTd_9uB_Q3HhF5in-kvLW8Tym4z0"

AUTH_URL = f"https://{PROJECT_REF}.supabase.co/auth/v1"

def decode_jwt_payload(token):
    """Decodifica il payload del JWT senza verificare la firma"""
    try:
        # Split e decodifica il payload (parte centrale del JWT)
        payload = token.split('.')[1]
        # Aggiungi padding se necessario
        padding = 4 - len(payload) % 4
        if padding:
            payload += '=' * padding
        
        import base64
        decoded = base64.urlsafe_b64decode(payload)
        return json.loads(decoded)
    except Exception as e:
        return {"error": str(e)}

def test_login_and_hook():
    """Testa il login e verifica se l'hook viene chiamato"""
    
    print("=" * 70)
    print("TEST CUSTOM ACCESS TOKEN HOOK - Login Diretto")
    print("=" * 70)
    
    # Credentials di test (usa quelle reali)
    email = "agenziaseocagliari@gmail.com"
    password = input("Inserisci la password per agenziaseocagliari@gmail.com: ")
    
    # Step 1: Login con password
    print("\n[STEP 1] Login con email/password...")
    login_response = requests.post(
        f"{AUTH_URL}/token",
        headers={
            "apikey": ANON_KEY,
            "Content-Type": "application/json"
        },
        params={
            "grant_type": "password"
        },
        json={
            "email": email,
            "password": password
        }
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login fallito: {login_response.status_code}")
        print(f"   Response: {login_response.text}")
        return False
    
    print("✅ Login successful")
    
    # Step 2: Estrai il JWT access_token
    data = login_response.json()
    access_token = data.get('access_token')
    
    if not access_token:
        print("❌ Nessun access_token nella risposta")
        return False
    
    print(f"✅ Access token ricevuto (lunghezza: {len(access_token)})")
    
    # Step 3: Decodifica il JWT
    print("\n[STEP 2] Decodifica JWT payload...")
    payload = decode_jwt_payload(access_token)
    
    print("\n" + "=" * 70)
    print("JWT PAYLOAD DECODIFICATO:")
    print("=" * 70)
    print(json.dumps(payload, indent=2))
    print("=" * 70)
    
    # Step 4: Verifica i custom claims
    print("\n[STEP 3] Verifica Custom Claims...")
    
    has_user_role = 'user_role' in payload
    has_is_super_admin = 'is_super_admin' in payload
    has_organization_id = 'organization_id' in payload
    
    print(f"\n{'✅' if has_user_role else '❌'} user_role: {payload.get('user_role', 'MANCANTE')}")
    print(f"{'✅' if has_is_super_admin else '❌'} is_super_admin: {payload.get('is_super_admin', 'MANCANTE')}")
    print(f"{'✅' if has_organization_id else '❌'} organization_id: {payload.get('organization_id', 'MANCANTE')}")
    
    # Step 5: Diagnosi
    print("\n" + "=" * 70)
    print("DIAGNOSI FINALE:")
    print("=" * 70)
    
    if has_user_role and has_is_super_admin:
        print("🎉 ✅ HOOK FUNZIONA CORRETTAMENTE!")
        print("   Il custom_access_token_hook è stato chiamato e ha aggiunto i claims!")
        return True
    else:
        print("❌ HOOK NON FUNZIONA!")
        print("   Il JWT non contiene i custom claims.")
        print("\n📋 Possibili cause:")
        print("   1. Hook non abilitato nel servizio GoTrue")
        print("   2. Funzione SQL ha errori runtime")
        print("   3. Permessi mancanti su supabase_auth_admin")
        print("   4. Cache del servizio Auth non aggiornata")
        print("\n🔧 Azioni raccomandate:")
        print("   1. Verifica nel Dashboard Supabase che l'hook sia ENABLED")
        print("   2. Esegui COMPREHENSIVE_AUTH_DIAGNOSIS.sql")
        print("   3. Controlla i logs del progetto Supabase")
        return False

if __name__ == "__main__":
    test_login_and_hook()
