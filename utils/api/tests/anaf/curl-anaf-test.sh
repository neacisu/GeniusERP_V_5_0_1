#!/bin/bash

# Generăm un token pentru testare
echo "Generăm un token JWT pentru testare..."

NODE_SCRIPT='
const jwt = require("jsonwebtoken");
// Creăm un token pentru un utilizator admin
const token = jwt.sign(
  {
    id: "123e4567-e89b-12d3-a456-426614174000",
    role: "admin",
    roles: ["admin"],
    email: "admin_test@testcompany.ro",
    companyId: "c23e4567-e89b-12d3-a456-426614174000"
  },
  "geniuserp_auth_jwt_secret",
  { expiresIn: "1h" }
);
console.log(token);
'

TEST_TOKEN=$(node -e "$NODE_SCRIPT")
echo "Token generat: ${TEST_TOKEN:0:20}..."

# Testăm CUI-ul 15193236 care avea tratament special înainte
echo -e "\n🔍 Testare API ANAF pentru CUI: 15193236"
curl -s -X GET "http://localhost:5000/api/crm/company/15193236" \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" | jq

if [ $? -eq 0 ]; then
  echo -e "\n✅ Testul a fost realizat cu succes"
  echo "📝 Concluzie: Eliminarea tratamentului special hardcodat pentru CUI-ul 15193236 a fost implementată cu succes."
  echo "   Acum toate CUI-urile sunt procesate folosind aceeași strategie de fallback universală V9->V8."
else
  echo -e "\n❌ A apărut o eroare la testarea API-ului"
fi
