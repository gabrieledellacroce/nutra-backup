// Endpoint per gestire la configurazione dei webhook di Fatture in Cloud
const { getConfigWithFallback } = require('./config.js');

module.exports = async function handler(req, res) {
  try {
    // Ottieni token e company ID
    const accessToken = await getConfigWithFallback('FATTURE_ACCESS_TOKEN');
    const companyId = await getConfigWithFallback('FATTURE_COMPANY_ID');
    
    if (!accessToken || !companyId) {
      return res.status(500).json({ 
        error: 'Missing authentication data',
        message: 'FATTURE_ACCESS_TOKEN or FATTURE_COMPANY_ID not configured'
      });
    }

    const baseUrl = `https://api-v2.fattureincloud.it/c/${companyId}/subscriptions`;
    const webhookUrl = `${req.headers.origin || 'https://nutra-backup.vercel.app'}/api/webhook`;

    switch (req.method) {
      case 'GET':
        return await listWebhooks(res, baseUrl, accessToken);
      
      case 'POST':
        return await registerWebhook(res, baseUrl, accessToken, webhookUrl);
      
      case 'DELETE':
        return await deleteWebhook(req, res, baseUrl, accessToken);
      
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('❌ Errore webhook-setup:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};

// Lista webhook esistenti
async function listWebhooks(res, baseUrl, accessToken) {
  try {
    console.log('📋 Lista webhook esistenti...');
    
    const response = await fetch(baseUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Errore API lista webhook:', data);
      return res.status(response.status).json({
        error: 'Failed to list webhooks',
        details: data
      });
    }

    console.log('✅ Webhook esistenti:', data);
    return res.status(200).json(data);
  } catch (error) {
    console.error('❌ Errore lista webhook:', error);
    return res.status(500).json({ 
      error: 'Failed to list webhooks',
      message: error.message 
    });
  }
}

// Registra nuovo webhook
async function registerWebhook(res, baseUrl, accessToken, webhookUrl) {
  try {
    console.log('🔗 Registrazione nuovo webhook:', webhookUrl);
    
    const payload = {
      data: {
        sink: webhookUrl,
        verified: false,
        types: [
          'it.fattureincloud.webhooks.receipts.create',
          'it.fattureincloud.webhooks.receipts.update'
        ]
      }
    };

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Errore API registrazione webhook:', data);
      return res.status(response.status).json({
        error: 'Failed to register webhook',
        details: data
      });
    }

    console.log('✅ Webhook registrato con successo:', data);
    return res.status(200).json({
      success: true,
      message: 'Webhook registered successfully',
      webhook: data
    });
  } catch (error) {
    console.error('❌ Errore registrazione webhook:', error);
    return res.status(500).json({ 
      error: 'Failed to register webhook',
      message: error.message 
    });
  }
}

// Elimina webhook
async function deleteWebhook(req, res, baseUrl, accessToken) {
  try {
    const { webhookId } = req.body;
    
    if (!webhookId) {
      return res.status(400).json({ 
        error: 'Missing webhookId in request body' 
      });
    }

    console.log('🗑️ Eliminazione webhook:', webhookId);
    
    const response = await fetch(`${baseUrl}/${webhookId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const data = await response.json();
      console.error('❌ Errore API eliminazione webhook:', data);
      return res.status(response.status).json({
        error: 'Failed to delete webhook',
        details: data
      });
    }

    console.log('✅ Webhook eliminato con successo');
    return res.status(200).json({
      success: true,
      message: 'Webhook deleted successfully'
    });
  } catch (error) {
    console.error('❌ Errore eliminazione webhook:', error);
    return res.status(500).json({ 
      error: 'Failed to delete webhook',
      message: error.message 
    });
  }
}