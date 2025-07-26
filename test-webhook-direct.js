const https = require('https');

async function testWebhookDirect() {
  console.log('🧪 TEST DIRETTO WEBHOOK PRODUZIONE\n');
  
  const webhookData = {
    type: 'receipts.created',
    data: {
      entity: {
        id: 'test-direct-' + Date.now(),
        number: 'TEST-' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        type: 'receipt',
        amount_net: '30.00',
        amount_gross: '36.60',
        entity: {
          name: 'Mario Rossi Test Direct',
          email: 'gabriprb@me.com'
        },
        status: 'paid'
      }
    }
  };
  
  console.log('📧 Dati webhook:', JSON.stringify(webhookData, null, 2));
  
  try {
    const result = await makeRequest('https://nutra-backup.vercel.app/api/ricevutecloud', 'POST', webhookData);
    
    console.log('\n📊 Risultato webhook:');
    console.log('Status:', result.status);
    console.log('Success:', result.success);
    console.log('Data:', JSON.stringify(result.data, null, 2));
    
    if (result.error) {
      console.log('Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

function makeRequest(url, method, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Direct-Webhook/1.0'
      }
    };
    
    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = responseData ? JSON.parse(responseData) : {};
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: jsonData,
            error: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null
          });
        } catch (e) {
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            data: responseData,
            error: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

testWebhookDirect();