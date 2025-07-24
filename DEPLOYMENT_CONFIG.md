# Configurazione Deployment Vercel

## File Esclusi dal Deployment

Per ottimizzare il deployment e mantenere la sicurezza, i seguenti file sono esclusi dal deployment su Vercel:

### Script di Test
- `test-*.sh` - Tutti gli script di test
- `*test*.sh` - Script contenenti "test" nel nome
- `register-webhook-*.sh` - Script di registrazione webhook
- `deploy-env.sh` - Script di deployment locale

### File di Documentazione
- `*.md` - Tutti i file Markdown (README, guide, etc.)

### File di Configurazione Locale
- `webhook-manager.html` - Manager webhook locale
- `config.html` - Configurazione locale
- `email-config.html` - Configurazione email locale
- `get_token.js` - Script per ottenere token OAuth
- `webhook-payload.json` - Payload di test

## Configurazione

La configurazione è definita in:
- `vercel.json` - Campo `ignores` per escludere file dal deployment
- `.gitignore` - Per escludere file dal versioning Git

## Vantaggi

1. **Sicurezza**: I file di test e configurazione locale non vengono esposti in produzione
2. **Performance**: Deployment più veloce con meno file
3. **Pulizia**: Solo i file necessari per il funzionamento sono in produzione

## File Inclusi nel Deployment

- `api/` - Tutte le funzioni serverless
- `package.json` - Dipendenze del progetto
- `vercel.json` - Configurazione Vercel
- File di ambiente (`.env.production`, etc.)

## Note

I file di test rimangono disponibili localmente per lo sviluppo e il testing, ma non vengono deployati in produzione.