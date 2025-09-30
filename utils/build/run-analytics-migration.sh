#!/bin/bash

# Run Analytics Module Migration Script
# This script runs the analytics module migration to create or update the analytics schema in the database

echo "Running Analytics Module Migration..."
npx tsx run-analytics-migration.ts

# Check if the migration was successful
if [ $? -eq 0 ]; then
  echo "✅ Analytics Module Migration completed successfully!"
else
  echo "❌ Analytics Module Migration failed. Check the logs above for errors."
  exit 1
fi

echo "Analytics Module database schema is now ready to use."