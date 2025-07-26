#!/usr/bin/env node

/**
 * Script per fare il refresh del token OAuth2 scaduto
 */

const https = require('https');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.prod' });

// Token di refresh
const REFRESH_TOKEN = 'r/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyZWYiOiIyNGdEQUgxVkMySWpjUUszSnVoaWkyNDlZWXR5cHFwViJ9.NW6H7Sd423IFdQ9AgRxbRlnihJco97aRq7-Y-3dWyQ4';

const MONGODB_URI = process.env.MONGODB_URI;
const CLIENT_ID = process.env.FIC_CLIENT_ID;
const CLIENT_SECRET = process.env.FIC_CLIENT_SECRET;

if (!MONGODB_URI || !CLIENT_ID || !CLIENT_SECRET) {
    console.error('❌ Errore: Variabili d\'ambiente mancanti in .env.prod');
    console.error('   MONGODB_URI:', MONGODB_URI ? '✅' : '❌');
    console.error('   FIC_CLIENT_ID:', CLIENT_ID ? '✅' : '❌');
    console.error('   FIC_CLIENT_SECRET:', CLIENT_SECRET ? '✅' : '❌');
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
 * Fa il refresh del token
 */
async function refreshAccessToken() {
    console.log('🔄 Refresh del token OAuth2...');
    
    const refreshData = {
        grant_type: 'refresh_token',
        refresh_token: REFRESH_TOKEN,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
    };
    
    const options = {
        hostname: 'api-v2.fattureincloud.it',
        path: '/oauth/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };
    
    try {
        const response = await makeRequest(options, JSON.stringify(refreshData));
        
        if (response.statusCode === 200) {
            console.log('✅ Token refreshed con successo!');
            console.log('🔑 Nuovo access token ottenuto');
            console.log('⏰ Expires in:', response.body.expires_in, 'secondi');
            return response.body;
        } else {
            console.error('❌ Errore nel refresh token:', response.statusCode, response.body);
            return null;
        }
    } catch (error) {
        console.error('❌ Errore nel refresh token:', error.message);
        return null;
    }
}

/**
 * Salva il nuovo token in MongoDB
 */
async function saveNewToken(tokenData) {
    console.log('💾 Salvataggio nuovo token in MongoDB...');
    
    let client;
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        
        const db = client.db('nutragenix');
        const collection = db.collection('tokens');
        
        const newTokenData = {
            type: 'oauth2',
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || REFRESH_TOKEN, // Mantieni il refresh token se non ne viene fornito uno nuovo
            expires_in: tokenData.expires_in,
            expires_at: Date.now() + (tokenData.expires_in * 1000),
            token_type: tokenData.token_type,
            created_at: new Date(),
            updated_at: new Date()
        };
        
        await collection.replaceOne(
            { type: 'oauth2' },
            newTokenData,
            { upsert: true }
        );
        
        console.log('✅ Nuovo token salvato con successo in MongoDB!');
        console.log('📅 Scadenza:', new Date(newTokenData.expires_at).toLocaleString());
        return true;
        
    } catch (error) {
        console.error('❌ Errore nel salvataggio nuovo token:', error.message);
        return false;
    } finally {
        if (client) {
            await client.close();
        }
    }
}

/**
 * Testa il nuovo token
 */
async function testNewToken(accessToken) {
    console.log('🔍 Test del nuovo token...');
    
    const options = {
        hostname: 'api-v2.fattureincloud.it',
        path: `/c/${process.env.FIC_COMPANY_ID}/info/payment_accounts`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json'
        }
    };
    
    try {
        const response = await makeRequest(options);
        
        if (response.statusCode === 200) {
            console.log('✅ Nuovo token valido! Connessione a Fatture in Cloud riuscita.');
            return true;
        } else {
            console.error('❌ Nuovo token non valido:', response.statusCode, response.body);
            return false;
        }
    } catch (error) {
        console.error('❌ Errore nel test nuovo token:', error.message);
        return false;
    }
}

/**
 * Main function
 */
async function main() {
    console.log('🚀 Refresh Token OAuth2 Fatture in Cloud');
    console.log('============================================');
    
    // 1. Refresh del token
    const newTokenData = await refreshAccessToken();
    if (!newTokenData) {
        console.error('❌ Impossibile fare il refresh del token. Uscita.');
        process.exit(1);
    }
    
    // 2. Salva il nuovo token
    const saved = await saveNewToken(newTokenData);
    if (!saved) {
        console.error('❌ Impossibile salvare il nuovo token. Uscita.');
        process.exit(1);
    }
    
    // 3. Testa il nuovo token
    const valid = await testNewToken(newTokenData.access_token);
    if (!valid) {
        console.error('❌ Il nuovo token non è valido. Uscita.');
        process.exit(1);
    }
    
    console.log('🎉 Refresh token completato con successo!');
    console.log('🔄 Il sistema ora utilizzerà automaticamente il nuovo token.');
}

// Esegui lo script
main().catch(error => {
    console.error('❌ Errore fatale:', error.message);
    process.exit(1);
});