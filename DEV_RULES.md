# 📋 Regole di Sviluppo - NutraGenix Fatture

## 🚫 **REGOLE FONDAMENTALI**

### 1. **NON CREARE FILE INUTILI**
- ❌ **MAI** creare nuovi file di test per ogni modifica
- ✅ **SEMPRE** modificare il file esistente `test-order.json`
- ✅ **SEMPRE** riutilizzare i file esistenti quando possibile

### 2. **FILE DI TEST UNICO**
- **File principale per test**: `test-order.json`
- Per modifiche ai test: **MODIFICA SOLO** questo file
- Non creare `test-webhook-xxx.json`, `esempio-xxx.json`, etc.

### 3. **PULIZIA PROGETTO**
- Eliminare immediatamente file temporanei o di test non necessari
- Mantenere solo i file essenziali per il funzionamento
- Non lasciare file `.js` di test sparsi nel progetto

### 4. **GESTIONE MODIFICHE**
- Per test webhook: modificare `test-order.json`
- Per configurazioni: usare i file esistenti in `/api/config/`
- Per documentazione: aggiornare i file `.md` esistenti

## 📁 **STRUTTURA FILE APPROVATA**

### File di Test
- `test-order.json` - UNICO file per test webhook
- `test-ricevuta.sh` - Script bash per test rapidi

### File di Configurazione
- File in `/api/config/` - Configurazioni sistema
- File `.env.*` - Variabili ambiente

### Documentazione
- `README.md` - Documentazione principale
- `*.md` - Guide specifiche (non creare nuovi senza motivo)

## ⚡ **WORKFLOW CORRETTO**

1. **Per test webhook**: Modifica `test-order.json`
2. **Per nuove funzionalità**: Modifica file esistenti in `/api/`
3. **Per deploy**: Usa `vercel --prod`
4. **Per commit**: Messaggi chiari e concisi

## 🔧 **COMANDI STANDARD**

```bash
# Test webhook
curl -X POST "https://nutra-backup.vercel.app/api/receipts" \
  -H "Content-Type: application/json" \
  -H "X-Shopify-Topic: orders/paid" \
  -H "X-Shopify-Shop-Domain: nutragenix.myshopify.com" \
  -H "X-Shopify-Hmac-Sha256: test" \
  -d @test-order.json

# Deploy
vercel --prod

# Logs
vercel logs https://nutra-backup.vercel.app
```

---
**IMPORTANTE**: Queste regole devono essere seguite SEMPRE per mantenere il progetto pulito e organizzato.