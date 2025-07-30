// Endpoint webhook per ricevere notifiche da Fatture in Cloud
const { sendReceiptEmail, checkEmailConfiguration } = require('./email.js');
const { getConfigWithFallback } = require('./config.js');
const { getValidToken } = require('./auth.js');

module.exports = async function handler(req, res) {
  // Accetta solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔔 Webhook ricevuto da Fatture in Cloud:', JSON.stringify(req.body, null, 2));
    
    const { type, data } = req.body;

    // Log del tipo di evento per debugging
    console.log('🔍 Tipo evento webhook:', type);

    // Verifica che sia un evento di ricevuta
    if (!type || !type.includes('receipts')) {
      console.log('⚠️ Evento ignorato, non è una ricevuta:', type);
      return res.status(200).json({ message: 'Event ignored - not a receipt' });
    }

    // 🎯 FILTRO ANTI-DUPLICATI: Ignora eventi UPDATE per evitare duplicati
    if (type.includes('update')) {
      console.log('⚠️ Evento UPDATE ignorato per evitare duplicati:', type);
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
    // Prima controlla se abbiamo i dati originali del cliente (da chiamata interna)
    let customerEmail, customerName;
    
    if (req.body.original_customer) {
      // Dati del cliente originale da chiamata interna
      customerEmail = req.body.original_customer.email;
      customerName = `${req.body.original_customer.first_name || ''} ${req.body.original_customer.last_name || ''}`.trim();
      console.log('👤 Utilizzando dati cliente originali:', { email: customerEmail, name: customerName });
    } else {
      // Fallback ai dati della ricevuta di Fatture in Cloud
      customerEmail = receipt.entity?.email;
      customerName = receipt.entity?.name;
      console.log('👤 Utilizzando dati cliente da ricevuta FIC:', { email: customerEmail, name: customerName });
      
      // 🔍 NUOVO: Se email vuota, prova a estrarla dalle note
      if (!customerEmail && receipt.notes) {
        const emailMatch = receipt.notes.match(/Email:\s*([^\s-]+@[^\s-]+)/);
        if (emailMatch) {
          customerEmail = emailMatch[1];
          console.log('📧 Email estratta dalle note della ricevuta:', customerEmail);
        }
      }
    }
    
    if (!customerEmail) {
      console.log('⚠️ Email cliente non trovata nella ricevuta o nelle note');
      console.log('🔍 Debug - Dati disponibili:', {
        hasOriginalCustomer: !!req.body.original_customer,
        entityEmail: receipt.entity?.email,
        notes: receipt.notes
      });
      return res.status(200).json({ 
        success: true, 
        message: 'No customer email found' 
      });
    }

    // Ottieni token e company ID dalle configurazioni
    const accessToken = await getValidToken();
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
      
      // Prepara i dati della ricevuta con URL del PDF se disponibile
      const receiptDataForEmail = {
        ...receipt,
        // Assicurati che l'URL sia pulito (rimuovi spazi extra)
        url: receipt.url ? receipt.url.trim() : null,
        // Aggiungi anche il permanent_token come fallback
        permanent_token: receipt.permanent_token
      };
      
      console.log('📄 Dati PDF per email:', {
        hasUrl: !!receiptDataForEmail.url,
        url: receiptDataForEmail.url,
        hasPermanentToken: !!receiptDataForEmail.permanent_token,
        permanentToken: receiptDataForEmail.permanent_token
      });
      
      const emailResult = await sendReceiptEmail(
        receiptDataForEmail,
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