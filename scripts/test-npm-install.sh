#!/bin/bash
# Test npm ci with all compatibility flags
# This script tests if npm ci works with the current Node.js version

echo "=================================================="
echo "NPM DEPENDENCY INSTALLATION TEST"
echo "=================================================="
echo ""

# Check Node.js version
NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)

echo "📦 Environment:"
echo "  Node.js: $NODE_VERSION"
echo "  npm: $NPM_VERSION"
echo ""

# Create backup of node_modules and package-lock.json
if [ -d "node_modules" ]; then
    echo "📦 Backing up existing node_modules..."
    tar -czf node_modules.backup.tar.gz node_modules 2>/dev/null
fi

if [ -f "package-lock.json" ]; then
    echo "📦 Backing up package-lock.json..."
    cp package-lock.json package-lock.json.backup
fi

echo ""
echo "🔄 Attempting npm ci with retry logic..."
echo ""

# Retry logic for npm ci
for attempt in 1 2 3; do
    echo "Attempt $attempt/3: Installing dependencies..."
    
    if npm ci --legacy-peer-deps --no-fund --no-audit; then
        echo ""
        echo "✅ npm ci succeeded!"
        echo ""
        echo "📊 Installed packages:"
        npm list --depth=0 2>/dev/null | head -20
        echo ""
        exit 0
    else
        EXIT_CODE=$?
        echo "❌ npm ci failed with exit code $EXIT_CODE"
        
        if [ $attempt -lt 3 ]; then
            WAIT_TIME=$((attempt * 5))
            echo "⏳ Waiting ${WAIT_TIME}s before retry..."
            sleep $WAIT_TIME
            echo ""
        fi
    fi
done

echo ""
echo "❌ All retry attempts failed!"
echo ""
echo "🔧 Troubleshooting steps:"
echo "  1. Clear npm cache: npm cache clean --force"
echo "  2. Delete node_modules: rm -rf node_modules package-lock.json"
echo "  3. Restore backups: tar -xzf node_modules.backup.tar.gz"
echo "  4. Try npm install instead: npm install --legacy-peer-deps"
echo ""

exit 1
