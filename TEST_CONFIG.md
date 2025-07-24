# 🧪 Configurazione Test

## Regole per i Test delle Ricevute

### 📅 Data delle Ricevute di Test
- **SEMPRE** usare la data corrente del giorno in cui viene eseguito il test
- Formato: `YYYY-MM-DDTHH:MM:SSZ` (ISO 8601)
- Esempio: se il test viene fatto il 15 gennaio 2024, usare `2024-01-15T10:30:00Z`

### 📧 Email per i Test
- **Email di test**: `gabriprb@me.com`
- Questa email deve essere usata per tutti i test delle ricevute
- Non usare email fittizie come `mario.rossi@test.com`

### 🔧 Template di Test Standard

```json
{
  "id": 999888777,
  "name": "#TEST-001",
  "order_number": "TEST-001",
  "created_at": "DATA_CORRENTE_QUI",
  "currency": "EUR",
  "total_price": "89.90",
  "total_discounts": "10.00",
  "financial_status": "paid",
  "payment_gateway_names": ["paypal"],
  "customer": {
    "first_name": "Mario",
    "last_name": "Rossi",
    "email": "gabriprb@me.com",
    "phone": "+39 123 456 7890"
  },
  "billing_address": {
    "address1": "Via Roma 123",
    "city": "Milano",
    "province": "MI",
    "zip": "20100",
    "country_code": "IT"
  },
  "line_items": [
    {
      "title": "Prodotto Test con Sconto",
      "quantity": 2,
      "price": "49.95",
      "total_discount": "10.00",
      "sku": "TEST-SKU-001"
    }
  ]
}
```

### 📝 Note Importanti
- Aggiornare sempre la data prima di eseguire i test
- Verificare che l'email sia `gabriprb@me.com`
- Controllare che il sistema invii correttamente l'email di conferma
- Verificare la creazione della ricevuta su Fatture in Cloud

### 🚀 Script di Test Raccomandati
- `test-ricevuta-simple.sh` - Test base
- `test-ricevuta-sconto.sh` - Test con sconto
- `test-ricevuta.sh` - Test completo

**IMPORTANTE**: Leggere sempre questo file prima di eseguire test delle ricevute!