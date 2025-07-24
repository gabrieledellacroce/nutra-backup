#!/bin/bash

echo "🚀 TEST RICEVUTA CORRETTA - Vercel"
echo "=================================="

# URL del deployment aggiornato
VERCEL_URL="https://nutragenix-fatture-ivyfut6py-gabrieledellacroce-2606s-projects.vercel.app"

# Genera la data corrente in formato ISO
CURRENT_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "📅 Data test: $CURRENT_DATE"

echo "📤 Invio ordine di test con struttura corretta..."

# Simula un ordine Shopify realistico con tutti i campi necessari
curl -X POST "${VERCEL_URL}/api/receipts" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Topic: orders/paid" \
  -H "X-Shopify-Shop-Domain: test-shop.myshopify.com" \
  -d '{
    "id": 999888777666,
    "order_number": "TEST-CORRETTO-001",
    "name": "#TEST-001",
    "created_at": "'$CURRENT_DATE'",
    "total_price": "76.50",
    "subtotal_price": "66.51",
    "total_discounts": "8.50",
    "total_tax": "6.95",
    "total_shipping_price_set": {
      "shop_money": {
        "amount": "9.99",
        "currency_code": "EUR"
      }
    },
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
      "province_code": "RM",
      "zip": "00100",
      "country": "Italy",
      "country_code": "IT"
    },
    "line_items": [
      {
        "id": 123456789,
        "title": "B-Complex Energy",
        "quantity": 1,
        "price": "27.62",
        "sku": "BC024",
        "product_id": 7891234567
      },
      {
        "id": 123456790,
        "title": "Vitamina C Liposomiale",
        "quantity": 1,
        "price": "29.75",
        "sku": "VTC124",
        "product_id": 7891234568
      },
      {
        "id": 123456791,
        "title": "Vitamina D3 + K2",
        "quantity": 1,
        "price": "27.63",
        "sku": "DK124",
        "product_id": 7891234569
      }
    ],
    "shipping_lines": [
      {
        "id": 789012345,
        "title": "Spedizione Standard",
        "price": "9.99",
        "code": "standard",
        "source": "shopify"
      }
    ],
    "discount_applications": [
      {
        "type": "discount_code",
        "value": "8.50",
        "value_type": "fixed_amount",
        "allocation_method": "across",
        "target_selection": "all",
        "target_type": "line_item",
        "code": "SCONTO10",
        "title": "Sconto 10%",
        "index": 0
      }
    ],
    "payment_gateway_names": ["paypal"],
    "gateway": "paypal"
  }'

echo ""
echo "✅ Test completato!"
echo "🔍 Controlla ora il tuo account Fatture in Cloud per vedere la ricevuta corretta"
echo "📧 Dovresti anche ricevere una email di conferma"
echo ""
echo "📊 Importi attesi nella ricevuta:"
echo "   - Subtotale prodotti: €66.51 (già al netto dello sconto)"
echo "   - Spedizione: €9.99 (nel riepilogo)"
echo "   - Sconto: €8.50 (nel riepilogo)"
echo "   - Totale: €76.50"