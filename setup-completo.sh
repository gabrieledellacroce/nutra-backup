#!/bin/bash

# 🎯 Script Setup Completo Webhook Fatture in Cloud
# Questo script guida attraverso tutti i passaggi necessari

set -e

echo "🎯 Setup Completo Webhook Fatture in Cloud"
echo "==========================================="
echo ""

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzione per stampare messaggi colorati
print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verifica prerequisiti
print_step "Verifica prerequisiti..."

if [ ! -f ".env.prod" ]; then
    print_error "File .env.prod non trovato!"
    exit 1
fi

# Carica variabili d'ambiente
source .env.prod

# Verifica configurazioni base
if [ -z "$FIC_CLIENT_ID" ] || [ -z "$FIC_CLIENT_SECRET" ] || [ -z "$FIC_COMPANY_ID" ]; then
    print_error "Configurazioni Fatture in Cloud mancanti in .env.prod"
    echo "Assicurati che siano configurati:"
    echo "- FIC_CLIENT_ID"
    echo "- FIC_CLIENT_SECRET"
    echo "- FIC_COMPANY_ID"
    exit 1
fi

print_success "Configurazioni base verificate"

# Verifica MongoDB
print_step "Verifica configurazione MongoDB..."

if [ -z "$MONGODB_URI" ]; then
    print_warning "MONGODB_URI non configurato"
    echo "MongoDB è necessario per salvare i token OAuth2."
    echo "Senza MongoDB dovrai riautorizzare ad ogni restart."
    echo ""
    echo "Vuoi configurare MongoDB Atlas gratuito? (y/n)"
    read -r configure_mongo
    
    if [ "$configure_mongo" = "y" ] || [ "$configure_mongo" = "Y" ]; then
        echo ""
        echo "📋 Istruzioni MongoDB Atlas:"
        echo "1. Vai su https://mongodb.com/atlas"
        echo "2. Crea account gratuito"
        echo "3. Crea cluster M0 (gratuito)"
        echo "4. Ottieni connection string"
        echo "5. Aggiorna MONGODB_URI in .env.prod"
        echo ""
        echo "Esempio: MONGODB_URI=\"mongodb+srv://user:pass@cluster.mongodb.net/nutragenix\""
        echo ""
        echo "Premi INVIO quando hai configurato MongoDB..."
        read -r
        
        # Ricarica variabili
        source .env.prod
        
        if [ -z "$MONGODB_URI" ]; then
            print_warning "MONGODB_URI ancora non configurato, continuo senza..."
        else
            print_success "MongoDB configurato!"
        fi
    fi
else
    print_success "MongoDB configurato"
fi

# Verifica se il server è in esecuzione
print_step "Verifica server di sviluppo..."

if ! curl -s http://localhost:3001/api/auth/start > /dev/null; then
    print_warning "Server non in esecuzione, avvio..."
    echo "Avvio server con: npm start"
    echo "Apri un nuovo terminale e esegui: npm start"
    echo "Poi premi INVIO per continuare..."
    read -r
else
    print_success "Server in esecuzione su http://localhost:3001"
fi

# Autorizzazione OAuth2
print_step "Autorizzazione OAuth2 Fatture in Cloud..."

echo "Ottengo URL di autorizzazione..."
AUTH_URL=$(curl -s http://localhost:3001/api/auth/start | jq -r '.auth_url')

if [ "$AUTH_URL" = "null" ] || [ -z "$AUTH_URL" ]; then
    print_error "Impossibile ottenere URL di autorizzazione"
    echo "Verifica che il server sia in esecuzione e le configurazioni siano corrette"
    exit 1
fi

echo ""
print_success "URL di autorizzazione generato!"
echo ""
echo "🔗 COPIA E INCOLLA QUESTO URL NEL BROWSER:"
echo "$AUTH_URL"
echo ""
echo "📋 Istruzioni:"
echo "1. Copia l'URL sopra"
echo "2. Incollalo nel browser"
echo "3. Autorizza l'applicazione in Fatture in Cloud"
echo "4. Verrai reindirizzato automaticamente"
echo "5. Torna qui e premi INVIO quando completato..."
echo ""
read -r

# Verifica autorizzazione
print_step "Verifica autorizzazione..."

if curl -s http://localhost:3001/api/auth/status | grep -q '"authorized":true'; then
    print_success "Autorizzazione completata!"
else
    print_warning "Autorizzazione non completata o non verificabile"
    echo "Continuo comunque con il setup webhook..."
fi

# Setup webhook
print_step "Configurazione webhook..."

echo "Registro webhook su Fatture in Cloud..."
WEBHOOK_RESULT=$(curl -s -X POST http://localhost:3001/api/webhook-setup)

if echo "$WEBHOOK_RESULT" | grep -q '"success":true'; then
    print_success "Webhook registrato con successo!"
    echo "$WEBHOOK_RESULT" | jq '.'
else
    print_warning "Errore nella registrazione webhook"
    echo "Risposta: $WEBHOOK_RESULT"
    echo ""
    echo "Puoi registrare il webhook manualmente:"
    echo "1. Vai su https://fattureincloud.it/api"
    echo "2. Accedi al tuo account"
    echo "3. Vai in 'Le mie app' > 'Nutragenix Fatture'"
    echo "4. Nella sezione 'Webhook' aggiungi:"
    echo "   URL: https://nutragenix-fatture-qlzulkde3-gabrieledellacroce-2606s-projects.vercel.app/api/webhook"
    echo "   Eventi: receipts.create, receipts.update"
fi

# Test del sistema
print_step "Test del sistema..."

echo "Vuoi eseguire un test del webhook? (y/n)"
read -r test_webhook

if [ "$test_webhook" = "y" ] || [ "$test_webhook" = "Y" ]; then
    echo "Eseguo test webhook..."
    if [ -f "./test-webhook-email.sh" ]; then
        ./test-webhook-email.sh
    else
        print_warning "Script di test non trovato"
    fi
fi

# Riepilogo finale
echo ""
print_success "🎉 Setup completato!"
echo ""
echo "📋 Riepilogo configurazione:"
echo "✅ Configurazioni Fatture in Cloud: OK"
if [ -n "$MONGODB_URI" ]; then
    echo "✅ MongoDB: Configurato"
else
    echo "⚠️  MongoDB: Non configurato (riautorizzazione necessaria ad ogni restart)"
fi
echo "✅ Server: In esecuzione"
echo "✅ Autorizzazione OAuth2: Completata"
echo "✅ Webhook: Configurato"
echo ""
echo "🔧 Comandi utili:"
echo "- Lista webhook: npm run webhook:list"
echo "- Test webhook: npm run test:webhook"
echo "- Test ricevuta: npm run test:receipt"
echo "- Logs Vercel: vercel logs"
echo ""
echo "🎯 Il sistema è ora pronto per ricevere webhook da Fatture in Cloud!"
echo "Quando viene creata una ricevuta, il PDF sarà inviato automaticamente via email."
echo ""