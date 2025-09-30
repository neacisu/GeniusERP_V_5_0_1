#!/bin/bash

# Collaboration Schema Migration Script using Drizzle ORM
# This script executes the collaboration schema migration 
# using Drizzle ORM's push method

# Load environment variables
source .env

echo "Starting collaboration schema migration with Drizzle ORM..."

# Execute the direct push script with ts-node
npx ts-node push-collaboration-schema.ts

# If specified, run the Drizzle kit push command
if [ "$1" == "--drizzle-kit" ]; then
  echo "Running drizzle-kit push:pg command..."
  npx drizzle-kit push:pg --schema=./shared/schema
fi

echo "Collaboration schema migration process completed."