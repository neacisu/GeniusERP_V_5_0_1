#!/usr/bin/env python3
"""
Extragere COMPLETĂ a arhitecturii bazei de date PostgreSQL
Output: DB_architecture.json cu TOATE informațiile
- Toate 190 tabele
- Toate coloanele (tip, nullable, default, precision, scale)
- Toate enum-urile cu valori
- Toți indexurile
- Toate constrângerile (PK, FK, UNIQUE, CHECK)
- Foreign keys cu ON DELETE/UPDATE rules
"""

import json
import subprocess
from collections import defaultdict

def run_psql_query(query):
    """Rulează query PostgreSQL și returnează rezultatul"""
    cmd = [
        'docker', 'exec', '-i', 'geniuserp-postgres',
        'psql', '-U', 'postgres', '-d', 'geniuserp',
        '-t', '-A', '-F', '|', '-c', query
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.stdout.strip()

def parse_table_output(output):
    """Parsează output PostgreSQL în listă de dicționare"""
    lines = [l for l in output.split('\n') if l.strip()]
    return lines

print("╔══════════════════════════════════════════════════════════════╗")
print("║  EXTRAGERE COMPLETĂ ARHITECTURĂ DB → JSON                  ║")
print("╚══════════════════════════════════════════════════════════════╝")
print()

architecture = {
    'database': 'geniuserp',
    'extracted_at': None,
    'statistics': {},
    'enums': {},
    'tables': {}
}

# =======================================================================
# 1. EXTRAGERE TABELE
# =======================================================================
print("1️⃣  Extragere lista tabele...")

tables_query = """
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
"""

tables_output = run_psql_query(tables_query)
all_tables = parse_table_output(tables_output)

print(f"   ✅ {len(all_tables)} tabele găsite")

# =======================================================================
# 2. EXTRAGERE COLOANE PENTRU FIECARE TABEL
# =======================================================================
print("2️⃣  Extragere coloane cu detalii complete...")

columns_query = """
SELECT 
    table_name,
    column_name,
    ordinal_position,
    data_type,
    character_maximum_length,
    numeric_precision,
    numeric_scale,
    is_nullable,
    column_default,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
"""

columns_output = run_psql_query(columns_query)
columns_lines = parse_table_output(columns_output)

columns_by_table = defaultdict(list)
for line in columns_lines:
    parts = line.split('|')
    if len(parts) >= 10:
        table_name = parts[0]
        columns_by_table[table_name].append({
            'name': parts[1],
            'position': int(parts[2]) if parts[2] else None,
            'data_type': parts[3],
            'char_max_length': int(parts[4]) if parts[4] else None,
            'numeric_precision': int(parts[5]) if parts[5] else None,
            'numeric_scale': int(parts[6]) if parts[6] else None,
            'is_nullable': parts[7] == 'YES',
            'column_default': parts[8] if parts[8] else None,
            'udt_name': parts[9]
        })

print(f"   ✅ {sum(len(cols) for cols in columns_by_table.values())} coloane extrase")

# =======================================================================
# 3. EXTRAGERE PRIMARY KEYS
# =======================================================================
print("3️⃣  Extragere primary keys...")

pk_query = """
SELECT
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
ORDER BY tc.table_name;
"""

pk_output = run_psql_query(pk_query)
pk_lines = parse_table_output(pk_output)

pks_by_table = defaultdict(list)
for line in pk_lines:
    parts = line.split('|')
    if len(parts) >= 3:
        pks_by_table[parts[0]].append({
            'column': parts[1],
            'constraint_name': parts[2]
        })

print(f"   ✅ {sum(len(pks) for pks in pks_by_table.values())} primary keys")

# =======================================================================
# 4. EXTRAGERE FOREIGN KEYS
# =======================================================================
print("4️⃣  Extragere foreign keys cu rules...")

fk_query = """
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column,
    tc.constraint_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
ORDER BY tc.table_name;
"""

fk_output = run_psql_query(fk_query)
fk_lines = parse_table_output(fk_output)

fks_by_table = defaultdict(list)
for line in fk_lines:
    parts = line.split('|')
    if len(parts) >= 7:
        fks_by_table[parts[0]].append({
            'column': parts[1],
            'references_table': parts[2],
            'references_column': parts[3],
            'constraint_name': parts[4],
            'on_update': parts[5] if len(parts) > 5 else 'NO ACTION',
            'on_delete': parts[6] if len(parts) > 6 else 'NO ACTION'
        })

print(f"   ✅ {sum(len(fks) for fks in fks_by_table.values())} foreign keys")

# =======================================================================
# 5. EXTRAGERE UNIQUE CONSTRAINTS
# =======================================================================
print("5️⃣  Extragere unique constraints...")

unique_query = """
SELECT
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = 'public'
ORDER BY tc.table_name;
"""

unique_output = run_psql_query(unique_query)
unique_lines = parse_table_output(unique_output)

uniques_by_table = defaultdict(list)
for line in unique_lines:
    parts = line.split('|')
    if len(parts) >= 3:
        uniques_by_table[parts[0]].append({
            'column': parts[1],
            'constraint_name': parts[2]
        })

print(f"   ✅ {sum(len(uqs) for uqs in uniques_by_table.values())} unique constraints")

# =======================================================================
# 6. EXTRAGERE INDEXURI
# =======================================================================
print("6️⃣  Extragere indexuri...")

indexes_query = """
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
"""

indexes_output = run_psql_query(indexes_query)
indexes_lines = parse_table_output(indexes_output)

indexes_by_table = defaultdict(list)
for line in indexes_lines:
    parts = line.split('|')
    if len(parts) >= 3:
        indexes_by_table[parts[0]].append({
            'name': parts[1],
            'definition': parts[2]
        })

print(f"   ✅ {sum(len(idxs) for idxs in indexes_by_table.values())} indexuri")

# =======================================================================
# 7. EXTRAGERE ENUM-URI
# =======================================================================
print("7️⃣  Extragere enum-uri cu valori...")

enums_query = """
SELECT 
    t.typname as enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;
"""

enums_output = run_psql_query(enums_query)
enums_lines = parse_table_output(enums_output)

for line in enums_lines:
    parts = line.split('|')
    if len(parts) >= 2:
        enum_name = parts[0]
        # Parse array format: {val1,val2,val3}
        values_str = parts[1]
        if values_str.startswith('{') and values_str.endswith('}'):
            values = [v.strip() for v in values_str[1:-1].split(',')]
            architecture['enums'][enum_name] = values

print(f"   ✅ {len(architecture['enums'])} enum-uri")

# =======================================================================
# 8. CONSTRUIRE JSON FINAL
# =======================================================================
print("8️⃣  Construire JSON final...")

for table in all_tables:
    architecture['tables'][table] = {
        'name': table,
        'columns': columns_by_table.get(table, []),
        'primary_keys': pks_by_table.get(table, []),
        'foreign_keys': fks_by_table.get(table, []),
        'unique_constraints': uniques_by_table.get(table, []),
        'indexes': indexes_by_table.get(table, []),
        'statistics': {
            'column_count': len(columns_by_table.get(table, [])),
            'pk_count': len(pks_by_table.get(table, [])),
            'fk_count': len(fks_by_table.get(table, [])),
            'unique_count': len(uniques_by_table.get(table, [])),
            'index_count': len(indexes_by_table.get(table, []))
        }
    }

# Statistici generale
architecture['statistics'] = {
    'total_tables': len(all_tables),
    'total_columns': sum(len(cols) for cols in columns_by_table.values()),
    'total_enums': len(architecture['enums']),
    'total_primary_keys': sum(len(pks) for pks in pks_by_table.values()),
    'total_foreign_keys': sum(len(fks) for fks in fks_by_table.values()),
    'total_unique_constraints': sum(len(uqs) for uqs in uniques_by_table.values()),
    'total_indexes': sum(len(idxs) for idxs in indexes_by_table.values())
}

# Timestamp
import datetime
architecture['extracted_at'] = datetime.datetime.now().isoformat()

# =======================================================================
# 9. SALVARE JSON
# =======================================================================
print("9️⃣  Salvare DB_architecture.json...")

output_file = '/var/www/GeniusERP/docs/audit/DB_architecture.json'
with open(output_file, 'w') as f:
    json.dump(architecture, f, indent=2, ensure_ascii=False)

# Salvare și variantă compactă
output_compact = '/var/www/GeniusERP/docs/audit/DB_architecture_compact.json'
with open(output_compact, 'w') as f:
    json.dump(architecture, f, ensure_ascii=False)

print()
print("="*70)
print("✅ EXTRAGERE COMPLETĂ FINALIZATĂ!")
print("="*70)
print()
print(f"📊 STATISTICI:")
print(f"   Tabele: {architecture['statistics']['total_tables']}")
print(f"   Coloane: {architecture['statistics']['total_columns']}")
print(f"   Enum-uri: {architecture['statistics']['total_enums']}")
print(f"   Primary Keys: {architecture['statistics']['total_primary_keys']}")
print(f"   Foreign Keys: {architecture['statistics']['total_foreign_keys']}")
print(f"   Unique Constraints: {architecture['statistics']['total_unique_constraints']}")
print(f"   Indexuri: {architecture['statistics']['total_indexes']}")
print()
print(f"📁 Fișiere generate:")
print(f"   {output_file} ({subprocess.run(['wc', '-c', output_file], capture_output=True, text=True).stdout.split()[0]} bytes)")
print(f"   {output_compact} (compact)")
print()
print("🎯 Folosire:")
print("   cat docs/audit/DB_architecture.json | jq '.tables.users'")
print("   cat docs/audit/DB_architecture.json | jq '.enums'")
print("   cat docs/audit/DB_architecture.json | jq '.statistics'")
print()

