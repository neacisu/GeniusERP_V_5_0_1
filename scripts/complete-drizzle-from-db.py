#!/usr/bin/env python3
"""
COMPLETARE DRIZZLE din DB
Compară DB_architecture.json cu DZ_architecture.json
și generează cod pentru a completa ce lipsește
"""

import json
import re

# Încarcă arhitecturi
with open('/var/www/GeniusERP/docs/audit/DB_architecture.json') as f:
    db_arch = json.load(f)

with open('/var/www/GeniusERP/docs/audit/DZ_architecture.json') as f:
    dz_arch = json.load(f)

print("╔══════════════════════════════════════════════════════════════╗")
print("║  COMPLETARE DRIZZLE CU INFORMAȚII LIPSĂ DIN DB            ║")
print("╚══════════════════════════════════════════════════════════════╝")
print()

# =======================================================================
# 1. TABELE LIPSĂ
# =======================================================================

db_tables = set(db_arch['tables'].keys())
dz_tables = set(dz_arch['tables'].keys())

missing_tables = db_tables - dz_tables

print(f"1️⃣  Tabele lipsă din Drizzle: {len(missing_tables)}")
if missing_tables:
    for t in sorted(missing_tables):
        print(f"   - {t}")
print()

# =======================================================================
# 2. COLOANE LIPSĂ (pentru tabele comune)
# =======================================================================

common_tables = db_tables & dz_tables

print(f"2️⃣  Verificare coloane pentru {len(common_tables)} tabele comune...")

tables_with_missing_cols = {}
total_missing_cols = 0

for table in sorted(common_tables):
    db_cols = {col['name'] for col in db_arch['tables'][table]['columns']}
    
    # Extrage coloane din Drizzle (din columns list)
    dz_cols = set()
    if table in dz_arch['tables'] and 'columns' in dz_arch['tables'][table]:
        dz_cols = {col['column_name'] for col in dz_arch['tables'][table]['columns']}
    
    missing = db_cols - dz_cols
    
    if missing:
        tables_with_missing_cols[table] = {
            'missing_columns': sorted(list(missing)),
            'missing_count': len(missing),
            'db_columns': db_arch['tables'][table]['columns']
        }
        total_missing_cols += len(missing)

print(f"   Tabele cu coloane lipsă: {len(tables_with_missing_cols)}")
print(f"   Total coloane lipsă: {total_missing_cols}")
print()

# Top 10 tabele cu cele mai multe coloane lipsă
if tables_with_missing_cols:
    print("   Top 10 tabele cu cele mai multe coloane lipsă:")
    top10 = sorted(tables_with_missing_cols.items(), key=lambda x: x[1]['missing_count'], reverse=True)[:10]
    for table, info in top10:
        print(f"   - {table}: {info['missing_count']} coloane")
    print()

# =======================================================================
# 3. GENERARE COD PENTRU COMPLETARE
# =======================================================================

print("3️⃣  Generare cod Drizzle pentru completare...")

def map_db_type_to_drizzle(col):
    """Mapare tip DB → Drizzle"""
    udt = col['udt_name']
    dt = col['data_type']
    
    if udt == 'uuid':
        return f"uuid('{col['name']}')"
    elif udt == 'text':
        return f"text('{col['name']}')"
    elif udt == 'bool':
        return f"boolean('{col['name']}')"
    elif udt in ['int4', 'integer', 'int2', 'smallint']:
        return f"integer('{col['name']}')"
    elif udt == 'timestamptz':
        return f"timestamp('{col['name']}', {{ withTimezone: true }})"
    elif udt == 'timestamp':
        return f"timestamp('{col['name']}')"
    elif udt == 'date':
        return f"date('{col['name']}')"
    elif udt in ['numeric', 'decimal']:
        if col['numeric_precision'] and col['numeric_scale']:
            return f"numeric('{col['name']}', {{ precision: {col['numeric_precision']}, scale: {col['numeric_scale']} }})"
        return f"numeric('{col['name']}')"
    elif udt == 'varchar':
        if col['char_max_length']:
            return f"varchar('{col['name']}', {{ length: {col['char_max_length']} }})"
        return f"varchar('{col['name']}')"
    elif udt in ['json', 'jsonb']:
        return f"jsonb('{col['name']}')"
    else:
        return f"text('{col['name']}')"

# Generează cod pentru primele 5 tabele cu cele mai multe lipsuri
output_file = '/var/www/GeniusERP/docs/audit/MISSING_COLUMNS_CODE.txt'

with open(output_file, 'w') as f:
    f.write("// COD GENERAT AUTOMAT PENTRU COMPLETARE DRIZZLE\n")
    f.write("// Adaugă aceste coloane în fișierele respective\n\n")
    
    top5 = sorted(tables_with_missing_cols.items(), key=lambda x: x[1]['missing_count'], reverse=True)[:5]
    
    for table, info in top5:
        f.write(f"\n{'='*70}\n")
        f.write(f"// TABEL: {table} - {info['missing_count']} coloane lipsă\n")
        f.write(f"// Fișier: {dz_arch['tables'].get(table, {}).get('source_file', 'NECUNOSCUT')}\n")
        f.write(f"{'='*70}\n\n")
        
        # Găsește coloanele complete din DB
        missing_col_names = set(info['missing_columns'])
        db_columns = db_arch['tables'][table]['columns']
        
        for db_col in db_columns:
            if db_col['name'] in missing_col_names:
                # Generează linie Drizzle
                drizzle_def = map_db_type_to_drizzle(db_col)
                
                # Adaugă modifiers
                modifiers = []
                if not db_col['is_nullable']:
                    modifiers.append('.notNull()')
                
                if db_col['column_default']:
                    default = db_col['column_default']
                    if 'gen_random_uuid' in default:
                        modifiers.append('.default(sql`gen_random_uuid()`)')
                    elif 'now()' in default or 'CURRENT_TIMESTAMP' in default:
                        modifiers.append('.defaultNow()')
                    elif default.replace("'", "").replace("::", " ").split()[0].isdigit():
                        clean_default = default.split('::')[0].strip("'")
                        modifiers.append(f".default('{clean_default}')")
                    elif default in ['true', 'false']:
                        modifiers.append(f".default({default})")
                
                modifier_str = ''.join(modifiers)
                nullable_comment = 'NOT NULL' if not db_col['is_nullable'] else 'nullable'
                comment = f"  // {nullable_comment}"
                
                col_name_safe = db_col['name'].replace('-', '_')
                f.write(f"  {col_name_safe}: {drizzle_def}{modifier_str},{comment}\n")

print(f"   ✅ Cod generat în: {output_file}")
print()

# =======================================================================
# 4. INDEXURI LIPSĂ
# =======================================================================

print("4️⃣  Indexuri lipsă...")

db_indexes_total = db_arch['statistics']['total_indexes']
dz_indexes_total = dz_arch['statistics']['total_indexes']
missing_indexes = db_indexes_total - dz_indexes_total

print(f"   DB indexuri: {db_indexes_total}")
print(f"   Drizzle indexuri: {dz_indexes_total}")
print(f"   Lipsă: {missing_indexes}")
print()

# =======================================================================
# REZUMAT
# =======================================================================

print("="*70)
print("📊 REZUMAT LIPSURI:")
print(f"   Tabele lipsă: {len(missing_tables)}")
print(f"   Coloane lipsă: {total_missing_cols}")
print(f"   Indexuri lipsă: {missing_indexes}")
print()
print(f"📁 COD GENERAT:")
print(f"   {output_file}")
print()
print("🎯 ACȚIUNE:")
print("   Review și aplică cod generat în fișierele schema respective")
print("="*70)

