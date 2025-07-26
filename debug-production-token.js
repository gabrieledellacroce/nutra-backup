import { config } from 'dotenv';
import { MongoClient } from 'mongodb';

// Carica le variabili d'ambiente
config({ path: '.env.prod' });

const MONGODB_URI = process.env.MONGODB_URI;

async function debugProductionToken() {
  console.log('🔍 Debug del token di produzione...\n');
  
  let client;
  try {
    // Connetti a MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connesso a MongoDB\n');
    
    const db = client.db('nutragenix');
    
    // Ottieni token dalla collection config
    const configCollection = db.collection('config');
    const configData = await configCollection.findOne({});
    
    // Ottieni token dalla collection tokens
    const tokensCollection = db.collection('tokens');
    const tokenData = await tokensCollection.findOne({});
    
    console.log('📋 Token dalla collection config:');
    if (configData?.FATTURE_ACCESS_TOKEN) {
      const configToken = configData.FATTURE_ACCESS_TOKEN;
      console.log(`- Token: ${configToken.substring(0, 20)}...`);
      
      // Test del token config
      try {
        const response = await fetch('https://api-v2.fattureincloud.it/user/info', {
          headers: {
            'Authorization': `Bearer ${configToken}`,
            'Accept': 'application/json'
          }
        });
        console.log(`- Status API: ${response.status}`);
        if (response.status === 200) {
          console.log('✅ Token dalla config è valido');
        } else {
          console.log('❌ Token dalla config non è valido');
          const errorText = await response.text();
          console.log(`- Errore: ${errorText}`);
        }
      } catch (error) {
        console.log(`❌ Errore test token config: ${error.message}`);
      }
    } else {
      console.log('❌ Nessun token trovato nella config');
    }
    
    console.log('\n🔑 Token dalla collection tokens:');
    if (tokenData?.access_token) {
      const tokensToken = tokenData.access_token;
      console.log(`- Token: ${tokensToken.substring(0, 20)}...`);
      console.log(`- Expires at: ${tokenData.expires_at}`);
      
      // Test del token tokens
      try {
        const response = await fetch('https://api-v2.fattureincloud.it/user/info', {
          headers: {
            'Authorization': `Bearer ${tokensToken}`,
            'Accept': 'application/json'
          }
        });
        console.log(`- Status API: ${response.status}`);
        if (response.status === 200) {
          console.log('✅ Token dalla collection tokens è valido');
        } else {
          console.log('❌ Token dalla collection tokens non è valido');
          const errorText = await response.text();
          console.log(`- Errore: ${errorText}`);
        }
      } catch (error) {
        console.log(`❌ Errore test token tokens: ${error.message}`);
      }
    } else {
      console.log('❌ Nessun token trovato nella collection tokens');
    }
    
    // Verifica variabili d'ambiente
    console.log('\n🌍 Variabili d\'ambiente:');
    console.log(`- FATTURE_ACCESS_TOKEN: ${process.env.FATTURE_ACCESS_TOKEN ? process.env.FATTURE_ACCESS_TOKEN.substring(0, 20) + '...' : 'NON DEFINITO'}`);
    console.log(`- FIC_COMPANY_ID: ${process.env.FIC_COMPANY_ID || 'NON DEFINITO'}`);
    
    // Test del token dalle variabili d'ambiente
    if (process.env.FATTURE_ACCESS_TOKEN) {
      console.log('\n🧪 Test token dalle variabili d\'ambiente...');
      try {
        const response = await fetch('https://api-v2.fattureincloud.it/user/info', {
          headers: {
            'Authorization': `Bearer ${process.env.FATTURE_ACCESS_TOKEN}`,
            'Accept': 'application/json'
          }
        });
        console.log(`- Status API: ${response.status}`);
        if (response.status === 200) {
          console.log('✅ Token dalle variabili d\'ambiente è valido');
        } else {
          console.log('❌ Token dalle variabili d\'ambiente non è valido');
          const errorText = await response.text();
          console.log(`- Errore: ${errorText}`);
        }
      } catch (error) {
        console.log(`❌ Errore test token env: ${error.message}`);
      }
    }
    
    // Confronta i token
    console.log('\n🔄 Confronto token:');
    const configToken = configData?.FATTURE_ACCESS_TOKEN;
    const tokensToken = tokenData?.access_token;
    const envToken = process.env.FATTURE_ACCESS_TOKEN;
    
    console.log(`- Config vs Tokens: ${configToken === tokensToken ? '✅ UGUALI' : '❌ DIVERSI'}`);
    console.log(`- Config vs Env: ${configToken === envToken ? '✅ UGUALI' : '❌ DIVERSI'}`);
    console.log(`- Tokens vs Env: ${tokensToken === envToken ? '✅ UGUALI' : '❌ DIVERSI'}`);
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

debugProductionToken();