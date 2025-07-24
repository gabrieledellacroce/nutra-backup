#!/usr/bin/env node

/**
 * Script per testare un token manuale e registrare il webhook
 * Usa questo script se hai problemi di connessione MongoDB
 */

const https = require('https');
require('dotenv').config({ path: '.env.prod' });

const COMPANY_ID = process.env.FIC_COMPANY_ID;
const BASE_URL = process.env.BASE_URL;

// 🔑 INSERISCI QUI IL TOKEN CHE VEDI IN MONGODB ATLAS
const ACCESS_TOKEN = 'INSERISCI_QUI_IL_TOKEN_DA_MONGODB';

async function testTokenManuale() {
    console.log('🔍 Test token manuale...');
    console.log(`🏢 Company ID: ${COMPANY_ID}`);
    console.log(`🌐 Base URL: ${BASE_URL}`);
    
    if (ACCESS_TOKEN === 'INSERISCI_QUI_IL_TOKEN_DA_MONGODB') {
        console.log('❌ Devi inserire il token nel file!');
        console.log('💡 Apri test-token-manuale.js e sostituisci ACCESS_TOKEN con il token da MongoDB Atlas');
        return;
    }
    
    console.log(`🔑 Token: ${ACCESS_TOKEN.substring(0, 20)}...`);
    
    // Test del token
    const isValid = await testToken(ACCESS_TOKEN);
    
    if (isValid) {
        console.log('✅ Token valido!');
        
        // Lista webhook esistenti
        await listWebhooks(ACCESS_TOKEN);
        
        // Registra nuovo webhook
        await registerWebhook(ACCESS_TOKEN);
        
        // Test webhook
        await testWebhook();
    } else {
        console.log('❌ Token non valido o scaduto');
        console.log('💡 Prova a ottenere un nuovo token con: node get-oauth-token.js');
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
                    try {
                        const data = JSON.parse(body);
                        console.log(`📊 Trovati ${data.data?.length || 0} metodi di pagamento`);
                    } catch (e) {
                        console.log('📊 Risposta API valida');
                    }
                    resolve(true);
                } else {
                    console.log(`❌ Token non valido - Status: ${res.statusCode}`);
                    console.log('Response:', body);
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
    console.log('\n🔗 Registrazione nuovo webhook...');
    
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
                    } catch (e) {
                        console.log('📋 Webhook creato (errore parsing dettagli)');
                    }
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

async function testWebhook() {
    console.log('\n🧪 Test webhook endpoint...');
    
    const webhookUrl = `${BASE_URL}/api/webhook`;
    
    // Test semplice GET per verificare che l'endpoint risponda
    return new Promise((resolve) => {
        const url = new URL(webhookUrl);
        const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        };
        
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                console.log(`📊 Endpoint webhook risponde - Status: ${res.statusCode}`);
                if (res.statusCode === 405) {
                    console.log('✅ Endpoint corretto (405 = Method Not Allowed per GET è normale)');
                } else if (res.statusCode === 200) {
                    console.log('✅ Endpoint risponde correttamente');
                } else {
                    console.log('⚠️  Endpoint risponde ma con status inaspettato');
                }
                resolve();
            });
        });
        
        req.on('error', (error) => {
            console.error('❌ Errore test endpoint:', error.message);
            resolve();
        });
        
        req.end();
    });
}

console.log('🎯 Test Token Manuale - Fatture in Cloud Webhook');
console.log('=' .repeat(60));

// Esegui il test
testTokenManuale().then(() => {
    console.log('\n🎉 Test completato!');
    console.log('\n📝 Prossimi passi:');
    console.log('1. Se il token è valido, il webhook è stato registrato');
    console.log('2. Testa con: ./test-webhook-email.sh');
    console.log('3. Verifica logs: vercel logs');
}).catch(console.error);