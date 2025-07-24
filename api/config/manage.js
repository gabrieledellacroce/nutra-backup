// Endpoint per gestire le configurazioni
const { 
  saveConfig, 
  loadConfig, 
  getAllConfig, 
  updateConfig, 
  validateConfig 
} = require('../config.js');

module.exports = async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res);
      case 'POST':
        return await handlePost(req, res);
      case 'PUT':
        return await handlePut(req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Errore nell\'endpoint config:', error);
    res.status(500).json({
      error: 'Errore interno del server',
      details: error.message
    });
  }
};

// GET - Ottieni tutte le configurazioni
async function handleGet(req, res) {
  try {
    const config = await getAllConfig();
    
    // Maschera i valori sensibili per la visualizzazione
    const maskedConfig = {};
    for (const [key, value] of Object.entries(config)) {
      if (key.includes('SECRET') || key.includes('PASSWORD')) {
        maskedConfig[key] = value ? '***NASCOSTO***' : '';
      } else {
        maskedConfig[key] = value;
      }
    }
    
    res.status(200).json({
      success: true,
      config: maskedConfig,
      message: 'Configurazione caricata con successo'
    });
  } catch (error) {
    throw error;
  }
}

// POST - Salva nuova configurazione completa
async function handlePost(req, res) {
  try {
    const newConfig = req.body;
    
    if (!newConfig || typeof newConfig !== 'object') {
      return res.status(400).json({
        error: 'Configurazione non valida',
        message: 'Il body deve contenere un oggetto con le configurazioni'
      });
    }
    
    // Valida configurazione
    try {
      validateConfig(newConfig);
    } catch (validationError) {
      return res.status(400).json({
        error: 'Configurazione non valida',
        message: validationError.message
      });
    }
    
    await saveConfig(newConfig);
    
    res.status(200).json({
      success: true,
      message: 'Configurazione salvata con successo',
      config: newConfig
    });
  } catch (error) {
    throw error;
  }
}

// PUT - Aggiorna singola configurazione
async function handlePut(req, res) {
  try {
    const { key, value } = req.body;
    
    if (!key) {
      return res.status(400).json({
        error: 'Parametro mancante',
        message: 'Il campo "key" è obbligatorio'
      });
    }
    
    const updatedConfig = await updateConfig(key, value);
    
    res.status(200).json({
      success: true,
      message: `Configurazione ${key} aggiornata con successo`,
      config: updatedConfig
    });
  } catch (error) {
    throw error;
  }
}