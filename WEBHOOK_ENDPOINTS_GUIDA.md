# 🔗 Guida agli Endpoint Webhook

## 📋 Panoramica

Il sistema utilizza **DUE endpoint webhook diversi** per gestire il flusso completo da Shopify a Fatture in Cloud:

---

## 🛒 **1. `/api/receipts` - Webhook DA Shopify**

### **Scopo**
Riceve gli ordini da Shopify e crea automaticamente le ricevute su Fatture in Cloud.

### **Configurazione su Shopify**
- **URL**: `https://nutra-backup.vercel.app/api/receipts`
- **Event**: `Order creation` (o `Order paid`)
- **Format**: `JSON`
- **Metodo**: `POST`

### **Cosa fa**
1. Riceve i dati dell'ordine da Shopify
2. Estrae informazioni cliente, prodotti, prezzi
3. Calcola totali, sconti, spedizione
4. Crea la ricevuta su Fatture in Cloud
5. Salva i dati in MongoDB
6. Gestisce duplicati e conflitti

### **Quando si attiva**
- Ogni volta che un cliente completa un ordine su Shopify
- Automaticamente quando Shopify invia il webhook

---

## 📧 **2. `/api/ricevutecloud` - Webhook DA Fatture in Cloud**

### **Scopo**
Riceve notifiche da Fatture in Cloud quando una ricevuta viene creata e invia email al cliente.

### **Configurazione su Fatture in Cloud**
- **URL**: `https://nutra-backup.vercel.app/api/ricevutecloud`
- **Event**: `receipts.create` (o simili)
- **Format**: `JSON`
- **Metodo**: `POST`

### **Cosa fa**
1. Riceve notifica da Fatture in Cloud
2. Scarica il PDF della ricevuta
3. Invia email al cliente con PDF allegato
4. Gestisce configurazione email

### **Quando si attiva**
- Dopo che `/api/receipts` ha creato una ricevuta su Fatture in Cloud
- Automaticamente quando Fatture in Cloud invia il webhook

---

## 🔄 **Flusso Completo**

```
1. CLIENTE FA ORDINE SU SHOPIFY
   ↓
2. SHOPIFY → /api/receipts
   ↓
3. /api/receipts crea ricevuta su Fatture in Cloud
   ↓
4. FATTURE IN CLOUD → /api/ricevutecloud
   ↓
5. /api/ricevutecloud invia email al cliente
```

---

## ⚠️ **Differenze Importanti**

| Aspetto | `/api/receipts` | `/api/ricevutecloud` |
|---------|-----------------|---------------------|
| **Fonte** | Shopify | Fatture in Cloud |
| **Trigger** | Ordine cliente | Ricevuta creata |
| **Azione** | Crea ricevuta | Invia email |
| **Dati** | Ordine Shopify | Ricevuta FiC |
| **Output** | Ricevuta FiC | Email + PDF |

---

## 🛠️ **Configurazione**

### **Per Shopify**
1. Vai su: Shopify Admin → Settings → Notifications
2. Sezione: Webhooks
3. Clicca: "Create webhook"
4. Inserisci: `https://nutra-backup.vercel.app/api/receipts`

### **Per Fatture in Cloud**
1. Vai su: Fatture in Cloud → Impostazioni → Webhook
2. Aggiungi: `https://nutra-backup.vercel.app/api/ricevutecloud`
3. Eventi: Creazione ricevute

---

## 🧪 **Test**

### **📋 REGOLE OBBLIGATORIE PER I TEST**

⚠️ **IMPORTANTE**: Seguire sempre queste regole quando si effettuano test:

1. **📧 Email di test**: Usare SEMPRE `gabriprb@me.com` per tutti i test
2. **📅 Data ricevuta**: Usare SEMPRE la data di oggi (del giorno in cui viene effettuato il test)
3. **🗑️ Pulizia file**: Eliminare SEMPRE i file di test temporanei dopo l'uso per evitare accumulo di file inutili

### **Test Shopify → Ricevuta**
```bash
curl -X POST https://nutra-backup.vercel.app/api/receipts \
  -H "Content-Type: application/json" \
  -d @webhook-payload.json
```

### **Test Fatture in Cloud → Email**
```bash
curl -X POST https://nutra-backup.vercel.app/api/ricevutecloud \
  -H "Content-Type: application/json" \
  -d '{"type":"receipts.create","data":{"entity":{"id":123}}}'
```

---

## 📝 **Note**

- **NON confondere** i due endpoint
- **Shopify** usa sempre `/api/receipts`
- **Fatture in Cloud** usa sempre `/api/ricevutecloud`
- Entrambi sono necessari per il flusso completo
- Il sistema gestisce automaticamente duplicati e errori

---

## 🆘 **Troubleshooting**

### **Ricevuta non creata**
- Controlla `/api/receipts`
- Verifica configurazione Shopify
- Controlla logs MongoDB

### **Email non inviata**
- Controlla `/api/ricevutecloud`
- Verifica configurazione email
- Controlla webhook Fatture in Cloud

---

*Ultimo aggiornamento: 25 Gennaio 2025*