// Load environment variables from .env file
require('dotenv').config();

module.exports = {
  apps: [
    {
      name: 'GeniusERP',
      script: 'dist/index.js',
      env: {
        // Application settings
        NODE_ENV: process.env.NODE_ENV || 'production',
        
        // Database configuration (uses local PostgreSQL)
        DATABASE_URL: process.env.DATABASE_URL,
        PGDATABASE: process.env.PGDATABASE,
        PGUSER: process.env.PGUSER,
        PGPASSWORD: process.env.PGPASSWORD,
        PGHOST: process.env.PGHOST,
        PGPORT: process.env.PGPORT,
        
        // JWT & Authentication
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
        SESSION_SECRET: process.env.SESSION_SECRET,
        
        // Redis Cloud configuration
        REDIS_HOST: process.env.REDIS_HOST,
        REDIS_PORT: process.env.REDIS_PORT,
        REDIS_PASSWORD: process.env.REDIS_PASSWORD,
        REDIS_USERNAME: process.env.REDIS_USERNAME,
        REDIS_URL: process.env.REDIS_URL,
        
        // OpenAI configuration
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        OPENAI_ORGANIZATION: process.env.OPENAI_ORGANIZATION,
        OPENAI_DEFAULT_MODEL: process.env.OPENAI_DEFAULT_MODEL,
        
        // ANAF API
        ANAF_API_URL: process.env.ANAF_API_URL,
        ANAF_API_VERSION: process.env.ANAF_API_VERSION,
        
        // Email/SMTP
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASS: process.env.SMTP_PASS,
        EMAIL_FROM: process.env.EMAIL_FROM,
        
        // Stripe
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY
      }
    }
  ]
}
