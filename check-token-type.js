#!/usr/bin/env node

require('dotenv').config({ path: '.env.prod' });
const { MongoClient } = require('mongodb');

async function checkTokenType() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        console.log('🔗 Connesso a MongoDB');
        
        const db = client.db('nutragenix');
        const tokens = await db.collection('tokens').find({}).toArray();
        
        console.log('📋 Tutti i token nel database:');
        tokens.forEach((token, index) => {
            console.log(`Token ${index + 1}:`, {
                type: token.type,
                hasAccessToken: !!token.access_token,
                hasRefreshToken: !!token.refresh_token,
                expires_at: token.expires_at ? new Date(token.expires_at) : 'N/A',
                created_at: token.created_at,
                updated_at: token.updated_at
            });
        });
        
    } catch (error) {
        console.error('❌ Errore:', error);
    } finally {
        await client.close();
    }
}

checkTokenType();