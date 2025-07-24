#!/bin/bash

echo "🚀 TEST NUOVO ID - Ricevuta su Vercel"
echo "====================================="

# URL del deployment Vercel
VERCEL_URL="https://nutragenix-fatture.vercel.app"

# Genera un ID univoco basato sul timestamp
UNIQUE_ID=$(date +%s)$((RANDOM % 9999 + 1000))
CURRENT_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "📅 Data test: $CURRENT_DATE"
echo "🆔 ID univoco: $UNIQUE_ID"
echo "📤 Invio ordine di test a Vercel..."

# Test con ID completamente nuovo e dati corretti da Shopify
curl -X POST "${VERCEL_URL}/api/receipts" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Topic: orders/paid" \
  -H "X-Shopify-Shop-Domain: test-shop.myshopify.com" \
  -d "{
    \"id\": $UNIQUE_ID,
    \"order_number\": \"TEST-$UNIQUE_ID\",
    \"created_at\": \"$CURRENT_DATE\",
    \"total_price\": \"76.50\",
    \"subtotal_price\": \"85.00\",
    \"total_discounts\": \"8.50\",
    \"currency\": \"EUR\",
    \"financial_status\": \"paid\",
    \"customer\": {
      \"first_name\": \"Mario\",
      \"last_name\": \"Rossi\",
      \"email\": \"gabriprb@me.com\",
      \"phone\": \"+39 123 456 7890\"
    },
    \"billing_address\": {
      \"first_name\": \"Mario\",
      \"last_name\": \"Rossi\",
      \"address1\": \"Via Roma 123\",
      \"city\": \"Roma\",
      \"province\": \"RM\",
      \"zip\": \"00100\",
      \"country\": \"Italy\"
    },
    \"line_items\": [
      {
        \"id\": 123456,
        \"title\": \"B-Complex Energy\",
        \"quantity\": 1,
        \"price\": \"27.62\"
      },
      {
        \"id\": 123457,
        \"title\": \"Vitamina C Liposomiale\",
        \"quantity\": 1,
        \"price\": \"29.75\"
      },
      {
        \"id\": 123458,
        \"title\": \"Vitamina D3 + K2\",
        \"quantity\": 1,
        \"price\": \"27.63\"
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
    \"discount_codes\": [
      {
        \"code\": \"elli10\",
        \"amount\": \"8.50\",
        \"type\": \"percentage\"
      }
    ],
    \"payment_gateway_names\": [\"paypal\"],
    \"gateway\": \"paypal\"
  }"

echo ""
echo "✅ Test completato!"
echo "🔍 Controlla ora il tuo account Fatture in Cloud per vedere la ricevuta"
echo "📧 Dovresti anche ricevere una email di conferma"