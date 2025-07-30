// Sistema di logging persistente per webhook
// Salva i log in un file JSON per debug quando Vercel non mostra i log

const fs = require('fs').promises;
const path = require('path');

// Funzione per salvare log persistente
async function saveWebhookLog(logData) {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...logData
    };
    
    // In ambiente Vercel, usa /tmp per file temporanei
    const logFile = process.env.VERCEL ? '/tmp/webhook-logs.json' : './webhook-logs.json';
    
    let logs = [];
    try {
      const existingLogs = await fs.readFile(logFile, 'utf8');
      logs = JSON.parse(existingLogs);
    } catch (error) {
      // File non esiste, inizia con array vuoto
      logs = [];
    }
    
    logs.push(logEntry);
    
    // Mantieni solo gli ultimi 50 log per evitare file troppo grandi
    if (logs.length > 50) {
      logs = logs.slice(-50);
    }
    
    await fs.writeFile(logFile, JSON.stringify(logs, null, 2));
    console.log('💾 Log webhook salvato:', logEntry.type || 'unknown');
    
  } catch (error) {
    console.error('❌ Errore salvataggio log webhook:', error.message);
  }
}

// Endpoint per visualizzare i log salvati
module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const logFile = process.env.VERCEL ? '/tmp/webhook-logs.json' : './webhook-logs.json';
      
      try {
        const logs = await fs.readFile(logFile, 'utf8');
        const parsedLogs = JSON.parse(logs);
        
        return res.status(200).json({
          success: true,
          totalLogs: parsedLogs.length,
          logs: parsedLogs.reverse(), // Più recenti prima
          lastUpdate: parsedLogs[parsedLogs.length - 1]?.timestamp
        });
      } catch (error) {
        return res.status(200).json({
          success: true,
          totalLogs: 0,
          logs: [],
          message: 'Nessun log trovato'
        });
      }
    } catch (error) {
      return res.status(500).json({
        error: 'Errore lettura log',
        message: error.message
      });
    }
  }
  
  if (req.method === 'POST') {
    // Salva un nuovo log
    await saveWebhookLog(req.body);
    return res.status(200).json({ success: true, message: 'Log salvato' });
  }
  
  if (req.method === 'DELETE') {
    // Cancella tutti i log
    try {
      const logFile = process.env.VERCEL ? '/tmp/webhook-logs.json' : './webhook-logs.json';
      await fs.unlink(logFile);
      return res.status(200).json({ success: true, message: 'Log cancellati' });
    } catch (error) {
      return res.status(200).json({ success: true, message: 'Nessun log da cancellare' });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
};

// Esporta anche la funzione di logging
module.exports.saveWebhookLog = saveWebhookLog;