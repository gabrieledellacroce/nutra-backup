// Endpoint di test per simulare webhook di Fatture in Cloud
// Utile per debuggare il problema dei duplicati senza creare ordini reali

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action = 'both' } = req.query; // 'create', 'update', 'both'
    
    console.log('🧪 TEST WEBHOOK - Simulazione iniziata:', { action });

    // Dati di test per simulare una ricevuta
    const testReceiptData = {
      id: 999999999,
      number: 'TEST-001',
      date: new Date().toISOString().split('T')[0],
      amount_net: 50.00,
      amount_gross: 61.00,
      entity: {
        id: 888888888,
        name: 'Cliente Test Webhook',
        email: 'test@example.com',
        code: 'SHOPIFY-TEST123456789'
      },
      status: 'paid'
    };

    // Simula webhook CREATE
    if (action === 'create' || action === 'both') {
      console.log('🧪 Simulazione webhook CREATE...');
      
      const createPayload = {
        type: 'it.fattureincloud.webhooks.receipts.create',
        data: {
          entity: testReceiptData
        }
      };

      const createResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createPayload)
      });

      const createResult = await createResponse.text();
      console.log('📊 Risultato CREATE:', {
        status: createResponse.status,
        response: createResult
      });
    }

    // Attesa di 2 secondi per simulare il timing reale
    if (action === 'both') {
      console.log('⏳ Attesa 2 secondi prima dell\'UPDATE...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Simula webhook UPDATE
    if (action === 'update' || action === 'both') {
      console.log('🧪 Simulazione webhook UPDATE...');
      
      const updatePayload = {
        type: 'it.fattureincloud.webhooks.receipts.update',
        data: {
          entity: {
            ...testReceiptData,
            status: 'sent' // Simula cambio di stato
          }
        }
      };

      const updateResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload)
      });

      const updateResult = await updateResponse.text();
      console.log('📊 Risultato UPDATE:', {
        status: updateResponse.status,
        response: updateResult
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Test webhook completato',
      action: action,
      testData: testReceiptData,
      instructions: {
        create_only: 'Usa ?action=create per testare solo CREATE',
        update_only: 'Usa ?action=update per testare solo UPDATE', 
        both: 'Usa ?action=both (default) per testare entrambi'
      }
    });

  } catch (error) {
    console.error('❌ Errore nel test webhook:', error);
    return res.status(500).json({
      error: 'Test webhook failed',
      message: error.message
    });
  }
};