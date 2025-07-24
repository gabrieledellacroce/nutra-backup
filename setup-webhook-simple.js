const https = require('https');
const fs = require('fs');
const path = require('path');

// Carica le variabili d'ambiente
require('dotenv').config({ path: '.env.prod' });

const API_BASE = 'https://api-v2.fattureincloud.it';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://nutragenix-fatture-qlzulkde3-gabrieledellacroce-2606s-projects.vercel.app/api/webhook';
const CLIENT_ID = process.env.FIC_CLIENT_ID;
const CLIENT_SECRET = process.env.FIC_CLIENT_SECRET;
const COMPANY_ID = process.env.FIC_COMPANY_ID;

if (!CLIENT_ID || !CLIENT_SECRET || !COMPANY_ID) {
    console.error('❌ Errore: CLIENT_ID, CLIENT_SECRET e COMPANY_ID sono richiesti nelle variabili d\'ambiente');
    process.exit(1);
}

/**
 * Ottiene un token di accesso usando client_credentials
 */
async function getAccessToken() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            grant_type: 'client_credentials',
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            scope: 'entity.clients:r entity.products:r issued_documents.invoices:w issued_documents.receipts:w'
        });

        const options = {
            hostname: 'api-v2.fattureincloud.it',
            port: 443,
            path: '/oauth/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (res.statusCode === 200) {
                        resolve(response.access_token);
                    } else {
                        reject(new Error(`Errore ${res.statusCode}: ${response.error_description || response.error}`));
                    }
                } catch (error) {
                    reject(new Error(`Errore nel parsing della risposta: ${error.message}`));
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

/**
 * Effettua una richiesta HTTPS
 */
function makeRequest(method, path, data = null, accessToken) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api-v2.fattureincloud.it',
            port: 443,
            path: path,
            method: method,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            const postData = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const req = https.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => responseData += chunk);
            res.on('end', () => {
                try {
                    const response = responseData ? JSON.parse(responseData) : {};
                    resolve({ statusCode: res.statusCode, data: response });
                } catch (error) {
                    resolve({ statusCode: res.statusCode, data: responseData });
                }
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

/**
 * Lista le subscription esistenti
 */
async function listSubscriptions(accessToken) {
    console.log('📋 Controllo subscription esistenti...');
    
    try {
        const response = await makeRequest('GET', `/v2/c/${COMPANY_ID}/subscriptions`, null, accessToken);
        
        if (response.statusCode === 200) {
            const subscriptions = response.data.data || [];
            console.log(`✅ Trovate ${subscriptions.length} subscription esistenti`);
            
            subscriptions.forEach((sub, index) => {
                console.log(`   ${index + 1}. ID: ${sub.id}`);
                console.log(`      Sink: ${sub.sink}`);
                console.log(`      Tipi: ${sub.types.join(', ')}`);
                console.log(`      Stato: ${sub.config?.status || 'N/A'}`);
                console.log('');
            });
            
            return subscriptions;
        } else {
            console.log(`⚠️  Errore nel recuperare le subscription: ${response.statusCode}`);
            console.log('   Risposta:', response.data);
            return [];
        }
    } catch (error) {
        console.error('❌ Errore nel listare le subscription:', error.message);
        return [];
    }
}

/**
 * Crea una nuova subscription
 */
async function createSubscription(accessToken) {
    console.log('🔧 Creazione nuova subscription...');
    
    const subscriptionData = {
        sink: WEBHOOK_URL,
        types: [
            'it.fattureincloud.webhooks.issued_documents.receipts.create',
            'it.fattureincloud.webhooks.issued_documents.receipts.update'
        ],
        config: {
            status: 'active'
        }
    };
    
    try {
        const response = await makeRequest('POST', `/v2/c/${COMPANY_ID}/subscriptions`, subscriptionData, accessToken);
        
        if (response.statusCode === 200 || response.statusCode === 201) {
            console.log('✅ Subscription creata con successo!');
            console.log('   ID:', response.data.data.id);
            console.log('   Sink:', response.data.data.sink);
            console.log('   Tipi:', response.data.data.types.join(', '));
            return response.data.data;
        } else {
            console.log(`❌ Errore nella creazione: ${response.statusCode}`);
            console.log('   Risposta:', response.data);
            return null;
        }
    } catch (error) {
        console.error('❌ Errore nella creazione della subscription:', error.message);
        return null;
    }
}

/**
 * Funzione principale
 */
async function main() {
    console.log('🎯 Setup Webhook Fatture in Cloud (Versione Semplificata)');
    console.log('=' .repeat(60));
    console.log(`📍 Company ID: ${COMPANY_ID}`);
    console.log(`🔗 Webhook URL: ${WEBHOOK_URL}`);
    console.log('=' .repeat(60));
    
    try {
        // Ottieni token di accesso
        console.log('🔐 Ottenimento token di accesso...');
        const accessToken = await getAccessToken();
        console.log('✅ Token ottenuto con successo');
        
        // Lista subscription esistenti
        const existingSubscriptions = await listSubscriptions(accessToken);
        
        // Controlla se esiste già una subscription per le ricevute
        const receiptSubscription = existingSubscriptions.find(sub => 
            sub.types.some(type => type.includes('receipts')) && 
            sub.sink === WEBHOOK_URL
        );
        
        if (receiptSubscription) {
            console.log('ℹ️  Subscription per le ricevute già esistente:');
            console.log(`   ID: ${receiptSubscription.id}`);
            console.log(`   Stato: ${receiptSubscription.config?.status || 'N/A'}`);
        } else {
            // Crea nuova subscription
            const newSubscription = await createSubscription(accessToken);
            
            if (newSubscription) {
                console.log('\n🎉 Setup completato con successo!');
                console.log('\n📝 Riepilogo:');
                console.log(`   • Subscription ID: ${newSubscription.id}`);
                console.log(`   • Webhook URL: ${newSubscription.sink}`);
                console.log(`   • Eventi monitorati:`);
                newSubscription.types.forEach(type => {
                    console.log(`     - ${type}`);
                });
                console.log('\n✅ Il sistema è ora configurato per ricevere notifiche quando:');
                console.log('   • Viene creata una nuova ricevuta');
                console.log('   • Viene aggiornata una ricevuta esistente');
                console.log('\n🚀 Prova a creare una ricevuta per testare il sistema!');
            }
        }
        
    } catch (error) {
        console.error('❌ Errore durante il setup:', error.message);
        console.error('\n💡 Possibili soluzioni:');
        console.error('   • Verifica che CLIENT_ID e CLIENT_SECRET siano corretti');
        console.error('   • Assicurati che l\'applicazione abbia i permessi necessari');
        console.error('   • Controlla che COMPANY_ID sia valido');
        process.exit(1);
    }
}

// Esegui se chiamato direttamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { main, getAccessToken, listSubscriptions, createSubscription };