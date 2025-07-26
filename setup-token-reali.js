#!/usr/bin/env node

/**
 * Script per configurare automaticamente i token OAuth2 reali
 * e registrare il webhook di Fatture in Cloud
 */

const https = require('https');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.prod' });

// Token OAuth2 reali forniti dall'utente
const REAL_TOKENS = {
    access_token: 'a/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyZWYiOiJJOWFaaU1pR0VXTVNiNWRLQ3lPTVdkbndRZjcwNHlIZyIsImV4cCI6MTc1MzI4NDM2MX0.CjUAB_zVpI0WWSdxIKnZWcFJrRnLSEOAU0rWOtUyi3c',
    refresh_token: 'r/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyZWYiOiIyNGdEQUgxVkMySWpjUUszSnVoaWkyNDlZWXR5cHFwViJ9.NW6H7Sd423IFdQ9AgRxbRlnihJco97aRq7-Y-3dWyQ4',
    token_type: 'Bearer',
    expires_in: 3600,
    scope: 'entity.clients:a issued_documents.receipts:a'
};

const MONGODB_URI = process.env.MONGODB_URI;
const COMPANY_ID = process.env.FIC_COMPANY_ID;
const BASE_URL = process.env.BASE_URL || 'https://nutra-backup.vercel.app';

if (!MONGODB_URI || !COMPANY_ID || !BASE_URL) {
    console.error('❌ Errore: Variabili d\'ambiente mancanti in .env.prod');
    console.error('   MONGODB_URI:', MONGODB_URI ? '✅' : '❌');
    console.error('   FIC_COMPANY_ID:', COMPANY_ID ? '✅' : '❌');
    console.error('   BASE_URL:', BASE_URL ? '✅' : '❌');
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
 * Salva i token in MongoDB
 */
async function saveTokensToMongoDB() {
    console.log('💾 Salvataggio token in MongoDB...');
    
    let client;
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        
        const db = client.db('nutragenix');
        const collection = db.collection('tokens');
        
        const tokenData = {
            app: 'fatture_in_cloud',
            access_token: REAL_TOKENS.access_token,
            refresh_token: REAL_TOKENS.refresh_token,
            token_type: REAL_TOKENS.token_type,
            expires_in: REAL_TOKENS.expires_in,
            scope: REAL_TOKENS.scope,
            created_at: new Date(),
            updated_at: new Date()
        };
        
        await collection.replaceOne(
            { app: 'fatture_in_cloud' },
            tokenData,
            { upsert: true }
        );
        
        console.log('✅ Token salvati con successo in MongoDB!');
        return true;
        
    } catch (error) {
        console.error('❌ Errore nel salvataggio token:', error.message);
        return false;
    } finally {
        if (client) {
            await client.close();
        }
    }
}

/**
 * Testa la validità del token
 */
async function testToken() {
    console.log('🔍 Test validità token...');
    
    const options = {
        hostname: 'api-v2.fattureincloud.it',
        path: `/c/${COMPANY_ID}/info/payment_accounts`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${REAL_TOKENS.access_token}`,
            'Accept': 'application/json'
        }
    };
    
    try {
        const response = await makeRequest(options);
        
        if (response.statusCode === 200) {
            console.log('✅ Token valido! Connessione a Fatture in Cloud riuscita.');
            console.log(`📊 Trovati ${response.body.data?.length || 0} metodi di pagamento.`);
            return true;
        } else {
            console.error('❌ Token non valido:', response.statusCode, response.body);
            return false;
        }
    } catch (error) {
        console.error('❌ Errore nel test token:', error.message);
        return false;
    }
}

/**
 * Registra il webhook
 */
async function registerWebhook() {
    console.log('🔗 Registrazione webhook...');
    
    const webhookUrl = `${BASE_URL}/api/webhook`;
    
    const webhookData = {
        data: {
            sink: webhookUrl,
            verified: true,
            types: ['receipts.create', 'receipts.update']
        }
    };
    
    const options = {
        hostname: 'api-v2.fattureincloud.it',
        path: `/c/${COMPANY_ID}/subscriptions`,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${REAL_TOKENS.access_token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };
    
    try {
        const response = await makeRequest(options, JSON.stringify(webhookData));
        
        if (response.statusCode === 200 || response.statusCode === 201) {
            console.log('✅ Webhook registrato con successo!');
            console.log(`🔗 URL: ${webhookUrl}`);
            console.log(`📋 ID Subscription: ${response.body.data?.id}`);
            
            // Salva i dettagli della subscription
            const fs = require('fs');
            fs.writeFileSync('webhook-subscription.json', JSON.stringify({
                id: response.body.data?.id,
                sink: webhookUrl,
                types: ['receipts.create', 'receipts.update'],
                created_at: new Date().toISOString(),
                response: response.body
            }, null, 2));
            
            console.log('💾 Dettagli subscription salvati in webhook-subscription.json');
            return true;
        } else {
            console.error('❌ Errore nella registrazione webhook:', response.statusCode, response.body);
            return false;
        }
    } catch (error) {
        console.error('❌ Errore nella registrazione webhook:', error.message);
        return false;
    }
}

/**
 * Lista webhook esistenti
 */
async function listWebhooks() {
    console.log('📋 Lista webhook esistenti...');
    
    const options = {
        hostname: 'api-v2.fattureincloud.it',
        path: `/c/${COMPANY_ID}/subscriptions`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${REAL_TOKENS.access_token}`,
            'Accept': 'application/json'
        }
    };
    
    try {
        const response = await makeRequest(options);
        
        if (response.statusCode === 200) {
            const webhooks = response.body.data || [];
            console.log(`📊 Trovati ${webhooks.length} webhook esistenti:`);
            
            webhooks.forEach((webhook, index) => {
                console.log(`   ${index + 1}. ID: ${webhook.id}`);
                console.log(`      URL: ${webhook.sink}`);
                console.log(`      Eventi: ${webhook.types?.join(', ')}`);
                console.log(`      Stato: ${webhook.verified ? '✅ Verificato' : '⚠️ Non verificato'}`);
                console.log('');
            });
            
            return webhooks;
        } else {
            console.error('❌ Errore nel recupero webhook:', response.statusCode, response.body);
            return [];
        }
    } catch (error) {
        console.error('❌ Errore nel recupero webhook:', error.message);
        return [];
    }
}

/**
 * Funzione principale
 */
async function main() {
    console.log('🚀 Setup Automatico Token e Webhook Fatture in Cloud');
    console.log('=' .repeat(60));
    console.log(`🆔 Company ID: ${COMPANY_ID}`);
    console.log(`🌐 Base URL: ${BASE_URL}`);
    console.log(`🔑 Access Token: ${REAL_TOKENS.access_token.substring(0, 20)}...`);
    console.log('=' .repeat(60));
    
    // 1. Salva token in MongoDB
    const tokensSaved = await saveTokensToMongoDB();
    if (!tokensSaved) {
        console.log('⚠️ Continuando senza MongoDB (token non persistenti)...');
    }
    
    // 2. Testa validità token
    const tokenValid = await testToken();
    if (!tokenValid) {
        console.error('❌ Token non valido. Impossibile continuare.');
        process.exit(1);
    }
    
    // 3. Lista webhook esistenti
    const existingWebhooks = await listWebhooks();
    
    // 4. Controlla se webhook già esiste
    const webhookUrl = `${BASE_URL}/api/webhook`;
    const existingWebhook = existingWebhooks.find(w => w.sink === webhookUrl);
    
    if (existingWebhook) {
        console.log('ℹ️ Webhook già esistente:');
        console.log(`   ID: ${existingWebhook.id}`);
        console.log(`   URL: ${existingWebhook.sink}`);
        console.log(`   Stato: ${existingWebhook.verified ? '✅ Verificato' : '⚠️ Non verificato'}`);
    } else {
        // 5. Registra nuovo webhook
        const webhookRegistered = await registerWebhook();
        if (!webhookRegistered) {
            console.error('❌ Impossibile registrare webhook.');
            process.exit(1);
        }
    }
    
    console.log('\n🎉 Setup completato con successo!');
    console.log('\n📝 Prossimi passi:');
    console.log('1. Testa il webhook: node test-webhook-email.js');
    console.log('2. Testa una ricevuta: node test-ricevuta.js');
    console.log('3. Verifica email: controlla configurazione SMTP');
    console.log('\n🔧 Comandi utili:');
    console.log('- Stato server: curl http://localhost:3001/api/auth/status');
    console.log('- Lista webhook: curl http://localhost:3001/api/webhook-setup');
    console.log('- Test email: ./test-email.sh');
}

// Gestione degli argomenti da riga di comando
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Uso: node setup-token-reali.js [opzioni]

Opzioni:
  --help, -h     Mostra questo messaggio di aiuto

Questo script:
1. Salva i token OAuth2 reali in MongoDB
2. Testa la validità dei token
3. Lista webhook esistenti
4. Registra nuovo webhook se necessario
5. Configura il sistema completo
`);
    process.exit(0);
}

main().catch(error => {
    console.error('❌ Errore fatale:', error.message);
    process.exit(1);
});