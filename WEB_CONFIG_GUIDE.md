# 🌐 Guida Interfaccia Web per Configurazione Email

## 📋 Come Modificare le Configurazioni Email

### **1. 🔗 Accesso all'Interfaccia**

Dopo il deploy su Vercel, puoi accedere all'interfaccia di configurazione tramite:

```
https://tuo-progetto.vercel.app/email-config.html
```

### **2. ⚙️ Funzionalità Disponibili**

#### **📧 Configurazione Base**
- **Abilita/Disabilita Email**: Checkbox per attivare l'invio automatico
- **Provider Email**: Scegli tra SMTP Generico, Gmail, o SendGrid
- **Email Mittente**: Indirizzo email da cui inviare
- **Nome Mittente**: Nome che apparirà come mittente
- **Oggetto Email**: Template per l'oggetto (supporta variabili)

#### **🔧 Opzioni Avanzate**
- **Allega PDF**: Include il PDF della ricevuta nell'email
- **Bottone Visualizza**: Aggiunge un link per visualizzare online
- **Copia (CC)**: Invia una copia all'indirizzo aziendale
- **Template Personalizzato**: Personalizza il contenuto dell'email

#### **🛠️ Configurazioni Provider**

**SMTP Generico:**
- Host SMTP (es. `smtps.aruba.it`)
- Porta (es. `465` per SSL, `587` per TLS)
- Username e Password
- Connessione sicura (SSL/TLS)

**Gmail:**
- Email Gmail
- App Password (non la password normale!)

**SendGrid:**
- API Key SendGrid

### **3. 💾 Come Salvare le Configurazioni**

1. **Compila i campi** necessari per il tuo provider
2. **Clicca "Salva Configurazione"**
3. **Testa la configurazione** con il bottone "Test"

### **4. 🔄 Sincronizzazione con Vercel**

#### **Importante:**
L'interfaccia web salva le configurazioni localmente, ma per Vercel in produzione devi anche:

1. **Copiare i valori** dall'interfaccia web
2. **Andare su Vercel Dashboard** → Settings → Environment Variables
3. **Aggiungere/Aggiornare** le variabili d'ambiente:

```bash
EMAIL_ENABLED=true
EMAIL_PROVIDER=smtp
SMTP_HOST=smtps.aruba.it
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@nutragenix.it
SMTP_PASSWORD=Ja$$23-lovelife
EMAIL_FROM=info@nutragenix.it
EMAIL_FROM_NAME=NutraGenix Integrazione Innovativa
EMAIL_ATTACH_PDF=true
EMAIL_CC_ENABLED=false
EMAIL_SUBJECT={document_type} {document_number} - NutraGenix
EMAIL_TEMPLATE=Il tuo template personalizzato...
```

### **5. 🧪 Test della Configurazione**

1. **Clicca "Test Configurazione"** nell'interfaccia
2. **Verifica i messaggi** di stato:
   - ✅ Verde = Configurazione OK
   - ❌ Rosso = Errore da correggere
3. **Controlla i dettagli** dell'errore se presente

### **6. 📱 Variabili Disponibili nei Template**

Puoi usare queste variabili nei tuoi template:

- `{customer_name}` - Nome del cliente
- `{document_type}` - Tipo documento (Ricevuta, Fattura)
- `{document_number}` - Numero del documento
- `{amount}` - Importo totale
- `{date}` - Data del documento

### **7. 🔒 Sicurezza**

- **Password non visualizzate**: Per sicurezza, le password non vengono mostrate nell'interfaccia
- **HTTPS**: L'interfaccia funziona solo su connessioni sicure
- **Validazione**: I dati vengono validati prima del salvataggio

### **8. 🚨 Risoluzione Problemi**

#### **"Configurazione email non valida"**
- Verifica che tutti i campi obbligatori siano compilati
- Controlla username/password del provider email
- Assicurati che l'host SMTP sia corretto

#### **"Test configurazione fallito"**
- Verifica la connessione internet
- Controlla le impostazioni del firewall
- Verifica le credenziali del provider email

#### **"Errore di connessione"**
- Ricarica la pagina
- Verifica che il server sia online
- Controlla la console del browser per errori

### **9. 💡 Consigli**

1. **Testa sempre** dopo ogni modifica
2. **Usa App Password** per Gmail (non la password normale)
3. **Mantieni backup** delle configurazioni funzionanti
4. **Monitora i log** di Vercel per errori di invio
5. **Aggiorna le variabili Vercel** dopo ogni modifica importante

### **10. 📞 Supporto**

Se hai problemi:
1. Controlla i log di Vercel
2. Verifica le configurazioni del provider email
3. Testa la connessione SMTP con strumenti esterni
4. Consulta la documentazione del tuo provider email