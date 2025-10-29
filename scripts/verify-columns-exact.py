#!/usr/bin/env python3
"""
Verificare EXACTĂ coloană cu coloană între DB și Drizzle Schema
Compară în paralel fiecare tabel și fiecare coloană
"""

import re
from pathlib import Path
from collections import defaultdict

# ============================================================================
# ÎNCĂRCARE COLOANE DIN DB
# ============================================================================

def load_db_columns():
    """Încarcă TOATE coloanele din PostgreSQL DB"""
    columns_by_table = defaultdict(list)
    
    with open('/tmp/db_columns_full.txt', 'r') as f:
        for line in f:
            if not line.strip():
                continue
            
            parts = line.strip().split('|')
            if len(parts) >= 10:
                table_name = parts[0]
                columns_by_table[table_name].append(parts[1])  # nume coloană
    
    return {k: set(v) for k, v in columns_by_table.items()}

# ============================================================================
# EXTRAGERE COLOANE DIN DRIZZLE
# ============================================================================

def extract_columns_from_drizzle_file(file_path):
    """Extrage coloanele din fișier Drizzle"""
    columns_by_table = defaultdict(set)
    
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Găsește toate defininițiile pgTable
        table_pattern = r'export const (\w+) = pgTable\(["\']([^"\']+)["\'],\s*\{([^}]+(?:\}[^}]*)*)\}'
        
        for match in re.finditer(table_pattern, content, re.DOTALL):
            var_name = match.group(1)
            table_name = match.group(2)
            columns_block = match.group(3)
            
            # Extrage coloanele din bloc
            # Pattern: variableName: type("column_name")
            col_pattern = r'\w+:\s+\w+\(["\']([^"\']+)["\']'
            columns = set()
            
            for col_match in re.finditer(col_pattern, columns_block):
                col_name = col_match.group(1)
                columns.add(col_name)
            
            columns_by_table[table_name] = columns
    
    except Exception as e:
        print(f"⚠️  Eroare citire {file_path}: {e}")
    
    return columns_by_table

# ============================================================================
# MAPARE FIȘIERE → TABELE
# ============================================================================

SCHEMA_FILES = {
    'core.schema.ts': [],  # Auto-detect
    'inventory.schema.ts': [],
    'invoicing.schema.ts': [],
    'purchasing.schema.ts': [],
    'transfer.schema.ts': [],
    'settings-extended.schema.ts': [],
    'documents-extended.schema.ts': [],
    'crm.schema.ts': [],
    'hr.schema.ts': [],
    'accounting.schema.ts': [],
    'analytics.schema.ts': [],
    'ecommerce.schema.ts': [],
    'collaboration.schema.ts': [],
    'communications.schema.ts': [],
    'bpm.schema.ts': [],
    'predictive.schema.ts': [],
    'inventory-assessment.ts': [],
    'marketing.schema.ts': [],
    'financial-data.schema.ts': [],
    'documents.schema.ts': [],
    'cor.schema.ts': [],
    'bank-journal.schema.ts': [],
    'cash-register.schema.ts': [],
    'accounting-settings.schema.ts': [],
    'account-mappings.schema.ts': [],
    'admin.schema.ts': [],
    'audit.schema.ts': [],
    'company.schema.ts': [],
    'document-counters.schema.ts': [],
    'invoice.schema.ts': [],
    'invoice-numbering.schema.ts': [],
    'integrations.schema.ts': [],
    'settings.schema.ts': [],
    'warehouse.ts': [],
}

# ============================================================================
# MAIN
# ============================================================================

def main():
    print("╔══════════════════════════════════════════════════════════════════════════╗")
    print("║  VERIFICARE EXACTĂ: COLOANĂ cu COLOANĂ, TABEL cu TABEL                  ║")
    print("╚══════════════════════════════════════════════════════════════════════════╝")
    print()
    
    # Încarcă DB
    db_columns = load_db_columns()
    print(f"✅ DB: {len(db_columns)} tabele, {sum(len(cols) for cols in db_columns.values())} coloane")
    
    # Procesează toate fișierele Drizzle
    schema_dir = Path('/var/www/GeniusERP/libs/shared/src/schema')
    all_drizzle_columns = {}
    
    for schema_file in SCHEMA_FILES.keys():
        file_path = schema_dir / schema_file
        if file_path.exists():
            file_columns = extract_columns_from_drizzle_file(file_path)
            all_drizzle_columns.update(file_columns)
    
    print(f"✅ Drizzle: {len(all_drizzle_columns)} tabele detectate")
    print()
    print("="*80)
    print()
    
    # Comparație TABEL cu TABEL
    all_db_tables = set(db_columns.keys())
    all_drizzle_tables = set(all_drizzle_columns.keys())
    
    tables_in_both = all_db_tables & all_drizzle_tables
    
    total_missing_columns = 0
    tables_with_issues = 0
    
    for table in sorted(tables_in_both):
        db_cols = db_columns[table]
        drizzle_cols = all_drizzle_columns[table]
        
        missing = db_cols - drizzle_cols
        extra = drizzle_cols - db_cols
        
        if missing or extra:
            tables_with_issues += 1
            total_missing_columns += len(missing)
            
            print(f"📋 {table}")
            print(f"   DB: {len(db_cols)} coloane | Drizzle: {len(drizzle_cols)} coloane")
            
            if missing:
                print(f"   ❌ LIPSĂ din Drizzle ({len(missing)}): {', '.join(sorted(list(missing))[:5])}{'...' if len(missing) > 5 else ''}")
            
            if extra:
                print(f"   ➕ EXTRA în Drizzle ({len(extra)}): {', '.join(sorted(list(extra))[:5])}{'...' if len(extra) > 5 else ''}")
            
            print()
    
    # Rezumat
    print("="*80)
    print()
    print(f"📊 REZUMAT:")
    print(f"   Tabele verificate: {len(tables_in_both)}")
    print(f"   Tabele cu probleme: {tables_with_issues}")
    print(f"   Tabele perfecte: {len(tables_in_both) - tables_with_issues}")
    print(f"   Total coloane lipsă: {total_missing_columns}")
    print()
    
    if tables_with_issues == 0:
        print("✅ PERFECT! Toate tabelele au TOATE coloanele!")
    else:
        print(f"⚠️  {tables_with_issues} tabele necesită completare")
    
    print()

if __name__ == "__main__":
    main()

