const https = require('https');

async function testPreviewEmailWebhook(previewUrl) {
  console.log('🧪 TEST WEBHOOK EMAIL SU PREVIEW URL\n');
  
  if (!previewUrl) {
    console.error('❌ Devi fornire l\'URL preview come parametro');
    console.log('Uso: node test-preview-email.js https://email-system-test-nutra-backup.vercel.app');
    return;
  }
  
  // Rimuovi trailing slash se presente
  const baseUrl = previewUrl.replace(/\/$/, '');
  
  try {
    // 1. Test endpoint ricevutecloud con webhook fittizio
    console.log('📧 1. Test webhook ricevutecloud...');
    
    const webhookData = {
      type: 'receipts.created',
      data: {
        entity: {
          id: 'test-webhook-123',
          number: '888',
          date: new Date().toISOString().split('T')[0],
          type: 'receipt',
          amount_net: '30.00',
          amount_gross: '36.60',
          entity: {
            name: 'Mario Rossi Test',
            email: 'gabriprb@me.com' // Email di test come da regole
          },
          status: 'paid'
        }
      }
    };
    
    const result = await makeRequest(`${baseUrl}/api/ricevutecloud`, 'POST', webhookData);
    
    if (result.success) {
      console.log('✅ Webhook ricevutecloud funziona!');
      console.log('📧 Risposta:', result.data);
    } else {
      console.error('❌ Errore webhook:', result.error);
    }
    
    // 2. Test status auth
    console.log('\n🔑 2. Test status autorizzazione...');
    const authResult = await makeRequest(`${baseUrl}/api/auth/status`, 'GET');
    
    if (authResult.success) {
      console.log('✅ Autorizzazione OK:', authResult.data);
    } else {
      console.error('❌ Errore autorizzazione:', authResult.error);
    }
    
  } catch (error) {
    console.error('❌ Errore durante il test:', error.message);
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
        'User-Agent': 'Test-Script/1.0'
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

// Esegui test con URL da parametro
const previewUrl = process.argv[2];
testPreviewEmailWebhook(previewUrl);