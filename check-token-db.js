#!/usr/bin/env node

/**
 * Script per verificare il token OAuth2 nel database MongoDB
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.prod' });

async function checkToken() {
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI non configurato');
    return;
  }

  try {
    console.log('🔍 Connessione a MongoDB...');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db('nutra-backup');
    const token = await db.collection('tokens').findOne({ type: 'oauth2' });
    
    await client.close();
    
    if (token) {
      console.log('✅ Token trovato nel database:');
      console.log('📅 Creato:', new Date(token.created_at));
      console.log('📅 Aggiornato:', new Date(token.updated_at));
      console.log('⏰ Scade il:', new Date(token.expires_at));
      console.log('🔄 Scaduto:', Date.now() > token.expires_at ? 'SÌ' : 'NO');
      console.log('🔑 Access Token:', token.access_token ? 'presente' : 'mancante');
      console.log('🔄 Refresh Token:', token.refresh_token ? 'presente' : 'mancante');
      console.log('⏱️  Expires in:', token.expires_in, 'secondi');
      console.log('🏷️  Token Type:', token.token_type);
      
      // Test del token con API Fatture in Cloud
      if (token.access_token && Date.now() < token.expires_at) {
        console.log('\n🧪 Test del token con API Fatture in Cloud...');
        
        const fetch = require('node-fetch');
        const response = await fetch('https://api-v2.fattureincloud.it/c/123456/info/user', {
          headers: {
            'Authorization': `Bearer ${token.access_token}`,
            'Accept': 'application/json'
          }
        });
        
        console.log('📡 Status API:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Token valido! Utente:', data.data?.email || 'N/A');
        } else {
          const error = await response.text();
          console.log('❌ Token non valido:', error);
        }
      }
    } else {
      console.log('❌ Nessun token trovato nel database');
      console.log('💡 Esegui l\'autorizzazione: https://nutra-backup.vercel.app/api/auth/start');
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

checkToken();