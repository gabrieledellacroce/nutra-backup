# 🔐 Setup OAuth2 per Fatture in Cloud

## 📋 Procedura di Autorizzazione

### 1. Avvia il Server di Sviluppo
```bash
vercel dev
```

### 2. Inizia l'Autorizzazione
Apri il browser e vai a:
```
http://localhost:3000/api/auth/start
```

Riceverai una risposta JSON con l'URL di autorizzazione:
```json
{
  "message": "Vai al seguente URL per autorizzare l'applicazione:",
  "auth_url": "https://api-v2.fattureincloud.it/oauth/authorize?...",
  "redirect_uri": "http://localhost:3000/api/auth/callback"
}
```

### 3. Autorizza l'Applicazione
1. Copia l'`auth_url` dalla risposta
2. Incollalo nel browser
3. Accedi al tuo account Fatture in Cloud
4. Autorizza l'applicazione
5. Verrai reindirizzato automaticamente al callback

### 4. Verifica l'Autorizzazione
Se tutto è andato bene, vedrai:
```json
{
  "message": "Autorizzazione completata con successo!",
  "token_saved": true,
  "expires_in": 3600
}
```

### 5. Controlla lo Stato del Token
Per verificare se il token è ancora valido:
```
http://localhost:3000/api/auth/status
```

## 🧪 Test dell'Integrazione

Dopo l'autorizzazione, testa l'API:
```bash
node test-api.js
```

## 🚀 Deploy in Produzione

### 1. Aggiorna il Redirect URI in Fatture in Cloud
Nel pannello di controllo della tua app:
- Redirect URL: `https://tuo-dominio.vercel.app/api/auth/callback`

### 2. Aggiorna le Variabili Ambiente
```bash
# In .env per produzione
BASE_URL=https://tuo-dominio.vercel.app
```

### 3. Deploy
```bash
vercel --prod
```

### 4. Riautorizza in Produzione
Ripeti il processo di autorizzazione usando l'URL di produzione.

## 🔄 Gestione Token

- **Token Automatico**: Il sistema rinnova automaticamente i token scaduti
- **Persistenza**: I token sono salvati in `.token.json` (in produzione usa un database)
- **Sicurezza**: I token sono gestiti server-side e mai esposti al client

## ⚠️ Note Importanti

1. **Primo Setup**: Devi autorizzare l'app almeno una volta
2. **Token Scaduti**: Il sistema li rinnova automaticamente
3. **Errori**: Controlla i log per diagnosticare problemi
4. **Sicurezza**: Non committare mai `.token.json` nel repository

## 🆘 Risoluzione Problemi

### Token Non Trovato
```bash
# Elimina il token e riautorizza
rm .token.json
# Poi vai a /api/auth/start
```

### Errori di Autorizzazione
1. Verifica che Client ID e Secret siano corretti
2. Controlla che il Redirect URI sia configurato correttamente in Fatture in Cloud
3. Assicurati che l'app abbia i permessi necessari

### Test Falliti
```bash
# Controlla lo stato del token
curl http://localhost:3000/api/auth/status

# Se necessario, riautorizza
curl http://localhost:3000/api/auth/start
```