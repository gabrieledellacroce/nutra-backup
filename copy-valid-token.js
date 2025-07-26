#!/usr/bin/env node

require('dotenv').config({ path: '.env.prod' });
const { MongoClient } = require('mongodb');

async function copyValidToken() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        console.log('🔗 Connesso a MongoDB');
        
        // Ottieni il token valido dal database nutragenix
        const sourceDb = client.db('nutragenix');
        const sourceToken = await sourceDb.collection('tokens').findOne({});
        
        if (!sourceToken || !sourceToken.access_token) {
            console.log('❌ Nessun token trovato nel database sorgente');
            return;
        }
        
        console.log('🔍 Token trovato nel database sorgente:', {
            hasAccessToken: !!sourceToken.access_token,
            prefix: sourceToken.access_token.substring(0, 20) + '...',
            expires_at: sourceToken.expires_at
        });
        
        // Copia il token nel database nutragenix
    const targetDb = client.db('nutragenix');
        
        const tokenData = {
            type: 'oauth2',
            access_token: sourceToken.access_token,
            refresh_token: sourceToken.refresh_token || null,
            expires_in: sourceToken.expires_in || 3600,
            expires_at: sourceToken.expires_at,
            token_type: sourceToken.token_type || 'Bearer',
            created_at: sourceToken.created_at || new Date(),
            updated_at: new Date()
        };
        
        const result = await targetDb.collection('tokens').replaceOne(
            { type: 'oauth2' },
            tokenData,
            { upsert: true }
        );
        
        console.log('✅ Token copiato nel database target:', {
            upserted: !!result.upsertedId,
            modified: result.modifiedCount,
            matched: result.matchedCount
        });
        
        // Verifica che sia stato salvato correttamente
        const savedToken = await targetDb.collection('tokens').findOne({ type: 'oauth2' });
        console.log('🔍 Token salvato nel target:', {
            type: savedToken.type,
            hasAccessToken: !!savedToken.access_token,
            prefix: savedToken.access_token.substring(0, 20) + '...',
            expires_at: new Date(savedToken.expires_at),
            is_expired: Date.now() > savedToken.expires_at
        });
        
        // Test del token copiato
        console.log('🧪 Test del token copiato...');
        try {
            const response = await fetch('https://api-v2.fattureincloud.it/user/info', {
                headers: {
                    'Authorization': `Bearer ${savedToken.access_token}`,
                    'Accept': 'application/json'
                }
            });
            console.log(`- Status API: ${response.status}`);
            if (response.status === 200) {
                console.log('✅ Token copiato è valido e funzionante');
            } else {
                console.log('❌ Token copiato non è valido');
                const errorText = await response.text();
                console.log(`- Errore: ${errorText}`);
            }
        } catch (error) {
            console.log(`❌ Errore test token: ${error.message}`);
        }
        
    } catch (error) {
        console.error('❌ Errore:', error);
    } finally {
        await client.close();
    }
}

copyValidToken();