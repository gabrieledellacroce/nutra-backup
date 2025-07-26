#!/bin/bash

echo "🚀 TEST SEMPLICE - Ricevuta su Vercel"
echo "====================================="

# URL del tuo deployment Vercel
VERCEL_URL="https://nutra-backup.vercel.app"

echo "📤 Invio ordine di test a Vercel..."

# Simula un ordine Shopify semplice
curl -X POST "${VERCEL_URL}/api/receipts" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Topic: orders/paid" \
  -H "X-Shopify-Shop-Domain: test-shop.myshopify.com" \
  -d '{
    "id": 999888777,
    "order_number": "TEST-001",
    "created_at": "2025-07-17T10:00:00Z",
    "total_price": "129.99",
    "currency": "EUR",
    "financial_status": "paid",
    "customer": {
      "first_name": "Mario",
      "last_name": "Rossi",
      "email": "mario.rossi@test.com",
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
        "price": "129.99",
        "sku": "NUTRA001"
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
    "payment_gateway_names": ["paypal"],
    "gateway": "paypal"
  }'

echo ""
echo "✅ Test completato!"
echo "🔍 Controlla ora il tuo account Fatture in Cloud per vedere la ricevuta"
echo "📧 Dovresti anche ricevere una email di conferma"