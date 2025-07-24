#!/bin/bash

# Script per configurare le variabili d'ambiente su Vercel
# Esegui: chmod +x deploy-env.sh && ./deploy-env.sh

echo "🚀 Configurazione variabili d'ambiente per Vercel..."

# Verifica se il progetto è già collegato
if [ ! -d ".vercel" ]; then
    echo "📝 Effettua il login a Vercel se richiesto..."
    vercel login
    
    echo "🔗 Collegamento al progetto Vercel..."
    vercel link
fi

echo "📧 Configurazione variabili email SMTP..."

# Funzione per aggiungere variabili d'ambiente
add_env_var() {
    local name=$1
    local value=$2
    echo "Aggiungendo $name..."
    echo "$value" | vercel env add "$name" production
    echo "$value" | vercel env add "$name" preview  
    echo "$value" | vercel env add "$name" development
}

# Configurazione variabili email SMTP
add_env_var "EMAIL_ENABLED" "true"
add_env_var "EMAIL_PROVIDER" "smtp"
add_env_var "SMTP_HOST" "smtps.aruba.it"
add_env_var "SMTP_PORT" "465"
add_env_var "SMTP_SECURE" "true"
add_env_var "SMTP_USER" "info@nutragenix.it"
add_env_var "SMTP_PASSWORD" "Ja\$\$23-lovelife"
add_env_var "EMAIL_FROM" "info@nutragenix.it"
add_env_var "EMAIL_FROM_NAME" "NutraGenix Integrazione Innovativa"

echo "⚙️ Configurazione email avanzata..."
add_env_var "EMAIL_ATTACH_PDF" "true"
add_env_var "EMAIL_CC_ENABLED" "false"
add_env_var "EMAIL_CC_ADDRESS" ""
add_env_var "EMAIL_SUBJECT" "{document_type} {document_number} - NutraGenix"
add_env_var "EMAIL_TEMPLATE" "Gentile {customer_name},\n\nLa ringraziamo per aver scelto NutraGenix.\n\nIn allegato trova la {document_type} n. {document_number} del {date} per l'importo di € {amount}.\n\nDettagli del documento:\n• Tipo: {document_type}\n• Numero: {document_number}\n• Data: {date}\n• Importo: € {amount}\n\nPer qualsiasi domanda o chiarimento, non esiti a contattarci.\n\nCordiali saluti,\nIl Team di NutraGenix\n\n---\nQuesta è una email automatica generata dal sistema di fatturazione."

echo "✅ Configurazione completata!"
echo "🚀 Ora puoi fare il deploy con: vercel --prod"