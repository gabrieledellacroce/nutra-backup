#!/bin/bash

# Test con dati completamente nuovi
echo "🧪 Test ricevuta con dati completamente freschi..."

# URL dell'API
API_URL="https://nutragenix-fatture.vercel.app/api/receipts"

# Genera un ID ordine completamente unico
RANDOM_ID=$(openssl rand -hex 8)
TIMESTAMP=$(date +%s)
ORDER_ID="FRESH_${TIMESTAMP}_${RANDOM_ID}"
ORDER_NUMBER="FRESH-${TIMESTAMP}"

# Genera la data corrente in formato ISO
CURRENT_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "📅 Data test: $CURRENT_DATE"
echo "🆔 ID Ordine: $ORDER_ID"
echo "📋 Numero Ordine: $ORDER_NUMBER"

# Dati della ricevuta di test con prodotti diversi
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Test-Script/1.0" \
  -v \
  -d '{
    "id": "'$ORDER_ID'",
    "name": "#'$ORDER_NUMBER'",
    "order_number": "'$ORDER_NUMBER'",
    "created_at": "'$CURRENT_DATE'",
    "currency": "EUR",
    "total_price": "45.99",
    "subtotal_price": "39.99",
    "total_discounts": "0.00",
    "total_tax": "3.64",
    "total_shipping_price_set": {
      "shop_money": {
        "amount": "6.00",
        "currency_code": "EUR"
      }
    },
    "financial_status": "paid",
    "payment_gateway_names": ["stripe"],
    "customer": {
      "first_name": "Luca",
      "last_name": "Bianchi",
      "email": "gabriprb@me.com",
      "phone": "+39 987 654 3210"
    },
    "billing_address": {
      "first_name": "Luca",
      "last_name": "Bianchi",
      "address1": "Via Milano 456",
      "city": "Milano",
      "province": "MI",
      "province_code": "MI",
      "zip": "20100",
      "country": "Italy",
      "country_code": "IT"
    },
    "line_items": [
      {
        "id": 987654321,
        "title": "Omega-3 Premium",
        "quantity": 1,
        "price": "39.99",
        "sku": "OM3P124",
        "product_id": 9876543210
      }
    ],
    "shipping_lines": [
      {
        "id": 456789012,
        "title": "Spedizione Express",
        "price": "6.00",
        "code": "express",
        "source": "shopify"
      }
    ],
    "discount_applications": []
  }'

echo ""
echo "✅ Test completato!"
echo "🔍 Controlla ora il tuo account Fatture in Cloud per vedere la ricevuta"
echo "📧 Dovresti anche ricevere una email di conferma"
echo ""
echo "📊 Importi attesi nella ricevuta:"
echo "   - Subtotale prodotti: €39.99"
echo "   - Spedizione: €6.00"
echo "   - Totale: €45.99"