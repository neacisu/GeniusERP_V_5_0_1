#!/usr/bin/env python3
"""
Verificare METODICĂ și CORECTĂ pentru TOATE 190 tabele
Parsare CORECTĂ a fișierelor Python AST-like
"""

import re
import sys

# Încarcă DB
def load_db():
    db = {}
    with open('/tmp/db_columns_full.txt') as f:
        for line in f:
            if '|' not in line:
                continue
            parts = line.strip().split('|')
            if len(parts) >= 2:
                table, col = parts[0], parts[1]
                if table not in db:
                    db[table] = []
                db[table].append(col)
    return db

# Extrage coloane dintr-un bloc pgTable
def extract_columns_from_block(block):
    """Extrage DOAR coloanele, NU indexurile"""
    columns = []
    
    # Împarte în linii
    lines = block.split('\n')
    depth = 0
    
    for line in lines:
        # Skip comentarii
        if line.strip().startswith('//') or line.strip().startswith('/*'):
            continue
        
        # Detectează nivel parante pentru a evita indexurile
        depth += line.count('(') - line.count(')')
        
        # Dacă depth > 1, suntem în funcții nested (indexuri)
        if depth > 1:
            continue
        
        # Pattern pentru coloană: "  variableName: type("
        if re.match(r'\s+\w+:\s+\w+\(', line):
            # Extrage numele coloanei din ghilimele
            match = re.search(r"['\"](\w+)['\"]", line)
            if match:
                columns.append(match.group(1))
    
    return columns

# Găsește tabel în fișiere
def find_table_in_files(table_name, schema_dir='/var/www/GeniusERP/libs/shared/src/schema'):
    """Caută tabel în toate fișierele schema"""
    import subprocess
    
    result = subprocess.run(
        ['grep', '-l', f'= pgTable("{table_name}"', schema_dir, '-r', '--include=*.ts'],
        capture_output=True, text=True
    )
    
    files = result.stdout.strip().split('\n')
    
    # Încearcă și cu ghilimele simple
    if not files or not files[0]:
        result = subprocess.run(
            ['grep', '-l', f"= pgTable('{table_name}'", schema_dir, '-r', '--include=*.ts'],
            capture_output=True, text=True
        )
        files = result.stdout.strip().split('\n')
    
    return files[0] if files and files[0] else None

# Main
def main():
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║  VERIFICARE METODICĂ: TOATE 190 TABELE                      ║")
    print("╚══════════════════════════════════════════════════════════════╝")
    print()
    
    db = load_db()
    all_tables = sorted(db.keys())
    
    print(f"Total tabele în DB: {len(all_tables)}")
    print()
    print("Verificare tabel cu tabel...")
    print("="*70)
    
    found_in_drizzle = 0
    not_found = 0
    perfect = 0
    with_issues = 0
    total_missing = 0
    
    for i, table in enumerate(all_tables, 1):
        db_cols = set(db[table])
        
        # Găsește fișierul
        file_path = find_table_in_files(table)
        
        if not file_path:
            not_found += 1
            print(f"{i}. ❌ {table}: NU găsit în Drizzle")
            continue
        
        found_in_drizzle += 1
        
        # Extrage coloane din fișier
        try:
            with open(file_path) as f:
                content = f.read()
            
            # Găsește blocul pgTable pentru acest tabel
            pattern = rf'export const \w+ = pgTable\(["\']' + re.escape(table) + r'["\'],\s*\{{(.+?)\}}\s*(?:,\s*\(|\);)'
            match = re.search(pattern, content, re.DOTALL)
            
            if not match:
                print(f"{i}. ⚠️  {table}: Găsit dar nu pot parsa blocul")
                continue
            
            block = match.group(1)
            drizzle_cols = set(extract_columns_from_block(block))
            
            missing = db_cols - drizzle_cols
            
            if missing:
                with_issues += 1
                total_missing += len(missing)
                print(f"{i}. ❌ {table}: {len(missing)} lipsă din {len(db_cols)}")
                print(f"     Lipsă: {', '.join(sorted(list(missing))[:5])}")
            else:
                perfect += 1
                if i % 20 == 0:  # Print la fiecare 20
                    print(f"{i}. ✅ {table}: PERFECT ({len(db_cols)} coloane)")
        
        except Exception as e:
            print(f"{i}. ⚠️  {table}: Eroare parsare - {e}")
    
    print()
    print("="*70)
    print()
    print(f"📊 REZULTAT FINAL:")
    print(f"   Tabele în DB: {len(all_tables)}")
    print(f"   Găsite în Drizzle: {found_in_drizzle}")
    print(f"   NU găsite: {not_found}")
    print(f"   Perfecte (toate coloanele): {perfect}")
    print(f"   Cu coloane lipsă: {with_issues}")
    print(f"   Total coloane lipsă: {total_missing}")
    print()
    
    coverage = (found_in_drizzle / len(all_tables)) * 100 if all_tables else 0
    completeness = (perfect / found_in_drizzle * 100) if found_in_drizzle else 0
    
    print(f"Coverage tabele: {coverage:.1f}%")
    print(f"Completitudine: {completeness:.1f}%")

if __name__ == "__main__":
    main()

