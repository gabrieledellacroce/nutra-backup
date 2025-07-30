#!/usr/bin/env node

/**
 * 🧪 SIMULATORE WEBHOOK SHOPIFY
 * Simula ordini Shopify per testare il sistema anti-duplicati
 */

const https = require('https');

// Webhook base dal vero ordine Shopify catturato
const baseWebhook = {
  "id": 10271015436553,
  "admin_graphql_api_id": "gid://shopify/Order/10271015436553",
  "app_id": 580111,
  "browser_ip": "93.36.167.230",
  "buyer_accepts_marketing": false,
  "cancel_reason": null,
  "cancelled_at": null,
  "cart_token": "c1-b123456789",
  "checkout_id": 123456789,
  "checkout_token": "abc123def456",
  "client_details": {
    "accept_language": "it-IT,it;q=0.9,en;q=0.8",
    "browser_height": 969,
    "browser_ip": "93.36.167.230",
    "browser_width": 1920,
    "session_hash": null,
    "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
  },
  "closed_at": null,
  "confirmed": true,
  "contact_email": "gabriele.dellacroce@fuzzymarketing.it",
  "created_at": "2025-01-30T14:12:15+01:00",
  "currency": "EUR",
  "current_subtotal_price": "0.00",
  "current_subtotal_price_set": {
    "shop_money": {"amount": "0.00", "currency_code": "EUR"},
    "presentment_money": {"amount": "0.00", "currency_code": "EUR"}
  },
  "current_total_discounts": "64.50",
  "current_total_discounts_set": {
    "shop_money": {"amount": "64.50", "currency_code": "EUR"},
    "presentment_money": {"amount": "64.50", "currency_code": "EUR"}
  },
  "current_total_duties_set": null,
  "current_total_price": "0.00",
  "current_total_price_set": {
    "shop_money": {"amount": "0.00", "currency_code": "EUR"},
    "presentment_money": {"amount": "0.00", "currency_code": "EUR"}
  },
  "current_total_tax": "0.00",
  "customer_locale": "it",
  "device_id": null,
  "discount_codes": [
    {
      "code": "TESTFUZZY",
      "amount": "57.50",
      "type": "percentage"
    },
    {
      "code": "TESTSPED",
      "amount": "7.00", 
      "type": "shipping"
    }
  ],
  "email": "gabriele.dellacroce@fuzzymarketing.it",
  "estimated_taxes": false,
  "financial_status": "paid",
  "fulfillment_status": null,
  "gateway": "",
  "landing_site": "/",
  "landing_site_ref": null,
  "location_id": null,
  "name": "#2037",
  "note": null,
  "note_attributes": [],
  "number": 2037,
  "order_number": 2037,
  "order_status_url": "https://nutragenix.it/123456/orders/abc123def456/authenticate?key=xyz789",
  "original_total_duties_set": null,
  "payment_gateway_names": [],
  "phone": null,
  "presentment_currency": "EUR",
  "processed_at": "2025-01-30T14:12:15+01:00",
  "processing_method": "direct",
  "reference": "abc123",
  "referring_site": "",
  "source_identifier": "abc123",
  "source_name": "web",
  "source_url": null,
  "subtotal_price": "57.50",
  "subtotal_price_set": {
    "shop_money": {"amount": "57.50", "currency_code": "EUR"},
    "presentment_money": {"amount": "57.50", "currency_code": "EUR"}
  },
  "tags": "",
  "tax_lines": [],
  "taxes_included": true,
  "test": false,
  "token": "abc123def456ghi789",
  "total_discounts": "64.50",
  "total_discounts_set": {
    "shop_money": {"amount": "64.50", "currency_code": "EUR"},
    "presentment_money": {"amount": "64.50", "currency_code": "EUR"}
  },
  "total_line_items_price": "57.50",
  "total_line_items_price_set": {
    "shop_money": {"amount": "57.50", "currency_code": "EUR"},
    "presentment_money": {"amount": "57.50", "currency_code": "EUR"}
  },
  "total_outstanding": "0.00",
  "total_price": "0.00",
  "total_price_set": {
    "shop_money": {"amount": "0.00", "currency_code": "EUR"},
    "presentment_money": {"amount": "0.00", "currency_code": "EUR"}
  },
  "total_shipping_price_set": {
    "shop_money": {"amount": "7.00", "currency_code": "EUR"},
    "presentment_money": {"amount": "7.00", "currency_code": "EUR"}
  },
  "total_tax": "0.00",
  "total_tax_set": {
    "shop_money": {"amount": "0.00", "currency_code": "EUR"},
    "presentment_money": {"amount": "0.00", "currency_code": "EUR"}
  },
  "total_tip_received": "0.00",
  "total_weight": 0,
  "updated_at": "2025-01-30T14:12:15+01:00",
  "user_id": null,
  "billing_address": {
    "first_name": "Gabriele",
    "address1": "Via Test 123",
    "phone": "+39123456789",
    "city": "Milano",
    "zip": "20100",
    "province": "MI",
    "country": "Italy",
    "last_name": "Della Croce",
    "address2": "",
    "company": "Fuzzy Marketing",
    "latitude": 45.4642,
    "longitude": 9.1900,
    "name": "Gabriele Della Croce",
    "country_code": "IT",
    "province_code": "MI"
  },
  "customer": {
    "id": 123456789,
    "email": "gabriele.dellacroce@fuzzymarketing.it",
    "accepts_marketing": false,
    "created_at": "2024-01-01T10:00:00+01:00",
    "updated_at": "2025-01-30T14:12:15+01:00",
    "first_name": "Gabriele",
    "last_name": "Della Croce",
    "orders_count": 5,
    "state": "enabled",
    "total_spent": "250.00",
    "last_order_id": 10271015436553,
    "note": null,
    "verified_email": true,
    "multipass_identifier": null,
    "tax_exempt": false,
    "phone": "+39123456789",
    "tags": "",
    "last_order_name": "#2037",
    "currency": "EUR",
    "accepts_marketing_updated_at": "2024-01-01T10:00:00+01:00",
    "marketing_opt_in_level": null,
    "tax_exemptions": [],
    "admin_graphql_api_id": "gid://shopify/Customer/123456789",
    "default_address": {
      "id": 987654321,
      "customer_id": 123456789,
      "first_name": "Gabriele",
      "last_name": "Della Croce",
      "company": "Fuzzy Marketing",
      "address1": "Via Test 123",
      "address2": "",
      "city": "Milano",
      "province": "MI",
      "country": "Italy",
      "zip": "20100",
      "phone": "+39123456789",
      "name": "Gabriele Della Croce",
      "province_code": "MI",
      "country_code": "IT",
      "country_name": "Italy",
      "default": true
    }
  },
  "line_items": [
    {
      "id": 456789123,
      "admin_graphql_api_id": "gid://shopify/LineItem/456789123",
      "fulfillable_quantity": 1,
      "fulfillment_service": "manual",
      "fulfillment_status": null,
      "gift_card": false,
      "grams": 0,
      "name": "Prodotto Test - Default Title",
      "origin_location": {
        "id": 111222333,
        "country_code": "IT",
        "province_code": "",
        "name": "Nutragenix Warehouse",
        "address1": "Via Warehouse 1",
        "address2": "",
        "city": "Milano",
        "zip": "20100"
      },
      "price": "57.50",
      "price_set": {
        "shop_money": {"amount": "57.50", "currency_code": "EUR"},
        "presentment_money": {"amount": "57.50", "currency_code": "EUR"}
      },
      "product_exists": true,
      "product_id": 789123456,
      "properties": [],
      "quantity": 1,
      "requires_shipping": true,
      "sku": "TEST-PROD-001",
      "taxable": true,
      "title": "Prodotto Test",
      "total_discount": "57.50",
      "total_discount_set": {
        "shop_money": {"amount": "57.50", "currency_code": "EUR"},
        "presentment_money": {"amount": "57.50", "currency_code": "EUR"}
      },
      "variant_id": 321654987,
      "variant_inventory_management": "shopify",
      "variant_title": "Default Title",
      "vendor": "Nutragenix",
      "tax_lines": [],
      "duties": [],
      "discount_allocations": [
        {
          "amount": "57.50",
          "amount_set": {
            "shop_money": {"amount": "57.50", "currency_code": "EUR"},
            "presentment_money": {"amount": "57.50", "currency_code": "EUR"}
          },
          "discount_application_index": 0
        }
      ]
    }
  ],
  "shipping_address": {
    "first_name": "Gabriele",
    "address1": "Via Test 123",
    "phone": "+39123456789",
    "city": "Milano",
    "zip": "20100",
    "province": "MI",
    "country": "Italy",
    "last_name": "Della Croce",
    "address2": "",
    "company": "Fuzzy Marketing",
    "latitude": 45.4642,
    "longitude": 9.1900,
    "name": "Gabriele Della Croce",
    "country_code": "IT",
    "province_code": "MI"
  },
  "shipping_lines": [
    {
      "id": 147258369,
      "carrier_identifier": "standard",
      "code": "Standard",
      "delivery_category": null,
      "discounted_price": "0.00",
      "discounted_price_set": {
        "shop_money": {"amount": "0.00", "currency_code": "EUR"},
        "presentment_money": {"amount": "0.00", "currency_code": "EUR"}
      },
      "phone": null,
      "price": "7.00",
      "price_set": {
        "shop_money": {"amount": "7.00", "currency_code": "EUR"},
        "presentment_money": {"amount": "7.00", "currency_code": "EUR"}
      },
      "requested_fulfillment_service_id": null,
      "source": "shopify",
      "title": "Standard",
      "tax_lines": [],
      "discount_allocations": [
        {
          "amount": "7.00",
          "amount_set": {
            "shop_money": {"amount": "7.00", "currency_code": "EUR"},
            "presentment_money": {"amount": "7.00", "currency_code": "EUR"}
          },
          "discount_application_index": 1
        }
      ]
    }
  ]
};

/**
 * Genera un nuovo webhook con ID univoco
 */
function generateTestWebhook(orderNumber) {
  const webhook = JSON.parse(JSON.stringify(baseWebhook));
  
  // Genera ID univoci
  const newId = 10271000000000 + orderNumber;
  const timestamp = new Date().toISOString();
  
  webhook.id = newId;
  webhook.admin_graphql_api_id = `gid://shopify/Order/${newId}`;
  webhook.name = `#${orderNumber}`;
  webhook.number = orderNumber;
  webhook.order_number = orderNumber;
  webhook.created_at = timestamp;
  webhook.processed_at = timestamp;
  webhook.updated_at = timestamp;
  
  // Aggiorna token univoci
  webhook.cart_token = `c1-${Math.random().toString(36).substr(2, 9)}`;
  webhook.checkout_token = Math.random().toString(36).substr(2, 15);
  webhook.token = Math.random().toString(36).substr(2, 20);
  
  return webhook;
}

/**
 * Invia webhook al server
 */
function sendWebhook(webhook, callback) {
  const data = JSON.stringify(webhook);
  
  const options = {
    hostname: 'nutra-backup.vercel.app',
    port: 443,
    path: '/api/receipts',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
      'X-Shopify-Topic': 'orders/create',
      'X-Shopify-Shop-Domain': 'nutragenix.myshopify.com'
    }
  };

  const req = https.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      callback(null, {
        statusCode: res.statusCode,
        headers: res.headers,
        body: responseData
      });
    });
  });

  req.on('error', (err) => {
    callback(err);
  });

  req.write(data);
  req.end();
}

/**
 * Test principale
 */
function runTest() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🧪 SIMULATORE WEBHOOK SHOPIFY

Uso:
  node test-webhook-simulator.js <numero_ordine>
  node test-webhook-simulator.js duplicate <numero_ordine>  # Invia lo stesso ordine 2 volte
  node test-webhook-simulator.js stress <numero_base> <quantità>  # Test di stress

Esempi:
  node test-webhook-simulator.js 3001
  node test-webhook-simulator.js duplicate 3002
  node test-webhook-simulator.js stress 4000 5
    `);
    return;
  }

  const command = args[0];
  
  if (command === 'duplicate') {
    const orderNumber = parseInt(args[1]);
    if (!orderNumber) {
      console.error('❌ Numero ordine richiesto per test duplicato');
      return;
    }
    
    console.log(`🔄 Test duplicato per ordine #${orderNumber}`);
    const webhook = generateTestWebhook(orderNumber);
    
    // Primo invio
    console.log('📤 Invio #1...');
    sendWebhook(webhook, (err, res) => {
      if (err) {
        console.error('❌ Errore invio #1:', err.message);
        return;
      }
      console.log(`✅ Invio #1 completato: ${res.statusCode}`);
      
      // Secondo invio (stesso webhook)
      setTimeout(() => {
        console.log('📤 Invio #2 (duplicato)...');
        sendWebhook(webhook, (err, res) => {
          if (err) {
            console.error('❌ Errore invio #2:', err.message);
            return;
          }
          console.log(`✅ Invio #2 completato: ${res.statusCode}`);
          console.log('🏁 Test duplicato completato');
        });
      }, 2000);
    });
    
  } else if (command === 'stress') {
    const baseNumber = parseInt(args[1]);
    const count = parseInt(args[2]);
    
    if (!baseNumber || !count) {
      console.error('❌ Numero base e quantità richiesti per stress test');
      return;
    }
    
    console.log(`⚡ Stress test: ${count} ordini a partire da #${baseNumber}`);
    
    for (let i = 0; i < count; i++) {
      const orderNumber = baseNumber + i;
      const webhook = generateTestWebhook(orderNumber);
      
      setTimeout(() => {
        console.log(`📤 Invio ordine #${orderNumber}...`);
        sendWebhook(webhook, (err, res) => {
          if (err) {
            console.error(`❌ Errore ordine #${orderNumber}:`, err.message);
            return;
          }
          console.log(`✅ Ordine #${orderNumber} completato: ${res.statusCode}`);
        });
      }, i * 1000); // 1 secondo di delay tra gli invii
    }
    
  } else {
    const orderNumber = parseInt(command);
    if (!orderNumber) {
      console.error('❌ Numero ordine non valido');
      return;
    }
    
    console.log(`📤 Invio ordine singolo #${orderNumber}...`);
    const webhook = generateTestWebhook(orderNumber);
    
    sendWebhook(webhook, (err, res) => {
      if (err) {
        console.error('❌ Errore:', err.message);
        return;
      }
      console.log(`✅ Ordine #${orderNumber} completato: ${res.statusCode}`);
      console.log('📄 Risposta:', res.body);
    });
  }
}

// Avvia il test
runTest();