const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');
const { getConfigWithFallback, getAllConfig } = require('./config.js');

// Funzione per salvare il token in MongoDB
async function saveToken(tokenData) {
  if (!process.env.MONGODB_URI) {
    console.log('MONGODB_URI non configurato, token non salvato:', {
      access_token: tokenData.access_token ? 'presente' : 'mancante',
      refresh_token: tokenData.refresh_token ? 'presente' : 'mancante',
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type
    });
    return false;
  }

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db('nutragenix');
    const result = await db.collection('tokens').replaceOne(
      { type: 'oauth2' },
      {
        type: 'oauth2',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        expires_at: Date.now() + (tokenData.expires_in * 1000),
        token_type: tokenData.token_type,
        created_at: new Date(),
        updated_at: new Date()
      },
      { upsert: true }
    );
    
    await client.close();
    console.log('Token salvato in MongoDB:', result.upsertedId ? 'nuovo' : 'aggiornato');
    return true;
  } catch (error) {
    console.error('Errore nel salvare il token in MongoDB:', error);
    return false;
  }
}

// Funzione per caricare il token da MongoDB
async function loadToken() {
  if (!process.env.MONGODB_URI) {
    console.log('MONGODB_URI non configurato, impossibile caricare token');
    return null;
  }

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db('nutragenix');
    const token = await db.collection('tokens').findOne({ type: 'oauth2' });
    
    await client.close();
    
    if (token) {
      console.log('Token caricato da MongoDB:', {
        expires_at: new Date(token.expires_at),
        is_expired: Date.now() > token.expires_at
      });
    } else {
      console.log('Nessun token trovato in MongoDB');
    }
    
    return token;
  } catch (error) {
    console.error('Errore nel caricare il token da MongoDB:', error);
    return null;
  }
}

// Funzione per verificare se il token è valido
function isTokenValid(token) {
  if (!token || !token.access_token) return false;
  return Date.now() < token.expires_at;
}

// Funzione per rinnovare il token
async function refreshToken(token) {
  try {
    const clientId = await getConfigWithFallback('FIC_CLIENT_ID');
    const clientSecret = await getConfigWithFallback('FIC_CLIENT_SECRET');
    
    const response = await fetch('https://api-v2.fattureincloud.it/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: token.refresh_token,
        client_id: clientId,
        client_secret: clientSecret
      })
    });

    if (!response.ok) {
      throw new Error(`Errore nel refresh del token: ${response.status}`);
    }

    const newTokenData = await response.json();
    saveToken(newTokenData);
    return newTokenData.access_token;
  } catch (error) {
    console.error('Errore nel refresh del token:', error);
    throw error;
  }
}

// Funzione principale per ottenere un token valido
async function getValidToken() {
  const token = await loadToken();
  
  if (!token) {
    throw new Error('Nessun token trovato. Esegui prima l\'autorizzazione OAuth2 tramite /api/auth/start');
  }
  
  if (isTokenValid(token)) {
    return token.access_token;
  }
  
  // Token scaduto, prova a rinnovarlo
  if (token.refresh_token) {
    return await refreshToken(token);
  }
  
  throw new Error('Token scaduto e nessun refresh token disponibile. È necessario riautorizzare.');
}



// Handler principale per Vercel API
async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const token = await loadToken();
      const isValid = token ? isTokenValid(token) : false;
      
      res.status(200).json({
        success: true,
        has_token: !!token,
        is_valid: isValid,
        expires_at: token ? new Date(token.expires_at).toISOString() : null,
        has_refresh_token: !!token?.refresh_token,
        auth_required: !isValid && !token?.refresh_token,
        message: isValid 
          ? 'Token valido' 
          : token?.refresh_token 
            ? 'Token scaduto ma refresh disponibile'
            : 'Autorizzazione richiesta'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  } else if (req.method === 'POST') {
    try {
      const validToken = await getValidToken();
      res.status(200).json({
        success: true,
        message: 'Token valido ottenuto',
        has_token: true
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error.message,
        auth_required: true
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

// Export default per Vercel
module.exports = handler;

// Re-export delle funzioni utility
module.exports.getValidToken = getValidToken;
module.exports.saveToken = saveToken;
module.exports.loadToken = loadToken;
module.exports.isTokenValid = isTokenValid;
module.exports.refreshToken = refreshToken;