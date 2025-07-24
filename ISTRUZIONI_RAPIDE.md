# 🚀 Istruzioni Rapide - Configurazione Webhook

## ✅ Situazione Attuale

- ✅ **MongoDB Atlas**: Configurato e funzionante
- ✅ **Token OAuth2**: Già presenti in MongoDB Atlas
- ✅ **Server**: In esecuzione su http://localhost:3001
- ✅ **Codice**: Tutto pronto e funzionante

## 🎯 Cosa Fare Ora (2 minuti)

### Opzione 1: Setup Automatico (RACCOMANDATO)

1. **Copia i token da MongoDB Atlas**:
   - Apri l'interfaccia MongoDB Atlas che hai mostrato
   - Copia il valore di `access_token` (quello lungo che inizia con "eyJ...")
   - Copia il valore di `refresh_token` (se presente)
   - Copia il valore di `expires_at`

2. **Configura lo script**:
   ```bash
   # Apri il file
   open setup-token-da-mongodb.js
   
   # Sostituisci nella sezione TOKENS_DA_MONGODB:
   access_token: 'IL_TUO_TOKEN_DA_MONGODB',
   refresh_token: 'IL_TUO_REFRESH_TOKEN',
   expires_at: 'LA_TUA_DATA_SCADENZA'
   ```

3. **Esegui lo script**:
   ```bash
   node setup-token-da-mongodb.js
   ```

### Opzione 2: Test Veloce

1. **Configura test rapido**:
   ```bash
   # Apri il file
   open test-token-manuale.js
   
   # Sostituisci:
   const ACCESS_TOKEN = 'IL_TUO_TOKEN_DA_MONGODB';
   ```

2. **Esegui il test**:
   ```bash
   node test-token-manuale.js
   ```

## 🎉 Risultato Atteso

Se tutto va bene vedrai:
```
✅ Token valido - API risponde correttamente
✅ Webhook registrato con successo!
🆔 ID Webhook: 12345
📍 URL: https://nutragenix-fatture-qlzulkde3-gabrieledellacroce-2606s-projects.vercel.app/api/webhook
```

## 🧪 Test Finale

Dopo la configurazione:
```bash
# Test webhook
./test-webhook-email.sh

# Test ricevuta completa
./test-ricevuta-email-completo.sh
```

## 🔧 Troubleshooting

### Se il token non funziona:
1. Controlla che sia copiato completamente (sono molto lunghi)
2. Verifica che non ci siano spazi extra
3. Prova con il refresh_token se disponibile

### Se il webhook non si registra:
1. Controlla che il server sia in esecuzione
2. Verifica l'URL in BASE_URL nel .env.prod
3. Controlla i logs del server

## 📞 Comandi Utili

```bash
# Verifica server
curl http://localhost:3001/api/webhook

# Lista webhook esistenti
node -e "console.log('Lista webhook:', process.env.FIC_COMPANY_ID)"

# Logs server
npm run dev
```

---

**🎯 Obiettivo**: Webhook funzionante in 2 minuti!
**📧 Risultato**: Email automatiche con PDF ricevute