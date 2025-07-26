const express = require('express');
const { MongoClient } = require('mongodb');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
let db;

async function connectDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db('nutragenix');
    console.log('✅ Connesso a MongoDB');
  } catch (error) {
    console.error('❌ Errore connessione MongoDB:', error);
  }
}

// Email transporter
let transporter;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
  console.log('✅ Email transporter configurato');
}

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  try {
    console.log('🎯 Webhook ricevuto:', JSON.stringify(req.body, null, 2));
    
    const { type, data } = req.body;

    // Verifica che sia un evento di ricevuta
    if (!type || !type.includes('receipts')) {
      console.log('⚠️ Evento ignorato, non è una ricevuta:', type);
      return res.status(200).json({ message: 'Event ignored - not a receipt' });
    }

    // Estrai i dati della ricevuta
    const receipt = data?.entity || data;
    if (!receipt) {
      console.log('❌ Nessun dato ricevuta trovato');
      return res.status(400).json({ error: 'No receipt data found' });
    }

    console.log('📄 Ricevuta ricevuta:', {
      id: receipt.id,
      number: receipt.number,
      date: receipt.date,
      entity: receipt.entity?.name,
      amount: receipt.amount_net
    });

    // Salva la ricevuta nel database
    if (db) {
      const receiptsCollection = db.collection('receipts');
      const receiptDoc = {
        ficId: receipt.id,
        number: receipt.number,
        date: receipt.date,
        entity: receipt.entity,
        amount_net: receipt.amount_net,
        amount_gross: receipt.amount_gross,
        items: receipt.items_list,
        payment_method: receipt.payment_method,
        status: receipt.status,
        webhookType: type,
        receivedAt: new Date(),
        rawData: receipt
      };

      await receiptsCollection.replaceOne(
        { ficId: receipt.id },
        receiptDoc,
        { upsert: true }
      );

      console.log('💾 Ricevuta salvata nel database');
    }

    // Invia email se configurato
    if (transporter) {
      try {
        const emailSubject = type.includes('create') 
          ? `🆕 Nuova ricevuta: ${receipt.number}`
          : `📝 Ricevuta aggiornata: ${receipt.number}`;

        const emailBody = `
          <h2>${emailSubject}</h2>
          <p><strong>Numero:</strong> ${receipt.number}</p>
          <p><strong>Data:</strong> ${receipt.date}</p>
          <p><strong>Cliente:</strong> ${receipt.entity?.name || 'N/A'}</p>
          <p><strong>Importo:</strong> €${receipt.amount_net}</p>
          <p><strong>Metodo pagamento:</strong> ${receipt.payment_method?.name || 'N/A'}</p>
          <p><strong>Stato:</strong> ${receipt.status}</p>
          
          <h3>Prodotti:</h3>
          <ul>
            ${receipt.items_list?.map(item => 
              `<li>${item.product?.name || item.description} - Qty: ${item.qty} - €${item.net_price}</li>`
            ).join('') || '<li>Nessun prodotto</li>'}
          </ul>
        `;

        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: process.env.EMAIL_TO || process.env.SMTP_USER,
          subject: emailSubject,
          html: emailBody
        });

        console.log('📧 Email inviata con successo');
      } catch (emailError) {
        console.error('❌ Errore invio email:', emailError);
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully',
      receiptId: receipt.id,
      receiptNumber: receipt.number
    });

  } catch (error) {
    console.error('❌ Errore nel webhook:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'Fatture in Cloud Webhook Service',
    timestamp: new Date().toISOString()
  });
});

// Avvia il server
app.listen(PORT, async () => {
  console.log(`🚀 Webhook service in ascolto sulla porta ${PORT}`);
  await connectDB();
});