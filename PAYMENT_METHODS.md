# 💳 Gestione Metodi di Pagamento

## 🔍 Rilevamento Automatico

L'applicazione rileva automaticamente il metodo di pagamento dai webhook di Shopify utilizzando:
- `payment_gateway_names`: array dei gateway di pagamento utilizzati
- `financial_status`: stato finanziario dell'ordine
- `transactions`: dettagli delle transazioni (opzionale)

## 🏦 Mappatura Gateway → Metodi Fatture in Cloud

| Gateway Shopify | Metodo Fatture in Cloud | Payment Account ID | Tipo |
|----------------|------------------------|-------------------|------|
| `bank_transfer`, `bonifico`, `wire` | Bonifico bancario | 1 | Non istantaneo |
| `paypal` | PayPal | 2 | Istantaneo |
| `card`, `visa`, `mastercard`, `shopify_payments`, `stripe`, `authorize` | Carta di credito/debito | 3 | Istantaneo |
| `cod`, `cash`, `contrassegno` | Contrassegno | 0 | Istantaneo |
| `klarna`, `afterpay`, `sezzle` | Pagamento rateale | 4 | Istantaneo |
| `apple_pay`, `google_pay`, `samsung_pay` | Wallet digitale | 5 | Istantaneo |
| `amazon`, `amazon_payments` | Amazon Pay | 6 | Istantaneo |
| Altri gateway | Pagamento online (nome gateway) | 3 | Istantaneo |

## 💰 Gestione Stati di Pagamento

### Pagamenti Istantanei
- **PayPal, Carte di credito, Wallet digitali, Amazon Pay**: sempre marcati come "pagati"
- **Contrassegno**: considerato istantaneo per la ricevuta
- **Pagamenti rateali**: considerati istantanei per la ricevuta

### Pagamenti Non Istantanei
- **Bonifico bancario**: segue il `financial_status` di Shopify
  - `paid` → ricevuta pagata
  - `pending` → ricevuta non pagata
  - `partially_paid` → ricevuta non pagata

## 📊 Esempi di Mappatura

### Esempio 1: Pagamento PayPal
```json
{
  "payment_gateway_names": ["paypal"],
  "financial_status": "pending"
}
```
**Risultato**: PayPal, ricevuta marcata come pagata (€100.00)

### Esempio 2: Bonifico Bancario
```json
{
  "payment_gateway_names": ["bank_transfer"],
  "financial_status": "pending"
}
```
**Risultato**: Bonifico bancario, ricevuta non pagata (€0.00)

### Esempio 3: Carta di Credito
```json
{
  "payment_gateway_names": ["shopify_payments"],
  "financial_status": "paid"
}
```
**Risultato**: Carta di credito/debito, ricevuta pagata (€100.00)

### Esempio 4: Apple Pay
```json
{
  "payment_gateway_names": ["apple_pay"],
  "financial_status": "pending"
}
```
**Risultato**: Wallet digitale, ricevuta marcata come pagata (€100.00)

### Esempio 5: Gateway Sconosciuto
```json
{
  "payment_gateway_names": ["custom_gateway"],
  "financial_status": "paid"
}
```
**Risultato**: Pagamento online (custom_gateway), ricevuta pagata (€100.00)

## 🔧 Analisi Transazioni

Il sistema analizza anche l'array `transactions` per informazioni aggiuntive:
- Filtra transazioni di successo (`status: "success"`)
- Considera solo transazioni di vendita (`kind: "sale"` o `kind: "capture"`)
- Confronta il gateway della transazione con quello rilevato

## 📝 Logging

Il sistema registra informazioni dettagliate per il debug:
```
💳 Metodo di pagamento rilevato: {
  gateway: "paypal",
  method: "PayPal", 
  isInstant: true,
  financialStatus: "pending",
  paidAmount: 100.00,
  totalAmount: 100.00
}
```

## ⚙️ Configurazione Payment Account ID

I Payment Account ID devono essere configurati in Fatture in Cloud:
- **0**: Cassa (per contrassegno/contanti)
- **1**: Conto bancario principale
- **2**: Conto PayPal
- **3**: Conto carte di credito
- **4**: Conto pagamenti rateali
- **5**: Conto wallet digitali
- **6**: Conto Amazon Pay

> **Nota**: Assicurati che questi ID corrispondano ai conti configurati nel tuo account Fatture in Cloud.