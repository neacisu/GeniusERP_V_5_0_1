#!/bin/bash
# Script pentru update TOATE dependințele la ultimele versiuni

echo "🚀 Actualizare TOATE dependințele la ultimele versiuni..."

# Instalează npm-check-updates dacă nu există
if ! command -v ncu &> /dev/null; then
    echo "📦 Instalare npm-check-updates..."
    pnpm add -g npm-check-updates
fi

# Backup package.json
cp package.json package.json.backup
echo "✅ Backup package.json creat"

# Update TOATE dependințele (including breaking changes)
echo "📝 Actualizare package.json cu ultimele versiuni..."
ncu -u

# Reinstall all packages
echo "📦 Reinstalare pachete..."
rm -rf node_modules pnpm-lock.yaml
pnpm install

echo "✅ Actualizare completă finalizată!"
echo "📊 Rulare audit..."
pnpm audit

echo ""
echo "ℹ️  Dacă întâmpini probleme, restaurează cu:"
echo "   cp package.json.backup package.json && pnpm install"

