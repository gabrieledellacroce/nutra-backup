const { getConfigWithFallback } = require('../config.js');

module.exports = async (req, res) => {
  try {
    // Ottieni le configurazioni necessarie
    const clientId = await getConfigWithFallback('FIC_CLIENT_ID');
    
    if (!clientId) {
      return res.status(500).json({
        error: 'FIC_CLIENT_ID non configurato',
        message: 'Configura le credenziali di Fatture in Cloud'
      });
    }

    // Usa sempre il redirect URI di produzione configurato su Fatture in Cloud
    // Questo è necessario perché il redirect URI deve corrispondere esattamente
    // a quello configurato nell'applicazione di Fatture in Cloud
    const redirectUri = 'https://nutra-backup.vercel.app/api/auth/callback';
    const scope = 'entity.clients:a issued_documents:a';
    const state = Math.random().toString(36).substring(2, 15);
    
    // Costruisci l'URL di autorizzazione
    const authUrl = new URL('https://api-v2.fattureincloud.it/oauth/authorize');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', scope);
    authUrl.searchParams.append('state', state);

    console.log('🔗 Generazione URL autorizzazione OAuth2:', {
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scope,
      state: state
    });

    // Risposta con URL di autorizzazione
    res.json({
      success: true,
      auth_url: authUrl.toString(),
      redirect_uri: redirectUri,
      scope: scope,
      state: state,
      message: 'Copia l\'auth_url nel browser per autorizzare l\'applicazione'
    });

  } catch (error) {
    console.error('Errore nella generazione URL autorizzazione:', error);
    res.status(500).json({
      error: 'Errore interno del server',
      message: error.message
    });
  }
};