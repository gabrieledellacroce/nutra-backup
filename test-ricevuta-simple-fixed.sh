#!/bin/bash

# Test con numero ricevuta fisso molto alto per evitare conflitti
echo "🧪 Test ricevuta con numero fisso alto..."

# URL dell'API
API_URL="https://nutragenix-fatture.vercel.app/api/receipts"

# Genera un ID ordine unico
RANDOM_ID=$(openssl rand -hex 8)
TIMESTAMP=$(date +%s)
ORDER_ID="FIXED_${TIMESTAMP}_${RANDOM_ID}"
ORDER_NUMBER="FIXED-${TIMESTAMP}"

# Genera la data corrente in formato ISO
CURRENT_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "📅 Data test: $CURRENT_DATE"
echo "🆔 ID Ordine: $ORDER_ID"
echo "📋 Numero Ordine: $ORDER_NUMBER"

# Test molto semplice con un solo prodotto
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
    "total_price": "33.00",
    "subtotal_price": "30.00",
    "total_discounts": "0.00",
    "total_tax": "2.73",
    "total_shipping_price_set": {
      "shop_money": {
        "amount": "3.00",
        "currency_code": "EUR"
      }
    },
    "financial_status": "pending",
    "payment_gateway_names": ["manual"],
    "customer": {
      "first_name": "Test",
      "last_name": "User",
      "email": "gabriprb@me.com",
      "phone": "+39 123 456 7890"
    },
    "billing_address": {
      "first_name": "Test",
      "last_name": "User",
      "address1": "Via Test 123",
      "city": "Roma",
      "province": "RM",
      "province_code": "RM",
      "zip": "00100",
      "country": "Italy",
      "country_code": "IT"
    },
    "line_items": [
      {
        "id": 111111111,
        "title": "Prodotto Test",
        "quantity": 1,
        "price": "30.00",
        "sku": "TEST123",
        "product_id": 1111111111
      }
    ],
    "shipping_lines": [
      {
        "id": 222222222,
        "title": "Spedizione Test",
        "price": "3.00",
        "code": "test",
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
echo "   - Subtotale prodotti: €30.00"
echo "   - Spedizione: €3.00"
echo "   - Totale: €33.00"