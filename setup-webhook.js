#!/usr/bin/env node

/**
 * Script per configurare i webhook di Fatture in Cloud
 * Configura automaticamente la subscription per ricevere notifiche
 * quando vengono create/modificate le ricevute
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { getValidToken } = require('./api/auth.js');
const { getConfigWithFallback } = require('./api/config.js');

// Carica le variabili d'ambiente
require('dotenv').config({ path: '.env.prod' });

const API_BASE = 'https://api-v2.fattureincloud.it';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://nutra-backup.vercel.app/api/webhook';

let ACCESS_TOKEN = null;
let COMPANY_ID = null;

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
                    reject(new Error(`Errore parsing JSON: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

/**
 * Lista le subscription esistenti
 */
async function listSubscriptions() {
    console.log('🔍 Controllo subscription esistenti...');
    
    const options = {
        hostname: 'api-v2.fattureincloud.it',
        path: `/c/${COMPANY_ID}/subscriptions`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await makeRequest(options);
        
        if (response.statusCode === 200) {
            console.log('✅ Subscription esistenti:', JSON.stringify(response.body, null, 2));
            return response.body.data || [];
        } else {
            console.log('⚠️ Nessuna subscription trovata o errore:', response.statusCode, response.body);
            return [];
        }
    } catch (error) {
        console.error('❌ Errore nel recupero delle subscription:', error.message);
        return [];
    }
}

/**
 * Crea una nuova subscription webhook
 */
async function createWebhookSubscription() {
    console.log('🚀 Creazione subscription webhook...');
    
    const subscriptionData = {
        data: {
            sink: WEBHOOK_URL,
            types: [
                'it.fattureincloud.webhooks.issued_documents.receipts.create',
                'it.fattureincloud.webhooks.issued_documents.receipts.update',
                'it.fattureincloud.webhooks.receipts.create',
                'it.fattureincloud.webhooks.receipts.update'
            ],
            verification_method: 'header',
            config: {
                mapping: 'binary'
            }
        }
    };

    const options = {
        hostname: 'api-v2.fattureincloud.it',
        path: `/c/${COMPANY_ID}/subscriptions`,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await makeRequest(options, subscriptionData);
        
        if (response.statusCode === 201 || response.statusCode === 200) {
            console.log('✅ Subscription webhook creata con successo!');
            console.log('📋 Dettagli:', JSON.stringify(response.body, null, 2));
            
            // Salva i dettagli della subscription
            const subscriptionInfo = {
                id: response.body.data?.id,
                sink: WEBHOOK_URL,
                types: subscriptionData.data.types,
                created_at: new Date().toISOString(),
                company_id: COMPANY_ID
            };
            
            fs.writeFileSync(
                path.join(__dirname, 'webhook-subscription.json'),
                JSON.stringify(subscriptionInfo, null, 2)
            );
            
            console.log('💾 Informazioni subscription salvate in webhook-subscription.json');
            return response.body.data;
        } else {
            console.error('❌ Errore nella creazione della subscription:', response.statusCode, response.body);
            return null;
        }
    } catch (error) {
        console.error('❌ Errore nella richiesta:', error.message);
        return null;
    }
}

/**
 * Elimina una subscription esistente
 */
async function deleteSubscription(subscriptionId) {
    console.log(`🗑️ Eliminazione subscription ${subscriptionId}...`);
    
    const options = {
        hostname: 'api-v2.fattureincloud.it',
        path: `/c/${COMPANY_ID}/subscriptions/${subscriptionId}`,
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await makeRequest(options);
        
        if (response.statusCode === 200 || response.statusCode === 204) {
            console.log('✅ Subscription eliminata con successo!');
            return true;
        } else {
            console.error('❌ Errore nell\'eliminazione della subscription:', response.statusCode, response.body);
            return false;
        }
    } catch (error) {
        console.error('❌ Errore nella richiesta di eliminazione:', error.message);
        return false;
    }
}

/**
 * Funzione principale
 */
async function main() {
    console.log('🎯 Setup Webhook Fatture in Cloud');
    console.log('=' .repeat(50));
    
    try {
        // Ottieni token e company ID dal sistema di autenticazione
        console.log('🔐 Ottenimento token di accesso...');
        ACCESS_TOKEN = await getValidToken();
        COMPANY_ID = await getConfigWithFallback('FIC_COMPANY_ID');
        
        if (!ACCESS_TOKEN || !COMPANY_ID) {
            console.error('❌ Errore: Impossibile ottenere token di accesso o Company ID');
            console.error('💡 Assicurati di aver completato l\'autorizzazione OAuth2 tramite /api/auth/start');
            process.exit(1);
        }
        
        console.log(`📍 Company ID: ${COMPANY_ID}`);
        console.log(`🔗 Webhook URL: ${WEBHOOK_URL}`);
        console.log('=' .repeat(50));
    } catch (error) {
        console.error('❌ Errore nell\'autenticazione:', error.message);
        console.error('💡 Esegui prima l\'autorizzazione OAuth2 tramite il browser su /api/auth/start');
        process.exit(1);
    }

    // Controlla le subscription esistenti
    const existingSubscriptions = await listSubscriptions();
    
    // Se ci sono subscription esistenti per lo stesso URL, chiedi se eliminarle
    const existingForSameUrl = existingSubscriptions.filter(sub => 
        sub.sink === WEBHOOK_URL
    );
    
    if (existingForSameUrl.length > 0) {
        console.log(`⚠️ Trovate ${existingForSameUrl.length} subscription esistenti per lo stesso URL`);
        
        // In modalità automatica, elimina le subscription esistenti
        for (const sub of existingForSameUrl) {
            await deleteSubscription(sub.id);
        }
    }
    
    // Crea la nuova subscription
    const newSubscription = await createWebhookSubscription();
    
    if (newSubscription) {
        console.log('\n🎉 Setup completato con successo!');
        console.log('\n📝 Prossimi passi:');
        console.log('1. Verifica che l\'endpoint webhook risponda correttamente');
        console.log('2. Testa la creazione di una ricevuta per verificare la ricezione del webhook');
        console.log('3. Controlla i log di Vercel per eventuali errori');
        
        console.log('\n🔧 Comandi utili:');
        console.log('- Test webhook: npm run test:webhook');
        console.log('- Verifica logs: vercel logs');
        console.log('- Test ricevuta: ./test-ricevuta-email-completo.sh');
    } else {
        console.log('\n❌ Setup fallito. Controlla i log sopra per i dettagli.');
        process.exit(1);
    }
}

// Gestione degli argomenti da riga di comando
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Uso: node setup-webhook.js [opzioni]

Opzioni:
  --help, -h     Mostra questo messaggio di aiuto
  --list         Lista solo le subscription esistenti
  --delete <id>  Elimina una subscription specifica

Variabili d'ambiente richieste:
  FATTURE_IN_CLOUD_ACCESS_TOKEN  Token di accesso API
  FATTURE_IN_CLOUD_COMPANY_ID    ID della company
  WEBHOOK_URL                    URL dell'endpoint webhook (opzionale)
`);
    process.exit(0);
}

if (args.includes('--list')) {
    listSubscriptions().then(() => process.exit(0));
} else if (args.includes('--delete')) {
    const deleteIndex = args.indexOf('--delete');
    const subscriptionId = args[deleteIndex + 1];
    if (!subscriptionId) {
        console.error('❌ Errore: Specifica l\'ID della subscription da eliminare');
        process.exit(1);
    }
    deleteSubscription(subscriptionId).then(() => process.exit(0));
} else {
    main().catch(error => {
        console.error('❌ Errore fatale:', error.message);
        process.exit(1);
    });
}