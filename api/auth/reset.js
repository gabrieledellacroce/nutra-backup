import { MongoClient } from 'mongodb';
import { getConfigWithFallback } from '../config.js';

export default async function handler(req, res) {
    if (req.method !== 'POST' && req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Ottieni la configurazione MongoDB
        const mongoUri = await getConfigWithFallback('MONGODB_URI');
        const companyId = await getConfigWithFallback('FIC_COMPANY_ID');
        
        if (!mongoUri) {
            console.log('⚠️ MONGODB_URI non configurato - reset simulato');
            
            // Se è una richiesta GET, reindirizza comunque
            if (req.method === 'GET') {
                const baseUrl = await getConfigWithFallback('BASE_URL') || 
                               (req.headers.host?.includes('localhost') ? 
                                `http://${req.headers.host}` : 
                                `https://${req.headers.host}`);
                
                return res.redirect(`${baseUrl}/api/auth/start`);
            }
            
            return res.status(200).json({ 
                success: true,
                message: 'Reset simulato (MongoDB non configurato)',
                next_step: 'Vai su /api/auth/start per una nuova autorizzazione'
            });
        }

        // Connetti a MongoDB
        const client = new MongoClient(mongoUri);
        await client.connect();
        
        const db = client.db('nutragenix');
        const collection = db.collection('oauth_tokens');

        // Cancella tutti i token esistenti per questa company
        const deleteResult = await collection.deleteMany({ 
            company_id: companyId 
        });

        await client.close();

        console.log(`🗑️ Token reset completato. Cancellati ${deleteResult.deletedCount} token per company ${companyId}`);

        // Se è una richiesta GET (dal browser), reindirizza alla pagina di start
        if (req.method === 'GET') {
            const baseUrl = await getConfigWithFallback('BASE_URL') || 
                           (req.headers.host?.includes('localhost') ? 
                            `http://${req.headers.host}` : 
                            `https://${req.headers.host}`);
            
            return res.redirect(`${baseUrl}/api/auth/start`);
        }

        // Se è una richiesta POST, restituisci JSON
        res.status(200).json({
            success: true,
            message: 'Token cancellati con successo',
            deleted_count: deleteResult.deletedCount,
            company_id: companyId,
            next_step: 'Vai su /api/auth/start per una nuova autorizzazione'
        });

    } catch (error) {
        console.error('❌ Errore durante il reset del token:', error);
        
        // Se è una richiesta GET, mostra una pagina di errore semplice
        if (req.method === 'GET') {
            const isLocalhost = req.headers.host?.includes('localhost');
            
            return res.status(200).send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Reset Token</title>
                    <meta charset="utf-8">
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            text-align: center; 
                            padding: 50px; 
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            min-height: 100vh;
                            margin: 0;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                        }
                        .container {
                            background: rgba(255,255,255,0.1);
                            padding: 40px;
                            border-radius: 15px;
                            backdrop-filter: blur(10px);
                            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                        }
                        .warning { color: #ffa726; }
                        .success { color: #66bb6a; }
                        .button { 
                            background: #1976d2; 
                            color: white; 
                            padding: 12px 24px; 
                            text-decoration: none; 
                            border-radius: 8px; 
                            display: inline-block; 
                            margin-top: 20px;
                            transition: background 0.3s;
                        }
                        .button:hover {
                            background: #1565c0;
                        }
                        h1 { margin-bottom: 20px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        ${isLocalhost ? `
                            <h1 class="warning">⚠️ Reset Token (Sviluppo)</h1>
                            <p>In ambiente di sviluppo locale, il reset è stato simulato.</p>
                            <p>Il token verrà effettivamente cancellato solo in produzione.</p>
                        ` : `
                            <h1 class="success">✅ Token Reset</h1>
                            <p>I token esistenti sono stati cancellati con successo.</p>
                        `}
                        <a href="/api/auth/start" class="button">🔄 Nuova Autorizzazione</a>
                    </div>
                </body>
                </html>
            `);
        }

        res.status(500).json({
            success: false,
            error: 'Errore durante il reset del token',
            details: error.message
        });
    }
}