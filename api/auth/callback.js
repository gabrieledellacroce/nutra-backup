const fetch = require('node-fetch');
const { saveToken } = require('../auth.js');
const { getConfigWithFallback } = require('../config.js');

// Funzione per creare pagine di errore HTML
function createErrorPage(title, message, resetUrl = '/api/auth/start') {
  return `
  <!DOCTYPE html>
  <html lang="it">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - Nutragenix</title>
      <style>
          body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
              margin: 0;
              padding: 20px;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
          }
          .container {
              background: white;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 500px;
              width: 100%;
          }
          .error-icon {
              font-size: 64px;
              color: #e74c3c;
              margin-bottom: 20px;
          }
          h1 {
              color: #333;
              margin-bottom: 20px;
              font-size: 28px;
          }
          .message {
              color: #666;
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 30px;
          }
          .actions {
              display: flex;
              gap: 15px;
              justify-content: center;
              flex-wrap: wrap;
          }
          .btn {
              padding: 12px 24px;
              border-radius: 6px;
              font-size: 16px;
              text-decoration: none;
              cursor: pointer;
              border: none;
              transition: all 0.3s;
          }
          .btn-primary {
              background: #667eea;
              color: white;
          }
          .btn-primary:hover {
              background: #5a6fd8;
          }
          .btn-secondary {
              background: #f8f9fa;
              color: #333;
              border: 1px solid #dee2e6;
          }
          .btn-secondary:hover {
              background: #e9ecef;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="error-icon">❌</div>
          <h1>${title}</h1>
          <div class="message">${message}</div>
          <div class="actions">
               ${resetUrl === '/api/auth/reset' ? 
                 '<form method="POST" action="/api/auth/reset" style="display: inline;"><button type="submit" class="btn btn-primary">Reset e Riprova</button></form>' :
                 '<a href="/api/auth/start" class="btn btn-primary">Riprova Autorizzazione</a>'
               }
               <button class="btn btn-secondary" onclick="window.close()">Chiudi Finestra</button>
           </div>
      </div>
  </body>
  </html>
  `;
}

// Handler per il callback dell'autorizzazione
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, error, state } = req.query;
  
  console.log('Callback ricevuto:', { code: code ? 'presente' : 'assente', error, state });
  
  if (error) {
    const errorHtml = createErrorPage('Autorizzazione Negata', `L'autorizzazione è stata rifiutata: ${error}`);
    return res.status(400).setHeader('Content-Type', 'text/html').send(errorHtml);
  }
  
  if (!code) {
    const errorHtml = createErrorPage('Codice Mancante', 'Il codice di autorizzazione non è stato fornito.');
    return res.status(400).setHeader('Content-Type', 'text/html').send(errorHtml);
  }
  
  try {
    const baseUrl = await getConfigWithFallback('BASE_URL') || `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`;
    const redirectUri = `${baseUrl}/api/auth/callback`;
    
    const clientId = await getConfigWithFallback('FIC_CLIENT_ID');
    const clientSecret = await getConfigWithFallback('FIC_CLIENT_SECRET');
    
    const response = await fetch('https://api-v2.fattureincloud.it/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Errore API Fatture in Cloud:', { status: response.status, error: errorText });
      
      // Gestione specifica per token scaduto/non valido
      if (errorText.includes('invalid_grant') || errorText.includes('Invalid token')) {
        const expiredTokenHtml = createErrorPage(
          'Token Scaduto', 
          'Il codice di autorizzazione è scaduto o non valido. Questo può accadere se hai già utilizzato questo link o se è passato troppo tempo. <br><br><strong>Soluzione:</strong> Cancella i token esistenti e riprova l\'autorizzazione.',
          '/api/auth/reset'
        );
        return res.status(400).setHeader('Content-Type', 'text/html').send(expiredTokenHtml);
      }
      
      throw new Error(`Errore nello scambio del codice: ${response.status} ${errorText}`);
    }
    
    const tokenData = await response.json();
    console.log('Token ricevuto da Fatture in Cloud:', {
      access_token: tokenData.access_token ? 'presente' : 'mancante',
      refresh_token: tokenData.refresh_token ? 'presente' : 'mancante',
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type
    });
    
    const tokenSaved = await saveToken(tokenData);
    console.log('Risultato salvataggio token:', tokenSaved);
    
    if (!tokenSaved) {
      console.error('ERRORE: Token non salvato correttamente!');
      const errorHtml = createErrorPage('Errore Salvataggio', 'Il token è stato ricevuto ma non è stato possibile salvarlo nel database. Controlla la configurazione MongoDB.');
      return res.status(500).setHeader('Content-Type', 'text/html').send(errorHtml);
    }
    
    // Restituisce una pagina HTML user-friendly invece di JSON
    const successHtml = `
    <!DOCTYPE html>
    <html lang="it">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Autorizzazione Completata - Nutragenix</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 20px;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container {
                background: white;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 500px;
                width: 100%;
            }
            .success-icon {
                font-size: 64px;
                color: #4CAF50;
                margin-bottom: 20px;
            }
            h1 {
                color: #333;
                margin-bottom: 20px;
                font-size: 28px;
            }
            .message {
                color: #666;
                font-size: 16px;
                line-height: 1.6;
                margin-bottom: 30px;
            }
            .details {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 30px;
                text-align: left;
            }
            .details h3 {
                margin-top: 0;
                color: #333;
                font-size: 18px;
            }
            .details ul {
                margin: 0;
                padding-left: 20px;
            }
            .details li {
                margin-bottom: 8px;
                color: #555;
            }
            .close-btn {
                background: #667eea;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 6px;
                font-size: 16px;
                cursor: pointer;
                transition: background 0.3s;
            }
            .close-btn:hover {
                background: #5a6fd8;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="success-icon">✅</div>
            <h1>Autorizzazione Completata!</h1>
            <div class="message">
                L'integrazione tra Shopify e Fatture in Cloud è stata configurata con successo.
            </div>
            <div class="details">
                <h3>📋 Dettagli:</h3>
                <ul>
                    <li>✅ Token OAuth2 salvato correttamente</li>
                    <li>⏰ Scadenza: ${Math.round(tokenData.expires_in / 3600)} ore</li>
                    <li>🔄 Rinnovo automatico attivo</li>
                    <li>🚀 Integrazione pronta per l'uso</li>
                </ul>
            </div>
            <div class="details">
                <h3>🎯 Prossimi Passi:</h3>
                <ul>
                    <li>Configura il webhook Shopify su: <code>/api/receipts</code></li>
                    <li>Testa l'integrazione creando un ordine</li>
                    <li>Verifica le ricevute in Fatture in Cloud</li>
                </ul>
            </div>
            <button class="close-btn" onclick="window.close()">Chiudi Finestra</button>
        </div>
    </body>
    </html>
    `;
    
    res.status(200).setHeader('Content-Type', 'text/html').send(successHtml);
  } catch (error) {
    console.error('Errore nel callback:', error);
    const errorHtml = createErrorPage('Errore di Sistema', `Si è verificato un errore durante l'autorizzazione: ${error.message}`);
    res.status(500).setHeader('Content-Type', 'text/html').send(errorHtml);
  }
}