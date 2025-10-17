#!/bin/bash

echo "🚀 Manual Documentation Update"
echo "================================"
echo ""

# Run Node.js script
echo "📊 Analyzing project and generating reports..."
node scripts/generate-docs-report.js

if [ $? -ne 0 ]; then
    echo "❌ Error running documentation generator"
    exit 1
fi

echo ""
echo "📝 Changes made:"
echo "--------------------------------"
git diff --stat MASTER_ROADMAP_OCT_2025.md TECHNICAL_ARCHITECTURE.md docs/daily-reports/

echo ""
echo "================================"
read -p "Commit and push these changes? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    git add MASTER_ROADMAP_OCT_2025.md TECHNICAL_ARCHITECTURE.md docs/daily-reports/
    git commit -m "docs: manual update $(date +%Y-%m-%d-%H:%M)"
    git push
    echo "✅ Changes committed and pushed!"
else
    echo "⚠️ Changes not committed. Run 'git add' and 'git commit' manually."
fi