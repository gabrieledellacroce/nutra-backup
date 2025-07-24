# Guida Deploy Vercel - Sistema Email Automatico

## 🚀 Procedura di Deploy Completa

### 1. Configurazione Variabili d'Ambiente

#### Metodo A: Dashboard Vercel (Consigliato)
1. Vai su https://vercel.com/dashboard
2. Seleziona il progetto `nutragenix-fatture`
3. Settings → Environment Variables
4. Aggiungi le seguenti variabili:

```
EMAIL_ENABLED=true
EMAIL_PROVIDER=smtp
SMTP_HOST=smtps.aruba.it
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@nutragenix.it
SMTP_PASSWORD=Ja$$23-lovelife
EMAIL_FROM=info@nutragenix.it
EMAIL_FROM_NAME=NutraGenix Integrazione Innovativa
EMAIL_ATTACH_PDF=true
EMAIL_CC_ENABLED=false
EMAIL_CC_ADDRESS=
EMAIL_SUBJECT={document_type} {document_number} - NutraGenix
EMAIL_TEMPLATE=Gentile {customer_name},\n\nLa ringraziamo per aver scelto NutraGenix.\n\nIn allegato trova la {document_type} n. {document_number} del {date} per l'importo di € {amount}.\n\nDettagli del documento:\n• Tipo: {document_type}\n• Numero: {document_number}\n• Data: {date}\n• Importo: € {amount}\n\nPer qualsiasi domanda o chiarimento, non esiti a contattarci.\n\nCordiali saluti,\nIl Team di NutraGenix\n\n---\nQuesta è una email automatica generata dal sistema di fatturazione.
```

#### Metodo B: Vercel CLI
```bash
# Rendi eseguibile lo script
chmod +x deploy-env.sh

# Esegui lo script
./deploy-env.sh
```

### 2. Deploy del Progetto

```bash
# Deploy in produzione
vercel --prod

# Oppure deploy normale
vercel
```

### 3. Test Post-Deploy

Dopo il deploy, testa il sistema:

1. **Test Webhook**: Invia una ricevuta di test
2. **Verifica Email**: Controlla che l'email arrivi correttamente
3. **Log Vercel**: Monitora i log per eventuali errori

### 4. Monitoraggio

- **Vercel Dashboard**: Monitora le funzioni serverless
- **Email Provider**: Controlla le statistiche di invio
- **Fatture in Cloud**: Verifica lo stato delle ricevute

## ⚠️ Note Importanti

1. **Sicurezza**: Le variabili d'ambiente sono crittografate su Vercel
2. **Backup**: Mantieni una copia sicura delle configurazioni
3. **Test**: Testa sempre in ambiente di preview prima della produzione
4. **Monitoring**: Configura alerting per errori di invio email

## 🔧 Troubleshooting

### Errore "SMTP Authentication Failed"
- Verifica username/password SMTP
- Controlla che l'host SMTP sia corretto
- Verifica le impostazioni di sicurezza del provider email

### Errore "Function Timeout"
- Aumenta il timeout delle funzioni Vercel
- Ottimizza il codice per ridurre i tempi di esecuzione

### Email non inviate
- Controlla i log di Vercel
- Verifica la configurazione EMAIL_ENABLED
- Controlla le quote del provider email