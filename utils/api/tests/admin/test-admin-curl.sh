#!/bin/bash

# Admin API curl test script
# This script tests the admin API endpoints using curl directly,
# which may bypass some middleware issues

# Configuration
HOST="localhost"
PORT="5000"
API_PATH="/api"
TOKEN_FILE="$(dirname "$0")/admin-token.txt"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Read admin token
if [ -f "$TOKEN_FILE" ]; then
  TOKEN=$(cat "$TOKEN_FILE")
  echo -e "${GREEN}Admin token loaded from $TOKEN_FILE${NC}"
else
  echo -e "${YELLOW}Warning: admin-token.txt not found${NC}"
  TOKEN=""
fi

# Test IDs
COMPANY_ID="test-company-$(date +%s)"
FRANCHISE_ID="test-franchise-$(date +%s)"

echo -e "Testing Admin API endpoints using curl..."
echo -e "API URL: http://$HOST:$PORT$API_PATH"
echo -e "Token available: ${TOKEN:0:20}..."
echo -e "Test Company ID: $COMPANY_ID"
echo -e "Test Franchise ID: $FRANCHISE_ID"

# 1. Test recording setup steps
echo -e "\n${YELLOW}1. Testing POST /admin/setup/steps/:companyId endpoint...${NC}"

for STEP_NAME in "company_created" "users_configured" "accounting_setup" "warehouse_setup"; do
  STATUS=""
  case "$STEP_NAME" in
    "company_created"|"users_configured") STATUS="completed" ;;
    "accounting_setup") STATUS="in_progress" ;;
    "warehouse_setup") STATUS="not_started" ;;
  esac
  
  echo -e "Recording step '$STEP_NAME' with status '$STATUS'..."
  
  response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"step\":\"$STEP_NAME\",\"status\":\"$STATUS\",\"franchiseId\":\"$FRANCHISE_ID\"}" \
    "http://$HOST:$PORT$API_PATH/admin/setup/steps/$COMPANY_ID")
  
  # Check if response is HTML or JSON
  if [[ "$response" == *"<!DOCTYPE html>"* ]]; then
    echo -e "${RED}Received HTML response instead of JSON${NC}"
  else
    echo -e "${GREEN}Response: $response${NC}"
  fi
done

# 2. Test retrieving all setup steps
echo -e "\n${YELLOW}2. Testing GET /admin/setup/steps/:companyId endpoint...${NC}"

response=$(curl -s -X GET \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  "http://$HOST:$PORT$API_PATH/admin/setup/steps/$COMPANY_ID?franchiseId=$FRANCHISE_ID")

# Check if response is HTML or JSON
if [[ "$response" == *"<!DOCTYPE html>"* ]]; then
  echo -e "${RED}Received HTML response instead of JSON${NC}"
else
  echo -e "${GREEN}Response: $response${NC}"
fi

# 3. Test checking step completion
echo -e "\n${YELLOW}3. Testing GET /admin/setup/completed/:companyId/:step endpoint...${NC}"

for STEP_NAME in "company_created" "accounting_setup" "nonexistent_step"; do
  echo -e "Checking completion status for step '$STEP_NAME'..."
  
  response=$(curl -s -X GET \
    -H "Accept: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    "http://$HOST:$PORT$API_PATH/admin/setup/completed/$COMPANY_ID/$STEP_NAME?franchiseId=$FRANCHISE_ID")
  
  # Check if response is HTML or JSON
  if [[ "$response" == *"<!DOCTYPE html>"* ]]; then
    echo -e "${RED}Received HTML response instead of JSON${NC}"
  else
    echo -e "${GREEN}Response: $response${NC}"
  fi
done

# 4. Test getting setup progress
echo -e "\n${YELLOW}4. Testing GET /admin/setup/progress/:companyId endpoint...${NC}"

response=$(curl -s -X GET \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  "http://$HOST:$PORT$API_PATH/admin/setup/progress/$COMPANY_ID?franchiseId=$FRANCHISE_ID")

# Check if response is HTML or JSON
if [[ "$response" == *"<!DOCTYPE html>"* ]]; then
  echo -e "${RED}Received HTML response instead of JSON${NC}"
else
  echo -e "${GREEN}Response: $response${NC}"
fi

echo -e "\n${GREEN}Admin API curl tests completed${NC}"