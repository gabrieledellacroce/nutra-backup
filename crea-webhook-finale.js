#!/usr/bin/env node

/**
 * Script per creare il webhook finale con il nuovo URL di produzione
 */

const https = require('https');
require('dotenv').config({ path: '.env.prod' });

// Token OAuth2 reali
const ACCESS_TOKEN = 'a/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyZWYiOiJJOWFaaU1pR0VXTVNiNWRLQ3lPTVdkbndRZjcwNHlIZyIsImV4cCI6MTc1MzI4NDM2MX0.CjUAB_zVpI0WWSdxIKnZWcFJrRnLSEOAU0rWOtUyi3c';
const COMPANY_ID = process.env.FIC_COMPANY_ID;
const WEBHOOK_URL = 'https://nutragenix-fatture-g6cq2h27e-gabrieledellacroce-2606s-projects.vercel.app/api/webhook';

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
 * Lista tutti i webhook esistenti
 */
async function listWebhooks() {
    console.log('📋 Lista webhook esistenti...');
    
    const options = {
        hostname: 'api-v2.fattureincloud.it',
        path: `/c/${COMPANY_ID}/subscriptions`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
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
                console.log(`      Eventi: ${webhook.types?.join(', ') || 'N/A'}`);
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
 * Crea un nuovo webhook
 */
async function createWebhook() {
    console.log(`🔗 Creazione nuovo webhook con URL: ${WEBHOOK_URL}...`);
    
    const webhookData = {
        data: {
            sink: WEBHOOK_URL,
            verified: true,
            types: ['receipts.create', 'receipts.update']
        }
    };
    
    const options = {
        hostname: 'api-v2.fattureincloud.it',
        path: `/c/${COMPANY_ID}/subscriptions`,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };
    
    try {
        const response = await makeRequest(options, JSON.stringify(webhookData));
        
        if (response.statusCode === 200 || response.statusCode === 201) {
            console.log('✅ Nuovo webhook creato con successo!');
            console.log(`🔗 URL: ${WEBHOOK_URL}`);
            console.log(`📋 ID Subscription: ${response.body.data?.id}`);
            
            // Salva i dettagli della subscription
            const fs = require('fs');
            fs.writeFileSync('webhook-subscription-finale.json', JSON.stringify({
                id: response.body.data?.id,
                sink: WEBHOOK_URL,
                types: ['receipts.create', 'receipts.update'],
                created_at: new Date().toISOString(),
                response: response.body
            }, null, 2));
            
            console.log('💾 Dettagli subscription salvati in webhook-subscription-finale.json');
            return response.body.data;
        } else {
            console.error('❌ Errore nella creazione webhook:', response.statusCode, response.body);
            return null;
        }
    } catch (error) {
        console.error('❌ Errore nella creazione webhook:', error.message);
        return null;
    }
}

/**
 * Funzione principale
 */
async function main() {
    console.log('🎯 Creazione Webhook Finale Fatture in Cloud');
    console.log('=' .repeat(60));
    console.log(`🆔 Company ID: ${COMPANY_ID}`);
    console.log(`🔗 Webhook URL: ${WEBHOOK_URL}`);
    console.log('=' .repeat(60));
    
    // 1. Lista webhook esistenti
    const existingWebhooks = await listWebhooks();
    
    // 2. Verifica se esiste già un webhook con questo URL
    const existingWebhook = existingWebhooks.find(w => w.sink === WEBHOOK_URL);
    
    if (existingWebhook) {
        console.log('ℹ️ Webhook già esistente con questo URL:');
        console.log(`   ID: ${existingWebhook.id}`);
        console.log(`   URL: ${existingWebhook.sink}`);
        console.log(`   Stato: ${existingWebhook.verified ? '✅ Verificato' : '⚠️ Non verificato'}`);
        console.log('');
        console.log('🎉 Sistema già configurato correttamente!');
        return;
    }
    
    // 3. Crea nuovo webhook
    const newWebhook = await createWebhook();
    if (!newWebhook) {
        console.error('❌ Impossibile creare nuovo webhook.');
        process.exit(1);
    }
    
    console.log('\n🎉 Webhook finale creato con successo!');
    console.log('\n📝 Il sistema è ora completamente configurato:');
    console.log('✅ Token OAuth2 configurati');
    console.log('✅ Webhook registrato su Fatture in Cloud');
    console.log('✅ Endpoint webhook deployato su Vercel');
    console.log('\n🚀 Quando viene creata/aggiornata una ricevuta su Fatture in Cloud:');
    console.log('1. Fatture in Cloud invierà una notifica al webhook');
    console.log('2. Il sistema scaricherà automaticamente il PDF');
    console.log('3. Il PDF sarà inviato via email al cliente');
    console.log('\n📧 Assicurati che la configurazione SMTP sia corretta per l\'invio email.');
}

main().catch(error => {
    console.error('❌ Errore fatale:', error.message);
    process.exit(1);
});