#!/usr/bin/env python3
"""
IMPLEMENTARE: Adaugă TOATE coloanele lipsă în schema Drizzle
"""
import json
from pathlib import Path

# Mapare tipuri DB → Drizzle
def map_type(col):
    udt = col.get('udt_name', col['data_type'])
    dt = col['data_type']
    
    if udt == 'uuid': return 'uuid'
    elif udt == 'text': return 'text'
    elif udt == 'bool': return 'boolean'
    elif udt in ['int4', 'integer']: return 'integer'
    elif udt == 'timestamptz': return 'timestamp_tz'
    elif udt == 'timestamp': return 'timestamp'
    elif udt == 'date': return 'date'
    elif udt == 'numeric': return 'numeric'
    elif udt == 'varchar': return 'varchar'
    elif udt in ['json', 'jsonb']: return 'jsonb'
    return 'text'

with open('docs/audit/missing-columns-detailed.json') as f:
    data = json.load(f)

# Generează cod pentru fiecare tabel
for table, info in sorted(data['details'].items(), key=lambda x: x[1]['missing_count'], reverse=True)[:5]:
    print(f"\n// {table} - {info['missing_count']} coloane lipsă")
    print(f"// Fișier: {info['file']}")
    for col in info['missing_with_types']:
        dtype = map_type(col)
        nullable = '' if not col['is_nullable'] else '  // nullable'
        print(f"  {col['name']}: {dtype}('{col['name']}'),{nullable}")
