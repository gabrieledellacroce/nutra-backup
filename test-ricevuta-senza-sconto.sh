#!/bin/bash

# Test ricevuta senza sconto
echo "🧪 Test ricevuta SENZA sconto..."

curl -X POST https://nutragenix-fatture.vercel.app/api/receipts \
  -H "Content-Type: application/json" \
  -d '{
    "id": 999999999,
    "order_number": "TEST-NO-DISCOUNT-001",
    "email": "gabriele.dellacroce@fuzzymarketing.it",
    "created_at": "2025-07-22T15:50:00Z",
    "currency": "EUR",
    "current_subtotal_price": "85.00",
    "current_total_price": "85.00",
    "current_total_discounts": "0.00",
    "customer": {
      "id": 123456789,
      "email": "gabriele.dellacroce@fuzzymarketing.it",
      "first_name": "Test",
      "last_name": "User"
    },
    "total_shipping_price_set": {
      "shop_money": {
        "amount": "0.00",
        "currency_code": "EUR"
      }
    },
    "shipping_address": {
      "first_name": "Test",
      "last_name": "User",
      "address1": "Via Test 123",
      "city": "Milano",
      "province": "MI",
      "zip": "20100",
      "country": "Italy"
    },
    "line_items": [
      {
        "id": 1,
        "title": "B-Complex Energy",
        "quantity": 1,
        "price": "27.62",
        "sku": "BC0024",
        "variant_title": null
      },
      {
        "id": 2,
        "title": "Vitamina C Liposomiale",
        "quantity": 1,
        "price": "29.75",
        "sku": "VTC104",
        "variant_title": null
      },
      {
        "id": 3,
        "title": "Vitamina D3 + K2",
        "quantity": 1,
        "price": "27.63",
        "sku": "DK124",
        "variant_title": null
      }
    ],
    "discount_codes": [],
    "financial_status": "paid",
    "total_price": "85.00"
  }'

echo ""
echo "✅ Test senza sconto completato!"
echo "🔍 Controlla ora il tuo account Fatture in Cloud per vedere la ricevuta"
echo "📊 Dati inviati:"
echo "   - Subtotale: €85.00"
echo "   - Sconto: €0.00"
echo "   - Totale: €85.00"
echo "   - Spedizione: €0.00"