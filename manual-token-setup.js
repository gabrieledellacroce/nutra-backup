#!/usr/bin/env node

/**
 * Script per configurare manualmente il token di accesso
 * Usa questo script se l'autorizzazione OAuth2 non funziona
 */

const fs = require('fs');
const path = require('path');

function setupManualToken() {
  const token = process.argv[2];
  
  if (!token) {
    console.log('❌ Errore: Token mancante');
    console.log('\n📖 Come ottenere il token manualmente:');
    console.log('1. Vai su https://fattureincloud.it/api');
    console.log('2. Accedi al tuo account');
    console.log('3. Vai in "Le mie app" > "Nutragenix Fatture"');
    console.log('4. Genera un token di accesso');
    console.log('5. Esegui: node manual-token-setup.js <IL_TUO_TOKEN>');
    console.log('\n🔗 Link diretto configurazione app:');
    console.log('https://secure.fattureincloud.it/user/authorize?response_type=access_token&client_id=5slpZH0Npa5HB4a4Cd7IdFCUwBYGyb5s&redirect_uri=https%3A%2F%2Fnutra-backup.vercel.app%2Fapi%2Fauth%2Fcallback&scope=entity.clients%3Aa%20issued_documents.receipts%3Aa');
    process.exit(1);
  }
  
  // Salva il token nel file .env
  const envPath = path.join(__dirname, '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Rimuovi eventuali token esistenti
  envContent = envContent.replace(/^FIC_ACCESS_TOKEN=.*$/gm, '');
  
  // Aggiungi il nuovo token
  envContent += `\nFIC_ACCESS_TOKEN=${token}\n`;
  
  // Pulisci righe vuote multiple
  envContent = envContent.replace(/\n\n+/g, '\n\n').trim() + '\n';
  
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ Token configurato con successo!');
  console.log('\n📋 Prossimi passi:');
  console.log('1. npm run webhook:setup');
  console.log('2. npm run test:webhook');
  console.log('\n🔍 Per verificare la configurazione:');
  console.log('npm run check');
}

setupManualToken();