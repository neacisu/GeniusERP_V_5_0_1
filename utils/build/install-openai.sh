#!/bin/bash

# OpenAI SDK Installation Script
# 
# This script installs the OpenAI SDK and required dependencies for the AI module
# Run this script once ready to activate the OpenAI integration

# Set working directory
cd "$(dirname "$0")"

echo "🤖 Installing OpenAI SDK and dependencies..."

# Install the OpenAI SDK
npm install openai --save

# Install any additional dependencies needed for the AI module
npm install dotenv --save
npm install uuid --save

# Check if installation was successful
if [ $? -eq 0 ]; then
  echo "✅ OpenAI SDK and dependencies installed successfully!"
  echo "🚀 You can now use the OpenAI integration in the AI module"
  echo ""
  echo "⚠️ Important: Make sure to set the following environment variables:"
  echo "   - OPENAI_API_KEY: Your OpenAI API key"
  echo "   - OPENAI_ORGANIZATION (optional): Your OpenAI organization ID"
  echo ""
  echo "🔑 You can set these variables in your .env file or in your deployment environment"
else
  echo "❌ Error: Failed to install OpenAI SDK and dependencies"
  echo "Please check your internet connection and try again"
fi

# Display next steps
echo ""
echo "📝 Next steps:"
echo "1. Set your OpenAI API key in the .env file"
echo "2. Restart the application after setting environment variables"
echo "3. Test the OpenAI integration at /api/ai/openai/status"
echo ""