#!/bin/bash

echo "Starting Romanian Accounting Schema Migration and Test"
echo "===================================================="

# Run the migration script
echo "Running migration script..."
npx tsx create-accounting-migration.ts

# Wait a moment for database operations to complete
sleep 2

# Run the test script
echo "Running test script..."
npx tsx test-accounting-schema.ts

echo "===================================================="
echo "Accounting schema migration and test completed!"