#!/usr/bin/env node

/**
 * Script per configurare il token direttamente da MongoDB Atlas
 * Basato sui token che vedi nell'interfaccia web
 */

const fs = require('fs');
const https = require('https');
require('dotenv').config({ path: '.env.prod' });

// 🔑 TOKENS CHE HAI VISTO IN MONGODB ATLAS
// Sostituisci questi con i token reali dall'interfaccia MongoDB
const TOKENS_DA_MONGODB = {
    // Esempio: copia i token che vedi nell'interfaccia MongoDB Atlas
    access_token: 'INSERISCI_ACCESS_TOKEN_QUI',
    refresh_token: 'INSERISCI_REFRESH_TOKEN_QUI',
    expires_at: 'INSERISCI_EXPIRES_AT_QUI'
};

const COMPANY_ID = process.env.FIC_COMPANY_ID;
const BASE_URL = process.env.BASE_URL;

async function setupTokenDaMongoDB() {
    console.log('🎯 Setup Token da MongoDB Atlas');
    console.log('=' .repeat(50));
    
    // Verifica che i token siano stati inseriti
    if (TOKENS_DA_MONGODB.access_token === 'INSERISCI_ACCESS_TOKEN_QUI') {
        console.log('❌ Devi inserire i token nel file!');
        console.log('\n📋 Istruzioni:');
        console.log('1. Apri setup-token-da-mongodb.js');
        console.log('2. Sostituisci TOKENS_DA_MONGODB con i valori da MongoDB Atlas');
        console.log('3. Esegui di nuovo lo script');
        console.log('\n💡 I token che vedi in MongoDB Atlas sono nel formato:');
        console.log('   access_token: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..."');
        console.log('   refresh_token: "def50200..."');
        console.log('   expires_at: "2024-01-27T10:52:30.000Z"');
        return;
    }
    
    console.log('🔍 Verifica token inseriti...');
    console.log(`🔑 Access Token: ${TOKENS_DA_MONGODB.access_token.substring(0, 30)}...`);
    console.log(`🔄 Refresh Token: ${TOKENS_DA_MONGODB.refresh_token ? TOKENS_DA_MONGODB.refresh_token.substring(0, 20) + '...' : 'Non fornito'}`);
    console.log(`⏰ Expires At: ${TOKENS_DA_MONGODB.expires_at}`);
    
    // Test del token
    const isValid = await testToken(TOKENS_DA_MONGODB.access_token);
    
    if (isValid) {
        console.log('\n✅ Token valido!');
        
        // Salva token nel file .env.prod
        await saveTokenToEnv(TOKENS_DA_MONGODB.access_token);
        
        // Lista webhook esistenti
        await listWebhooks(TOKENS_DA_MONGODB.access_token);
        
        // Registra webhook
        await registerWebhook(TOKENS_DA_MONGODB.access_token);
        
        console.log('\n🎉 Setup completato!');
        console.log('\n📝 Prossimi passi:');
        console.log('1. Testa webhook: ./test-webhook-email.sh');
        console.log('2. Verifica ricevute: ./test-ricevuta.sh');
        console.log('3. Controlla logs: vercel logs');
        
    } else {
        console.log('\n❌ Token non valido!');
        
        // Prova a fare refresh se abbiamo il refresh token
        if (TOKENS_DA_MONGODB.refresh_token && TOKENS_DA_MONGODB.refresh_token !== 'INSERISCI_REFRESH_TOKEN_QUI') {
            console.log('🔄 Tentativo refresh token...');
            const newToken = await refreshToken(TOKENS_DA_MONGODB.refresh_token);
            
            if (newToken) {
                console.log('✅ Token refreshed!');
                await saveTokenToEnv(newToken);
                await registerWebhook(newToken);
            }
        } else {
            console.log('💡 Prova a ottenere un nuovo token con: node get-oauth-token.js');
        }
    }
}

async function testToken(accessToken) {
    console.log('\n🧪 Test validità token...');
    
    return new Promise((resolve) => {
        const options = {
            hostname: 'api-v2.fattureincloud.it',
            path: `/c/${COMPANY_ID}/info/payment_accounts`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            }
        };
        
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ Token valido - API risponde correttamente');
                    resolve(true);
                } else {
                    console.log(`❌ Token non valido - Status: ${res.statusCode}`);
                    if (body) {
                        try {
                            const error = JSON.parse(body);
                            console.log(`📋 Errore: ${error.error || error.message || 'Sconosciuto'}`);
                        } catch (e) {
                            console.log('📋 Response:', body.substring(0, 200));
                        }
                    }
                    resolve(false);
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ Errore nella richiesta:', error.message);
            resolve(false);
        });
        
        req.end();
    });
}

async function refreshToken(refreshToken) {
    console.log('🔄 Refresh token...');
    
    const CLIENT_ID = process.env.FIC_CLIENT_ID;
    const CLIENT_SECRET = process.env.FIC_CLIENT_SECRET;
    
    if (!CLIENT_ID || !CLIENT_SECRET) {
        console.log('❌ CLIENT_ID o CLIENT_SECRET mancanti');
        return null;
    }
    
    return new Promise((resolve) => {
        const postData = JSON.stringify({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET
        });
        
        const options = {
            hostname: 'api-v2.fattureincloud.it',
            path: '/oauth/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const data = JSON.parse(body);
                        console.log('✅ Token refreshed con successo!');
                        resolve(data.access_token);
                    } catch (e) {
                        console.log('❌ Errore parsing response refresh');
                        resolve(null);
                    }
                } else {
                    console.log(`❌ Errore refresh - Status: ${res.statusCode}`);
                    console.log('Response:', body);
                    resolve(null);
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ Errore refresh:', error.message);
            resolve(null);
        });
        
        req.write(postData);
        req.end();
    });
}

async function saveTokenToEnv(accessToken) {
    console.log('\n💾 Salvataggio token in .env.prod...');
    
    try {
        let envContent = fs.readFileSync('.env.prod', 'utf8');
        
        // Rimuovi eventuali token esistenti
        envContent = envContent.replace(/^FATTURE_IN_CLOUD_ACCESS_TOKEN=.*$/gm, '');
        
        // Aggiungi il nuovo token
        envContent += `\nFATTURE_IN_CLOUD_ACCESS_TOKEN="${accessToken}"\n`;
        
        fs.writeFileSync('.env.prod', envContent);
        console.log('✅ Token salvato in .env.prod');
        
    } catch (error) {
        console.error('❌ Errore salvataggio token:', error.message);
    }
}

async function listWebhooks(accessToken) {
    console.log('\n📋 Lista webhook esistenti...');
    
    return new Promise((resolve) => {
        const options = {
            hostname: 'api-v2.fattureincloud.it',
            path: `/c/${COMPANY_ID}/subscriptions`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            }
        };
        
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const data = JSON.parse(body);
                        const webhooks = data.data || [];
                        console.log(`📊 Trovati ${webhooks.length} webhook esistenti`);
                        
                        webhooks.forEach((webhook, index) => {
                            console.log(`  ${index + 1}. ID: ${webhook.id}`);
                            console.log(`     URL: ${webhook.sink}`);
                            console.log(`     Eventi: ${Object.keys(webhook.config?.mapping || {}).join(', ')}`);
                        });
                        
                        // Controlla se esiste già il nostro webhook
                        const ourWebhook = webhooks.find(w => w.sink === `${BASE_URL}/api/webhook`);
                        if (ourWebhook) {
                            console.log('\n✅ Il nostro webhook è già registrato!');
                            console.log(`🆔 ID: ${ourWebhook.id}`);
                        }
                        
                    } catch (e) {
                        console.log('📊 Risposta ricevuta ma errore parsing');
                    }
                } else {
                    console.log(`❌ Errore lista webhook - Status: ${res.statusCode}`);
                }
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ Errore nella richiesta:', error.message);
            resolve();
        });
        
        req.end();
    });
}

async function registerWebhook(accessToken) {
    console.log('\n🔗 Registrazione webhook...');
    
    const webhookUrl = `${BASE_URL}/api/webhook`;
    console.log(`📍 URL webhook: ${webhookUrl}`);
    
    const webhookData = {
        data: {
            sink: webhookUrl,
            config: {
                mapping: {
                    'receipts.create': 'all',
                    'receipts.update': 'all'
                }
            }
        }
    };
    
    return new Promise((resolve) => {
        const postData = JSON.stringify(webhookData);
        
        const options = {
            hostname: 'api-v2.fattureincloud.it',
            path: `/c/${COMPANY_ID}/subscriptions`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 200 || res.statusCode === 201) {
                    console.log('✅ Webhook registrato con successo!');
                    try {
                        const response = JSON.parse(body);
                        console.log(`🆔 ID Webhook: ${response.data?.id}`);
                        console.log(`📍 URL: ${response.data?.sink}`);
                        console.log(`📅 Creato: ${response.data?.created_at}`);
                        
                        // Salva info webhook
                        fs.writeFileSync('webhook-subscription.json', JSON.stringify(response, null, 2));
                        console.log('💾 Dettagli salvati in webhook-subscription.json');
                        
                    } catch (e) {
                        console.log('📋 Webhook creato (errore parsing dettagli)');
                    }
                    resolve(true);
                } else if (res.statusCode === 409) {
                    console.log('⚠️  Webhook già esistente (409 Conflict)');
                    console.log('✅ Il webhook è già configurato correttamente');
                    resolve(true);
                } else {
                    console.log(`❌ Errore registrazione webhook - Status: ${res.statusCode}`);
                    console.log('Response:', body);
                    resolve(false);
                }
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ Errore nella richiesta webhook:', error.message);
            resolve(false);
        });
        
        req.write(postData);
        req.end();
    });
}

// Esegui il setup
setupTokenDaMongoDB().catch(console.error);