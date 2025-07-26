const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.prod' });

(async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('nutragenix');
    
    console.log('📊 Stato collections:');
    const collections = await db.listCollections().toArray();
    console.log('Collections disponibili:', collections.map(c => c.name));
    
    // Verifica tokens
    const tokenCount = await db.collection('tokens').countDocuments();
    console.log('📄 Documenti in tokens:', tokenCount);
    
    // Verifica config
    const configCount = await db.collection('config').countDocuments();
    console.log('⚙️ Documenti in config:', configCount);
    
    if (configCount > 0) {
      const config = await db.collection('config').findOne({ type: 'app_config' });
      console.log('✅ Configurazione trovata:', {
        hasToken: !!config?.FATTURE_ACCESS_TOKEN,
        hasRefresh: !!config?.FATTURE_REFRESH_TOKEN,
        hasCompanyId: !!config?.FIC_COMPANY_ID,
        expires: config?.FATTURE_EXPIRES_AT
      });
    } else {
      console.log('❌ Nessuna configurazione trovata');
    }
    
    await client.close();
  } catch (error) {
    console.error('❌ Errore:', error);
  }
})();