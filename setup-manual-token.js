#!/usr/bin/env node

/**
 * Script per configurare manualmente il token di accesso
 * Bypassa il problema OAuth2 utilizzando un token esistente
 */

const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// Configurazione
const CONFIG_FILE = path.join(__dirname, '.env.prod');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'fatture_cloud';
const COLLECTION_NAME = 'config';

/**
 * Carica le variabili d'ambiente dal file .env.prod
 */
function loadEnvFromFile() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const envContent = fs.readFileSync(CONFIG_FILE, 'utf8');
            const lines = envContent.split('\n');
            
            lines.forEach(line => {
                const trimmedLine = line.trim();
                if (trimmedLine && !trimmedLine.startsWith('#')) {
                    const [key, ...valueParts] = trimmedLine.split('=');
                    if (key && valueParts.length > 0) {
                        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
                        if (!process.env[key]) {
                            process.env[key] = value;
                        }
                    }
                }
            });
        }
    } catch (error) {
        console.log('Errore nel caricamento del file .env.prod:', error.message);
    }
}

/**
 * Salva il token nel database MongoDB
 */
async function saveTokenToMongoDB(accessToken) {
    let client;
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);
        
        // Salva il token
        await collection.updateOne(
            { key: 'ACCESS_TOKEN' },
            { 
                $set: { 
                    key: 'ACCESS_TOKEN',
                    value: accessToken,
                    updatedAt: new Date()
                }
            },
            { upsert: true }
        );
        
        console.log('✅ Token salvato con successo nel database MongoDB');
        return true;
    } catch (error) {
        console.error('❌ Errore nel salvataggio del token:', error.message);
        return false;
    } finally {
        if (client) {
            await client.close();
        }
    }
}

/**
 * Salva il token nel file .env.prod
 */
function saveTokenToFile(accessToken) {
    try {
        let envContent = '';
        
        // Leggi il contenuto esistente
        if (fs.existsSync(CONFIG_FILE)) {
            envContent = fs.readFileSync(CONFIG_FILE, 'utf8');
        }
        
        // Rimuovi eventuali righe ACCESS_TOKEN esistenti
        const lines = envContent.split('\n').filter(line => 
            !line.trim().startsWith('ACCESS_TOKEN=')
        );
        
        // Aggiungi il nuovo token
        lines.push(`ACCESS_TOKEN=${accessToken}`);
        
        // Scrivi il file
        fs.writeFileSync(CONFIG_FILE, lines.join('\n'));
        
        console.log('✅ Token salvato con successo nel file .env.prod');
        return true;
    } catch (error) {
        console.error('❌ Errore nel salvataggio del token nel file:', error.message);
        return false;
    }
}

/**
 * Funzione principale
 */
async function main() {
    console.log('🔧 Setup Manuale Token di Accesso');
    console.log('=====================================\n');
    
    // Carica le variabili d'ambiente
    loadEnvFromFile();
    
    // Richiedi il token all'utente
    console.log('Per ottenere il token di accesso:');
    console.log('1. Vai su https://fattureincloud.it/platform/marketplace/apps');
    console.log('2. Trova la tua app e clicca su "Gestisci"');
    console.log('3. Vai nella sezione "Token di accesso"');
    console.log('4. Copia il token di accesso\n');
    
    // Leggi il token dalla riga di comando
    const token = process.argv[2];
    
    if (!token) {
        console.error('❌ Errore: Token non fornito');
        console.log('\nUso: node setup-manual-token.js <ACCESS_TOKEN>');
        console.log('Esempio: node setup-manual-token.js eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...');
        process.exit(1);
    }
    
    console.log('📝 Salvando il token...');
    
    // Salva nel file
    const fileSaved = saveTokenToFile(token);
    
    // Prova a salvare nel database MongoDB (opzionale)
    let dbSaved = false;
    if (MONGODB_URI && MONGODB_URI !== 'mongodb://localhost:27017') {
        dbSaved = await saveTokenToMongoDB(token);
    } else {
        console.log('⚠️  MongoDB non configurato, salvataggio solo nel file');
    }
    
    if (fileSaved) {
        console.log('\n✅ Setup completato con successo!');
        console.log('\nProssimi passi:');
        console.log('1. Esegui: npm run webhook:setup');
        console.log('2. Testa il sistema con: npm run test:webhook');
    } else {
        console.log('\n❌ Setup fallito');
        process.exit(1);
    }
}

// Esegui solo se chiamato direttamente
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Errore durante il setup:', error.message);
        process.exit(1);
    });
}

module.exports = { saveTokenToFile, saveTokenToMongoDB };