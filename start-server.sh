#!/bin/bash

# Încarcă variabilele de mediu din .env
if [ -f .env ]; then
  echo "📁 Încărcare variabile de mediu din .env..."
  export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
else
  echo "⚠️  Atenție: Fișierul .env nu a fost găsit!"
  echo "   Creați fișierul .env din .env.template:"
  echo "   cp .env.template .env"
  exit 1
fi

# Afișează variabilele setate pentru debug (fără a expune valorile)
echo "✅ Variabile de mediu încărcate:"
echo "   - NODE_ENV: ${NODE_ENV}"
echo "   - DATABASE_URL: [mascat pentru securitate]"
echo "   - REDIS_URL: [mascat pentru securitate]"
echo "   - JWT_SECRET: [mascat pentru securitate]"
echo ""

# Pornirea serverului
echo "🚀 Pornire server în modul ${NODE_ENV}..."
pnpm run dev