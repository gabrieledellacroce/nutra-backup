# 📧 Sistema Email con PDF - Implementazione Webhook

## 🎯 Obiettivo
Modificare il sistema per inviare **una sola email al cliente contenente il PDF solo quando è stato generato con certezza** da Fatture in Cloud.

## 🔄 Modifiche Implementate

### 1. Modifica Logica Email in `api/receipts.js`
- ❌ **Rimosso**: Invio immediato dell'email dopo creazione ricevuta
- ❌ **Rimosso**: Sistema di email differita con timeout
- ✅ **Aggiunto**: Registrazione ricevuta per invio tramite webhook
- ✅ **Aggiunto**: Messaggio informativo che l'email sarà inviata quando il PDF è pronto

### 2. Creazione Endpoint Webhook `api/webhook.js`
- ✅ **Gestisce**: Notifiche di aggiornamento ricevute da Fatture in Cloud
- ✅ **Verifica**: Disponibilità del PDF prima dell'invio
- ✅ **Invia**: Email con PDF allegato solo quando `hasPDF: true`
- ✅ **Log**: Dettagliato per debugging e monitoraggio

### 3. Endpoint Configurazione Webhook `api/webhook-setup.js`
- ✅ **Lista**: Webhook esistenti (GET)
- ✅ **Registra**: Nuovo webhook per ricevute (POST)
- ✅ **Elimina**: Webhook esistente (DELETE)

### 4. Script di Setup e Test
- ✅ `setup-webhook-manual.sh`: Istruzioni per registrazione manuale
- ✅ `register-webhook.sh`: Script automatico (richiede config locale)
- ✅ `test-webhook-setup.sh`: Test endpoint configurazione

## 🔧 Configurazione Webhook

### URL Webhook
```
https://nutra-backup.vercel.app/api/webhook
```

### Eventi Monitorati
- `it.fattureincloud.webhooks.receipts.create`
- `it.fattureincloud.webhooks.receipts.update`

### Registrazione Manuale
1. Vai su [Fatture in Cloud Developer](https://developers.fattureincloud.it/)
2. Accedi al tuo account
3. Seleziona la tua applicazione
4. Vai nella sezione "Webhook"
5. Aggiungi nuovo webhook con:
   - **URL**: `https://nutra-backup.vercel.app/api/webhook`
   - **Eventi**: `receipts.create`, `receipts.update`

### Registrazione via API
```bash
curl -X POST "https://api-v2.fattureincloud.it/c/COMPANY_ID/subscriptions" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "sink": "https://nutra-backup.vercel.app/api/webhook",
      "verified": false,
      "types": [
        "it.fattureincloud.webhooks.receipts.create",
        "it.fattureincloud.webhooks.receipts.update"
      ]
    }
  }'
```

## 🔄 Flusso Operativo

### Prima (Sistema Precedente)
1. Ordine Shopify → Creazione ricevuta
2. **Invio immediato email** (spesso senza PDF)
3. Sistema di retry con timeout fissi (2 min, 7 min)
4. **Problema**: Email multiple, PDF spesso non disponibile

### Ora (Nuovo Sistema)
1. Ordine Shopify → Creazione ricevuta
2. **Nessun invio email immediato**
3. Fatture in Cloud genera PDF
4. **Webhook notifica aggiornamento ricevuta**
5. Sistema verifica disponibilità PDF
6. **Invio email SOLO se PDF disponibile**
7. **Risultato**: Una sola email con PDF garantito

## 📊 Vantaggi del Nuovo Sistema

### ✅ Vantaggi
- **Email unica**: Il cliente riceve una sola email
- **PDF garantito**: Email inviata solo quando PDF è pronto
- **Affidabilità**: Basato su notifiche real-time di Fatture in Cloud
- **Efficienza**: Nessun polling o timeout arbitrari
- **Scalabilità**: Gestisce automaticamente i tempi di generazione PDF

### ⚠️ Considerazioni
- **Dipendenza webhook**: Richiede configurazione webhook attiva
- **Latenza variabile**: Tempo di invio dipende da Fatture in Cloud
- **Monitoraggio**: Necessario monitorare webhook per eventuali problemi

## 🧪 Test del Sistema

### Test Ricevuta
```bash
./test-ricevuta.sh
```

### Verifica Webhook
1. Crea una ricevuta di test
2. Monitora i log di Vercel
3. Verifica ricezione email con PDF

### Debug
- Log webhook: `/api/webhook` endpoint
- Log creazione ricevuta: `/api/receipts` endpoint
- Configurazione email: `/api/config/email` endpoint

## 📋 Prossimi Passi

1. **Registra il webhook** su Fatture in Cloud
2. **Testa il sistema** con una ricevuta reale
3. **Monitora i log** per verificare il funzionamento
4. **Documenta eventuali problemi** per ottimizzazioni future

## 🔍 Monitoraggio

### Log da Controllare
- Creazione ricevuta: `📧 Email sarà inviata tramite webhook`
- Ricezione webhook: `🔔 Webhook ricevuto da Fatture in Cloud`
- Verifica PDF: `📄 PDF disponibile, invio email`
- Invio email: `✅ Email ricevuta con PDF inviata`

### Metriche di Successo
- ✅ Una sola email per ricevuta
- ✅ Email sempre con PDF allegato
- ✅ Tempo di invio ragionevole (< 5 minuti)
- ✅ Nessuna email duplicata