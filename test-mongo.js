const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.prod' });

async function testConnection() {
    console.log('Testing MongoDB connection...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    
    if (!process.env.MONGODB_URI) {
        console.error('MONGODB_URI not found in environment variables');
        return;
    }
    
    // Mask password for logging
    const maskedUri = process.env.MONGODB_URI.replace(/:([^:@]+)@/, ':***@');
    console.log('Connection string (masked):', maskedUri);
    
    try {
        const client = new MongoClient(process.env.MONGODB_URI);
        await client.connect();
        console.log('✅ Successfully connected to MongoDB');
        
        // Test database access
        const db = client.db('nutragenix');
        const collections = await db.listCollections().toArray();
        console.log('✅ Database access successful');
        console.log('Collections:', collections.map(c => c.name));
        
        await client.close();
        console.log('✅ Connection closed successfully');
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        
        if (error.message.includes('bad auth')) {
            console.log('\n🔍 Authentication troubleshooting:');
            console.log('1. Check if the password contains special characters that need URL encoding');
            console.log('2. Verify the username and password in MongoDB Atlas Database Access');
            console.log('3. Make sure you\'re using the database user password, not your Atlas account password');
            console.log('4. Check if the user has the correct permissions for the database');
        }
    }
}

testConnection();