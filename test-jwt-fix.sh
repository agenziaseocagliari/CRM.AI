#!/bin/bash
# ====================================================================
# TEST RAPIDO JWT POST-FIX
# ====================================================================

echo "🧪 Testing JWT generation dopo fix hook..."
echo ""
echo "Attendere 3 secondi per stabilizzazione GoTrue..."
sleep 3

cd /workspaces/CRM.AI
python3 advanced_jwt_interceptor.py

echo ""
echo "======================================================================"
echo "COSA CERCARE NEL RISULTATO:"
echo "======================================================================"
echo "✅ user_role: super_admin (NON 'MANCANTE')"
echo "✅ is_super_admin: true (NON 'MANCANTE')"
echo "✅ organization_id: 00000000-0000-0000-0000-000000000001 (NON 'MANCANTE')"
echo ""
echo "Se vedi ✅ su tutti e tre = PROBLEMA RISOLTO! 🎉"
echo "======================================================================"
