#!/bin/bash

echo "🔧 MongoDB Password Update Script"
echo "================================="
echo ""

# Check if new password is provided
if [ -z "$1" ]; then
    echo "❌ Usage: ./update-mongo-password.sh <new_password>"
    echo "Example: ./update-mongo-password.sh myNewPassword123"
    exit 1
fi

NEW_PASSWORD="$1"
echo "📝 New password: $NEW_PASSWORD"

# Update .env.prod file
echo "🔄 Updating .env.prod file..."
sed -i.bak "s/gabrieledellacroce:[^@]*@/gabrieledellacroce:$NEW_PASSWORD@/" .env.prod

if [ $? -eq 0 ]; then
    echo "✅ .env.prod updated successfully"
else
    echo "❌ Failed to update .env.prod"
    exit 1
fi

# Test the connection
echo "🧪 Testing MongoDB connection..."
node test-mongo.js

if [ $? -eq 0 ]; then
    echo "✅ MongoDB connection test passed!"
    
    # Update Vercel environment variable
    echo "🚀 Updating Vercel environment variable..."
    NEW_URI="mongodb+srv://USERNAME:$NEW_PASSWORD@cluster0.XXXXX.mongodb.net/DATABASE?retryWrites=true&w=majority&appName=Cluster0"
    
    # Remove old variable
    vercel env rm MONGODB_URI production --yes
    
    # Add new variable
    echo "$NEW_URI" | vercel env add MONGODB_URI production
    
    if [ $? -eq 0 ]; then
        echo "✅ Vercel environment variable updated!"
        echo "🚀 Deploying to production..."
        vercel --prod
        echo "✅ Deployment complete!"
    else
        echo "❌ Failed to update Vercel environment variable"
        exit 1
    fi
else
    echo "❌ MongoDB connection test failed. Please check the password."
    exit 1
fi

echo ""
echo "🎉 All done! The MongoDB password has been updated everywhere."
echo "🔗 You can now test the authorization URL again."