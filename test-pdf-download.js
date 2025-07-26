#!/usr/bin/env node

/**
 * Test specifico per il download PDF con il nuovo token OAuth2
 */

const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.prod' });

// Importa la funzione getValidToken
const { getValidToken } = require('./api/auth.js');

async function testPDFDownload() {
    console.log('🧪 TEST DOWNLOAD PDF CON TOKEN OAUTH2');
    console.log('=====================================');
    
    try {
        // Ottieni token valido
        console.log('🔑 Ottenimento token valido...');
        const accessToken = await getValidToken();
        console.log('✅ Token OAuth2 ottenuto con successo');
        console.log('🔑 Token prefix:', accessToken.substring(0, 20) + '...');
        
        const companyId = process.env.FIC_COMPANY_ID || '1268058';
        
        // Crea una ricevuta di test per ottenere un ID valido
        console.log('📄 Creazione ricevuta di test...');
        
        const receiptData = {
            data: {
                type: "receipt",
                numeration: "REC001",
                subject: "Test PDF Download",
                visible_subject: "Test PDF Download",
                entity: {
                    name: "Test Cliente PDF",
                    email: "test@example.com"
                },
                date: new Date().toISOString().split('T')[0],
                currency: {
                    id: "EUR"
                },
                items_list: [{
                    name: "Test Item PDF",
                    qty: 1,
                    net_price: 10.00,
                    vat: {
                        id: 3
                    }
                }],
                payments_list: [{
                    amount: 11.00,
                    due_date: new Date().toISOString().split('T')[0],
                    status: "paid",
                    payment_account: {
                        id: 1205214
                    }
                }]
            }
        };
        
        // Crea la ricevuta
        const createResponse = await fetch(
            `https://api-v2.fattureincloud.it/c/${companyId}/issued_documents`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(receiptData)
            }
        );
        
        if (!createResponse.ok) {
            throw new Error(`Errore creazione ricevuta: ${createResponse.status} ${createResponse.statusText}`);
        }
        
        const receiptResult = await createResponse.json();
        const receiptId = receiptResult.data.id;
        
        console.log('✅ Ricevuta creata con successo');
        console.log('📋 ID Ricevuta:', receiptId);
        
        // Aspetta un momento per la generazione del PDF
        console.log('⏳ Attesa generazione PDF...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Tenta il download del PDF
        console.log('📄 Tentativo download PDF...');
        
        const pdfResponse = await fetch(
            `https://api-v2.fattureincloud.it/c/${companyId}/issued_documents/${receiptId}/pdf`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );
        
        console.log('📊 Risposta download PDF:');
        console.log('   Status:', pdfResponse.status);
        console.log('   Status Text:', pdfResponse.statusText);
        console.log('   Headers:', Object.fromEntries(pdfResponse.headers.entries()));
        
        if (pdfResponse.ok) {
            const arrayBuffer = await pdfResponse.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
            console.log('✅ PDF scaricato con successo!');
            console.log('📏 Dimensione PDF:', pdfBuffer.length, 'bytes');
            
            // Salva il PDF per verifica
            const fs = require('fs');
            fs.writeFileSync('test-pdf-download.pdf', pdfBuffer);
            console.log('💾 PDF salvato come test-pdf-download.pdf');
            
        } else if (pdfResponse.status === 404) {
            console.log('⏳ PDF non ancora disponibile (404)');
        } else {
            console.error('❌ Errore download PDF:', pdfResponse.status, pdfResponse.statusText);
            const errorBody = await pdfResponse.text();
            console.error('   Error body:', errorBody);
        }
        
        // Cleanup: elimina la ricevuta di test
        console.log('🧹 Pulizia ricevuta di test...');
        const deleteResponse = await fetch(
            `https://api-v2.fattureincloud.it/c/${companyId}/issued_documents/${receiptId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );
        
        if (deleteResponse.ok) {
            console.log('✅ Ricevuta di test eliminata');
        } else {
            console.warn('⚠️ Impossibile eliminare ricevuta di test:', deleteResponse.status);
        }
        
    } catch (error) {
        console.error('❌ Errore nel test:', error.message);
        process.exit(1);
    }
}

// Esegui il test
testPDFDownload().then(() => {
    console.log('🎉 Test completato!');
}).catch(error => {
    console.error('❌ Test fallito:', error.message);
    process.exit(1);
});