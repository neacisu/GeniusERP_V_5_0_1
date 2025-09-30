#!/bin/bash

# Collaboration Schema Migration Script
# This script executes the collaboration schema migration using ts-node

# Load environment variables
source .env

echo "Starting collaboration schema migration..."

# Execute the migration script with ts-node
npx ts-node migrate-collaboration.ts

echo "Collaboration schema migration process completed."