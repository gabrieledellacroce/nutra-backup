#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

// Dati dell'app forniti dall'utente
const APP_ID = '13053';
const CLIENT_ID = '5slpZH0Npa5HB4a4Cd7IdFCUwBYGyb5s';
const CLIENT_SECRET = '81F76ZPwZDoKYLGACa3a2QJoyxn303MQPnJbJvDDeWUnupcnXS5ZFKTchReFjUNA';

// URL per ottenere il token
const TOKEN_URL = 'https://api-v2.fattureincloud.it/oauth/token';

// Funzione per fare richiesta HTTPS
function makeRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve({ status: res.statusCode, data: response });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });
        
        req.on('error', (err) => {
            reject(err);
        });
        
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

// Funzione per salvare il token nel file .env.prod
function saveTokenToEnv(token) {
    const envPath = path.join(__dirname, '.env.prod');
    let envContent = '';
    
    // Leggi il contenuto esistente se il file esiste
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Rimuovi eventuali righe FATTURE_IN_CLOUD_TOKEN esistenti
    const lines = envContent.split('\n').filter(line => 
        !line.startsWith('FATTURE_IN_CLOUD_TOKEN=')
    );
    
    // Aggiungi il nuovo token
    lines.push(`FATTURE_IN_CLOUD_TOKEN=${token}`);
    
    // Scrivi il file
    fs.writeFileSync(envPath, lines.join('\n'));
    console.log('✅ Token salvato in .env.prod');
}

// Funzione per generare URL di autorizzazione
function generateAuthUrl() {
    const state = Math.random().toString(36).substring(2, 15);
    // Usa il dominio Vercel per l'autorizzazione in produzione
    const redirectUri = 'https://nutra-backup.vercel.app/api/auth/callback';
    
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        redirect_uri: redirectUri,
        scope: 'entity.clients:a issued_documents.receipts:a',
        state: state
    });
    
    return `https://api-v2.fattureincloud.it/oauth/authorize?${params.toString()}`;
}

// Funzione principale
async function generateToken() {
    console.log('🔄 Generazione URL di autorizzazione...');
    console.log(`📱 App ID: ${APP_ID}`);
    console.log(`🔑 Client ID: ${CLIENT_ID}`);
    
    console.log('\n⚠️  ATTENZIONE: Fatture in Cloud richiede autorizzazione manuale.');
    console.log('\n📋 Passaggi per ottenere il token:');
    console.log('\n1. 🌐 Apri questo URL nel browser:');
    console.log('\n' + generateAuthUrl());
    console.log('\n2. 🔐 Autorizza l\'applicazione in Fatture in Cloud');
    console.log('3. 📋 Dopo l\'autorizzazione, copia il codice dalla URL di callback');
    console.log('4. 🚀 Esegui: npm run webhook:setup');
    
    console.log('\n💡 Suggerimento: Se hai problemi con l\'autorizzazione,');
    console.log('   puoi anche ottenere il token direttamente dal pannello');
    console.log('   di Fatture in Cloud e usare: npm run token:setup <TOKEN>');
    
    return null;
}

// Esegui se chiamato direttamente
if (require.main === module) {
    generateToken();
}

module.exports = { generateToken };