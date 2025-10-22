# COR Occupations Import Process Documentation

This document outlines the process for importing the Romanian Classification of Occupations (COR) data into the system.

## Overview

The Romanian Classification of Occupations (COR) is a hierarchical structure of occupations used in Romania. The structure consists of:

- Major Groups (1 digit code)
- Submajor Groups (2 digit code)
- Minor Groups (3 digit code)
- Subminor Groups (4 digit code)
- Occupations (6 digit code)

The system needs this data to properly categorize employees and their job titles according to Romanian standards.

## Data Source

The primary source of data is the Excel file `Coduri COR - occupations.xlsx` containing official occupation codes and names. This file has been converted to CSV format to facilitate processing. The resulting file `Coduri COR - occupations.csv` contains 4,247 occupation entries.

## Database Schema

The database schema supports the hierarchical structure with the following tables:

- `cor_major_groups`: Top-level groups (9 entries)
- `cor_submajor_groups`: Second-level groups (39 entries)
- `cor_minor_groups`: Third-level groups (121 entries)
- `cor_subminor_groups`: Fourth-level groups (396 entries)
- `cor_occupations`: Individual occupations (4,247 entries)

Each table includes appropriate foreign key relationships to maintain the hierarchy.

## Import Options

Several import methods have been implemented, providing flexibility based on the specific needs:

### 1. SQL-Based Import (Most Direct)

The most efficient approach for a fresh import is using pre-generated SQL files:

1. First run `node extract-cor-csv.js` to create SQL files from the CSV.
2. Then run `node execute-cor-sql.js` to execute the SQL files in order.

This approach:
- Generates separate SQL files for group hierarchies and batches of 100 occupations
- Executes the SQL directly in the database
- Handles data conflicts with ON CONFLICT clauses

### 2. API-Based Import

For environments where direct database access is limited:

1. Run `node import-cor-from-csv.js` to import occupations through the API.

This approach:
- Uses the API endpoints to import data
- Processes occupations in batches of 100
- Handles authentication through JWT tokens
- Provides detailed progress updates

### 3. Direct Database Import

For environments with direct database access but not SQL execution rights:

1. Run `node import-cor-from-csv-direct.js` to import directly to the database.

This approach:
- Connects directly to the database using the connection string
- Processes occupations in batches
- Ensures parent groups exist before adding occupations
- Records audit trails

### 4. Continuous Import Process

For handling large imports that might time out:

1. Run `node direct-batch-import.js` to import occupations through the API with state tracking.
2. If needed, run `node complete-cor-import.js` to automatically execute the import script repeatedly until completion.

## Monitoring Progress

To monitor the import progress:

1. Run `node check-cor-import-progress.js` to see real-time import statistics.
2. Run `node cor-import-status.js` to generate a comprehensive status report.

## Verification

After import, verify the data:

1. Use the API endpoint `/api/hr/cor/stats` to get current counts.
2. Check that all levels of the hierarchy are properly populated.
3. Verify random sample of occupations using the search endpoint.

## Common Issues and Solutions

1. **Authentication Failures**: The import scripts use a simplified JWT token for testing. In production, you may need to update the `generateAdminToken()` function to use proper JWT signing.

2. **Database Timeouts**: If the database times out during import, the batched approaches with resume capability should be used.

3. **Duplicate Entries**: The import scripts handle duplicates using ON CONFLICT clauses in SQL mode or by checking existing entries in API mode.

4. **Missing Parent Groups**: All scripts ensure parent groups exist before inserting occupations, maintaining hierarchy integrity.

## Performance Considerations

- The SQL-based import is the fastest method (typically 5-10 seconds).
- API-based imports are slower due to HTTP overhead and may take 1-2 minutes.
- Direct database imports are faster than API but slower than SQL (typically 30-60 seconds).
- All approaches use batching to prevent memory issues with large datasets.

## Conclusion

The provided scripts offer multiple approaches to importing COR occupation data, suitable for different environments and access levels. Choose the approach that best fits your specific deployment scenario.

For regular maintenance, the SQL extraction method is recommended, as it provides the cleanest, fastest import while preserving data integrity across the hierarchy.