#!/usr/bin/env python3
"""
Script pentru adăugarea automată a tabelelor lipsă în fișierele schema existente
"""

import json
import re

# Încarcă raportul cu tabele lipsă
with open('/var/www/GeniusERP/docs/audit/missing-tables-structure.json', 'r') as f:
    missing_data = json.load(f)

# Încarcă coloanele din DB
columns_by_table = {}
with open('/tmp/db_columns_full.txt', 'r') as f:
    for line in f:
        if not line.strip():
            continue
        parts = line.strip().split('|')
        if len(parts) >= 10:
            table_name = parts[0]
            if table_name not in columns_by_table:
                columns_by_table[table_name] = []
            columns_by_table[table_name].append({
                'name': parts[1],
                'data_type': parts[3],
                'char_max_length': parts[4],
                'numeric_precision': parts[5],
                'numeric_scale': parts[6],
                'is_nullable': parts[7] == 'YES',
                'column_default': parts[8],
                'udt_name': parts[9]
            })

def map_pg_type_to_drizzle(col):
    """Mapează tipurile PostgreSQL la Drizzle ORM"""
    data_type = col['data_type']
    udt = col['udt_name']
    
    if udt == 'uuid':
        return f"uuid('{col['name']}')"
    elif udt == 'text':
        return f"text('{col['name']}')"
    elif udt == 'bool':
        return f"boolean('{col['name']}')"
    elif udt in ['int4', 'integer']:
        return f"integer('{col['name']}')"
    elif udt in ['timestamptz']:
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
        # Unknown type - use text as fallback
        return f"text('{col['name']}')"

def generate_table_definition(table_name, columns):
    """Generează definiția completă a tabelului pentru Drizzle"""
    lines = []
    lines.append(f"export const {table_name} = pgTable('{table_name}', {{")
    
    for col in columns:
        col_name_camel = re.sub(r'_([a-z])', lambda m: m.group(1).upper(), col['name'])
        drizzle_type = map_pg_type_to_drizzle(col)
        
        modifiers = []
        if not col['is_nullable']:
            modifiers.append('.notNull()')
        
        if col['column_default']:
            default_val = col['column_default']
            if 'gen_random_uuid' in default_val:
                modifiers.append('.default(sql`gen_random_uuid()`)')
            elif 'now()' in default_val or 'CURRENT_TIMESTAMP' in default_val:
                if 'withTimezone' in drizzle_type:
                    modifiers.append('.defaultNow()')
                else:
                    modifiers.append('.default(sql`now()`)')
            elif default_val not in ['', 'NULL']:
                # Încearcă să parseze default-ul
                if default_val.isdigit():
                    modifiers.append(f'.default({default_val})')
                elif default_val == 'true' or default_val == 'false':
                    modifiers.append(f'.default({default_val})')
                elif default_val.startswith("'") and default_val.endswith("'"):
                    val = default_val[1:-1].split("::")[0]
                    modifiers.append(f".default('{val}')")
        
        modifier_str = ''.join(modifiers)
        lines.append(f"  {col_name_camel}: {drizzle_type}{modifier_str},")
    
    lines.append("});")
    return '\n'.join(lines)

print("Script pentru adăugare tabele - pregătit pentru execuție manuală")
print("Tabelele vor fi adăugate în următoarele fișiere:")
print("- ecommerce.schema.ts: 4 tabele Shopify")
print("- hr.schema.ts: 6 tabele")  
print("- analytics.schema.ts: 3 tabele")
print("- accounting.schema.ts: 5 tabele")
print("\nRulează manual pentru fiecare tabel specific.")

