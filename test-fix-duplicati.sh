#!/bin/bash

echo "🔧 TEST CORREZIONE DUPLICATI E IMPORTI"
echo "======================================"

# URL del tuo deployment Vercel
VERCEL_URL="https://nutra-backup.vercel.app"

echo "📤 Test 1: Ordine con importi corretti..."

# Test con l'ordine che aveva problemi di importo
curl -X POST "${VERCEL_URL}/api/receipts" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Topic: orders/paid" \
  -H "X-Shopify-Shop-Domain: nutragenix.myshopify.com" \
  -d '{
    "id": 5678901234,
    "name": "#TEST-2025-001",
    "order_number": "TEST-2025-001",
    "created_at": "2025-07-18T10:30:00Z",
    "total_price": "74.50",
    "currency": "EUR",
    "financial_status": "paid",
    "payment_gateway_names": ["paypal"],
    "customer": {
      "id": 7890123456,
      "email": "gabriprb@me.com",
      "first_name": "Mario",
      "last_name": "Rossi",
      "phone": "+39 333 1234567"
    },
    "billing_address": {
      "first_name": "Mario",
      "last_name": "Rossi",
      "address1": "Via Roma 123",
      "city": "Milano",
      "province": "MI",
      "country": "Italy",
      "zip": "20100",
      "phone": "+39 333 1234567"
    },
    "line_items": [
      {
        "id": 13579246810,
        "title": "NutraGenix Omega-3 Premium",
        "quantity": 2,
        "price": "29.90"
      },
      {
        "id": 24681357902,
        "title": "NutraGenix Vitamina D3",
        "quantity": 1,
        "price": "14.70"
      }
    ]
  }'

echo ""
echo "⏳ Aspetto 3 secondi..."
sleep 3

echo "📤 Test 2: Stesso ordine (dovrebbe essere bloccato come duplicato)..."

# Stesso ordine - dovrebbe essere bloccato
curl -X POST "${VERCEL_URL}/api/receipts" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Topic: orders/paid" \
  -H "X-Shopify-Shop-Domain: nutragenix.myshopify.com" \
  -d '{
    "id": 5678901234,
    "name": "#TEST-2025-001",
    "order_number": "TEST-2025-001",
    "created_at": "2025-07-18T10:30:00Z",
    "total_price": "74.50",
    "currency": "EUR",
    "financial_status": "paid",
    "payment_gateway_names": ["paypal"],
    "customer": {
      "id": 7890123456,
      "email": "gabriprb@me.com",
      "first_name": "Mario",
      "last_name": "Rossi",
      "phone": "+39 333 1234567"
    },
    "billing_address": {
      "first_name": "Mario",
      "last_name": "Rossi",
      "address1": "Via Roma 123",
      "city": "Milano",
      "province": "MI",
      "country": "Italy",
      "zip": "20100"
    },
    "line_items": [
      {
        "id": 13579246810,
        "title": "NutraGenix Omega-3 Premium",
        "quantity": 2,
        "price": "29.90"
      },
      {
        "id": 24681357902,
        "title": "NutraGenix Vitamina D3",
        "quantity": 1,
        "price": "14.70"
      }
    ]
  }'

echo ""
echo "✅ Test completato!"
echo ""
echo "🔍 VERIFICA RISULTATI:"
echo "1. La prima ricevuta dovrebbe avere importo CORRETTO: €74,50"
echo "2. La seconda chiamata dovrebbe essere BLOCCATA come duplicato"
echo "3. Controlla i log di Vercel per vedere i calcoli dettagliati"