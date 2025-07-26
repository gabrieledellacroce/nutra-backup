const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.prod' });

(async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('nutragenix');
    
    const tokenDoc = await db.collection('tokens').findOne({});
    console.log('Token in collection tokens:', {
      prefix: tokenDoc?.access_token?.substring(0, 30) + '...',
      expires: tokenDoc?.expires_at,
      hasRefresh: !!tokenDoc?.refresh_token
    });
    
    const configDoc = await db.collection('config').findOne({ type: 'app_config' });
    console.log('Token in collection config:', {
      prefix: configDoc?.FATTURE_ACCESS_TOKEN?.substring(0, 30) + '...',
      expires: configDoc?.FATTURE_EXPIRES_AT,
      hasRefresh: !!configDoc?.FATTURE_REFRESH_TOKEN
    });
    
    // Test del token dalla collection tokens
    if (tokenDoc?.access_token) {
      const fetch = require('node-fetch');
      const response = await fetch(`https://api-v2.fattureincloud.it/c/1268058/info/payment_accounts`, {
        headers: { Authorization: `Bearer ${tokenDoc.access_token}` }
      });
      console.log('Test token da collection tokens - Status:', response.status);
    }
    
    await client.close();
  } catch (error) {
    console.error('Errore:', error);
  }
})();