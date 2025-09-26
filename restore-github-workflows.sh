#!/bin/bash
# restore-github-workflows.sh
# Script per ripristinare la directory .github/workflows/ e sincronizzare con il remote

set -e

echo "[INFO] Fetching latest changes from origin..."
git fetch origin

echo "[INFO] Restoring .github/workflows/ from origin/main..."
git checkout origin/main -- .github/workflows/

echo "[INFO] Adding restored workflows to commit..."
git add .github/workflows/

git commit -m "fix: ripristino directory workflows persa" || echo "[INFO] Nulla da committare, nessuna modifica."

echo "[INFO] Pushing to origin/main..."
git push origin main

echo "[SUCCESS] Directory .github/workflows/ ripristinata e sincronizzata con il remote."

echo "[AVVISO] Dopo ogni modifica ai file workflow su GitHub o locale, ricordarsi di fare pull su AI Studio e NON modificare mai la directory .github/workflows/ da ambiente cloud IDE."
