# Romanian Occupational Classification (COR) Seeding Tools

This directory contains the tools and data used for importing the Romanian Occupational Classification (COR) data into the system.

## Directory Structure

- **data/**: Contains source data files
  - `Coduri COR - occupations.csv`: CSV export of COR codes
  - `cor-grupe-ocupationale.xml`: XML file with occupational groups structure
  - `isco-08-lista-cresc-cod-ocupatii-cor-2024.xml`: Complete XML with all occupations

- **sql/**: Contains SQL scripts for direct database import
  - `cor-groups.sql`: SQL for importing occupational groups (major, submajor, minor, subminor)
  - `cor-data.sql`: SQL for importing all 4,247 occupations

- **scripts/**: Contains JavaScript utilities for importing and monitoring
  - `check-cor-import-progress.js`: Monitors import progress
  - `execute-cor-sql.js`: Executes SQL scripts directly against the database
  - `import-cor-from-csv-direct.js`: Imports occupations from CSV
  - `complete-cor-import.js`: Finalizes the import process

## Import Process

The COR data import follows these steps:

1. Import group structure (major, submajor, minor, subminor groups) using `cor-groups.sql`
2. Import occupations using `cor-data.sql` or batch scripts
3. Verify import using the monitoring scripts

## Important Notes

- The full COR database contains 4,247 occupations organized in a hierarchical structure
- All data must comply with the official Romanian COR codes
- Import scripts should be run in the specified order to maintain referential integrity

## Usage

For a complete new import:

```bash
node ./scripts/execute-cor-sql.js ./sql/cor-groups.sql
node ./scripts/execute-cor-sql.js ./sql/cor-data.sql
```

To check import status:

```bash
node ./scripts/check-cor-import-progress.js
```

See `cor-import-documentation.md` for more detailed information.
