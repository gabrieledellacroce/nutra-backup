#!/usr/bin/env node

/**
 * Script per aggiornare il webhook esistente con il nuovo URL di produzione
 */

const https = require('https');
require('dotenv').config({ path: '.env.prod' });

// Token OAuth2 reali
const ACCESS_TOKEN = 'a/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyZWYiOiJJOWFaaU1pR0VXTVNiNWRLQ3lPTVdkbndRZjcwNHlIZyIsImV4cCI6MTc1MzI4NDM2MX0.CjUAB_zVpI0WWSdxIKnZWcFJrRnLSEOAU0rWOtUyi3c';
const COMPANY_ID = process.env.FIC_COMPANY_ID;
const NEW_URL = 'https://nutra-backup.vercel.app/api/webhook';
const WEBHOOK_ID = 'SUB2048';

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
 * Elimina il webhook esistente
 */
async function deleteWebhook() {
    console.log(`🗑️ Eliminazione webhook esistente (ID: ${WEBHOOK_ID})...`);
    
    const options = {
        hostname: 'api-v2.fattureincloud.it',
        path: `/c/${COMPANY_ID}/subscriptions/${WEBHOOK_ID}`,
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Accept': 'application/json'
        }
    };
    
    try {
        const response = await makeRequest(options);
        
        if (response.statusCode === 200 || response.statusCode === 204) {
            console.log('✅ Webhook eliminato con successo!');
            return true;
        } else {
            console.error('❌ Errore nell\'eliminazione webhook:', response.statusCode, response.body);
            return false;
        }
    } catch (error) {
        console.error('❌ Errore nell\'eliminazione webhook:', error.message);
        return false;
    }
}

/**
 * Crea un nuovo webhook
 */
async function createWebhook() {
    console.log(`🔗 Creazione nuovo webhook con URL: ${NEW_URL}...`);
    
    const webhookData = {
        data: {
            sink: NEW_URL,
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
            console.log(`🔗 URL: ${NEW_URL}`);
            console.log(`📋 ID Subscription: ${response.body.data?.id}`);
            
            // Salva i dettagli della subscription
            const fs = require('fs');
            fs.writeFileSync('webhook-subscription.json', JSON.stringify({
                id: response.body.data?.id,
                sink: NEW_URL,
                types: ['receipts.create', 'receipts.update'],
                created_at: new Date().toISOString(),
                response: response.body
            }, null, 2));
            
            console.log('💾 Dettagli subscription salvati in webhook-subscription.json');
            return true;
        } else {
            console.error('❌ Errore nella creazione webhook:', response.statusCode, response.body);
            return false;
        }
    } catch (error) {
        console.error('❌ Errore nella creazione webhook:', error.message);
        return false;
    }
}

/**
 * Testa il nuovo webhook
 */
async function testWebhook() {
    console.log('🧪 Test del nuovo webhook...');
    
    const testData = {
        type: 'receipts.update',
        object: {
            id: 12345,
            type: 'receipt',
            entity: {
                id: 67890,
                name: 'Test Cliente',
                email: 'gabriprb@me.com'
            },
            date: new Date().toISOString().split('T')[0],
            number: 'TEST-001',
            amount_net: 100.00,
            amount_gross: 122.00,
            attachment_url: 'https://secure.fattureincloud.it/api/v2/issued_documents/12345/pdf'
        }
    };
    
    const options = {
        hostname: 'nutra-backup.vercel.app',
        path: '/api/webhook',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'FattureInCloud-Webhook/1.0'
        }
    };
    
    try {
        const response = await makeRequest(options, JSON.stringify(testData));
        
        if (response.statusCode === 200) {
            console.log('✅ Test webhook riuscito!');
            console.log('📧 Controlla l\'email per la ricevuta di test');
            return true;
        } else {
            console.error('❌ Test webhook fallito:', response.statusCode, response.body);
            return false;
        }
    } catch (error) {
        console.error('❌ Errore nel test webhook:', error.message);
        return false;
    }
}

/**
 * Funzione principale
 */
async function main() {
    console.log('🔄 Aggiornamento Webhook Fatture in Cloud');
    console.log('=' .repeat(50));
    console.log(`🆔 Company ID: ${COMPANY_ID}`);
    console.log(`🔗 Nuovo URL: ${NEW_URL}`);
    console.log(`🗑️ Webhook da eliminare: ${WEBHOOK_ID}`);
    console.log('=' .repeat(50));
    
    // 1. Elimina webhook esistente
    const deleted = await deleteWebhook();
    if (!deleted) {
        console.error('❌ Impossibile eliminare webhook esistente.');
        process.exit(1);
    }
    
    // 2. Crea nuovo webhook
    const created = await createWebhook();
    if (!created) {
        console.error('❌ Impossibile creare nuovo webhook.');
        process.exit(1);
    }
    
    // 3. Testa il nuovo webhook
    console.log('\n⏳ Attendo 5 secondi prima del test...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const tested = await testWebhook();
    if (!tested) {
        console.warn('⚠️ Test webhook fallito, ma il webhook è stato creato.');
    }
    
    console.log('\n🎉 Aggiornamento webhook completato!');
    console.log('\n📝 Il sistema è ora pronto per ricevere notifiche da Fatture in Cloud');
    console.log('📧 Quando viene creata/aggiornata una ricevuta, il PDF sarà inviato automaticamente via email');
}

main().catch(error => {
    console.error('❌ Errore fatale:', error.message);
    process.exit(1);
});