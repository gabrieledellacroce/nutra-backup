const nodemailer = require('nodemailer');
const { getConfig } = require('./config.js');
const fs = require('fs');
const path = require('path');

/**
 * Carica configurazione da file locale se MongoDB non è disponibile
 */
function loadLocalConfig() {
  try {
    const configPath = path.join(__dirname, '..', 'smtp-config.json');
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.log('Nessuna configurazione locale trovata');
  }
  return {};
}

/**
 * Ottiene configurazione con fallback al file locale
 */
async function getConfigWithFallback(key, defaultValue = null) {
  try {
    // Prova prima con MongoDB
    const value = await getConfig(key, defaultValue);
    if (value !== null && value !== undefined) {
      return value;
    }
  } catch (error) {
    // Se MongoDB non è disponibile, usa configurazione locale
    console.log(`MongoDB non disponibile, uso configurazione locale per ${key}`);
  }
  
  // Fallback alla configurazione locale
  const localConfig = loadLocalConfig();
  return localConfig[key] || defaultValue;
}

/**
 * Configura il trasportatore email basandosi sulle configurazioni
 */
async function createEmailTransporter() {
  const emailProvider = await getConfigWithFallback('EMAIL_PROVIDER', 'smtp');
  
  if (emailProvider === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: await getConfigWithFallback('EMAIL_USER'),
        pass: await getConfigWithFallback('EMAIL_PASSWORD') // App password per Gmail
      }
    });
  } else if (emailProvider === 'sendgrid') {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: await getConfigWithFallback('SENDGRID_API_KEY')
      }
    });
  } else {
    // SMTP generico
    return nodemailer.createTransport({
      host: await getConfigWithFallback('SMTP_HOST'),
      port: parseInt(await getConfigWithFallback('SMTP_PORT', '587')),
      secure: (await getConfigWithFallback('SMTP_SECURE', 'false')) === 'true',
      auth: {
        user: await getConfigWithFallback('SMTP_USER'),
        pass: await getConfigWithFallback('SMTP_PASSWORD')
      }
    });
  }
}

/**
 * Genera il PDF della ricevuta da Fatture in Cloud con retry logic
 */
async function getReceiptPDF(accessToken, companyId, receiptId) {
  const maxRetries = 3;
  const retryDelay = 5000; // Ridotto da 20000 (20 secondi) a 5000 (5 secondi)
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📄 Tentativo ${attempt}/${maxRetries} download PDF ricevuta ${receiptId}...`);
      
      const response = await fetch(
        `https://api-v2.fattureincloud.it/c/${companyId}/issued_documents/${receiptId}/pdf`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        console.log(`✅ PDF ricevuta ${receiptId} scaricato con successo al tentativo ${attempt}`);
        return await response.buffer();
      }
      
      // Se è 404, il PDF potrebbe non essere ancora pronto
      if (response.status === 404) {
        console.log(`⏳ PDF ricevuta ${receiptId} non ancora disponibile (tentativo ${attempt}/${maxRetries})`);
        
        // Se non è l'ultimo tentativo, aspetta prima di riprovare
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
      }
      
      // Altri errori HTTP
      throw new Error(`Errore download PDF: ${response.status} ${response.statusText}`);
      
    } catch (error) {
      console.error(`❌ Errore tentativo ${attempt}/${maxRetries} download PDF ricevuta ${receiptId}:`, error.message);
      
      // Se è l'ultimo tentativo, rilancia l'errore
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Aspetta prima del prossimo tentativo
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

/**
 * Sostituisce i tag dinamici nel template email
 */
function replaceDynamicTags(template, receiptData, customerName, companyData = {}) {
  let processedTemplate = template;
  
  // Tag base del documento
  processedTemplate = processedTemplate.replace(/{document_type}/g, getDocumentTypeLabel(receiptData.type));
  processedTemplate = processedTemplate.replace(/{document_number}/g, receiptData.number || '');
  processedTemplate = processedTemplate.replace(/{customer_name}/g, customerName || '');
  processedTemplate = processedTemplate.replace(/{amount}/g, receiptData.amount_gross || '0');
  processedTemplate = processedTemplate.replace(/{date}/g, receiptData.date || '');
  
  // Tag aziendali (se configurati in Fatture in Cloud)
  processedTemplate = processedTemplate.replace(/{logo-1}/g, companyData.name || '');
  processedTemplate = processedTemplate.replace(/{logo-2}/g, companyData.address || '');
  
  // Rimuovi tag {pdf} dal template (gestito separatamente come allegato)
  processedTemplate = processedTemplate.replace(/{pdf}/g, '');
  
  return processedTemplate;
}

/**
 * Converte il tipo di documento in etichetta leggibile
 */
function getDocumentTypeLabel(documentType) {
  const labels = {
    'invoice': 'Fattura',
    'receipt': 'Ricevuta',
    'quote': 'Preventivo',
    'proforma': 'Proforma',
    'delivery_note': 'Bolla di Consegna',
    'credit_note': 'Nota di Credito',
    'order': 'Ordine',
    'work_report': 'Rapporto di Lavoro'
  };
  return labels[documentType] || 'Documento';
}

/**
 * Genera HTML per bottone visualizza/scarica documento
 */
function generateDocumentButton(receiptData, companyId) {
  const buttonStyle = `
    display: inline-block;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    text-decoration: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: bold;
    margin: 20px 0;
  `;
  
  // URL diretto per scaricare il PDF del documento
  const documentUrl = `https://compute.fattureincloud.it/doc/${receiptData.token}.pdf`;
  
  return `
    <div style="text-align: center; margin: 20px 0;">
      <a href="${documentUrl}" style="${buttonStyle}">
        📄 Visualizza/Scarica Documento
      </a>
    </div>
  `;
}

/**
 * Invia email con ricevuta allegata
 */
async function sendReceiptEmail(receiptData, customerEmail, customerName, accessToken, companyId) {
  try {
    console.log('📧 Preparazione invio email ricevuta...');
    
    // Verifica configurazione email
    const emailEnabled = await getConfigWithFallback('EMAIL_ENABLED');
    if (emailEnabled !== 'true') {
      console.log('📧 Invio email disabilitato nella configurazione');
      return { success: false, reason: 'Email disabled in configuration' };
    }

    // Crea trasportatore email
    const transporter = await createEmailTransporter();
    
    // Configurazione email avanzata
    const fromEmail = await getConfigWithFallback('EMAIL_FROM', 'no-reply@fattureincloud.it');
    const fromName = await getConfigWithFallback('EMAIL_FROM_NAME', 'NutraGenix');
    const ccEnabled = await getConfigWithFallback('EMAIL_CC_ENABLED') === 'true';
    const ccEmail = await getConfigWithFallback('EMAIL_CC_ADDRESS');
    const attachPdf = await getConfigWithFallback('EMAIL_ATTACH_PDF', 'true') !== 'false'; // Default true
    const includeButton = await getConfigWithFallback('EMAIL_INCLUDE_BUTTON') === 'true';
    
    // Scarica il PDF della ricevuta se richiesto
    let pdfBuffer = null;
    let pdfStatus = 'not_requested';
    
    if (attachPdf) {
      try {
        pdfBuffer = await getReceiptPDF(accessToken, companyId, receiptData.id);
        console.log('📄 PDF ricevuta scaricato con successo');
        pdfStatus = 'downloaded';
      } catch (error) {
        console.warn('⚠️ Impossibile scaricare PDF ricevuta:', error.message);
        pdfStatus = 'failed';
        
        // Se il PDF non è disponibile, invia comunque l'email senza allegato
        // ma includi un messaggio informativo
        if (error.message.includes('404')) {
          console.log('📄 PDF non ancora disponibile - l\'email verrà inviata senza allegato');
          pdfStatus = 'not_ready';
        }
      }
    }
    
    // Template email con tag dinamici
    let emailSubject = await getConfigWithFallback('EMAIL_SUBJECT', '{document_type} {document_number} - {logo-1}');
    let emailTemplate = await getConfigWithFallback('EMAIL_TEMPLATE', `
Gentile {customer_name},

La ringraziamo per aver scelto {logo-1}.

In allegato trova la {document_type} n. {document_number} del {date} per l'importo di € {amount}.

Dettagli del documento:
• Tipo: {document_type}
• Numero: {document_number}  
• Data: {date}
• Importo: € {amount}

{logo-1}
{logo-2}

Per qualsiasi domanda o chiarimento, non esiti a contattarci.

Cordiali saluti,
Il Team di {logo-1}

---
Questa è una email automatica generata dal sistema di fatturazione.
    `.trim());

    // Sostituisci i tag dinamici
    emailSubject = replaceDynamicTags(emailSubject, receiptData, customerName);
    emailTemplate = replaceDynamicTags(emailTemplate, receiptData, customerName);
    
    // Genera versione HTML del template
    let htmlTemplate = emailTemplate.replace(/\n/g, '<br>');
    
    // Aggiungi messaggio informativo se il PDF non è disponibile
    if (attachPdf && pdfStatus === 'not_ready') {
      const pdfNotReadyMessage = `
<div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; border-radius: 5px;">
  <strong>📄 Nota:</strong> Il PDF del documento è in fase di generazione e sarà disponibile a breve nell'area clienti di Fatture in Cloud.
</div>`;
      htmlTemplate += pdfNotReadyMessage;
    }
    
    // Aggiungi bottone se richiesto
    if (includeButton) {
      const buttonHtml = generateDocumentButton(receiptData, companyId);
      htmlTemplate += buttonHtml;
    }

    // Configurazione messaggio
    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: customerEmail,
      subject: emailSubject,
      text: emailTemplate,
      html: htmlTemplate
    };

    // Aggiungi CC se configurato
    if (ccEnabled && ccEmail) {
      mailOptions.cc = ccEmail;
    }

    // Aggiungi allegato PDF se disponibile e richiesto
    if (pdfBuffer && attachPdf) {
      mailOptions.attachments = [{
        filename: `${getDocumentTypeLabel(receiptData.type).toLowerCase()}_${receiptData.number}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }];
    }

    // Invia email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email ricevuta inviata con successo:', {
      messageId: info.messageId,
      to: customerEmail,
      cc: ccEnabled ? ccEmail : null,
      receiptNumber: receiptData.number,
      pdfStatus: pdfStatus,
      hasPDF: !!pdfBuffer,
      hasButton: includeButton
    });

    return { 
      success: true, 
      messageId: info.messageId,
      pdfStatus: pdfStatus,
      hasPDF: !!pdfBuffer,
      hasButton: includeButton,
      ccSent: ccEnabled && ccEmail
    };

  } catch (error) {
    console.error('❌ Errore invio email ricevuta:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Verifica configurazione email
 */
async function checkEmailConfiguration() {
  try {
    const emailEnabled = await getConfigWithFallback('EMAIL_ENABLED');
    if (emailEnabled !== 'true') {
      return { configured: false, reason: 'Email disabled' };
    }

    const emailProvider = await getConfigWithFallback('EMAIL_PROVIDER', 'smtp');
    const requiredConfigs = ['EMAIL_FROM'];

    if (emailProvider === 'gmail') {
      requiredConfigs.push('EMAIL_USER', 'EMAIL_PASSWORD');
    } else if (emailProvider === 'sendgrid') {
      requiredConfigs.push('SENDGRID_API_KEY');
    } else {
      requiredConfigs.push('SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD');
    }

    for (const config of requiredConfigs) {
      const value = await getConfigWithFallback(config);
      if (!value) {
        return { 
          configured: false, 
          reason: `Missing configuration: ${config}` 
        };
      }
    }

    // Verifica configurazioni opzionali avanzate
    const advancedConfig = {
      ccEnabled: await getConfigWithFallback('EMAIL_CC_ENABLED') === 'true',
      ccAddress: await getConfigWithFallback('EMAIL_CC_ADDRESS'),
      attachPdf: await getConfigWithFallback('EMAIL_ATTACH_PDF', 'true') !== 'false',
      includeButton: await getConfigWithFallback('EMAIL_INCLUDE_BUTTON') === 'true',
      subject: await getConfigWithFallback('EMAIL_SUBJECT'),
      template: await getConfigWithFallback('EMAIL_TEMPLATE')
    };

    return { 
      configured: true,
      advanced: advancedConfig
    };
  } catch (error) {
    return { 
      configured: false, 
      reason: `Configuration error: ${error.message}` 
    };
  }
}

module.exports = {
  sendReceiptEmail,
  checkEmailConfiguration,
  createEmailTransporter
};