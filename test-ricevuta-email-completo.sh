#!/bin/bash

# Test completo: creazione ricevuta + verifica sistema email
echo "🧪 Test completo sistema ricevute con email..."
echo "================================================"

# URL dell'API
API_URL="https://nutra-backup.vercel.app/api/receipts"

# Genera un ID univoco per il test
TEST_ID=$(date +%s)
ORDER_NUMBER="TEST-EMAIL-$TEST_ID"

# Genera la data corrente in formato ISO
CURRENT_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "📅 Data test: $CURRENT_DATE"
echo "🆔 Order ID: $TEST_ID"
echo "📋 Order Number: $ORDER_NUMBER"
echo ""

echo "1️⃣ Creazione ricevuta di test..."
echo "📧 Email destinatario: gabriprb@me.com"
echo ""

# Dati della ricevuta di test con email specifica
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Test-Script/1.0" \
  -w "\n%{http_code}" \
  -d '{
    "id": '$TEST_ID',
    "name": "#'$ORDER_NUMBER'",
    "order_number": "'$ORDER_NUMBER'",
    "created_at": "'$CURRENT_DATE'",
    "currency": "EUR",
    "total_price": "99.90",
    "total_discounts": "0.00",
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
        "title": "Prodotto Test Email",
        "quantity": 1,
        "price": "99.90",
        "total_discount": "0.00",
        "sku": "TEST-EMAIL-SKU"
      }
    ]
  }')

# Estrai il codice di stato HTTP
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)

echo "📊 Codice risposta HTTP: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Ricevuta creata con successo!"
    echo ""
    echo "📄 Dettagli risposta:"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
    echo ""
    
    # Estrai informazioni dalla risposta
    RECEIPT_ID=$(echo "$RESPONSE_BODY" | jq -r '.receipt.data.id // "N/A"' 2>/dev/null)
    RECEIPT_NUMBER=$(echo "$RESPONSE_BODY" | jq -r '.receipt.data.number // "N/A"' 2>/dev/null)
    PAYMENT_STATUS=$(echo "$RESPONSE_BODY" | jq -r '.payment_status // "N/A"' 2>/dev/null)
    EMAIL_STATUS=$(echo "$RESPONSE_BODY" | jq -r '.email.success // "N/A"' 2>/dev/null)
    EMAIL_REASON=$(echo "$RESPONSE_BODY" | jq -r '.email.reason // "N/A"' 2>/dev/null)
    
    echo "📋 Riepilogo:"
    echo "   - ID Ricevuta: $RECEIPT_ID"
    echo "   - Numero Ricevuta: $RECEIPT_NUMBER"
    echo "   - Stato Pagamento: $PAYMENT_STATUS"
    echo "   - Email Inviata: $EMAIL_STATUS"
    if [ "$EMAIL_STATUS" = "false" ]; then
        echo "   - Motivo: $EMAIL_REASON"
    fi
    echo ""
    
    echo "2️⃣ Stato del sistema email:"
    if [ "$EMAIL_STATUS" = "false" ] && [[ "$EMAIL_REASON" == *"webhook"* ]]; then
        echo "✅ Sistema webhook attivo - Email sarà inviata quando PDF è pronto"
        echo "📧 Controlla gabriprb@me.com nei prossimi minuti"
        echo "🔔 Fatture in Cloud invierà un webhook quando il PDF è generato"
    elif [ "$EMAIL_STATUS" = "true" ]; then
        echo "✅ Email inviata immediatamente"
        echo "📧 Controlla gabriprb@me.com per la ricevuta"
    else
        echo "⚠️ Email non configurata o disabilitata"
        echo "📧 Motivo: $EMAIL_REASON"
    fi
    
else
    echo "❌ Errore nella creazione della ricevuta!"
    echo "📄 Risposta:"
    echo "$RESPONSE_BODY"
fi

echo ""
echo "✅ Test completato!"
echo ""
echo "📋 Prossimi passi:"
echo "   1. Controlla l'email gabriprb@me.com"
echo "   2. Verifica la ricevuta su Fatture in Cloud"
echo "   3. Se il sistema webhook è attivo, l'email arriverà quando il PDF è pronto"
echo "   4. Monitora i log per eventuali errori"