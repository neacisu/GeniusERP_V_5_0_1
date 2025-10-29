#!/usr/bin/env python3
"""
Extragere COMPLETĂ a arhitecturii Drizzle Schema
Output: DZ_architecture.json cu TOATE informațiile din schema Drizzle
- Toate tabelele din toate fișierele
- Toate coloanele (tip Drizzle, nullable, default, constraints)
- Toate enum-urile
- Toți indexurile
- Toate constrângerile
- Toate relațiile
"""

import json
import re
from pathlib import Path
from collections import defaultdict

def extract_enums_from_file(file_path):
    """Extrage enum-uri din fișier"""
    enums = {}
    
    try:
        with open(file_path) as f:
            content = f.read()
        
        # Pattern: export const enum_name = pgEnum('enum_name', ['val1', 'val2'])
        pattern = r"export const (\w+) = pgEnum\('(\w+)',\s*\[(.*?)\]"
        
        for match in re.finditer(pattern, content, re.DOTALL):
            var_name = match.group(1)
            enum_name = match.group(2)
            values_str = match.group(3)
            
            # Parse values
            values = re.findall(r"'([^']+)'", values_str)
            
            enums[enum_name] = {
                'variable_name': var_name,
                'values': values,
                'count': len(values)
            }
    
    except Exception as e:
        print(f"⚠️  Eroare enum extraction {file_path}: {e}")
    
    return enums

def extract_table_from_block(var_name, table_name, block, file_name):
    """Extrage detalii tabel din blocul pgTable"""
    
    table_info = {
        'variable_name': var_name,
        'table_name': table_name,
        'source_file': file_name,
        'columns': [],
        'indexes': [],
        'unique_constraints': [],
        'foreign_keys': []
    }
    
    # Împarte blocul în două părți: coloane și constraints
    # Găsește unde încep constraints (după }, (table) => ({)
    parts = block.split('}, (table) => ({')
    
    columns_block = parts[0] if parts else block
    constraints_block = parts[1] if len(parts) > 1 else ''
    
    # Extrage coloane
    for line in columns_block.split('\n'):
        line = line.strip()
        
        # Skip comentarii și linii goale
        if not line or line.startswith('//') or line.startswith('/*'):
            continue
        
        # Pattern: variableName: type("column_name", options)
        match = re.match(r'(\w+):\s+(\w+)\(["\']([^"\']+)["\']([^,]*)', line)
        if match:
            var_col_name = match.group(1)
            drizzle_type = match.group(2)
            db_col_name = match.group(3)
            options = match.group(4)
            
            # Detectează modifiers
            is_primary = 'primaryKey()' in line or 'primaryKey' in line
            is_not_null = '.notNull()' in line
            has_default = '.default(' in line or '.defaultNow()' in line or '.defaultRandom()' in line
            is_unique = '.unique()' in line
            has_references = '.references(' in line
            
            # Extrage default value
            default_val = None
            if '.default(' in line:
                default_match = re.search(r"\.default\(([^)]+)\)", line)
                if default_match:
                    default_val = default_match.group(1)
            elif '.defaultNow()' in line:
                default_val = 'now()'
            elif '.defaultRandom()' in line or 'gen_random_uuid()' in line:
                default_val = 'gen_random_uuid()'
            
            # Extrage opțiuni (precision, scale, length)
            precision = None
            scale = None
            length = None
            
            if 'precision:' in options:
                prec_match = re.search(r'precision:\s*(\d+)', options)
                if prec_match:
                    precision = int(prec_match.group(1))
            
            if 'scale:' in options:
                scale_match = re.search(r'scale:\s*(\d+)', options)
                if scale_match:
                    scale = int(scale_match.group(1))
            
            if 'length:' in options:
                len_match = re.search(r'length:\s*(\d+)', options)
                if len_match:
                    length = int(len_match.group(1))
            
            table_info['columns'].append({
                'variable_name': var_col_name,
                'column_name': db_col_name,
                'drizzle_type': drizzle_type,
                'is_primary_key': is_primary,
                'is_not_null': is_not_null,
                'is_unique': is_unique,
                'has_foreign_key': has_references,
                'default_value': default_val,
                'precision': precision,
                'scale': scale,
                'length': length
            })
    
    # Extrage indexes din constraints block
    if constraints_block:
        # Pattern: indexName: index('index_name').on(...)
        for line in constraints_block.split('\n'):
            if 'index(' in line:
                idx_match = re.search(r"(\w+):\s+index\('([^']+)'\)", line)
                if idx_match:
                    table_info['indexes'].append({
                        'variable_name': idx_match.group(1),
                        'index_name': idx_match.group(2)
                    })
            
            # Pattern: uniqueName: unique('constraint_name').on(...)
            if 'unique(' in line:
                uniq_match = re.search(r"(\w+):\s+unique\('([^']+)'\)", line)
                if uniq_match:
                    table_info['unique_constraints'].append({
                        'variable_name': uniq_match.group(1),
                        'constraint_name': uniq_match.group(2)
                    })
            
            # Pattern: pk: primaryKey({ columns: [...] })
            if 'primaryKey(' in line:
                table_info['primary_key_composite'] = True
    
    return table_info

def extract_tables_from_file(file_path):
    """Extrage toate tabelele dintr-un fișier schema"""
    tables = []
    
    try:
        with open(file_path) as f:
            content = f.read()
        
        # Pattern: export const VAR_NAME = pgTable('table_name', { ... })
        # Folosim regex non-greedy pentru a prinde fiecare tabel individual
        pattern = r"export const (\w+)(?::\s*any)?\s*=\s*pgTable\(['\"]([^'\"]+)['\"]\s*,\s*\{(.*?)\}(?:\s*,\s*\(table\)\s*=>\s*\(\{(.*?)\}\))?\s*\);"
        
        matches = list(re.finditer(pattern, content, re.DOTALL))
        
        for match in matches:
            var_name = match.group(1)
            table_name = match.group(2)
            columns_block = match.group(3)
            constraints_block = match.group(4) if match.group(4) else ''
            
            full_block = columns_block
            if constraints_block:
                full_block += '\n}, (table) => ({\n' + constraints_block
            
            table_info = extract_table_from_block(var_name, table_name, full_block, file_path.name)
            tables.append(table_info)
    
    except Exception as e:
        print(f"⚠️  Eroare extragere tabele din {file_path.name}: {e}")
    
    return tables

def extract_relations_from_file(file_path):
    """Extrage relații Drizzle din fișier"""
    relations = {}
    
    try:
        with open(file_path) as f:
            content = f.read()
        
        # Pattern: export const tableRelations = relations(table, ({ one, many }) => ({ ... }))
        pattern = r"export const (\w+)Relations = relations\((\w+),.*?\(\{(.*?)\}\)\);"
        
        for match in re.finditer(pattern, content, re.DOTALL):
            var_name = match.group(1)
            table_var = match.group(2)
            relations_block = match.group(3)
            
            # Extrage relații one și many
            one_relations = re.findall(r"(\w+):\s*one\((\w+),", relations_block)
            many_relations = re.findall(r"(\w+):\s*many\((\w+)", relations_block)
            
            relations[table_var] = {
                'one_to_one': [{'name': r[0], 'references': r[1]} for r in one_relations],
                'one_to_many': [{'name': r[0], 'references': r[1]} for r in many_relations]
            }
    
    except Exception as e:
        print(f"⚠️  Eroare extragere relații din {file_path.name}: {e}")
    
    return relations

# ============================================================================
# MAIN
# ============================================================================

def main():
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║  EXTRAGERE COMPLETĂ DRIZZLE SCHEMA → JSON                  ║")
    print("╚══════════════════════════════════════════════════════════════╝")
    print()
    
    schema_dir = Path('/var/www/GeniusERP/libs/shared/src/schema')
    
    architecture = {
        'extracted_at': None,
        'source': 'Drizzle ORM Schema',
        'statistics': {},
        'enums': {},
        'tables': {},
        'relations': {},
        'files': []
    }
    
    # Procesează toate fișierele
    schema_files = list(schema_dir.glob('*.ts')) + list(schema_dir.glob('*.schema.ts'))
    schema_files = [f for f in schema_files if f.name != 'index.ts']
    
    print(f"📁 Găsite {len(schema_files)} fișiere schema")
    print()
    
    all_tables = []
    all_enums = {}
    all_relations = {}
    
    for file_path in sorted(schema_files):
        print(f"   📄 {file_path.name}...", end='')
        
        # Extrage enum-uri
        if file_path.name == 'enums.ts':
            file_enums = extract_enums_from_file(file_path)
            all_enums.update(file_enums)
            print(f" {len(file_enums)} enums")
            continue
        
        # Extrage tabele
        tables = extract_tables_from_file(file_path)
        
        # Extrage relații
        relations = extract_relations_from_file(file_path)
        all_relations.update(relations)
        
        if tables:
            all_tables.extend(tables)
            print(f" {len(tables)} tabele, {len(relations)} relații")
            architecture['files'].append({
                'name': file_path.name,
                'tables_count': len(tables),
                'relations_count': len(relations)
            })
        else:
            print()
    
    # Organizează în dicționar
    for table in all_tables:
        architecture['tables'][table['table_name']] = table
    
    architecture['enums'] = all_enums
    architecture['relations'] = all_relations
    
    # Statistici
    architecture['statistics'] = {
        'total_files': len(architecture['files']),
        'total_tables': len(architecture['tables']),
        'total_columns': sum(len(t['columns']) for t in architecture['tables'].values()),
        'total_enums': len(architecture['enums']),
        'total_enum_values': sum(len(e['values']) for e in architecture['enums'].values()),
        'total_indexes': sum(len(t['indexes']) for t in architecture['tables'].values()),
        'total_unique_constraints': sum(len(t['unique_constraints']) for t in architecture['tables'].values()),
        'total_relations': len(architecture['relations'])
    }
    
    # Timestamp
    import datetime
    architecture['extracted_at'] = datetime.datetime.now().isoformat()
    
    # Salvare
    print()
    print("💾 Salvare DZ_architecture.json...")
    
    output_file = '/var/www/GeniusERP/docs/audit/DZ_architecture.json'
    with open(output_file, 'w') as f:
        json.dump(architecture, f, indent=2, ensure_ascii=False)
    
    output_compact = '/var/www/GeniusERP/docs/audit/DZ_architecture_compact.json'
    with open(output_compact, 'w') as f:
        json.dump(architecture, f, ensure_ascii=False)
    
    print()
    print("="*70)
    print("✅ EXTRAGERE DRIZZLE COMPLETĂ FINALIZATĂ!")
    print("="*70)
    print()
    print(f"📊 STATISTICI:")
    print(f"   Fișiere schema: {architecture['statistics']['total_files']}")
    print(f"   Tabele: {architecture['statistics']['total_tables']}")
    print(f"   Coloane: {architecture['statistics']['total_columns']}")
    print(f"   Enum-uri: {architecture['statistics']['total_enums']}")
    print(f"   Valori enum: {architecture['statistics']['total_enum_values']}")
    print(f"   Indexuri: {architecture['statistics']['total_indexes']}")
    print(f"   Unique Constraints: {architecture['statistics']['total_unique_constraints']}")
    print(f"   Relații definite: {architecture['statistics']['total_relations']}")
    print()
    print(f"📁 Fișiere generate:")
    print(f"   {output_file}")
    print(f"   {output_compact} (compact)")
    print()
    print("🎯 Folosire:")
    print("   cat docs/audit/DZ_architecture.json | jq '.tables.users'")
    print("   cat docs/audit/DZ_architecture.json | jq '.enums'")
    print("   cat docs/audit/DZ_architecture.json | jq '.statistics'")
    print()
    
    return architecture

if __name__ == "__main__":
    arch = main()

