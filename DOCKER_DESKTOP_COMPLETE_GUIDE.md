# 🐳 DOCKER DESKTOP - INSTALLAZIONE COMPLETA STEP BY STEP
# =======================================================

## 🎯 **REQUISITI SISTEMA:**
- Windows 10/11 Pro, Enterprise, Education (64-bit)
- Hyper-V abilitato
- Virtualizzazione abilitata nel BIOS
- 4GB RAM minimo (8GB raccomandato)

## 🔧 **STEP 1: ABILITARE VIRTUALIZZAZIONE BIOS**

### A. Riavvia il PC e accedi al BIOS:
- **ASUS/MSI**: Premi `F2` o `DEL` durante l'avvio
- **HP**: Premi `F10` o `ESC`
- **Dell**: Premi `F2` o `F12`
- **Lenovo**: Premi `F1` o `F2`

### B. Cerca queste opzioni e ABILITALE:
- **Intel**: "Intel VT-x" o "Virtualization Technology"
- **AMD**: "AMD-V" o "SVM Mode"
- **Hyper-V**: "Hyper-V" (se presente)

### C. Salva e esci: `F10` → `Yes`

## 🔧 **STEP 2: ABILITARE HYPER-V SU WINDOWS**

### Metodo 1 - PowerShell (come Amministratore):
```powershell
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
```

### Metodo 2 - Pannello di Controllo:
1. **Pannello di Controllo** → **Programmi** → **Attiva/Disattiva funzionalità Windows**
2. Spunta: ✅ **Hyper-V**
3. Spunta: ✅ **Sottosistema Windows per Linux**
4. Spunta: ✅ **Piattaforma macchina virtuale**
5. **OK** → **Riavvia**

## 🔧 **STEP 3: INSTALLARE WSL2**

### PowerShell (come Amministratore):
```powershell
wsl --install
wsl --set-default-version 2
```

### Verifica WSL2:
```powershell
wsl --list --verbose
```

## 🔧 **STEP 4: SCARICARE E INSTALLARE DOCKER DESKTOP**

### A. Download:
- Vai a: https://www.docker.com/products/docker-desktop/
- Clicca **"Download for Windows"**
- File: `Docker Desktop Installer.exe` (~500MB)

### B. Installazione:
1. **Esegui come Amministratore** `Docker Desktop Installer.exe`
2. Spunta: ✅ **"Use WSL 2 instead of Hyper-V"**
3. Spunta: ✅ **"Add shortcut to desktop"**
4. **Install** → Attendi 5-10 minuti
5. **Close and restart**

## 🔧 **STEP 5: CONFIGURAZIONE DOCKER**

### A. Primo Avvio:
1. **Accetta** i Terms of Service
2. **Skip** il tutorial (opzionale)
3. Verifica che Docker sia in esecuzione (icona nella system tray)

### B. Test Installazione:
```powershell
docker --version
docker run hello-world
```

## 🔧 **STEP 6: INSTALLARE SUPABASE CLI**

### PowerShell:
```powershell
npm install -g supabase
supabase --version
```

## 🚀 **STEP 7: DEPLOY FUNZIONE CON DOCKER**

### A. Setup Progetto:
```powershell
cd C:\Users\inves\CRM-AI
supabase login
```

### B. Deploy:
```powershell
supabase functions deploy generate-form-fields --project-ref qjtaqrlpronohgpfdxsi
```

## 🛠️ **TROUBLESHOOTING:**

### Errore "Virtualizzazione non supportata":
- ✅ Verifica BIOS: virtualizzazione abilitata
- ✅ Verifica Windows: Hyper-V abilitato
- ✅ Riavvia dopo ogni modifica

### Errore "WSL2 non trovato":
```powershell
wsl --update
wsl --shutdown
```

### Docker non si avvia:
1. **Task Manager** → Termina `Docker Desktop`
2. **Esegui come Amministratore** Docker Desktop
3. Attendi 2-3 minuti per l'inizializzazione

## ⚡ **ALTERNATIVE SE DOCKER FALLISCE:**

### 1. GitHub Codespaces:
- Crea Codespace dal repo
- Deploy da cloud environment

### 2. Supabase Dashboard Deploy:
- Copy/paste manuale come ultima risorsa

---

## 🎯 **GARANZIA:**
Seguendo questi passi, Docker funzionerà al 99%.
Il problema principale è sempre la virtualizzazione BIOS.

**TEMPO STIMATO: 30-45 minuti (inclusi riavvii)**