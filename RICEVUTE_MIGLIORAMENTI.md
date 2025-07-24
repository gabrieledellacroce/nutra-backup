# Miglioramenti Ricevute NutraGenix

## Problemi Risolti

Questo documento descrive i miglioramenti implementati per risolvere i dati mancanti nelle ricevute generate automaticamente dal sito NutraGenix.it.

### Dati Aggiunti

#### 1. **Telefono Cliente**
- **Campo aggiunto**: `phone` nell'entità cliente
- **Logica**: Priorità di ricerca del telefono:
  1. `customer.phone` (telefono del cliente)
  2. `billing_address.phone` (telefono dell'indirizzo di fatturazione)
  3. `phone` (telefono dell'ordine)
- **Fallback**: Stringa vuota se nessun telefono è disponibile

#### 2. **Email Cliente**
- **Campo**: `email` nell'entità cliente
- **Fonte**: `customer.email` dal webhook Shopify
- **Stato**: ✅ Già implementato

#### 3. **Oggetto Ordine**
- **Campo aggiunto**: `subject`
- **Formato**: `[NutraGenix] ordine numero {order_number} {data}`
- **Esempio**: `[NutraGenix] ordine numero 27168 20-06-2025`
- **Fonte dati**: `order_number` o `name` dal webhook Shopify

#### 4. **Scadenza Corretta**
- **Campo aggiunto**: `expiration_date`
- **Logica**: Impostata alla data di generazione della fattura (non +10 giorni)
- **Fonte**: `created_at` dell'ordine Shopify o data corrente

#### 5. **Riepilogo IVA**
- **Campi aggiunti**:
  - `amount_net`: Totale netto (calcolato dal lordo / 1.22)
  - `amount_vat`: Importo IVA (22% sempre)
  - `amount_gross`: Totale lordo
- **Calcolo automatico**: Basato sui prezzi lordi degli articoli
- **Aliquota fissa**: 22% per tutti i prodotti

#### 6. **Numerazione Progressiva**
- **Campo modificato**: `numeration`
- **Valore precedente**: `/R` (che generava "RICEVUTA nr. 7/R/2025")
- **Valore nuovo**: `/2025` (per continuare la numerazione progressiva)
- **Risultato atteso**: Numerazione che continua da "RICEVUTA nr. 303/2025"

### Struttura Dati Webhook

I seguenti campi vengono ora estratti dal webhook Shopify:

```javascript
const {
  customer,           // Dati cliente (nome, cognome, email, telefono)
  billing_address,    // Indirizzo di fatturazione (telefono alternativo)
  line_items,         // Articoli dell'ordine
  total_price,        // Prezzo totale
  currency,           // Valuta
  created_at,         // Data creazione ordine
  payment_gateway_names, // Gateway di pagamento
  financial_status,   // Stato finanziario
  order_number,       // Numero ordine
  name,              // Nome ordine (es. #1001)
  phone              // Telefono ordine
} = req.body;
```

### Calcoli IVA

```javascript
// Calcolo automatico del riepilogo IVA
const grossTotal = items.reduce((sum, item) => sum + (item.gross_price * item.qty), 0);
const netTotal = grossTotal / 1.22;  // Netto dal lordo
const vatAmount = grossTotal - netTotal;  // IVA al 22%
```

### Compatibilità

- ✅ Mantiene compatibilità con il sistema esistente
- ✅ Gestisce dati mancanti con fallback appropriati
- ✅ Non rompe la funzionalità esistente
- ✅ Migliora la qualità dei dati nelle ricevute

### Test

Per testare le modifiche:
1. Effettuare un ordine dal sito NutraGenix.it
2. Verificare che la ricevuta generata contenga:
   - Telefono del cliente
   - Oggetto con numero ordine
   - Scadenza = data di generazione
   - Riepilogo IVA al 22%
   - Numerazione progressiva corretta

### Deploy

Le modifiche sono state deployate su:
- **Produzione**: https://nutragenix-fatture-jteinma5n-gabrieledellacroce-2606s-projects.vercel.app
- **Commit**: `95cc236` - "Aggiungi dati mancanti nelle ricevute"