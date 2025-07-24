// Endpoint webhook per ricevere notifiche da Fatture in Cloud
const { sendReceiptEmail, checkEmailConfiguration } = require('./email.js');
const { getConfigWithFallback } = require('./config.js');

module.exports = async function handler(req, res) {
  // Accetta solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔔 Webhook ricevuto da Fatture in Cloud:', JSON.stringify(req.body, null, 2));
    
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

    // Ottieni token e company ID dalle configurazioni o variabili d'ambiente
    const accessToken = await getConfigWithFallback('FATTURE_ACCESS_TOKEN') || 
                       process.env.FATTURE_ACCESS_TOKEN || 
                       'a/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyZWYiOiJJOWFaaU1pR0VXTVNiNWRLQ3lPTVdkbndRZjcwNHlIZyIsImV4cCI6MTc1MzI4NDM2MX0.CjUAB_zVpI0WWSdxIKnZWcFJrRnLSEOAU0rWOtUyi3c';
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