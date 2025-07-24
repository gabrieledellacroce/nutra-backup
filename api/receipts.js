const fetch = require("node-fetch");
const { getValidToken } = require('./auth.js');
const { getConfig, saveConfig, loadConfig } = require('./config.js');
const { sendReceiptEmail, checkEmailConfiguration } = require('./email.js');
const fs = require('fs');
const path = require('path');

// Funzione per ottenere i payment accounts da Fatture in Cloud
async function getPaymentAccounts(accessToken, companyId) {
  try {
    const response = await fetch(
      `https://api-v2.fattureincloud.it/c/${companyId}/info/payment_accounts`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    
    if (!response.ok) {
      console.error('❌ Errore recupero payment accounts:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    console.log('✅ Payment accounts recuperati:', data.data?.length || 0);
    
    // Cerca un account di default o prendi il primo disponibile
    const accounts = data.data || [];
    const defaultAccount = accounts.find(acc => acc.is_default) || accounts[0];
    
    if (defaultAccount) {
      console.log('💳 Account di pagamento selezionato:', {
        id: defaultAccount.id,
        name: defaultAccount.name,
        type: defaultAccount.type,
        is_default: defaultAccount.is_default
      });
    }
    
    return defaultAccount;
  } catch (error) {
    console.error('❌ Errore nella chiamata payment accounts:', error);
    return null;
  }
}

// Funzione per determinare il metodo di pagamento basandosi sui dati Shopify
function getPaymentMethod(paymentGatewayNames, financialStatus, totalAmount, transactions = []) {
  // Default: contanti
  let paymentMethod = {
    name: "Contanti",
    type: "standard",
    paid_amount: totalAmount
  };

  let isInstantPayment = false; // Flag per pagamenti istantanei
  let detectedGateway = 'unknown';

  // Se abbiamo informazioni sui gateway di pagamento
  if (paymentGatewayNames && Array.isArray(paymentGatewayNames) && paymentGatewayNames.length > 0) {
    const gateway = paymentGatewayNames[0].toLowerCase();
    detectedGateway = gateway;
    
    // Mappa i gateway di Shopify ai metodi di pagamento di Fatture in Cloud
    if (gateway.includes('bank') || gateway.includes('transfer') || gateway.includes('bonifico') || gateway.includes('wire')) {
      paymentMethod.name = "Bonifico bancario";
      isInstantPayment = false; // Bonifico non è istantaneo
    } else if (gateway.includes('paypal')) {
      paymentMethod.name = "PayPal";
      isInstantPayment = true; // PayPal è istantaneo
    } else if (gateway.includes('card') || gateway.includes('visa') || gateway.includes('mastercard') || 
               gateway.includes('shopify_payments') || gateway.includes('stripe') || gateway.includes('authorize')) {
      paymentMethod.name = "Carta di credito/debito";
      isInstantPayment = true; // Carta di credito è istantanea
    } else if (gateway.includes('cod') || gateway.includes('cash') || gateway.includes('contrassegno')) {
      paymentMethod.name = "Contrassegno";
      isInstantPayment = true; // Contrassegno è considerato istantaneo
    } else if (gateway.includes('klarna') || gateway.includes('afterpay') || gateway.includes('sezzle')) {
      paymentMethod.name = "Pagamento rateale";
      isInstantPayment = true; // Considerato istantaneo per la ricevuta
    } else if (gateway.includes('apple_pay') || gateway.includes('google_pay') || gateway.includes('samsung_pay')) {
      paymentMethod.name = "Wallet digitale";
      isInstantPayment = true; // Wallet digitali sono istantanei
    } else if (gateway.includes('amazon') || gateway.includes('amazon_payments')) {
      paymentMethod.name = "Amazon Pay";
      isInstantPayment = true; // Amazon Pay è istantaneo
    } else {
      // Gateway non riconosciuto, usa il nome del gateway
      paymentMethod.name = `Pagamento online (${gateway})`;
      isInstantPayment = true; // Assume istantaneo per gateway online
    }
  }

  // Analizza le transazioni per informazioni aggiuntive
  if (transactions && Array.isArray(transactions) && transactions.length > 0) {
    const successfulTransactions = transactions.filter(t => 
      t.status === 'success' && (t.kind === 'sale' || t.kind === 'capture')
    );
    
    if (successfulTransactions.length > 0) {
      const transaction = successfulTransactions[0];
      // Se abbiamo una transazione di successo, considera il pagamento come effettuato
      if (transaction.gateway && transaction.gateway !== detectedGateway) {
        console.log(`🔄 Gateway da transazione: ${transaction.gateway} (vs ${detectedGateway})`);
      }
    }
  }

  // Logica di pagamento migliorata:
  // - PayPal, Carte, Wallet: sempre considerati pagati (anche se pending in Shopify)
  // - Bonifico: segue lo stato di Shopify (pending = non pagato)
  // - Ordini esplicitamente pagati: sempre pagati
  if (financialStatus === 'paid') {
    // Ordine esplicitamente pagato
    paymentMethod.paid_amount = totalAmount;
  } else if (isInstantPayment) {
    // PayPal, Carta di credito, Wallet, ecc.: considerati sempre pagati
    paymentMethod.paid_amount = totalAmount;
  } else if (financialStatus === 'pending' || financialStatus === 'partially_paid') {
    // Bonifico o altri metodi in pending: non pagati
    paymentMethod.paid_amount = 0;
  } else {
    // Stati sconosciuti: default a non pagato per sicurezza
    paymentMethod.paid_amount = 0;
  }

  // Log dettagliato per debug
  console.log(`💳 Metodo di pagamento rilevato:`, {
    gateway: detectedGateway,
    method: paymentMethod.name,
    isInstant: isInstantPayment,
    financialStatus,
    paidAmount: paymentMethod.paid_amount,
    totalAmount
  });

  return paymentMethod;
}

// Funzione per ottenere il prossimo numero di ricevuta con gestione conflitti
async function getNextReceiptNumber(accessToken, companyId, retryCount = 0) {
  try {
    // Ottieni le ricevute esistenti per determinare il prossimo numero
    const response = await fetch(
      `https://api-v2.fattureincloud.it/c/${companyId}/issued_documents?type=receipt&numeration=/2025&sort=-number&per_page=5`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        // Trova il numero più alto esistente
        const existingNumbers = data.data.map(doc => parseInt(doc.number)).filter(num => !isNaN(num));
        const maxNumber = Math.max(...existingNumbers, 303);
        
        // Aggiungi un offset basato sui retry per evitare conflitti
        const nextNumber = maxNumber + 1 + retryCount;
        
        console.log(`📊 Numeri esistenti: [${existingNumbers.join(', ')}], prossimo: ${nextNumber}`);
        return nextNumber;
      }
    }
    
    // Se non ci sono ricevute o errore, inizia da 304 + retry offset
    return 304 + retryCount;
  } catch (error) {
    console.error("Errore nel recupero ultimo numero ricevuta:", error);
    // Fallback: inizia da 304 + retry offset
    return 304 + retryCount;
  }
}

// Funzione per verificare se una ricevuta esiste già per questo ordine
async function checkExistingReceipt(accessToken, companyId, shopifyOrderId, orderNumber) {
  try {
    // Cerca ricevute con l'ID ordine Shopify nelle note
    const response = await fetch(
      `https://api-v2.fattureincloud.it/c/${companyId}/issued_documents?type=receipt&q=${shopifyOrderId}&per_page=10`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      const existingReceipts = data.data?.filter(receipt => 
        receipt.notes?.includes(`Shopify-ID:${shopifyOrderId}`) ||
        receipt.notes?.includes(`Ordine: ${orderNumber}`)
      ) || [];
      
      if (existingReceipts.length > 0) {
        console.log(`🔍 Ricevuta esistente trovata per ordine ${shopifyOrderId}:`, {
          receipt_id: existingReceipts[0].id,
          number: existingReceipts[0].number,
          amount: existingReceipts[0].amount_gross
        });
        return existingReceipts[0];
      }
    }
    
    return null;
  } catch (error) {
    console.error("Errore controllo ricevuta esistente:", error);
    return null;
  }
}

// Mappa per tenere traccia degli ordini in elaborazione
const processingOrders = new Map();

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // Validazione dati in ingresso
    if (!req.body || !req.body.customer || !req.body.line_items) {
      return res.status(400).json({ 
        error: "Dati ordine Shopify mancanti", 
        required: ["customer", "line_items", "total_price"] 
      });
    }

    // Estrai i dati dall'ordine Shopify
    const { id: shopifyOrderId, customer, billing_address, line_items, total_price, subtotal_price, total_discounts, discount_codes, discount_applications, currency, created_at, payment_gateway_names, financial_status, order_number, name, phone } = req.body;
    
    // Verifica se l'ordine è già in elaborazione
    if (processingOrders.has(shopifyOrderId)) {
      console.log(`⚠️ ORDINE ${shopifyOrderId} GIÀ IN ELABORAZIONE - Richiesta ignorata`);
      return res.status(429).json({
        success: false,
        error: "Ordine già in elaborazione",
        message: "Una richiesta per questo ordine è già in corso di elaborazione"
      });
    }
    
    // Segna l'ordine come in elaborazione
    processingOrders.set(shopifyOrderId, new Date());
    
    // Log delle informazioni di pagamento per debug
    console.log("💳 Informazioni pagamento Shopify:", {
      payment_gateway_names,
      financial_status,
      total_price
    });
    
    if (!customer.first_name || !customer.last_name || !customer.email) {
      // Rimuovi l'ordine dalla mappa prima di restituire l'errore
      processingOrders.delete(shopifyOrderId);
      return res.status(400).json({ 
        error: "Dati cliente incompleti", 
        required: ["customer.first_name", "customer.last_name", "customer.email"] 
      });
    }
    
    const { first_name, last_name, email, phone: customer_phone } = customer;
    
    // Determina il telefono del cliente (priorità: customer.phone, billing_address.phone, phone dell'ordine)
    const customerPhone = customer_phone || (billing_address && billing_address.phone) || phone || '';
    
    // Ottieni il token OAuth2 e company ID prima di calcolare il numero
    const accessToken = await getValidToken();
    const companyId = await getConfig('FIC_COMPANY_ID');
    
    // 🔍 CONTROLLO DUPLICATI: Verifica se esiste già una ricevuta per questo ordine
    const existingReceipt = await checkExistingReceipt(accessToken, companyId, shopifyOrderId, order_number || name);
    if (existingReceipt) {
      console.log(`⚠️ RICEVUTA DUPLICATA BLOCCATA per ordine ${shopifyOrderId}`);
      return res.status(200).json({
        success: true,
        duplicate: true,
        message: "Ricevuta già esistente per questo ordine",
        existing_receipt: {
          id: existingReceipt.id,
          number: existingReceipt.number,
          amount: existingReceipt.amount_gross,
          date: existingReceipt.date
        }
      });
    }
    
    // Ottieni il prossimo numero di ricevuta
    let nextReceiptNumber = await getNextReceiptNumber(accessToken, companyId);

    // 🔧 CORREZIONE CALCOLO IMPORTI
    // Shopify invia prezzi già scontati nei line_items, ma dobbiamo usare i prezzi originali
    // Calcoliamo il prezzo originale dal subtotal_price prima degli sconti
    const shopifySubtotal = parseFloat(subtotal_price) || 0;
    const shopifyDiscount = parseFloat(total_discounts) || 0;
    const shopifyTotal = parseFloat(total_price) || 0;
    
    console.log(`💰 Shopify Totali:`, {
      subtotal: shopifySubtotal,
      discount: shopifyDiscount,
      total: shopifyTotal
    });
    
    const items = line_items.map(item => {
      // Usa il prezzo da Shopify che è già quello finale (scontato se applicabile)
      const shopifyPrice = parseFloat(item.price) || 0;
      // Calcola il prezzo netto (senza IVA) dal prezzo Shopify
      const netPrice = shopifyPrice / 1.10; // Rimuovi IVA 10%
      const grossPrice = shopifyPrice; // Il prezzo Shopify è già lordo
      
      console.log(`📊 Item: ${item.title} - Shopify: €${shopifyPrice} → Netto: €${netPrice.toFixed(2)} → Lordo: €${grossPrice.toFixed(2)}`);
      
      return {
        name: item.name || item.title,
        description: item.name || item.title,
        qty: parseFloat(item.quantity) || 1,
        measure: "pz",
        net_price: parseFloat(netPrice.toFixed(2)), // Prezzo netto calcolato
        gross_price: parseFloat(grossPrice.toFixed(2)), // Prezzo lordo da Shopify
        vat: {
          id: 3, // ID IVA ridotta 10%
          value: 10,
          description: "10%"
        }
      };
    });
    
    // Calcola spedizione per il riepilogo (non come articolo)
    let shippingAmount = 0;
    if (req.body.shipping_lines && Array.isArray(req.body.shipping_lines) && req.body.shipping_lines.length > 0) {
      shippingAmount = req.body.shipping_lines.reduce((sum, shipping) => {
        return sum + (parseFloat(shipping.price) || 0);
      }, 0);
      console.log(`📦 Spedizione totale: €${shippingAmount.toFixed(2)}`);
    }

    // Calcola sconto per il riepilogo (non come articolo)
    let discountAmount = shopifyDiscount;
    const discountDescription = discount_codes && discount_codes.length > 0 
      ? discount_codes[0].code 
      : 'Sconto';
    
    if (discountAmount > 0) {
      console.log(`💸 Sconto ${discountDescription}: €${discountAmount.toFixed(2)}`);
    }

    // Spedizione e sconti NON vengono aggiunti alla lista articoli
    // ma gestiti tramite i campi amount_delivery_note e amount_discount nel riepilogo

    // Solo gli articoli veri (senza spedizione e sconti)
    const allItems = items;
    
    // Calcola i totali degli articoli
    const itemsNetTotal = allItems.reduce((sum, item) => sum + (item.net_price * item.qty), 0);
    const itemsGrossTotal = allItems.reduce((sum, item) => sum + (item.gross_price * item.qty), 0);
    
    // Calcola spedizione netta e lorda
    const shippingNet = shippingAmount / 1.10;
    const shippingGross = shippingAmount;
    
    // Calcola sconto netto e lordo (negativi)
    const discountNet = -(discountAmount / 1.10);
    const discountGross = -discountAmount;
    
    // Totali finali includendo spedizione e sconti
    const netTotal = itemsNetTotal + shippingNet + discountNet;
    const grossTotal = itemsGrossTotal + shippingGross + discountGross;
    const vatAmount = grossTotal - netTotal;
    
    // Usa il totale di Shopify come riferimento
    console.log(`💰 Verifica totali:`, {
      shopify_total: shopifyTotal.toFixed(2),
      shopify_subtotal: shopifySubtotal.toFixed(2),
      shopify_discount: shopifyDiscount.toFixed(2),
      items_net: itemsNetTotal.toFixed(2),
      items_gross: itemsGrossTotal.toFixed(2),
      shipping_net: shippingNet.toFixed(2),
      shipping_gross: shippingGross.toFixed(2),
      discount_net: discountNet.toFixed(2),
      discount_gross: discountGross.toFixed(2),
      final_net: netTotal.toFixed(2),
      final_gross: grossTotal.toFixed(2),
      final_vat: vatAmount.toFixed(2),
      items_count: items.length,
      difference: Math.abs(shopifyTotal - grossTotal).toFixed(2)
    });

    // Determina se il pagamento è istantaneo basandosi sui gateway di Shopify
    const isInstantPayment = payment_gateway_names && Array.isArray(payment_gateway_names) && 
      payment_gateway_names.some(gateway => {
        const g = gateway.toLowerCase();
        // Gateway che indicano pagamento immediato/elettronico
        return g.includes('paypal') || 
               g.includes('card') || 
               g.includes('visa') || 
               g.includes('mastercard') || 
               g.includes('shopify_payments') || 
               g.includes('stripe') || 
               g.includes('authorize') ||
               g.includes('apple_pay') ||
               g.includes('google_pay') ||
               g.includes('samsung_pay') ||
               g.includes('klarna') ||
               g.includes('afterpay') ||
               g.includes('amazon');
      });

    // Determina lo status della ricevuta
    const receiptStatus = isInstantPayment ? 'paid' : 'not_paid';
    
    console.log("💳 Analisi pagamento:", {
      payment_gateway_names,
      isInstantPayment,
      receiptStatus,
      financial_status
    });

    // Se è un pagamento istantaneo, recupera i payment accounts per marcare come pagata
    let paymentAccount = null;
    if (isInstantPayment) {
      console.log("🔍 Recupero payment accounts per pagamento automatico...");
      paymentAccount = await getPaymentAccounts(accessToken, companyId);
    }

    // Corpo della richiesta API per Fatture in Cloud
    // Utilizziamo i campi specifici per spedizione e sconti globali
    const payload = {
      data: {
        type: "receipt",
        entity: {
          name: `${first_name} ${last_name}`,
          email: email,
          phone: customerPhone,
          address_street: billing_address?.address1 || '',
          address_postal_code: billing_address?.zip || '',
          address_city: billing_address?.city || '',
          address_province: billing_address?.province_code || billing_address?.province || '',
          address_extra: billing_address?.address2 || '',
          country_iso: billing_address?.country_code || 'IT'
        },
        date: created_at ? created_at.split("T")[0] : new Date().toISOString().split("T")[0],
        number: nextReceiptNumber,
        numeration: "",
        use_gross_prices: true,
        subject: `[NutraGenix] ordine numero ${order_number || name || 'N/A'} del ${created_at ? created_at.split("T")[0] : new Date().toISOString().split("T")[0]}`,
        description: `Ordine Shopify - ${first_name} ${last_name}`,
        expiration_date: (() => {
          const orderDate = created_at ? new Date(created_at) : new Date();
          orderDate.setDate(orderDate.getDate() + 30); // Scadenza a 30 giorni dalla data ordine
          return orderDate.toISOString().split("T")[0];
        })(),
        rc_center: "",
        rivalsa: 0,
        cassa: 0,
        amount_cassa: 0,
        cassa_taxable: 0,
        amount_cassa_taxable: 0,
        cassa2: 0,
        amount_cassa2: 0,
        cassa2_taxable: 0,
        amount_cassa2_taxable: 0,
        global_cassa_taxable: 0,
        amount_global_cassa_taxable: 0,
        withholding_tax: 0,
        withholding_tax_taxable: 0,
        other_withholding_tax: 0,
        stamp_duty: 0,
        // Note senza dettagli di spedizione e sconto (ora gestiti come articoli separati)
        notes: `Shopify-ID:${shopifyOrderId} - Email: ${email}${customerPhone ? ` - Tel: ${customerPhone}` : ''} - Ordine: ${order_number || name || 'N/A'} - Gateway: ${payment_gateway_names?.[0] || 'unknown'} - ${isInstantPayment ? 'PAGAMENTO ELETTRONICO AUTOMATICO' : 'DA SALDARE'}`,
        // Totali calcolati solo sugli articoli (senza spedizione e sconti)
        amount_net: parseFloat(itemsNetTotal.toFixed(2)),
        amount_vat: parseFloat((itemsGrossTotal - itemsNetTotal).toFixed(2)),
        amount_gross: parseFloat(itemsGrossTotal.toFixed(2)),
        items_list: allItems,
        // Gestione automatica dei pagamenti
        fix_payments: true
      }
    };
    
    // Aggiungi spedizione se presente
    if (shippingAmount > 0) {
      // Aggiungi la spedizione come articolo separato con categoria specifica
      payload.data.items_list.push({
        name: "Spedizione",
        description: "Costi di spedizione",
        qty: 1,
        measure: "pz",
        net_price: parseFloat(shippingNet.toFixed(2)),
        gross_price: parseFloat(shippingGross.toFixed(2)),
        category: "Trasporto",
        vat: {
          id: 3, // ID IVA ridotta 10%
          value: 10,
          description: "10%"
        }
      });
      
      // Aggiorna i totali includendo la spedizione
      payload.data.amount_net = parseFloat((itemsNetTotal + shippingNet).toFixed(2));
      payload.data.amount_vat = parseFloat((itemsGrossTotal + shippingGross - itemsNetTotal - shippingNet).toFixed(2));
      payload.data.amount_gross = parseFloat((itemsGrossTotal + shippingGross).toFixed(2));
    }
    
    // Aggiungi sconto se presente
    if (discountAmount > 0) {
      // Aggiungi lo sconto come articolo separato con categoria specifica
      payload.data.items_list.push({
        name: `Sconto ${discountDescription}`,
        description: `Sconto applicato: ${discountDescription}`,
        qty: 1,
        measure: "pz",
        net_price: parseFloat(discountNet.toFixed(2)), // Negativo
        gross_price: parseFloat(discountGross.toFixed(2)), // Negativo
        category: "Sconto",
        vat: {
          id: 3, // ID IVA ridotta 10%
          value: 10,
          description: "10%"
        }
      });
      
      // Aggiorna i totali includendo lo sconto
      const currentNet = payload.data.amount_net;
      const currentGross = payload.data.amount_gross;
      payload.data.amount_net = parseFloat((currentNet + discountNet).toFixed(2));
      payload.data.amount_vat = parseFloat((currentGross + discountGross - currentNet - discountNet).toFixed(2));
      payload.data.amount_gross = parseFloat((currentGross + discountGross).toFixed(2));
    }

    // Se è un pagamento istantaneo e abbiamo un payment account, aggiungi il pagamento
    if (isInstantPayment && paymentAccount) {
      const orderDate = created_at ? new Date(created_at) : new Date();
      
      payload.data.payments_list = [{
        amount: parseFloat(grossTotal.toFixed(2)),
        due_date: orderDate.toISOString().split("T")[0],
        paid_date: orderDate.toISOString().split("T")[0],
        status: "paid",
        payment_account: {
          id: paymentAccount.id
        },
        payment_terms: {
          type: "standard"
        }
      }];
      
      console.log("💰 Pagamento automatico aggiunto:", {
        amount: parseFloat(grossTotal.toFixed(2)),
        payment_account_id: paymentAccount.id,
        payment_account_name: paymentAccount.name,
        status: "paid"
      });
    }

    // Token e company ID già ottenuti sopra

    // Chiamata a Fatture in Cloud API - Le ricevute sono issued documents
    // Aggiungiamo l'opzione fix_payments per risolvere automaticamente i problemi di totali
    const requestBody = {
      data: payload.data,
      options: {
        fix_payments: true
      }
    };

    // Retry logic per gestire conflitti di numerazione
    let response;
    let data;
    let retryCount = 0;
    const maxRetries = 3;
    
    do {
      // Aggiorna il numero nel payload
      payload.data.number = nextReceiptNumber;
      requestBody.data = payload.data;
      
      response = await fetch(
        `https://api-v2.fattureincloud.it/c/${companyId}/issued_documents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify(requestBody)
        }
      );

      data = await response.json();
      
      // Se c'è un conflitto (409), riprova con un numero diverso
      if (response.status === 409 && retryCount < maxRetries) {
        retryCount++;
        console.log(`⚠️ Conflitto numero ${nextReceiptNumber}, retry ${retryCount}/${maxRetries}`);
        nextReceiptNumber = await getNextReceiptNumber(accessToken, companyId, retryCount);
        continue;
      }
      
      break;
    } while (retryCount <= maxRetries);
    
    if (!response.ok) {
      console.error("❌ Errore API Fatture in Cloud:", {
        status: response.status,
        statusText: response.statusText,
        error: data,
        validation_result: data.error?.validation_result,
        payload: JSON.stringify(payload, null, 2)
      });
      
      // Log dettagliato del validation_result se presente
      if (data.error?.validation_result) {
        console.error("🔍 Dettagli validazione:", JSON.stringify(data.error.validation_result, null, 2));
      }
      
      return res.status(500).json({ 
        error: "Errore creazione ricevuta", 
        details: data,
        validation_result: data.error?.validation_result,
        status: response.status 
      });
    }

    console.log("✅ Ricevuta creata con successo:", {
      receipt_id: data.data?.id,
      number: data.data?.number,
      amount: data.data?.amount_gross,
      customer: `${first_name} ${last_name}`,
      payment_status: isInstantPayment && paymentAccount ? 'automatically_paid' : (isInstantPayment ? 'manual_payment_required' : 'not_paid'),
      payment_gateway: payment_gateway_names?.[0] || 'unknown',
      auto_paid: isInstantPayment && paymentAccount,
      payment_account_used: paymentAccount?.name || null
    });

    // DISABILITATO: Invio automatico email ricevuta
    // Fatture in Cloud invia un webhook quando la ricevuta è pronta per il download
    // quindi non è necessario inviare l'email immediatamente
    let emailResult = { success: false, reason: 'Email disabled - webhook system active' };
    console.log("📧 Invio email disabilitato - sistema webhook attivo");
    
    /*
    try {
      console.log("📧 Tentativo invio email ricevuta...");
      
      // Verifica configurazione email
      const emailConfig = await checkEmailConfiguration();
      if (emailConfig.configured) {
        emailResult = await sendReceiptEmail(
          data.data, 
          email, 
          `${first_name} ${last_name}`,
          accessToken,
          companyId
        );
        
        if (emailResult.success) {
          console.log("✅ Email ricevuta inviata con successo:", {
            to: email,
            messageId: emailResult.messageId,
            hasPDF: emailResult.hasPDF
          });
        } else {
          console.warn("⚠️ Errore invio email ricevuta:", emailResult.error);
        }
      } else {
        console.log("📧 Invio email saltato:", emailConfig.reason);
        emailResult = { success: false, reason: emailConfig.reason };
      }
    } catch (emailError) {
      console.error("❌ Errore durante invio email:", emailError);
      emailResult = { success: false, error: emailError.message };
    }
    */

    // Determina il messaggio di stato finale
    let finalStatus, finalMessage;
    
    if (isInstantPayment && paymentAccount) {
      finalStatus = 'automatically_paid';
      finalMessage = `Ricevuta creata e AUTOMATICAMENTE MARCATA COME PAGATA. Gateway: ${payment_gateway_names?.[0] || 'unknown'}. ✅ PAGAMENTO ELETTRONICO PROCESSATO AUTOMATICAMENTE. 📧 Email sarà inviata tramite webhook quando PDF è pronto`;
    } else if (isInstantPayment && !paymentAccount) {
      finalStatus = 'manual_payment_required';
      finalMessage = `Ricevuta creata. Gateway: ${payment_gateway_names?.[0] || 'unknown'}. ⚠️ PAGAMENTO ELETTRONICO RILEVATO ma account di pagamento non disponibile - Marca manualmente come PAGATA. 📧 Email sarà inviata tramite webhook quando PDF è pronto`;
    } else {
      finalStatus = 'not_paid';
      finalMessage = `Ricevuta creata come DA SALDARE. Gateway: ${payment_gateway_names?.[0] || 'unknown'}. 📋 Ricevuta in attesa di pagamento. 📧 Email sarà inviata tramite webhook quando PDF è pronto`;
    }

    // Tutto ok
    const finalResponse = {
      success: true, 
      receipt: data,
      email: emailResult,
      payment_status: finalStatus,
      payment_gateway: payment_gateway_names?.[0] || 'unknown',
      is_instant_payment: isInstantPayment,
      payment_account_used: paymentAccount?.name || null,
      message: finalMessage
    };
    
    // Rimuovi l'ordine dalla mappa di elaborazione
    processingOrders.delete(shopifyOrderId);
    console.log(`✅ Ordine ${shopifyOrderId} completato e rimosso dalla coda di elaborazione`);
    
    return res.status(200).json(finalResponse);
  } catch (error) {
    // In caso di errore, assicurati di rimuovere l'ordine dalla mappa
    if (req.body && req.body.id) {
      processingOrders.delete(req.body.id);
      console.log(`⚠️ Errore durante l'elaborazione dell'ordine ${req.body.id} - Rimosso dalla coda`);
    }
    
    console.error("❌ Errore durante la creazione della ricevuta:", error);
    return res.status(500).json({ 
      error: "Errore durante la creazione della ricevuta", 
      message: error.message 
    });
  }
}

module.exports = { default: handler };