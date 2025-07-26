import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Carica le variabili d'ambiente
dotenv.config({ path: '.env.prod' });

const MONGODB_URI = process.env.MONGODB_URI;

async function fixConfigCollection() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connesso a MongoDB');
    
    const db = client.db('nutragenix');
    const configCollection = db.collection('config');
    
    // Aggiorna la configurazione aggiungendo FATTURE_COMPANY_ID
    const result = await configCollection.updateOne(
      {},
      {
        $set: {
          FATTURE_COMPANY_ID: '1268058'
        }
      },
      { upsert: true }
    );
    
    console.log('✅ Configurazione aggiornata:', result);
    
    // Verifica la configurazione aggiornata
    const configData = await configCollection.findOne({});
    console.log('\n📋 Configurazione aggiornata:');
    console.log('- FATTURE_ACCESS_TOKEN:', configData.FATTURE_ACCESS_TOKEN ? 
      configData.FATTURE_ACCESS_TOKEN.substring(0, 20) + '...' : 'NON TROVATO');
    console.log('- FATTURE_COMPANY_ID:', configData.FATTURE_COMPANY_ID || 'NON TROVATO');
    console.log('- FIC_COMPANY_ID:', configData.FIC_COMPANY_ID || 'NON TROVATO');
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await client.close();
  }
}

fixConfigCollection();