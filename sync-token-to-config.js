const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.prod' });

(async () => {
  try {
    console.log('🔄 Sincronizzazione token da tokens a config...');
    
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('nutragenix');
    
    // Leggi il token dalla collection tokens
    const tokenDoc = await db.collection('tokens').findOne({});
    if (!tokenDoc) {
      console.log('❌ Nessun token trovato nella collection tokens');
      return;
    }
    
    console.log('✅ Token trovato:', {
      expires: tokenDoc.expires_at,
      hasAccess: !!tokenDoc.access_token,
      hasRefresh: !!tokenDoc.refresh_token
    });
    
    // Salva nella collection config
    const configData = {
      type: 'app_config',
      FATTURE_ACCESS_TOKEN: tokenDoc.access_token,
      FATTURE_REFRESH_TOKEN: tokenDoc.refresh_token,
      FATTURE_EXPIRES_AT: tokenDoc.expires_at,
      FIC_CLIENT_ID: process.env.FIC_CLIENT_ID,
      FIC_CLIENT_SECRET: process.env.FIC_CLIENT_SECRET,
      FIC_COMPANY_ID: process.env.FIC_COMPANY_ID,
      BASE_URL: process.env.BASE_URL,
      updated_at: new Date()
    };
    
    const result = await db.collection('config').replaceOne(
      { type: 'app_config' },
      configData,
      { upsert: true }
    );
    
    console.log('✅ Configurazione salvata:', result.upsertedId ? 'nuova' : 'aggiornata');
    
    await client.close();
    console.log('🎉 Sincronizzazione completata!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
})();