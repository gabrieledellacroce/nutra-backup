#!/usr/bin/env node

require('dotenv').config({ path: '.env.prod' });
const { MongoClient } = require('mongodb');

async function checkConfigTokens() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        console.log('🔗 Connesso a MongoDB');
        
        const db = client.db('nutragenix-fatture');
        
        // Controlla la collezione config
        const configs = await db.collection('config').find({}).toArray();
        console.log('📋 Configurazioni nel database:');
        configs.forEach((config) => {
            console.log(`Config:`, {
                key: config.key,
                value: config.value ? (config.value.length > 50 ? config.value.substring(0, 50) + '...' : config.value) : 'N/A',
                updated_at: config.updated_at
            });
        });
        
        // Cerca specificamente il token di accesso
        const accessToken = await db.collection('config').findOne({ key: 'FATTURE_ACCESS_TOKEN' });
        if (accessToken) {
            console.log('\n🔑 Token di accesso trovato nella config:', {
                hasValue: !!accessToken.value,
                length: accessToken.value ? accessToken.value.length : 0,
                prefix: accessToken.value ? accessToken.value.substring(0, 20) + '...' : 'N/A'
            });
        } else {
            console.log('\n❌ Nessun token di accesso trovato nella config');
        }
        
    } catch (error) {
        console.error('❌ Errore:', error);
    } finally {
        await client.close();
    }
}

checkConfigTokens();