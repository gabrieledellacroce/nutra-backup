#!/bin/bash

# Script per registrare webhook con Fatture in Cloud
# Versione finale con endpoint pubblico

# Configurazione
FIC_CLIENT_ID="AVJTKw2gBVhQRJO6VL6EXjl4nOkYfK4z"
FIC_CLIENT_SECRET="bEhVUmJHWHVZbVJoYkdGamNtOWpaUzVwZEE9PQ=="
FIC_COMPANY_ID="1268058"

# IMPORTANTE: Inserisci qui un token OAuth2 valido
# Puoi ottenerlo da: https://nutragenix-fatture-qjnb5ou0n-gabrieledellacroce-2606s-projects.vercel.app/api/auth
ACCESS_TOKEN="YOUR_VALID_TOKEN_HERE"

# URL del webhook (aggiornato dopo il deploy su Vercel)
WEBHOOK_URL="https://nutragenix-fatture-qjnb5ou0n-gabrieledellacroce-2606s-projects.vercel.app/api/webhook"

echo "🚀 Registrando webhook per le ricevute..."
echo "🎯 URL: $WEBHOOK_URL"
echo "🏢 Company ID: $FIC_COMPANY_ID"
echo ""

# Verifica che il token sia stato inserito
if [ "$ACCESS_TOKEN" = "YOUR_VALID_TOKEN_HERE" ]; then
    echo "❌ ERRORE: Devi inserire un token OAuth2 valido!"
    echo "📋 Vai su: https://nutragenix-fatture-qjnb5ou0n-gabrieledellacroce-2606s-projects.vercel.app/api/auth"
    echo "🔑 Copia il token e sostituisci YOUR_VALID_TOKEN_HERE nello script"
    exit 1
fi

# Registra il webhook
response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "sink": "'$WEBHOOK_URL'",
      "verified": true,
      "types": [
        "it.fattureincloud.webhooks.issued_documents.receipts.create",
        "it.fattureincloud.webhooks.issued_documents.receipts.update"
      ]
    }
  }' \
  "https://api-v2.fattureincloud.it/$FIC_COMPANY_ID/webhooks_subscriptions")

# Estrai il codice HTTP
http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')

echo "📊 Codice HTTP: $http_code"
echo "📄 Risposta: $body"
echo ""

if [ $http_code -eq 200 ] || [ $http_code -eq 201 ]; then
    echo "✅ WEBHOOK REGISTRATO CON SUCCESSO!"
    echo "🎉 Il sistema è ora pronto per ricevere notifiche dalle ricevute"
    echo ""
    echo "📋 Dettagli webhook:"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
    echo "❌ ERRORE nella registrazione del webhook"
    echo ""
    echo "📋 Dettagli errore: $body"
    
    if [ $http_code -eq 401 ]; then
        echo ""
        echo "🔑 Il token è scaduto o non valido!"
        echo "📋 Ottieni un nuovo token da: https://nutragenix-fatture-qjnb5ou0n-gabrieledellacroce-2606s-projects.vercel.app/api/auth"
    fi
fi