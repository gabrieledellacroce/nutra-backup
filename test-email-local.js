const { sendReceiptEmail, checkEmailConfiguration } = require('./api/email.js');

async function testEmailSystem() {
  console.log('🧪 TEST SISTEMA EMAIL LOCALE\n');
  
  try {
    // 1. Verifica configurazione
    console.log('📋 1. Verifica configurazione email...');
    const emailConfig = await checkEmailConfiguration();
    
    if (!emailConfig.configured) {
      console.error('❌ Configurazione email non valida:', emailConfig.reason);
      return;
    }
    
    console.log('✅ Configurazione email valida!');
    console.log('📧 Configurazioni avanzate:', emailConfig.advanced);
    
    // 2. Test invio email con ricevuta fittizia
    console.log('\n📧 2. Test invio email...');
    
    const fakeReceipt = {
      id: 'test-123',
      number: '999',
      date: new Date().toISOString().split('T')[0],
      type: 'receipt',
      amount_gross: '25.00',
      entity: {
        name: 'Mario Rossi',
        email: 'gabriprb@me.com' // Email di test come da regole
      }
    };
    
    const accessToken = 'test-token'; // Token fittizio per test locale
    const companyId = '1268058';
    
    const result = await sendReceiptEmail(
      fakeReceipt,
      'gabriprb@me.com',
      'Mario Rossi',
      accessToken,
      companyId
    );
    
    if (result.success) {
      console.log('✅ Email inviata con successo!');
      console.log('📧 Dettagli:', {
        messageId: result.messageId,
        hasPDF: result.hasPDF,
        pdfStatus: result.pdfStatus,
        hasButton: result.hasButton
      });
    } else {
      console.error('❌ Errore invio email:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
  }
}

// Esegui test
testEmailSystem();