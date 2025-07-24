# 🎯 Guida Setup Webhook Fatture in Cloud

Questa guida spiega come configurare i webhook di Fatture in Cloud per ricevere notifiche automatiche quando vengono create o modificate le ricevute.

## 📋 Prerequisiti

1. **Token di accesso API** di Fatture in Cloud configurato
2. **Company ID** configurato
3. **Endpoint webhook** deployato e funzionante
4. **Variabili d'ambiente** configurate correttamente

## 🔧 Configurazione

### 1. Verifica Variabili d'Ambiente

Assicurati che il file `.env.production` contenga:

```bash
FATTURE_IN_CLOUD_ACCESS_TOKEN=your_access_token_here
FATTURE_IN_CLOUD_COMPANY_ID=your_company_id_here
WEBHOOK_URL=https://your-app.vercel.app/api/webhook
```

### 2. Esegui il Setup Automatico

#### Opzione A: Script Bash (Raccomandato)
```bash
./setup-webhook.sh
```

#### Opzione B: Script Node.js
```bash
node setup-webhook.js
```

#### Opzione C: NPM Script
```bash
npm run webhook:setup
```

## 📊 Comandi Disponibili

### Setup e Configurazione
```bash
# Setup completo webhook
./setup-webhook.sh
npm run webhook:setup

# Lista subscription esistenti
node setup-webhook.js --list
npm run webhook:list

# Elimina una subscription specifica
node setup-webhook.js --delete <SUBSCRIPTION_ID>

# Mostra aiuto
node setup-webhook.js --help
npm run webhook:help
```

### Test e Verifica
```bash
# Test webhook endpoint
./test-webhook-email.sh
npm run test:webhook

# Test completo ricevuta + email
./test-ricevuta-email-completo.sh
npm run test:receipt

# Verifica logs Vercel
vercel logs
```

## 🎯 Eventi Webhook Configurati

Il sistema è configurato per ricevere notifiche per questi eventi:

- `it.fattureincloud.webhooks.issued_documents.receipts.create` - Creazione ricevute
- `it.fattureincloud.webhooks.issued_documents.receipts.update` - Modifica ricevute
- `it.fattureincloud.webhooks.receipts.create` - Creazione ricevute (alternativo)
- `it.fattureincloud.webhooks.receipts.update` - Modifica ricevute (alternativo)

## 🔄 Flusso Operativo

1. **Creazione Ricevuta** → API crea ricevuta su Fatture in Cloud
2. **Generazione PDF** → Fatture in Cloud genera il PDF della ricevuta
3. **Notifica Webhook** → Fatture in Cloud invia notifica al nostro endpoint
4. **Elaborazione** → Il nostro sistema riceve la notifica e recupera i dettagli
5. **Invio Email** → Sistema invia email con PDF al cliente

## 🛠️ Troubleshooting

### Problema: Webhook non ricevuti

1. **Verifica subscription**:
   ```bash
   npm run webhook:list
   ```

2. **Controlla endpoint**:
   ```bash
   curl -X GET https://your-app.vercel.app/api/webhook
   ```

3. **Verifica logs**:
   ```bash
   vercel logs --follow
   ```

### Problema: Errori di autenticazione

1. **Verifica token**:
   - Controlla che `FATTURE_IN_CLOUD_ACCESS_TOKEN` sia valido
   - Verifica che il token abbia i permessi necessari

2. **Verifica Company ID**:
   - Controlla che `FATTURE_IN_CLOUD_COMPANY_ID` sia corretto

### Problema: Email non inviate

1. **Verifica configurazione email**:
   - Controlla variabili SMTP in `.env.production`
   - Testa invio email con `./test-email.sh`

2. **Verifica webhook endpoint**:
   - Controlla che `/api/webhook.js` risponda correttamente
   - Verifica che il sistema di invio email sia attivo

## 📁 File Generati

Dopo il setup, vengono creati questi file:

- `webhook-subscription.json` - Dettagli della subscription creata
- `setup-webhook.js` - Script di configurazione
- `setup-webhook.sh` - Script bash per setup rapido

## 🔒 Sicurezza

- Le notifiche webhook includono header di verifica
- Il sistema verifica la firma delle richieste
- Solo gli eventi autorizzati vengono elaborati
- I dati sensibili non vengono esposti nei log

## 📞 Supporto

In caso di problemi:

1. Controlla i log di Vercel
2. Verifica la configurazione delle variabili d'ambiente
3. Testa manualmente gli endpoint
4. Consulta la documentazione ufficiale di Fatture in Cloud

## 🔗 Link Utili

- [Documentazione Webhook Fatture in Cloud](https://developers.fattureincloud.it/docs/webhooks/)
- [API Reference](https://developers.fattureincloud.it/api-reference/)
- [Notification Types](https://developers.fattureincloud.it/docs/webhooks/notification-types/)