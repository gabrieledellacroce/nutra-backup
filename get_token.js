const { MongoClient } = require('mongodb');

async function getToken() {
    const client = new MongoClient(process.env.MONGODB_URI);
    try {
        await client.connect();
        const db = client.db('nutragenix-fatture');
        const collection = db.collection('tokens');
        
        const tokenDoc = await collection.findOne({}, { sort: { createdAt: -1 } });
        
        if (tokenDoc && tokenDoc.access_token) {
            console.log(tokenDoc.access_token);
        } else {
            console.error('Token non trovato nel database');
            process.exit(1);
        }
    } catch (error) {
        console.error('Errore nel recupero del token:', error);
        process.exit(1);
    } finally {
        await client.close();
    }
}

getToken();
