const { getConfigWithFallback } = require('./api/config.js');

(async () => {
  console.log('🔍 Test accesso configurazione...');
  try {
    const token = await getConfigWithFallback('FATTURE_ACCESS_TOKEN');
    const companyId = await getConfigWithFallback('FIC_COMPANY_ID');
    console.log('Token trovato:', !!token);
    console.log('Company ID:', companyId);
    console.log('Token prefix:', token ? token.substring(0, 20) + '...' : 'none');
    
    // Test API call
    if (token) {
      const fetch = require('node-fetch');
      const response = await fetch(`https://api-v2.fattureincloud.it/c/${companyId}/info/payment_accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('API Status:', response.status);
      if (response.ok) {
        console.log('✅ Token valido!');
      } else {
        console.log('❌ Token non valido');
      }
    }
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
})();