#!/bin/bash

# Script per testare la configurazione del webhook di Fatture in Cloud

BASE_URL="https://nutragenix-fatture-qlzulkde3-gabrieledellacroce-2606s-projects.vercel.app"

echo "🔧 Test configurazione webhook Fatture in Cloud"
echo "================================================"

echo ""
echo "1️⃣ Lista webhook esistenti..."
curl -s -X GET "$BASE_URL/api/webhook-setup" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "2️⃣ Registra nuovo webhook per ricevute..."
curl -s -X POST "$BASE_URL/api/webhook-setup" \
  -H "Content-Type: application/json" \
  -d '{
    "webhook_url": "'$BASE_URL'/api/webhook"
  }' | jq '.'

echo ""
echo "3️⃣ Verifica webhook registrati..."
curl -s -X GET "$BASE_URL/api/webhook-setup" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "✅ Test completato!"
echo ""
echo "📋 Prossimi passi:"
echo "   - Verifica che il webhook sia stato registrato correttamente"
echo "   - Testa creando una ricevuta per verificare che l'email arrivi quando il PDF è pronto"
echo "   - Monitora i log per eventuali errori"