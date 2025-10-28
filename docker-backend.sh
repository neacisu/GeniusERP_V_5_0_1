#!/bin/bash

# Script pentru pornire DOAR backend GeniusERP
# Pornește backend API + PostgreSQL pe porturi 5001 și 5433

echo "🚀 Pornire GeniusERP Backend (Express API + PostgreSQL)..."
echo "Backend API: 5001"
echo "PostgreSQL: 5433"
echo ""

docker-compose up backend postgres


