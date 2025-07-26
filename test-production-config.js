import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Carica le variabili d'ambiente
dotenv.config({ path: '.env.prod' });

const MONGODB_URI = process.env.MONGODB_URI;

async function testProductionConfig() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connesso a MongoDB');
    
    const db = client.db('nutragenix');
    
    // Test 1: Verifica collection config
    const configCollection = db.collection('config');
    const configData = await configCollection.findOne({});
    
    console.log('\n📋 Configurazione dalla collection config:');
    if (configData) {
      console.log('- FATTURE_ACCESS_TOKEN:', configData.FATTURE_ACCESS_TOKEN ? 
        configData.FATTURE_ACCESS_TOKEN.substring(0, 20) + '...' : 'NON TROVATO');
      console.log('- FATTURE_COMPANY_ID:', configData.FATTURE_COMPANY_ID || 'NON TROVATO');
      console.log('- FIC_COMPANY_ID:', configData.FIC_COMPANY_ID || 'NON TROVATO');
    } else {
      console.log('❌ Nessuna configurazione trovata nella collection config');
    }
    
    // Test 2: Verifica collection tokens
    const tokensCollection = db.collection('tokens');
    const tokenData = await tokensCollection.findOne({});
    
    console.log('\n🔑 Token dalla collection tokens:');
    if (tokenData) {
      console.log('- access_token:', tokenData.access_token ? 
        tokenData.access_token.substring(0, 20) + '...' : 'NON TROVATO');
      console.log('- hasRefresh:', tokenData.hasRefresh);
      console.log('- expires_at:', tokenData.expires_at);
    } else {
      console.log('❌ Nessun token trovato nella collection tokens');
    }
    
    // Test 3: Test API con token dalla config
    if (configData && configData.FATTURE_ACCESS_TOKEN) {
      console.log('\n🧪 Test API con token dalla config...');
      
      const response = await fetch('https://api-v2.fattureincloud.it/user/info', {
        headers: {
          'Authorization': `Bearer ${configData.FATTURE_ACCESS_TOKEN}`,
          'Accept': 'application/json'
        }
      });
      
      console.log('Status API:', response.status);
      if (response.status === 200) {
        console.log('✅ Token dalla config è valido');
      } else {
        console.log('❌ Token dalla config non è valido');
        const errorText = await response.text();
        console.log('Errore:', errorText);
      }
    }
    
    // Test 4: Test API con token dalla tokens collection
    if (tokenData && tokenData.access_token) {
      console.log('\n🧪 Test API con token dalla collection tokens...');
      
      const response = await fetch('https://api-v2.fattureincloud.it/user/info', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
          'Accept': 'application/json'
        }
      });
      
      console.log('Status API:', response.status);
      if (response.status === 200) {
        console.log('✅ Token dalla collection tokens è valido');
      } else {
        console.log('❌ Token dalla collection tokens non è valido');
        const errorText = await response.text();
        console.log('Errore:', errorText);
      }
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await client.close();
  }
}

testProductionConfig();