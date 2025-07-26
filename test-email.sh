#!/bin/bash

echo "📧 TEST EMAIL - Invio email di test"
echo "=================================="

# URL del tuo deployment Vercel
VERCEL_URL="https://nutra-backup.vercel.app"

echo "📤 Invio email di test a gabriprb@me.com..."

# Test email
curl -X POST "${VERCEL_URL}/api/test-email" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "gabriprb@me.com"
  }'

echo ""
echo "✅ Test email completato!"
echo "📧 Controlla la tua casella email (anche spam/junk)"