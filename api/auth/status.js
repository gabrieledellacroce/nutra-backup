const { loadToken, isTokenValid } = require('../auth.js');

// Handler per verificare lo stato del token
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = await loadToken();
    if (!token) {
      return res.status(200).json({ 
        status: 'no_token',
        message: 'Nessun token trovato. È necessario completare l\'autorizzazione.',
        auth_required: true,
        next_step: 'Vai a /api/auth/start per iniziare l\'autorizzazione'
      });
    }
    
    const isValid = isTokenValid(token);
    const timeUntilExpiry = token.expires_at - Date.now();
    const hoursUntilExpiry = Math.floor(timeUntilExpiry / (1000 * 60 * 60));
    
    res.status(200).json({
      status: isValid ? 'valid' : 'expired',
      expires_at: new Date(token.expires_at).toISOString(),
      hours_until_expiry: isValid ? hoursUntilExpiry : 0,
      has_refresh_token: !!token.refresh_token,
      auth_required: !isValid && !token.refresh_token,
      message: isValid 
        ? `Token valido, scade tra ${hoursUntilExpiry} ore`
        : token.refresh_token 
          ? 'Token scaduto ma può essere rinnovato automaticamente'
          : 'Token scaduto, è necessario riautorizzare'
    });
  } catch (error) {
    console.error('Errore nel controllo del token:', error);
    res.status(500).json({ error: 'Errore nel controllo del token', details: error.message });
  }
}