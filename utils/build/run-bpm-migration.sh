#!/bin/bash

# BPM Schema Migration Script
# This script applies the BPM schema to the database using direct SQL

echo "Starting BPM schema migration..."
node --loader ts-node/esm migrate-bpm-direct.ts

if [ $? -eq 0 ]; then
  echo "BPM schema migration completed successfully!"
else
  echo "BPM schema migration failed!"
  exit 1
fi

echo "Done!"