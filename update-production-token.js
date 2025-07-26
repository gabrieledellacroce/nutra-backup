const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.prod' });

(async () => {
  try {
    console.log('🔄 Aggiornamento token in produzione...');
    
    // Prima verifichiamo il token attuale
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('nutragenix');
    
    const tokenDoc = await db.collection('tokens').findOne({});
    if (!tokenDoc) {
      console.log('❌ Nessun token trovato');
      return;
    }
    
    console.log('📋 Token attuale:', {
      prefix: tokenDoc.access_token?.substring(0, 30) + '...',
      hasRefresh: !!tokenDoc.refresh_token
    });
    
    // Test del token attuale
    const fetch = require('node-fetch');
    const testResponse = await fetch(`https://api-v2.fattureincloud.it/c/${process.env.FIC_COMPANY_ID}/info/payment_accounts`, {
      headers: { Authorization: `Bearer ${tokenDoc.access_token}` }
    });
    
    console.log('🔍 Test token attuale - Status:', testResponse.status);
    
    if (testResponse.status === 401) {
      console.log('🔄 Token scaduto, eseguo refresh...');
      
      // Refresh del token
      const refreshResponse = await fetch('https://api-v2.fattureincloud.it/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'refresh_token',
          refresh_token: tokenDoc.refresh_token,
          client_id: process.env.FIC_CLIENT_ID,
          client_secret: process.env.FIC_CLIENT_SECRET
        })
      });
      
      if (refreshResponse.ok) {
        const newTokenData = await refreshResponse.json();
        console.log('✅ Nuovo token ottenuto');
        
        // Salva il nuovo token
        const expiresAt = new Date(Date.now() + (newTokenData.expires_in * 1000));
        
        await db.collection('tokens').replaceOne(
          {},
          {
            access_token: newTokenData.access_token,
            refresh_token: newTokenData.refresh_token || tokenDoc.refresh_token,
            expires_at: expiresAt,
            updated_at: new Date()
          },
          { upsert: true }
        );
        
        // Aggiorna anche la collection config
        await db.collection('config').updateOne(
          { type: 'app_config' },
          {
            $set: {
              FATTURE_ACCESS_TOKEN: newTokenData.access_token,
              FATTURE_REFRESH_TOKEN: newTokenData.refresh_token || tokenDoc.refresh_token,
              FATTURE_EXPIRES_AT: expiresAt,
              updated_at: new Date()
            }
          }
        );
        
        console.log('💾 Token aggiornato in entrambe le collections');
        
        // Test del nuovo token
        const newTestResponse = await fetch(`https://api-v2.fattureincloud.it/c/${process.env.FIC_COMPANY_ID}/info/payment_accounts`, {
          headers: { Authorization: `Bearer ${newTokenData.access_token}` }
        });
        
        console.log('🔍 Test nuovo token - Status:', newTestResponse.status);
        
        if (newTestResponse.ok) {
          console.log('🎉 Token aggiornato e validato con successo!');
        } else {
          console.log('❌ Nuovo token non valido');
        }
      } else {
        console.log('❌ Errore nel refresh del token:', await refreshResponse.text());
      }
    } else if (testResponse.ok) {
      console.log('✅ Token attuale è valido, nessun aggiornamento necessario');
    }
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
})();