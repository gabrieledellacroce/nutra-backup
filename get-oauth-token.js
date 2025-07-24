#!/usr/bin/env node

/**
 * Script per ottenere il token OAuth2 di Fatture in Cloud
 * Utilizza il client_credentials flow per ottenere un access token
 */

const https = require('https');
const querystring = require('querystring');
const fs = require('fs');

// Carica le variabili d'ambiente
require('dotenv').config({ path: '.env.prod' });

const CLIENT_ID = process.env.FIC_CLIENT_ID;
const CLIENT_SECRET = process.env.FIC_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('❌ Errore: FIC_CLIENT_ID e FIC_CLIENT_SECRET sono richiesti nel file .env.prod');
    process.exit(1);
}

/**
 * Effettua una richiesta HTTPS
 */
function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const response = {
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body ? JSON.parse(body) : null
                    };
                    resolve(response);
                } catch (error) {
                    reject(new Error(`Errore parsing JSON: ${error.message}\nBody: ${body}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(data);
        }
        req.end();
    });
}

/**
 * Ottiene il token OAuth2 usando client_credentials flow
 */
async function getOAuthToken() {
    console.log('🔐 Richiesta token OAuth2...');
    
    const postData = querystring.stringify({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: 'issued_documents.receipts:r issued_documents.receipts:w receipts:r receipts:w'
    });

    const options = {
        hostname: 'api-v2.fattureincloud.it',
        path: '/oauth/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    try {
        const response = await makeRequest(options, postData);
        
        if (response.statusCode === 200 && response.body.access_token) {
            console.log('✅ Token OAuth2 ottenuto con successo!');
            console.log(`🔑 Access Token: ${response.body.access_token}`);
            console.log(`⏰ Expires in: ${response.body.expires_in} secondi`);
            console.log(`🎯 Token Type: ${response.body.token_type}`);
            
            // Aggiorna il file .env.prod con il nuovo token
            await updateEnvFile(response.body.access_token);
            
            return response.body.access_token;
        } else {
            console.error('❌ Errore nell\'ottenimento del token:', response.statusCode, response.body);
            return null;
        }
    } catch (error) {
        console.error('❌ Errore nella richiesta OAuth2:', error.message);
        return null;
    }
}

/**
 * Aggiorna il file .env.prod con il nuovo token
 */
async function updateEnvFile(accessToken) {
    try {
        console.log('📝 Aggiornamento file .env.prod...');
        
        // Legge il file .env.prod esistente
        let envContent = fs.readFileSync('.env.prod', 'utf8');
        
        // Aggiunge o aggiorna la variabile FATTURE_IN_CLOUD_ACCESS_TOKEN
        const tokenLine = `FATTURE_IN_CLOUD_ACCESS_TOKEN="${accessToken}"`;
        
        if (envContent.includes('FATTURE_IN_CLOUD_ACCESS_TOKEN=')) {
            // Sostituisce la linea esistente
            envContent = envContent.replace(
                /FATTURE_IN_CLOUD_ACCESS_TOKEN=.*/,
                tokenLine
            );
        } else {
            // Aggiunge la nuova linea
            envContent += `\n${tokenLine}\n`;
        }
        
        // Scrive il file aggiornato
        fs.writeFileSync('.env.prod', envContent);
        
        console.log('✅ File .env.prod aggiornato con il nuovo token!');
        
        // Salva anche le informazioni del token in un file separato
        const tokenInfo = {
            access_token: accessToken,
            obtained_at: new Date().toISOString(),
            client_id: CLIENT_ID,
            expires_in: 3600 // Default per client_credentials
        };
        
        fs.writeFileSync('oauth-token.json', JSON.stringify(tokenInfo, null, 2));
        console.log('💾 Informazioni token salvate in oauth-token.json');
        
    } catch (error) {
        console.error('❌ Errore nell\'aggiornamento del file .env.prod:', error.message);
    }
}

/**
 * Funzione principale
 */
async function main() {
    console.log('🎯 Ottenimento Token OAuth2 Fatture in Cloud');
    console.log('=' .repeat(50));
    console.log(`🆔 Client ID: ${CLIENT_ID}`);
    console.log(`🔒 Client Secret: ${CLIENT_SECRET ? '***' + CLIENT_SECRET.slice(-4) : 'Non configurato'}`);
    console.log('=' .repeat(50));

    const token = await getOAuthToken();
    
    if (token) {
        console.log('\n🎉 Token ottenuto con successo!');
        console.log('\n📝 Prossimi passi:');
        console.log('1. Il token è stato salvato automaticamente in .env.prod');
        console.log('2. Ora puoi eseguire il setup webhook: ./setup-webhook.sh');
        console.log('3. Testa il sistema: ./test-ricevuta-email-completo.sh');
    } else {
        console.log('\n❌ Impossibile ottenere il token. Controlla:');
        console.log('1. Le credenziali CLIENT_ID e CLIENT_SECRET in .env.prod');
        console.log('2. La connessione internet');
        console.log('3. Che l\'applicazione sia configurata correttamente su Fatture in Cloud');
        process.exit(1);
    }
}

// Gestione degli argomenti da riga di comando
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Uso: node get-oauth-token.js [opzioni]

Opzioni:
  --help, -h     Mostra questo messaggio di aiuto

Variabili d'ambiente richieste (in .env.prod):
  FIC_CLIENT_ID      Client ID dell'applicazione Fatture in Cloud
  FIC_CLIENT_SECRET  Client Secret dell'applicazione Fatture in Cloud

Questo script:
1. Ottiene un access token OAuth2 usando client_credentials flow
2. Aggiorna automaticamente il file .env.prod con il token
3. Salva le informazioni del token in oauth-token.json
`);
    process.exit(0);
}

main().catch(error => {
    console.error('❌ Errore fatale:', error.message);
    process.exit(1);
});