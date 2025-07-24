#!/bin/bash

echo "🚀 TEST CON SCONTO - Ricevuta su Vercel"
echo "======================================"

# URL del deployment Vercel
VERCEL_URL="https://nutragenix-fatture.vercel.app"

# Genera un ID univoco basato sul timestamp
UNIQUE_ID=$(date +%s)$((RANDOM % 9999 + 1000))
CURRENT_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "📅 Data test: $CURRENT_DATE"
echo "🆔 ID univoco: $UNIQUE_ID"
echo "📤 Invio ordine di test con SCONTO a Vercel..."

# Test con sconto come negli screenshot
curl -X POST "${VERCEL_URL}/api/receipts" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Topic: orders/paid" \
  -H "X-Shopify-Shop-Domain: test-shop.myshopify.com" \
  -d "{
    \"id\": $UNIQUE_ID,
    \"order_number\": \"TEST-$UNIQUE_ID\",
    \"name\": \"#2014\",
    \"created_at\": \"$CURRENT_DATE\",
    \"total_price\": \"76.50\",
    \"subtotal_price\": \"85.00\",
    \"total_discounts\": \"8.50\",
    \"currency\": \"EUR\",
    \"financial_status\": \"paid\",
    \"customer\": {
      \"first_name\": \"Gabriel\",
      \"last_name\": \"Della Croce\",
      \"email\": \"gabriele.dellacroce@fuzzymarketing.it\",
      \"phone\": \"+39 345 697 2192\"
    },
    \"billing_address\": {
      \"first_name\": \"Gabriel\",
      \"last_name\": \"Della Croce\",
      \"address1\": \"Via per Chiatri 570\",
      \"city\": \"Lucca\",
      \"province\": \"LU\",
      \"zip\": \"55100\",
      \"country\": \"Italy\"
    },
    \"line_items\": [
      {
        \"id\": 123456,
        \"title\": \"B-Complex Energy\",
        \"sku\": \"BCO/24\",
        \"quantity\": 1,
        \"price\": \"27.62\"
      },
      {
        \"id\": 123457,
        \"title\": \"Vitamina C Liposomiale\",
        \"sku\": \"VITC/24\",
        \"quantity\": 1,
        \"price\": \"29.75\"
      },
      {
        \"id\": 123458,
        \"title\": \"Vitamina D3 + K2\",
        \"sku\": \"DK/24\",
        \"quantity\": 1,
        \"price\": \"27.63\"
      }
    ],
    \"discount_codes\": [
      {
        \"code\": \"elli10\",
        \"amount\": \"8.50\",
        \"type\": \"percentage\"
      }
    ],
    \"discount_applications\": [
      {
        \"type\": \"discount_code\",
        \"value\": \"8.50\",
        \"value_type\": \"fixed_amount\",
        \"allocation_method\": \"across\",
        \"target_selection\": \"all\",
        \"target_type\": \"line_item\",
        \"description\": \"elli10\",
        \"title\": \"elli10\"
      }
    ],
    \"shipping_lines\": [
      {
        \"id\": 789012,
        \"title\": \"Standard\",
        \"price\": \"0.00\",
        \"code\": \"standard\"
      }
    ],
    \"payment_gateway_names\": [\"Bank Deposit\"],
    \"gateway\": \"bank_deposit\"
  }"

echo ""
echo "✅ Test con sconto completato!"
echo "🔍 Controlla ora il tuo account Fatture in Cloud per vedere la ricevuta"
echo "📊 Dati inviati:"
echo "   - Subtotale: €85.00"
echo "   - Sconto: €8.50 (elli10)"
echo "   - Totale: €76.50"
echo "   - Spedizione: €0.00"