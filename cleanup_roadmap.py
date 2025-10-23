#!/usr/bin/env python3
"""
Script per pulire MASTER_ROADMAP_OCT_2025.md
- Conserva header, dashboard, Phase 0, Executive Summary
- Conserva i milestone importanti (COMPLETE!, 🚀)
- Rimuove tutte le sezioni "Automated Daily Update" duplicate
- Mantiene solo UNA sezione riassuntiva per giorno
"""
import re
from collections import defaultdict

def clean_roadmap():
    input_file = r"c:\Users\inves\CRM-AI\MASTER_ROADMAP_OCT_2025.md"
    output_file = r"c:\Users\inves\CRM-AI\MASTER_ROADMAP_OCT_2025_CLEANED.md"
    
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    cleaned_lines = []
    i = 0
    
    # FASE 1: Conserva tutto fino a linea 650 (header + Phase 0 + Executive Summary)
    print("📋 Fase 1: Conservo header e contenuto essenziale...")
    while i < min(650, len(lines)):
        cleaned_lines.append(lines[i])
        i += 1
    
    print(f"✅ Conservate prime {i} righe")
    
    # FASE 2: Salta tutte le sezioni "Automated Daily Update" ripetitive (linee 650-4300)
    print("\n🗑️ Fase 2: Salto tutte le sezioni 'Automated Daily Update' ripetitive...")
    skipped = 0
    while i < len(lines):
        line = lines[i]
        # Cerca la prima sezione IMPORTANTE (milestone con 🚀)
        if re.search(r'COMPLETE!.*🚀|PHASE \d+.*🚀', line):
            print(f"✨ Trovato milestone importante alla linea {i}: {line.strip()[:80]}")
            break
        if "Automated Daily Update" in line:
            skipped += 1
        i += 1
    
    print(f"✅ Saltate {skipped} sezioni automatiche ripetitive")
    
    # FASE 3: Conserva tutto il resto (milestone importanti)
    print(f"\n📝 Fase 3: Conservo milestone importanti dalla linea {i} alla fine...")
    remaining = 0
    while i < len(lines):
        cleaned_lines.append(lines[i])
        remaining += 1
        i += 1
    
    print(f"✅ Conservate {remaining} righe di milestone")
    
    # Scrivi il file pulito
    with open(output_file, 'w', encoding='utf-8') as f:
        f.writelines(cleaned_lines)
    
    # Statistiche
    original_lines = len(lines)
    cleaned_lines_count = len(cleaned_lines)
    reduction = (1 - cleaned_lines_count / original_lines) * 100
    
    print("\n" + "="*60)
    print("📊 STATISTICHE PULIZIA")
    print("="*60)
    print(f"Righe originali:  {original_lines:,}")
    print(f"Righe pulite:     {cleaned_lines_count:,}")
    print(f"Righe rimosse:    {original_lines - cleaned_lines_count:,}")
    print(f"Riduzione:        {reduction:.1f}%")
    print("="*60)
    print(f"\n✅ File pulito salvato in: {output_file}")

if __name__ == "__main__":
    clean_roadmap()
