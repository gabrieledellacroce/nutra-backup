# Nutragenix Fatture - Integrazione Shopify con Fatture in Cloud

Questa applicazione integra Shopify con Fatture in Cloud per la creazione automatica di corrispettivi/ricevute.

## ⚠️ Limitazioni su Vercel

**IMPORTANTE**: Su Vercel, i token OAuth2 non vengono salvati in modo persistente perché il filesystem è read-only. Questa è una demo funzionante che mostra il flusso OAuth2, ma per un ambiente di produzione è necessario utilizzare un database.

## Funzionalità

- ✅ Autorizzazione OAuth2 con Fatture in Cloud
- ✅ Gestione corretta degli scope (`entity.clients:a receipts:a`)
- ✅ Callback OAuth2 funzionante
- ⚠️ Salvataggio token (solo log su Vercel, richiede database in produzione)
- ✅ API per creazione corrispettivi
- ✅ Integrazione webhook Shopify
- ✅ **Invio automatico email con ricevute** (nuovo!)
- ✅ **Configurazione email tramite interfaccia web** (nuovo!)

## ⚙️ Setup

### 1. Database MongoDB
**IMPORTANTE**: Per il funzionamento in produzione è necessario un database MongoDB per salvare i token OAuth2.

1. **Crea un cluster MongoDB Atlas gratuito:**
   - Vai su [mongodb.com/atlas](https://mongodb.com/atlas)
   - Crea un account e un cluster gratuito (512MB)
   - Ottieni la connection string

2. **Configura l'accesso:**
   - Aggiungi `0.0.0.0/0` agli IP autorizzati (per Vercel)
   - Crea un utente database con permessi di lettura/scrittura

### 2. Variabili Ambiente
Configura le seguenti variabili su Vercel:

```bash
# Fatture in Cloud OAuth2
FIC_CLIENT_ID=your_client_id
FIC_CLIENT_SECRET=your_client_secret  
FIC_COMPANY_ID=your_company_id

# MongoDB (OBBLIGATORIO)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nutragenix

# Base URL (opzionale - auto-rilevato)
BASE_URL=https://your-app.vercel.app

# Configurazione Email (opzionale - per invio automatico ricevute)
EMAIL_PROVIDER=smtp  # smtp, gmail, sendgrid
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Nutragenix
```

### 3. Configurazione Email (Opzionale)

Per abilitare l'invio automatico delle ricevute via email:

1. **Accedi alla configurazione email:**
   - Vai su `https://your-app.vercel.app/email-config.html`
   - Configura il provider email (SMTP, Gmail, SendGrid)

2. **Provider supportati:**
   - **SMTP generico**: Qualsiasi server SMTP
   - **Gmail**: Usa password per app (non la password normale)
   - **SendGrid**: Usa API key come password

3. **Test della configurazione:**
   - Usa il pulsante "Test Configuration" nell'interfaccia
   - Verifica che l'email di test arrivi correttamente

### 2. Configurazione Fatture in Cloud

1. Vai su [Fatture in Cloud Developer](https://developers.fattureincloud.it/)
2. Crea una nuova applicazione
3. Imposta il Redirect URI: `https://nutragenix-fatture.vercel.app/api/auth/callback`
4. Scope richiesti: `entity.clients:a receipts:a`

## Test del flusso OAuth2

1. **Ottieni l'URL di autorizzazione:**
   ```bash
   curl -s https://nutragenix-fatture.vercel.app/api/auth/start | jq
   ```

2. **Autorizza l'applicazione:**
   - Copia l'`auth_url` dalla risposta
   - Incollalo nel browser
   - Autorizza l'applicazione
   - Il callback mostrerà il successo dell'autorizzazione

3. **Verifica lo stato del token:**
   ```bash
   curl -s https://nutragenix-fatture.vercel.app/api/auth/status | jq
   ```

## API Endpoints

### Autenticazione OAuth2

### `/api/auth/start`
- **Metodo**: GET
- **Descrizione**: Genera l'URL di autorizzazione OAuth2

### `/api/auth/callback`
- **Metodo**: GET
- **Descrizione**: Gestisce il callback OAuth2 da Fatture in Cloud

### `/api/auth/status`
- **Metodo**: GET
- **Descrizione**: Verifica lo stato del token (sempre "no_token" su Vercel)

### Gestione Ricevute

### `/api/receipts`
- **Metodo**: POST
- **Descrizione**: Crea un corrispettivo da dati Shopify e invia automaticamente via email
- **Body**: Dati dell'ordine Shopify
- **Risposta**: Include `emailResult` con lo stato dell'invio email

### Configurazione Email

### `/api/config/email`
- **Metodo**: GET
- **Descrizione**: Recupera la configurazione email corrente
- **Risposta**: Configurazione email (senza password)

### `/api/config/email`
- **Metodo**: POST
- **Descrizione**: Aggiorna la configurazione email
- **Body**: Configurazione email completa

### `/api/config/email`
- **Metodo**: PUT
- **Descrizione**: Testa la configurazione email
- **Body**: Configurazione email e indirizzo di test
- **Risposta**: Risultato del test di invio

### Interfaccia Web

### `/email-config.html`
- **Descrizione**: Interfaccia web per configurare le impostazioni email
- **Funzionalità**: Caricamento, salvataggio e test della configurazione

## 📧 Funzionalità Email Automatica

### Come Funziona

1. **Creazione Ricevuta**: Quando viene creata una ricevuta tramite `/api/receipts`
2. **Download PDF**: Il sistema scarica automaticamente il PDF della ricevuta da Fatture in Cloud
3. **Invio Email**: La ricevuta viene inviata via email al cliente con il PDF allegato
4. **Risposta Completa**: L'API restituisce sia il risultato della creazione che dell'invio email

### Configurazione Email

La configurazione email può essere gestita in due modi:

#### 1. Variabili d'Ambiente
```bash
EMAIL_PROVIDER=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=Nutragenix
EMAIL_SUBJECT=La tua ricevuta da Nutragenix
```

#### 2. Interfaccia Web
- Accedi a `/email-config.html`
- Configura provider, credenziali e template
- Testa la configurazione prima di salvare

### Provider Supportati

#### Gmail
- Host: `smtp.gmail.com`
- Porta: `587`
- Richiede password per app (non password normale)
- [Guida password per app](https://support.google.com/accounts/answer/185833)

#### SendGrid
- Host: `smtp.sendgrid.net`
- Porta: `587`
- Username: `apikey`
- Password: La tua API key SendGrid

#### SMTP Generico
- Configura host, porta, username e password del tuo provider

### Template Email

Il template email è personalizzabile e include:
- Saluto personalizzato con nome cliente
- Dettagli dell'ordine (numero, data, totale)
- Messaggio personalizzabile
- PDF della ricevuta in allegato

### Gestione Errori

Se l'invio email fallisce:
- La ricevuta viene comunque creata in Fatture in Cloud
- L'errore viene loggato ma non blocca il processo
- La risposta include `emailResult` con dettagli dell'errore

## Implementazione in Produzione

Per un ambiente di produzione, sostituisci le funzioni `saveToken()` e `loadToken()` con implementazioni che utilizzano un database:

### Esempio con MongoDB:

```javascript
// auth.js
const { MongoClient } = require('mongodb');

async function saveToken(tokenData) {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  
  const db = client.db('nutragenix');
  const tokens = db.collection('oauth_tokens');
  
  await tokens.replaceOne(
    { app: 'fatture_in_cloud' },
    {
      app: 'fatture_in_cloud',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + (tokenData.expires_in * 1000),
      created_at: Date.now()
    },
    { upsert: true }
  );
  
  await client.close();
}

async function loadToken() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  
  const db = client.db('nutragenix');
  const tokens = db.collection('oauth_tokens');
  
  const token = await tokens.findOne({ app: 'fatture_in_cloud' });
  await client.close();
  
  return token;
}
```

### Esempio con PostgreSQL:

```javascript
// auth.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function saveToken(tokenData) {
  const query = `
    INSERT INTO oauth_tokens (app, access_token, refresh_token, expires_at, created_at)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (app) DO UPDATE SET
      access_token = $2,
      refresh_token = $3,
      expires_at = $4,
      created_at = $5
  `;
  
  await pool.query(query, [
    'fatture_in_cloud',
    tokenData.access_token,
    tokenData.refresh_token,
    Date.now() + (tokenData.expires_in * 1000),
    Date.now()
  ]);
}

async function loadToken() {
  const query = 'SELECT * FROM oauth_tokens WHERE app = $1';
  const result = await pool.query(query, ['fatture_in_cloud']);
  
  return result.rows[0] || null;
}
```

## Configurazione Webhook Shopify

Per ricevere automaticamente gli ordini da Shopify:

1. Vai nelle impostazioni del tuo store Shopify
2. Aggiungi un webhook per "Order created"
3. URL: `https://nutragenix-fatture.vercel.app/api/receipts`
4. Formato: JSON

## Troubleshooting

### Errore "scope is not valid"
- Verifica che gli scope siano `entity.clients:a receipts:a`
- Controlla che il Redirect URI sia configurato correttamente

### Errore "readonly file system"
- Normale su Vercel, implementa la persistenza con database

### Token non trovato
- Su Vercel i token non sono persistenti
- In produzione usa un database per salvare i token

## Struttura del Progetto

```
├── api/
│   ├── auth/
│   │   ├── start.js      # Genera URL autorizzazione
│   │   ├── callback.js   # Gestisce callback OAuth2
│   │   └── status.js     # Verifica stato token
│   ├── auth.js           # Utility per gestione token
│   └── receipts.js       # Creazione corrispettivi
├── package.json
├── README.md
└── .env                  # Variabili d'ambiente locali
```

## Licenza

MIT License