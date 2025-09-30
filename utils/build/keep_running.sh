#!/bin/bash

STATS_URL="http://localhost:5000/api/hr/cor/stats"
TOKEN=$(node -e "console.log(require('jsonwebtoken').sign({ userId: 'admin-user-id', roles: ['admin', 'hr_admin'], email: 'admin@test.com', companyId: 'system' }, process.env.JWT_SECRET || 'x7k9p2m5q8x7k9p2m5q8', { expiresIn: '1h' }))")

echo "Starting COR import verification..."
echo "Generated token: ${TOKEN:0:10}..."

# Get current stats
current_count=$(curl -s -H "Authorization: Bearer $TOKEN" $STATS_URL | jq -r '.data.occupations')
echo "Current occupation count: $current_count"

# Run import script
echo "Running import script in batches..."
node run-until-complete.js

# Get updated stats
sleep 5
updated_count=$(curl -s -H "Authorization: Bearer $TOKEN" $STATS_URL | jq -r '.data.occupations')
echo "Updated occupation count: $updated_count"
echo "Added occupations: $((updated_count - current_count))"
echo "Import completed!"
