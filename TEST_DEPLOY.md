# 🧪 Test Deploy - Guida Rapida

## 📋 Procedura Post-Deploy

Dopo ogni deploy su Vercel, **SEMPRE** eseguire questo test per verificare il corretto funzionamento dell'integrazione Shopify → Fatture in Cloud.

## 🚀 Comando Test Ricevuta

```bash
curl -X POST https://nutragenix-fatture.vercel.app/api/receipts \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "first_name": "Mario",
      "last_name": "Rossi",
      "email": "mario.rossi@email.com"
    },
    "line_items": [
      {
        "name": "Vitamina D3 + K2",
        "price": "32.50",
        "quantity": 1
      },
      {
        "name": "B-Complex Energy",
        "price": "28.90",
        "quantity": 2
      }
    ],
    "total_price": "90.30",
    "currency": "EUR",
    "created_at": "2025-07-10T12:00:00Z"
  }'
```

## ✅ Risultato Atteso

**Successo (200)**:
```json
{
  "success": true,
  "receipt": {
    "data": {
      "id": 12345,
      "number": "R001",
      "amount_gross": 90.30
    }
  },
  "message": "Ricevuta creata con successo"
}
```

## ❌ Errori Comuni

### 403 - NO_PERMISSION
```bash
# Reset autorizzazione
curl https://nutragenix-fatture.vercel.app/api/auth/reset

# Nuova autorizzazione
curl https://nutragenix-fatture.vercel.app/api/auth/start
# Copia URL e autorizza nel browser
```

### 422 - Totale Pagamenti
- Verificare che `use_gross_prices: true`
- Controllare calcoli arrotondamenti

## 🔍 Debug Avanzato

```bash
# Test con output verbose
curl -X POST https://nutragenix-fatture.vercel.app/api/receipts \
  -H "Content-Type: application/json" \
  -d @test-order-simple.json \
  -v

# Verifica stato token
curl https://nutragenix-fatture.vercel.app/api/auth/status
```

## 📝 Checklist Post-Deploy

- [ ] ✅ Test ricevuta con comando curl
- [ ] ✅ Verifica risposta 200 OK
- [ ] ✅ Controllo ID ricevuta generato
- [ ] ✅ Verifica in Fatture in Cloud (opzionale)
- [ ] ✅ Test autorizzazione se necessario

---

**⚠️ IMPORTANTE**: Questo test deve essere eseguito **SEMPRE** dopo ogni deploy per garantire il corretto funzionamento dell'integrazione.