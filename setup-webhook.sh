#!/bin/bash

# 🎯 Script per configurare i webhook di Fatture in Cloud
# Questo script configura automaticamente la subscription webhook
# per ricevere notifiche sulle ricevute

set -e  # Esce in caso di errore

echo "🎯 Setup Webhook Fatture in Cloud"
echo "=================================="

# Controlla se il file .env esiste
if [ ! -f ".env.prod" ]; then
    echo "❌ Errore: File .env.prod non trovato"
    echo "💡 Assicurati di essere nella directory del progetto e di avere il file .env.prod configurato"
    exit 1
fi

# Carica le variabili d'ambiente
echo "📋 Caricamento variabili d'ambiente..."
source .env.prod

# Controlla le variabili richieste
if [ -z "$FATTURE_IN_CLOUD_ACCESS_TOKEN" ]; then
    echo "❌ Errore: FATTURE_IN_CLOUD_ACCESS_TOKEN non configurato in .env.prod"
    echo "💡 Nota: Questa variabile deve essere ottenuta tramite OAuth2 flow"
    echo "🔧 Esegui prima: node get_token.js per ottenere il token"
    exit 1
fi

if [ -z "$FIC_COMPANY_ID" ]; then
    echo "❌ Errore: FIC_COMPANY_ID non configurato in .env.prod"
    exit 1
fi

echo "✅ Variabili d'ambiente caricate correttamente"
echo "📍 Company ID: $FIC_COMPANY_ID"
echo "🔗 Webhook URL: ${WEBHOOK_URL:-'https://nutragenix-fatture-qlzulkde3-gabrieledellacroce-2606s-projects.vercel.app/api/webhook'}"

# Esegue lo script Node.js
echo "\n🚀 Avvio configurazione webhook..."
node setup-webhook.js

echo "\n✅ Setup webhook completato!"
echo "\n📝 Prossimi passi:"
echo "1. Testa il webhook con: ./test-webhook-email.sh"
echo "2. Crea una ricevuta di test con: ./test-ricevuta-email-completo.sh"
echo "3. Controlla i log su Vercel: vercel logs"
echo "\n🔧 Altri comandi utili:"
echo "- Lista subscription: node setup-webhook.js --list"
echo "- Elimina subscription: node setup-webhook.js --delete <ID>"
echo "- Aiuto: node setup-webhook.js --help"