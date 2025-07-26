#!/bin/bash

# Test semplice per creazione ricevuta
echo "🧪 Test creazione ricevuta con PDF download..."

# Genera un ID ordine casuale per evitare duplicati
ORDER_ID=$((999888000 + RANDOM % 1000))

curl -v -X POST https://nutra-backup.vercel.app/api/receipts \
  -H "Content-Type: application/json" \
  -H "User-Agent: Test-Script/1.0" \
  -d "{
    \"id\": $ORDER_ID,
    \"order_number\": \"TEST-PDF-$ORDER_ID\",
    \"total_price\": \"89.90\",
    \"customer\": {
      \"email\": \"gabriprb@me.com\",
      \"first_name\": \"Mario\",
      \"last_name\": \"Rossi\",
      \"phone\": \"+39 123 456 7890\"
    },
    \"billing_address\": {
      \"address1\": \"Via Roma 123\",
      \"city\": \"Milano\",
      \"province\": \"MI\",
      \"zip\": \"20100\",
      \"country_code\": \"IT\"
    },
    \"line_items\": [
      {
        \"title\": \"Prodotto Test con PDF\",
        \"quantity\": 2,
        \"price\": \"49.95\"
      }
    ],
    \"payment_gateway_names\": [\"paypal\"],
    \"financial_status\": \"paid\",
    \"currency\": \"EUR\",
    \"created_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
  }"

echo ""
echo "✅ Test completato!"
echo "📧 Controlla la tua email per la conferma"
echo "📄 Controlla Fatture in Cloud per la ricevuta creata"