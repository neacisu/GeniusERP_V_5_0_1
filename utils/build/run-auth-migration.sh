#!/bin/bash

# Authentication Standardization Migration Script
# This script runs the auth migration and test process in order

# Terminal colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Create a backup of the original modules
echo -e "${YELLOW}Creating backup of current server modules...${NC}"
mkdir -p ./backup
cp -r ./server/modules ./backup/
echo -e "${GREEN}Backup created at ./backup/modules${NC}"

# Step 2: Run the migration script
echo -e "${YELLOW}Running authentication standardization migration...${NC}"
node auth-standardization.js
if [ $? -ne 0 ]; then
  echo -e "${RED}Migration failed. Check auth-standardization.js output for details.${NC}"
  exit 1
fi
echo -e "${GREEN}Migration completed successfully${NC}"

# Step 3: Start server in the background for testing (use the established workflow)
echo -e "${YELLOW}Starting server for testing...${NC}"
echo "NOTICE: Please start the server manually using the 'Start application' workflow"
echo "Press Enter after the server has started..."
read

# Step 4: Run the authentication tests
echo -e "${YELLOW}Running authentication tests...${NC}"
node test-auth-endpoints.js
TEST_RESULT=$?

# Step 5: Summarize results
if [ $TEST_RESULT -eq 0 ]; then
  echo -e "${GREEN}====================================${NC}"
  echo -e "${GREEN}Authentication migration successful!${NC}"
  echo -e "${GREEN}Testing completed successfully${NC}"
  echo -e "${GREEN}====================================${NC}"
  echo "See auth-test-results.json for complete test results"
  echo "See auth-migration-report.json for migration details"
else
  echo -e "${RED}====================================${NC}"
  echo -e "${RED}Authentication tests failed${NC}"
  echo -e "${RED}====================================${NC}"
  echo "Check auth-test-results.json for details"
fi

exit $TEST_RESULT
