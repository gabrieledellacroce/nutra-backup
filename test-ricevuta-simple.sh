#!/bin/bash

# Test semplice per inviare una ricevuta
echo "🧪 Invio ricevuta di test..."

# URL dell'API (prova con il dominio principale)
API_URL="https://nutragenix-fatture.vercel.app/api/receipts"

# Genera la data corrente in formato ISO
CURRENT_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "📅 Data test: $CURRENT_DATE"

# Dati della ricevuta di test
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Test-Script/1.0" \
  -v \
  -d '{
    "id": 999888777,
    "name": "#TEST-001",
    "order_number": "TEST-001",
    "created_at": "'$CURRENT_DATE'",
    "currency": "EUR",
    "total_price": "89.90",
    "total_discounts": "10.00",
    "financial_status": "paid",
    "payment_gateway_names": ["paypal"],
    "customer": {
      "first_name": "Mario",
      "last_name": "Rossi",
      "email": "gabriprb@me.com",
      "phone": "+39 123 456 7890"
    },
    "billing_address": {
      "address1": "Via Roma 123",
      "city": "Milano",
      "province": "MI",
      "zip": "20100",
      "country_code": "IT"
    },
    "line_items": [
      {
        "title": "Prodotto Test con Sconto",
        "quantity": 2,
        "price": "49.95",
        "total_discount": "10.00",
        "sku": "TEST-SKU-001"
      }
    ]
  }'

echo ""
echo "✅ Test completato!"
echo "📧 Controlla la tua email per la conferma"
echo "📄 Controlla Fatture in Cloud per la ricevuta creata"