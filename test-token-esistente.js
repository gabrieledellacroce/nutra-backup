#!/usr/bin/env node

/**
 * Script per testare i token esistenti in MongoDB e registrare il webhook
 */

const { MongoClient } = require('mongodb');
const https = require('https');
require('dotenv').config({ path: '.env.prod' });

const MONGODB_URI = process.env.MONGODB_URI;
const COMPANY_ID = process.env.FIC_COMPANY_ID;
const BASE_URL = process.env.BASE_URL;

async function testTokenEsistente() {
    console.log('🔍 Test token esistente in MongoDB...');
    
    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI non configurato');
        return;
    }
    
    let client;
    try {
        // Connessione a MongoDB
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        console.log('✅ Connesso a MongoDB');
        
        // Recupera token
        const db = client.db();
        const collection = db.collection('tokens');
        const tokenDoc = await collection.findOne({ key: 'oauth2' });
        
        if (!tokenDoc || !tokenDoc.access_token) {
            console.log('❌ Nessun token trovato in MongoDB');
            console.log('💡 Prova a usare il token che vedi nell\'interfaccia MongoDB Atlas');
            return;
        }
        
        console.log('✅ Token trovato in MongoDB!');
        console.log(`🔑 Access Token: ${tokenDoc.access_token.substring(0, 20)}...`);
        
        // Test del token
        const isValid = await testToken(tokenDoc.access_token);
        
        if (isValid) {
            console.log('✅ Token valido!');
            
            // Registra webhook
            await registerWebhook(tokenDoc.access_token);
        } else {
            console.log('❌ Token non valido o scaduto');
        }
        
    } catch (error) {
        console.error('❌ Errore:', error.message);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

async function testToken(accessToken) {
    console.log('🧪 Test validità token...');
    
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

async function registerWebhook(accessToken) {
    console.log('🔗 Registrazione webhook...');
    
    const webhookUrl = `${BASE_URL}/api/webhook`;
    
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
                    console.log('📋 Dettagli:', JSON.parse(body));
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

// Esegui il test
testTokenEsistente().catch(console.error);