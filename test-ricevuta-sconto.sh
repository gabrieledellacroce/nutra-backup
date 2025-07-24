#!/bin/bash

echo "🚀 TEST RICEVUTA CON SCONTO - Vercel"
echo "==================================="

# URL del tuo deployment Vercel
VERCEL_URL="https://nutragenix-fatture-qlzulkde3-gabrieledellacroce-2606s-projects.vercel.app"

# Genera la data corrente in formato ISO
CURRENT_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "📅 Data test: $CURRENT_DATE"

echo "📤 Invio ordine di test con sconto a Vercel..."

# Simula un ordine Shopify con sconto
curl -X POST "${VERCEL_URL}/api/receipts" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Topic: orders/paid" \
  -H "X-Shopify-Shop-Domain: test-shop.myshopify.com" \
  -d '{
    "id": 999888778,
    "order_number": "TEST-SCONTO-001",
    "created_at": "'$CURRENT_DATE'",
    "total_price": "116.99",
    "total_discounts": "23.00",
    "currency": "EUR",
    "financial_status": "paid",
    "customer": {
      "first_name": "Mario",
      "last_name": "Rossi",
      "email": "gabriprb@me.com",
      "phone": "+39 123 456 7890"
    },
    "billing_address": {
      "first_name": "Mario",
      "last_name": "Rossi",
      "address1": "Via Roma 123",
      "city": "Roma",
      "province": "RM",
      "zip": "00100",
      "country": "Italy"
    },
    "line_items": [
      {
        "id": 123456,
        "title": "Integratore Nutragenix Premium",
        "quantity": 1,
        "price": "107.00",
        "sku": "NUTRA001",
        "discount_allocations": [
          {
            "amount": "23.00",
            "discount_application_index": 0
          }
        ]
      }
    ],
    "shipping_lines": [
      {
        "id": 789012,
        "title": "Spedizione Standard",
        "price": "9.99",
        "code": "standard",
        "source": "shopify"
      }
    ],
    "discount_applications": [
      {
        "type": "discount_code",
        "value": "23.00",
        "value_type": "fixed_amount",
        "allocation_method": "across",
        "target_selection": "all",
        "target_type": "line_item",
        "code": "SCONTO20",
        "title": "Sconto 20%",
        "index": 0
      }
    ],
    "payment_gateway_names": ["paypal"],
    "gateway": "paypal"
  }'

echo ""
echo "✅ Test completato!"
echo "🔍 Controlla ora il tuo account Fatture in Cloud per vedere la ricevuta con sconto"
echo "📧 Dovresti anche ricevere una email di conferma"