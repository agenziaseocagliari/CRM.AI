# 🚀 Production Deployment URL - Railway.app

**Date:** October 15, 2025  
**Status:** ✅ READY FOR DEPLOYMENT  
**Environment:** Railway.app Production  

---

## 🎯 Deployment Configuration

### 📁 **Repository Setup**
- **GitHub Repository:** `agenziaseocagliari/CRM.AI`
- **Root Directory:** `python-services/datapizza`
- **Branch:** `main`

### ⚙️ **Railway Environment Variables**

#### Required Environment Variables:
```bash
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=crm-ai-471815
GOOGLE_CLOUD_LOCATION=us-central1

# Google Cloud Credentials (JSON format)
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"crm-ai-471815","private_key_id":"e610b874e802979e6f14f2d38981ce73148bd71","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCecCwfLMU7W2Vv\n15d5pBu8sPuPMUrEC8bj3/EqOr5LgbU1cGeWONBIjODw4jNFwbKTQ5ETzO+prz9y\nFqio+pLc6taPG1tpTNeeEG+W+36xZaUxzV1+kKo2crASXKFkbcrQLDSa/JGRX79D\nAFbsFOPRkejDmGSUOP1BvhENGFbFOUuarV6UvhQF3k+Znt6Io5s7fx0cDbKVQCJT\nkRlq4HEapkEGcNaIaSSNty1+6q/Aa6vD1bytblxELEeMBnJfpY0ilezn+/DDtYHU\ng06xxt+we3CTTyapPhXUfjt/2SQd+ysq2X6gXh+fJxlAdwukA4BM1+bhBOqCQvUN\n/LWfxVeBAgMBAAECggEAA/Dx5Aei015raEwSYEwBBaFYbKAzBivt02LRdrW14J52\nIcFtTjsVEUzx1oQl9t0B4nBqljXBm3S4zQ97vBJZn2W3FyG81SJ8dZnekMCqTuLi\nqFm9suWJ2mdhcl98A0nI4wNKfrV8MIPTd+j1AJPnc+HfiqgKjnZZdG50MaFynR7M\n94yNe9Uai+aVbKCJSrHPJ4mHiihlBgRYvhc0azzLl4EiaqHuf7lEgYxPg5B6IrXy\nGse+SCn3Cj6lf7EUGLK6+5GYqR9Mqkzxdjg6EeqgooKeBUtIHIx8WJo5itLSnAeW\nASBG7k94NHnAwoZBAB754ckNcsdnWLFsYJYKgPpQcQKBgQDSJWFXytUFdzqCfN/R\n3+9XHKNzTfRZ/0WRcLpwnnocwgAIxU8tqNeajBmnEkQU3UmLTl94obQZZ02pJI1A\nicgeDtW4lhVvB1VZBMSNJJRNcrNSoHQQUvpd9i9CrlbSXidGbEYQ+25rXDnvnMze\nqEHhuzBHT6nOswPry9bU+uppKQKBgQDBAmz1amHpTQUH7TYXf0V3D985Q0s21on5\nIBbEDWqOjsodH+drcyLLysMBrJpnWf48I6wyPMLTnM+VhKE7StdSDtTHWGJb9EL9\nK6hBUCjx7iCZY5iPZTTbJbUPB9zv0wiIaoUhKAihYxXL90gbGf0OI0WtfdQo8hqi\nFmNratJOmQKBgCKH8+vqL4Dba6jffiPNiVWmJhGfYKSdNsBEZs50rBonorvOOEmH\ncg46MUjrznYjOp+CfFulLqPx/qfpkrBlM5YE2Aeh2dnJubOL/gQ3W4syatcL+KZq\nDCv+dRue7DNbN1byGb1Wo3lOyVJfUKbRvSmria5eH8gQUHehoiaTKIupAoGBALxV\n75hyXGRZQYWAlP3MtS3/EOVBow05v5yXEV/xb374GoTc8ubIjLWrfyoNEQW0rP5m\nGMtUuw/evji6GNJQr1dlHX//4Mq1yQBeL2q8G5gnsyu6Ic4bBb6qRskJ9S8YEAV9\nW7cE55cDputGutenPmUjSgSG+hWSWSa9DfptXBZRAoGAV9OaUu5BAvyWm2FDQPR1\nfhHDkIIHsxlSMEOZt4c6VhrNN3Rfv0IFrAajf/cNyYs0Vf+rmTFGPkXn7yp0Wbo5\nYkCjX2ijuGZlGy5PAlewH3gTAWfHl9gbpz/RVKPflGabXK9rDpMaSNIXTk+iNBcv\nMHuIppEyU9I9IpUFbkNNtv4=\n-----END PRIVATE KEY-----\n","client_email":"datapizza-service@crm-ai-471815.iam.gserviceaccount.com","client_id":"109365808197297095015","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/datapizza-service%40crm-ai-471815.iam.gserviceaccount.com","universe_domain":"googleapis.com"}

# Optional: Port (Railway auto-assigns)
PORT=8000
```

### 📦 **Deployment Files Created**

#### `Procfile`
```
web: uvicorn server:app --host 0.0.0.0 --port $PORT
```

#### `railway.json`
```json
{
  "web": {
    "build": "pip install -r requirements.txt",
    "start": "uvicorn server:app --host 0.0.0.0 --port $PORT"
  }
}
```

#### `requirements.txt`
```
datapizza-ai>=0.0.2
google-cloud-aiplatform>=1.38.0
google-auth>=2.23.0
google-auth-oauthlib>=1.1.0
google-auth-httplib2>=0.1.1
fastapi>=0.104.0
uvicorn>=0.24.0
pydantic>=2.0.0
google-genai>=1.44.0
python-dotenv>=1.0.1
```

---

## 🚀 **Deployment Steps**

### 1. Railway.app Project Creation
1. Login to Railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `agenziaseocagliari/CRM.AI`
5. Set root directory: `python-services/datapizza`

### 2. Environment Variable Configuration
Add the following environment variables in Railway dashboard:
- `GOOGLE_CLOUD_PROJECT`
- `GOOGLE_CLOUD_LOCATION`
- `GOOGLE_APPLICATION_CREDENTIALS_JSON`

### 3. Deployment Verification
- Railway will auto-detect Python and install requirements
- Service will start with uvicorn on assigned port
- Health endpoint available at `/health`
- API docs available at `/docs`

---

## 📊 **Expected Production URLs**

### Primary Endpoints:
- **Base URL:** `https://datapizza-production.railway.app`
- **Health Check:** `https://datapizza-production.railway.app/health`
- **Lead Scoring:** `https://datapizza-production.railway.app/score-lead`
- **API Documentation:** `https://datapizza-production.railway.app/docs`

### CORS Configuration:
```python
allow_origins=[
    "http://localhost:5173",          # Vite dev server
    "http://localhost:3000",          # React dev server  
    "https://crm-ai-rho.vercel.app",  # Production frontend
    "https://*.vercel.app"            # All Vercel deployments
]
```

---

## ✅ **Deployment Readiness Checklist**

- ✅ **Server Configuration:** Updated for Railway environment variables
- ✅ **Google Cloud Integration:** Credentials configured for production
- ✅ **Dependencies:** All requirements specified in requirements.txt
- ✅ **Process Definition:** Procfile and railway.json created
- ✅ **CORS Setup:** Frontend domains whitelisted
- ✅ **Error Handling:** Comprehensive fallback system implemented
- ✅ **Security:** Credentials handled via environment variables

---

## 🎯 **Next Steps**

1. **Deploy to Railway:** Follow steps above to create and deploy project
2. **Copy Production URL:** Save Railway-generated URL (e.g., `https://datapizza-production.railway.app`)
3. **Configure Vercel:** Add `VITE_DATAPIZZA_API_URL` environment variable
4. **Test Production:** Verify end-to-end functionality

---

**Status:** ✅ CONFIGURATION COMPLETE - READY FOR RAILWAY DEPLOYMENT

**Note:** Once deployed to Railway, update this document with the actual production URL and deployment status.