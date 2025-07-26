#!/bin/bash

# Test simulazione webhook per invio email
echo "🧪 Test simulazione webhook per invio email..."

# URL dell'API
API_URL="https://nutra-backup.vercel.app/api/webhook"

# Genera la data corrente in formato ISO
CURRENT_DATE=$(date -u +"%Y-%m-%d")
echo "📅 Data test: $CURRENT_DATE"

# Simula una notifica webhook da Fatture in Cloud
echo "📡 Invio notifica webhook simulata..."

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "User-Agent: FattureInCloud-Webhook/1.0" \
  -v \
  -d '{
    "type": "it.fattureincloud.webhooks.receipts.update",
    "data": {
      "entity": {
        "id": 999888777,
        "number": "TEST-WEBHOOK-001",
        "date": "'$CURRENT_DATE'",
        "entity": {
          "name": "Mario Rossi",
          "email": "gabriprb@me.com"
        },
        "amount_net": 89.90,
        "amount_gross": 98.89,
        "status": "paid",
        "url": "https://compute.fattureincloud.it/doc/test123.pdf",
        "items_list": [
          {
            "name": "Prodotto Test",
            "qty": 2,
            "net_price": 44.95
          }
        ]
      }
    }
  }'

echo ""
echo "✅ Test webhook completato!"
echo "📧 Controlla l'email gabriprb@me.com per la ricevuta con PDF"
echo "📄 Se configurato correttamente, dovresti ricevere l'email con il PDF allegato"