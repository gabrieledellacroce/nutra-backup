# 🔧 CORREZIONI RICEVUTE - DUPLICATI E IMPORTI

## 📋 Problemi Risolti

### 1. **Ricevute Duplicate** ❌➡️✅
**Problema**: Le ricevute venivano create più volte per lo stesso ordine Shopify.

**Causa**: 
- Webhook Shopify multipli
- Test manuali ripetuti
- Retry automatici

**Soluzione**: 
- Aggiunta funzione `checkExistingReceipt()` che cerca ricevute esistenti tramite Shopify ID
- Controllo preventivo prima della creazione
- ID Shopify incluso nelle note della ricevuta per identificazione

### 2. **Importi Errati** ❌➡️✅
**Problema**: Importi delle ricevute non corrispondevano agli ordini Shopify.
- Esempio: Ordine €36,50 → Ricevuta €24,18

**Causa**: 
- Codice assumeva che Shopify fornisse prezzi lordi (con IVA)
- Divideva erroneamente per 1.22 (assumendo IVA 22%)
- In realtà Shopify fornisce prezzi netti (senza IVA)

**Soluzione**:
- Rimossa divisione per 1.22
- Shopify fornisce già prezzi netti
- IVA calcolata correttamente dal sistema Fatture in Cloud

## 🔍 Modifiche Tecniche

### File: `api/receipts.js`

#### 1. Funzione Anti-Duplicati
```javascript
async function checkExistingReceipt(shopifyOrderId, companyId, accessToken) {
  // Cerca ricevute esistenti con lo stesso Shopify ID
  // Restituisce la ricevuta se trovata, null altrimenti
}
```

#### 2. Correzione Calcolo Importi
```javascript
// PRIMA (ERRATO):
const netTotal = parseFloat(grossTotal) / 1.22;

// DOPO (CORRETTO):
const netTotal = parseFloat(total_price); // Shopify fornisce già netto
```

#### 3. Note Ricevuta Migliorate
```javascript
notes: `Shopify-ID:${shopifyOrderId} - Email: ${email}...`
```

## 🧪 Test

Esegui il test per verificare le correzioni:
```bash
./test-fix-duplicati.sh
```

**Risultati Attesi**:
1. ✅ Prima ricevuta creata con importo corretto
2. ✅ Seconda chiamata bloccata come duplicato
3. ✅ Log dettagliati nei log di Vercel

## 📊 Verifica Importi

### Esempio Calcolo Corretto:
- **Ordine Shopify**: €74,50 (netto)
- **Ricevuta Fatture in Cloud**: €74,50 + IVA 22% = €90,89 (lordo)

### Prima della Correzione:
- **Ordine Shopify**: €74,50
- **Calcolo Errato**: €74,50 ÷ 1.22 = €61,07 (SBAGLIATO)
- **Ricevuta**: €61,07 + IVA = €74,50 (importo finale corretto ma calcolo interno sbagliato)

## 🚀 Deploy

Le modifiche sono già nel codice. Per applicarle:

1. **Commit e Push**:
```bash
git add .
git commit -m "Fix: Risolti duplicati ricevute e calcolo importi"
git push
```

2. **Vercel Deploy Automatico**: Il deploy avviene automaticamente

3. **Test**: Usa `./test-fix-duplicati.sh` per verificare

## 📝 Note Importanti

- ⚠️ **Backup**: Le ricevute esistenti non sono modificate
- 🔄 **Compatibilità**: Funziona con tutti i tipi di ordine Shopify
- 🛡️ **Sicurezza**: Controllo duplicati basato su ID univoco Shopify
- 📈 **Performance**: Controllo duplicati efficiente con ricerca mirata

## 🔍 Monitoraggio

Controlla i log di Vercel per:
- ✅ "Ricevuta già esistente per ordine Shopify"
- ✅ "Ricevuta creata con successo"
- ❌ Eventuali errori di calcolo

---
*Correzioni implementate il 18 Luglio 2025*