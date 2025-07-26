#!/usr/bin/env node

require('dotenv').config({ path: '.env.prod' });
const { MongoClient } = require('mongodb');

// Token valido che abbiamo verificato funzionare
const VALID_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyZWYiOiJJOWFaaU1pR0VXTVNiNWRLQ3lPTVdkbndRZjcwNHlIZyIsImV4cCI6MTc1MzI4NDM2MX0.CjUAB_zVpI0WWSdxIKnZWcFJrRnLSEOAU0rWOtUyi3c';

async function createOAuthToken() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        console.log('🔗 Connesso a MongoDB');
        
        const db = client.db('nutragenix-fatture');
        
        // Crea il token OAuth2 nella collezione tokens
        const tokenData = {
            type: 'oauth2',
            access_token: VALID_TOKEN,
            refresh_token: null, // Non abbiamo un refresh token
            expires_in: 3600, // 1 ora (valore standard)
            expires_at: Date.now() + (3600 * 1000), // Scade tra 1 ora
            token_type: 'Bearer',
            created_at: new Date(),
            updated_at: new Date()
        };
        
        const result = await db.collection('tokens').replaceOne(
            { type: 'oauth2' },
            tokenData,
            { upsert: true }
        );
        
        console.log('✅ Token OAuth2 creato/aggiornato:', {
            upserted: !!result.upsertedId,
            modified: result.modifiedCount,
            matched: result.matchedCount
        });
        
        // Verifica che sia stato salvato correttamente
        const savedToken = await db.collection('tokens').findOne({ type: 'oauth2' });
        console.log('🔍 Token salvato:', {
            type: savedToken.type,
            hasAccessToken: !!savedToken.access_token,
            expires_at: new Date(savedToken.expires_at),
            is_expired: Date.now() > savedToken.expires_at
        });
        
    } catch (error) {
        console.error('❌ Errore:', error);
    } finally {
        await client.close();
    }
}

createOAuthToken();