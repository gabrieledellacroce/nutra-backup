// Sistema di gestione configurazione con MongoDB
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Carica variabili d'ambiente dal file .env.prod se esiste
function loadEnvFromFile() {
  const envPath = path.join(process.cwd(), '.env.prod');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
  }
}

// Carica le variabili d'ambiente all'avvio
loadEnvFromFile();

// Cache per le configurazioni
let configCache = null;
let cacheExpiry = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minuti

// Configurazioni di default (fallback)
const DEFAULT_CONFIG = {
  FIC_CLIENT_ID: process.env.FIC_CLIENT_ID || '',
  FIC_CLIENT_SECRET: process.env.FIC_CLIENT_SECRET || '',
  FIC_COMPANY_ID: process.env.FIC_COMPANY_ID || '',
  BASE_URL: process.env.BASE_URL || '',
  MONGODB_URI: process.env.MONGODB_URI || ''
};

// Funzione per salvare configurazione in MongoDB
async function saveConfig(configData) {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI non configurato');
  }

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db('nutragenix');
    const result = await db.collection('config').replaceOne(
      { type: 'app_config' },
      {
        type: 'app_config',
        ...configData,
        updated_at: new Date(),
        created_at: new Date()
      },
      { upsert: true }
    );
    
    await client.close();
    
    // Invalida cache
    configCache = null;
    cacheExpiry = 0;
    
    console.log('Configurazione salvata in MongoDB:', result.upsertedId ? 'nuova' : 'aggiornata');
    return true;
  } catch (error) {
    console.error('Errore nel salvare la configurazione:', error);
    throw error;
  }
}

// Funzione per caricare configurazione da MongoDB
async function loadConfig() {
  // Controlla cache
  if (configCache && Date.now() < cacheExpiry) {
    return configCache;
  }

  if (!process.env.MONGODB_URI) {
    console.log('MONGODB_URI non configurato, uso configurazione di default');
    return DEFAULT_CONFIG;
  }

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    
    const db = client.db('nutragenix');
    const config = await db.collection('config').findOne({ type: 'app_config' });
    
    await client.close();
    
    if (config) {
      // Merge con configurazione di default per campi mancanti
      const mergedConfig = { ...DEFAULT_CONFIG, ...config };
      delete mergedConfig._id;
      delete mergedConfig.type;
      delete mergedConfig.created_at;
      delete mergedConfig.updated_at;
      
      // Aggiorna cache
      configCache = mergedConfig;
      cacheExpiry = Date.now() + CACHE_DURATION;
      
      console.log('Configurazione caricata da MongoDB');
      return mergedConfig;
    } else {
      console.log('Nessuna configurazione trovata in MongoDB, uso default');
      return DEFAULT_CONFIG;
    }
  } catch (error) {
    console.error('Errore nel caricare la configurazione:', error);
    console.log('Fallback alla configurazione di default');
    return DEFAULT_CONFIG;
  }
}

// Funzione per ottenere una singola variabile di configurazione
async function getConfig(key) {
  const config = await loadConfig();
  return config[key];
}

// Funzione per ottenere tutte le configurazioni
async function getAllConfig() {
  return await loadConfig();
}

// Funzione per aggiornare una singola configurazione
async function updateConfig(key, value) {
  const currentConfig = await loadConfig();
  const newConfig = { ...currentConfig, [key]: value };
  await saveConfig(newConfig);
  return newConfig;
}

// Funzione per validare configurazione
function validateConfig(config) {
  const required = ['FIC_CLIENT_ID', 'FIC_CLIENT_SECRET', 'FIC_COMPANY_ID'];
  const missing = required.filter(key => !config[key]);
  
  if (missing.length > 0) {
    throw new Error(`Configurazioni mancanti: ${missing.join(', ')}`);
  }
  
  return true;
}

// Funzione per invalidare cache
function invalidateCache() {
  configCache = null;
  cacheExpiry = 0;
}

// Funzione per ottenere configurazione con fallback diretto alle variabili d'ambiente
async function getConfigWithFallback(key) {
  // Prima prova le variabili d'ambiente dirette
  if (process.env[key]) {
    return process.env[key];
  }
  
  // Poi prova il sistema di configurazione MongoDB
  try {
    return await getConfig(key);
  } catch (error) {
    console.log(`Fallback per ${key}: usando variabile d'ambiente`);
    return process.env[key] || '';
  }
}

// Handler per Vercel API
async function handler(req, res) {
  try {
    const { method } = req;
    const { action } = req.query;

    if (method === 'GET') {
      if (action === 'check_email') {
        // Importa la funzione di controllo email
        const { checkEmailConfiguration } = require('./email');
        const emailStatus = await checkEmailConfiguration();
        return res.status(200).json(emailStatus);
      }
      
      // Restituisce tutte le configurazioni
      const config = await getAllConfig();
      return res.status(200).json(config);
    }

    if (method === 'POST') {
      const configData = req.body;
      await saveConfig(configData);
      return res.status(200).json({ success: true, message: 'Configurazione salvata' });
    }

    return res.status(405).json({ error: 'Metodo non supportato' });
  } catch (error) {
    console.error('Errore API config:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Export per Vercel
module.exports = handler;

// Export delle funzioni per uso interno
module.exports.saveConfig = saveConfig;
module.exports.loadConfig = loadConfig;
module.exports.getConfig = getConfig;
module.exports.getAllConfig = getAllConfig;
module.exports.updateConfig = updateConfig;
module.exports.validateConfig = validateConfig;
module.exports.invalidateCache = invalidateCache;
module.exports.getConfigWithFallback = getConfigWithFallback;