#!/bin/bash

echo "🔍 Checking for incorrect API endpoints..."

# Check for wrong endpoints
wrong_endpoints=$(grep -rn "api/agents" src/ 2>/dev/null)
datapizza_refs=$(grep -rn "DataPizza" src/ 2>/dev/null | grep -v "datapizza-vercel")
railway_refs=$(grep -rn "Railway" src/ 2>/dev/null)

if [ ! -z "$wrong_endpoints" ]; then
  echo "❌ Found /api/agents references:"
  echo "$wrong_endpoints"
fi

if [ ! -z "$datapizza_refs" ]; then
  echo "⚠️ Found DataPizza references:"
  echo "$datapizza_refs"
fi

if [ ! -z "$railway_refs" ]; then
  echo "⚠️ Found Railway references:"  
  echo "$railway_refs"
fi

if [ -z "$wrong_endpoints" ] && [ -z "$datapizza_refs" ] && [ -z "$railway_refs" ]; then
  echo "✅ All API endpoints correct!"
fi