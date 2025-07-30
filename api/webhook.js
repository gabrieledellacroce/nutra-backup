// Endpoint webhook per ricevere notifiche da Fatture in Cloud
const { sendReceiptEmail, checkEmailConfiguration } = require('./email.js');
const { getConfigWithFallback } = require('./config.js');

// Array in memoria per logging (si resetta ad ogni deploy)
let webhookLogs = [];

// Funzione di logging semplificata
function logWebhookEvent(logData) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...logData
  };
  
  webhookLogs.push(logEntry);
  if (webhookLogs.length > 10) {
    webhookLogs = webhookLogs.slice(-10); // Mantieni solo ultimi 10
  }
  
  console.log('💾 WEBHOOK EVENT:', JSON.stringify(logEntry, null, 2));
}

module.exports = async function handler(req, res) {
  // ENDPOINT DI TEST - GET per vedere i log
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: 'Webhook endpoint attivo',
      recentLogs: webhookLogs.reverse(),
      totalLogs: webhookLogs.length,
      testInstructions: {
        simulate_create: 'POST con ?test=create',
        simulate_update: 'POST con ?test=update',
        simulate_both: 'POST con ?test=both'
      }
    });
  }

  // Accetta solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // MODALITÀ TEST - Simula webhook per debug
    if (req.query.test) {
      const testType = req.query.test;
      console.log('🧪 MODALITÀ TEST ATTIVATA:', testType);
      
      const testData = {
        id: 999999999,
        number: 'TEST-001',
        date: new Date().toISOString().split('T')[0],
        amount_net: 50.00,
        entity: {
          name: 'Cliente Test',
          email: 'test@example.com'
        }
      };

      if (testType === 'create' || testType === 'both') {
        console.log('🧪 Simulazione CREATE...');
        logWebhookEvent({
          type: 'it.fattureincloud.webhooks.receipts.create',
          action: 'test_create',
          receiptId: testData.id
        });
        
        if (testType === 'both') {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (testType === 'update' || testType === 'both') {
        console.log('🧪 Simulazione UPDATE...');
        logWebhookEvent({
          type: 'it.fattureincloud.webhooks.receipts.update',
          action: 'test_update_filtered',
          receiptId: testData.id,
          filtered: true
        });
      }

      return res.status(200).json({
        success: true,
        message: `Test ${testType} completato`,
        testData: testData,
        logs: webhookLogs
      });
    }

    console.log('🔔 Webhook ricevuto da Fatture in Cloud:', JSON.stringify(req.body, null, 2));
    
    const { type, data } = req.body;

    // Log del tipo di evento per debugging
    console.log('🔍 Tipo evento webhook:', type);

    // LOGGING - Salva sempre tutti i webhook ricevuti
    logWebhookEvent({
      type: type,
      action: 'received',
      receiptId: data?.entity?.id || data?.id,
      receiptNumber: data?.entity?.number || data?.number,
      customerName: data?.entity?.entity?.name || data?.entity?.name
    });

    // Verifica che sia un evento di ricevuta
    if (!type || !type.includes('receipts')) {
      console.log('⚠️ Evento ignorato, non è una ricevuta:', type);
      logWebhookEvent({
        type: type,
        action: 'ignored_not_receipt',
        reason: 'Not a receipt event'
      });
      return res.status(200).json({ message: 'Event ignored - not a receipt' });
    }

    // FILTRO DUPLICATI: Ignora eventi UPDATE per evitare duplicati
    if (type.includes('update')) {
      console.log('⚠️ Evento UPDATE ignorato per evitare duplicati:', type);
      logWebhookEvent({
        type: type,
        action: 'ignored_update',
        reason: 'Update event filtered to avoid duplicates',
        receiptId: data?.entity?.id || data?.id
      });
      return res.status(200).json({ message: 'Event ignored - update event (avoiding duplicates)' });
    }

    // Estrai i dati della ricevuta
    const receipt = data?.entity || data;
    if (!receipt) {
      console.log('❌ Nessun dato ricevuta trovato');
      return res.status(400).json({ error: 'No receipt data found' });
    }

    console.log('📄 Ricevuta ricevuta via webhook:', {
      id: receipt.id,
      number: receipt.number,
      date: receipt.date,
      entity: receipt.entity?.name,
      amount: receipt.amount_net,
      status: receipt.status
    });

    // Verifica se l'email è abilitata
    const emailConfig = await checkEmailConfiguration();
    if (!emailConfig.configured) {
      console.log('📧 Email disabilitata, webhook ignorato:', emailConfig.reason);
      return res.status(200).json({ 
        success: true, 
        message: 'Webhook received but email disabled',
        reason: emailConfig.reason 
      });
    }

    // Verifica se abbiamo i dati del cliente
    const customerEmail = receipt.entity?.email;
    const customerName = receipt.entity?.name;
    
    if (!customerEmail) {
      console.log('⚠️ Email cliente non trovata nella ricevuta');
      return res.status(200).json({ 
        success: true, 
        message: 'No customer email found' 
      });
    }

    // Ottieni token valido (con refresh automatico se necessario) e company ID
    const { getValidToken } = require('./auth.js');
    let accessToken;
    
    try {
      accessToken = await getValidToken();
      console.log('🔑 Token valido ottenuto dal sistema OAuth2');
    } catch (error) {
      console.error('❌ Impossibile ottenere token OAuth2:', error.message);
      return res.status(500).json({ 
        error: 'Authentication failed', 
        message: 'Unable to get valid token' 
      });
    }
    
    const companyId = await getConfigWithFallback('FATTURE_COMPANY_ID') || 
                     process.env.FIC_COMPANY_ID || 
                     '1268058';
    
    console.log('🔑 Token e Company ID ottenuti:', {
      hasToken: !!accessToken,
      companyId: companyId,
      tokenPrefix: accessToken ? accessToken.substring(0, 10) + '...' : 'none'
    });
    
    if (!accessToken || !companyId) {
      console.error('❌ Token o Company ID mancanti per invio email');
      return res.status(500).json({ error: 'Missing authentication data' });
    }

    // Invia email con PDF
    try {
      console.log('📧 Tentativo invio email via webhook...');
      
      const emailResult = await sendReceiptEmail(
        receipt,
        customerEmail,
        customerName,
        accessToken,
        companyId
      );
      
      if (emailResult.success) {
        console.log('✅ Email ricevuta inviata con successo via webhook:', {
          to: customerEmail,
          messageId: emailResult.messageId,
          hasPDF: emailResult.hasPDF,
          receiptNumber: receipt.number
        });
        
        // Log successo invio email
        logWebhookEvent({
          type: type,
          action: 'email_sent_success',
          receiptId: receipt.id,
          receiptNumber: receipt.number,
          customerEmail: customerEmail,
          messageId: emailResult.messageId,
          hasPDF: emailResult.hasPDF
        });
        
        return res.status(200).json({ 
          success: true, 
          message: 'Email sent successfully',
          receiptId: receipt.id,
          receiptNumber: receipt.number,
          emailSent: true,
          hasPDF: emailResult.hasPDF
        });
      } else {
        console.warn('⚠️ Errore invio email via webhook:', emailResult.error);
        
        // Log errore invio email
        logWebhookEvent({
          type: type,
          action: 'email_sent_failed',
          receiptId: receipt.id,
          receiptNumber: receipt.number,
          customerEmail: customerEmail,
          error: emailResult.error
        });
        
        return res.status(200).json({ 
          success: true, 
          message: 'Webhook processed but email failed',
          receiptId: receipt.id,
          receiptNumber: receipt.number,
          emailSent: false,
          error: emailResult.error
        });
      }
    } catch (emailError) {
      console.error('❌ Errore durante invio email via webhook:', emailError);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Webhook processed but email error',
        receiptId: receipt.id,
        receiptNumber: receipt.number,
        emailSent: false,
        error: emailError.message
      });
    }

  } catch (error) {
    console.error('❌ Errore nel webhook:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};