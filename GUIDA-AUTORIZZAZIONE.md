# 🔐 Guida Completa Autorizzazione OAuth2

## ❌ Problema Attuale
L'errore "access_denied" indica che il `redirect_uri` non è configurato correttamente nell'app di Fatture in Cloud.

## 🔧 Soluzioni Disponibili

### Soluzione 1: Link Corretto (Raccomandato)

**Link di autorizzazione corretto:**
```
https://api-v2.fattureincloud.it/oauth/authorize?response_type=code&client_id=5slpZH0Npa5HB4a4Cd7IdFCUwBYGyb5s&redirect_uri=https%3A%2F%2Fnutragenix-fatture-qlzulkde3-gabrieledellacroce-2606s-projects.vercel.app%2Fapi%2Fauth%2Fcallback&scope=entity.clients%3Aa%20issued_documents.receipts%3Aa&state=bee6f0a22149955efe46854fb53d755e
```

**Istruzioni:**
1. Apri il link sopra nel browser
2. Autorizza l'applicazione
3. Verrai reindirizzato automaticamente
4. Esegui: `npm run webhook:setup`

### Soluzione 2: Configurazione App Fatture in Cloud

Se il link sopra non funziona, devi configurare il redirect URI nell'app:

1. Vai su https://fattureincloud.it/api
2. Accedi al tuo account
3. Vai in "Le mie app" > "Nutragenix Fatture"
4. Nella sezione "Redirect URI" aggiungi:
   ```
   https://nutragenix-fatture-qlzulkde3-gabrieledellacroce-2606s-projects.vercel.app/api/auth/callback
   ```
5. Salva le modifiche
6. Riprova con il link di autorizzazione

### Soluzione 3: Setup Manuale Token (Alternativa)

Se OAuth2 continua a non funzionare:

1. **Ottieni il token manualmente:**
   - Vai su https://fattureincloud.it/api
   - Accedi al tuo account
   - Vai in "Le mie app" > "Nutragenix Fatture"
   - Genera un token di accesso

2. **Configura il token:**
   ```bash
   npm run token:setup <IL_TUO_TOKEN>
   ```

3. **Configura i webhook:**
   ```bash
   npm run webhook:setup
   ```

## 🔍 Verifica Configurazione

Dopo qualsiasi soluzione, verifica che tutto funzioni:

```bash
# Verifica la configurazione
npm run check

# Testa i webhook
npm run test:webhook
```

## 📋 Comandi Utili

- `npm run token:generate` - Genera nuovo link di autorizzazione
- `npm run token:setup <TOKEN>` - Configura token manualmente
- `npm run webhook:setup` - Configura webhook
- `npm run webhook:list` - Lista webhook esistenti
- `npm run test:webhook` - Testa webhook

## 🆘 Supporto

Se nessuna soluzione funziona, controlla:
1. Che l'app sia attiva su Fatture in Cloud
2. Che i permessi siano corretti
3. Che il redirect URI sia esatto (case-sensitive)