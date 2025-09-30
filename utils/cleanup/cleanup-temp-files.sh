#!/bin/bash
# Cleanup script for temporary and placeholder files

echo "Starting cleanup of temporary and placeholder files..."

# Count files before cleanup
INITIAL_COUNT=$(find . -type f \( -name "*.tmp*" -o -name "*temp*" -o -name "*placeholder*" \) | grep -v "node_modules\|utils\|template" | wc -l)
echo "Found $INITIAL_COUNT temporary/placeholder files to clean up"

# List files to be removed
echo "The following files will be removed:"
find . -type f \( -name "*.tmp*" -o -name "*placeholder*" \) | grep -v "node_modules\|utils\|template" | sort

# Confirm before proceeding
read -p "Continue with removal? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cleanup aborted"
    exit 1
fi

# Remove temporary files
echo "Removing temporary and placeholder files..."
find . -type f \( -name "*.tmp*" -o -name "*placeholder*" \) | grep -v "node_modules\|utils\|template" | xargs rm -f

# Count remaining files
REMAINING_COUNT=$(find . -type f \( -name "*.tmp*" -o -name "*temp*" -o -name "*placeholder*" \) | grep -v "node_modules\|utils\|template" | wc -l)
echo "Cleanup complete. $((INITIAL_COUNT - REMAINING_COUNT)) files removed."

echo "Done!"