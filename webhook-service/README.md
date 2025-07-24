# Webhook Service per Fatture in Cloud

Servizio webhook separato per bypassare le protezioni Vercel.

## Deploy su Railway

1. Vai su [railway.app](https://railway.app)
2. Connetti il tuo GitHub
3. Fai il deploy di questo progetto
4. Configura le variabili d'ambiente

## Variabili d'ambiente necessarie

```
MONGODB_URI=your_mongodb_connection_string
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASSWORD=your_password
EMAIL_TO=recipient@email.com
```

## Endpoint

- `POST /webhook` - Riceve i webhook da Fatture in Cloud