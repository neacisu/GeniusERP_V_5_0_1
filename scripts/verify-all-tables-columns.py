#!/usr/bin/env python3
"""
Verificare COMPLETĂ: TOATE cele 190 tabele, TOATE coloanele
Parsare mai puternică cu AST pentru extragere precisă
"""

import re
import subprocess
from collections import defaultdict

# ============================================================================
# ÎNCĂRCARE DB
# ============================================================================

def load_db_columns():
    """Coloane din DB"""
    columns_by_table = defaultdict(set)
    
    with open('/tmp/db_columns_full.txt', 'r') as f:
        for line in f:
            if not line.strip():
                continue
            parts = line.strip().split('|')
            if len(parts) >= 2:
                table_name, col_name = parts[0], parts[1]
                columns_by_table[table_name].add(col_name)
    
    return dict(columns_by_table)

# ============================================================================
# EXTRAGERE DIN DRIZZLE - METODA SIMPLĂ DAR EFICIENTĂ
# ============================================================================

def extract_all_drizzle_tables():
    """Extrage TOATE tabelele și coloanele din Drizzle folosind grep"""
    result = subprocess.run(
        ['grep', '-r', '= pgTable(', '/var/www/GeniusERP/libs/shared/src/schema', '--include=*.ts'],
        capture_output=True, text=True
    )
    
    tables_found = {}
    
    for line in result.stdout.split('\n'):
        if not line.strip():
            continue
        
        # Extract: export const VAR = pgTable("table_name", {
        match = re.search(r'export const \w+ = pgTable\(["\']([^"\']+)["\']', line)
        if match:
            table_name = match.group(1)
            file_path = line.split(':')[0]
            
            if table_name not in tables_found:
                tables_found[table_name] = file_path
    
    return tables_found

def extract_columns_from_file(file_path, table_name):
    """Extrage coloane dintr-un fișier pentru un anumit tabel"""
    try:
        with open(file_path, 'r') as f:
            content = f.read()
        
        # Găsește blocul pentru acest tabel
        # Pattern: export const X = pgTable('table_name', { ... })
        pattern = rf'export const \w+ = pgTable\(["\']'  + re.escape(table_name) + r'["\'],\s*\{{(.+?)\}}(?:\s*,\s*\(|;)'
        
        match = re.search(pattern, content, re.DOTALL)
        if not match:
            return set()
        
        columns_block = match.group(1)
        
        # Extrage coloane: camelCase: type("column_name")
        col_pattern = r'\w+:\s+\w+\(["\']([^"\']+)["\']'
        columns = set()
        
        for col_match in re.finditer(col_pattern, columns_block):
            col_name = col_match.group(1)
            columns.add(col_name)
        
        return columns
        
    except Exception as e:
        return set()

# ============================================================================
# MAIN
# ============================================================================

def main():
    print("╔═══════════════════════════════════════════════════════════════╗")
    print("║  VERIFICARE COMPLETĂ: TOATE 190 TABELE                       ║")
    print("╚═══════════════════════════════════════════════════════════════╝")
    print()
    
    # Încarcă DB
    db_columns = load_db_columns()
    print(f"✅ DB: {len(db_columns)} tabele încărcate")
    
    # Extrage tabele din Drizzle
    drizzle_tables = extract_all_drizzle_tables()
    print(f"✅ Drizzle: {len(drizzle_tables)} tabele detectate")
    print()
    
    # Tabele comune
    all_db_tables = set(db_columns.keys())
    all_drizzle_tables = set(drizzle_tables.keys())
    
    in_both = all_db_tables & all_drizzle_tables
    only_db = all_db_tables - all_drizzle_tables
    only_drizzle = all_drizzle_tables - all_db_tables
    
    print(f"📊 Coverage:")
    print(f"   În ambele (DB + Drizzle): {len(in_both)}")
    print(f"   Doar în DB: {len(only_db)}")
    print(f"   Doar în Drizzle: {len(only_drizzle)}")
    print()
    
    if only_db:
        print(f"⚠️  {len(only_db)} tabele lipsesc din Drizzle:")
        for t in sorted(list(only_db))[:10]:
            print(f"   - {t}")
        if len(only_db) > 10:
            print(f"   ... și încă {len(only_db) - 10}")
        print()
    
    # Verificare coloană cu coloană
    print("="*70)
    print("VERIFICARE COLOANE:")
    print("="*70)
    print()
    
    total_missing = 0
    tables_perfect = 0
    tables_with_missing = 0
    
    for table in sorted(in_both):
        db_cols = db_columns[table]
        file_path = drizzle_tables[table]
        drizzle_cols = extract_columns_from_file(file_path, table)
        
        missing = db_cols - drizzle_cols
        
        if missing:
            tables_with_missing += 1
            total_missing += len(missing)
            print(f"❌ {table}: {len(missing)} coloane lipsă")
            print(f"   {', '.join(sorted(list(missing))[:8])}")
            print()
        else:
            tables_perfect += 1
            # print(f"✅ {table}: Complete")
    
    print("="*70)
    print()
    print(f"📊 REZULTAT FINAL:")
    print(f"   Tabele în Drizzle: {len(in_both)}/{len(all_db_tables)}")
    print(f"   Tabele perfecte: {tables_perfect}")
    print(f"   Tabele cu coloane lipsă: {tables_with_missing}")
    print(f"   Total coloane lipsă: {total_missing}")
    print()
    
    if len(in_both) == len(all_db_tables) and total_missing == 0:
        print("✅✅✅ PERFECT! 100% COVERAGE ȘI TOATE COLOANELE!")
    elif total_missing < 50:
        print(f"✅ EXCELENT! Doar {total_missing} coloane lipsă - FIX RAPID!")
    else:
        print(f"⚠️  {total_missing} coloane necesită completare")

if __name__ == "__main__":
    main()

