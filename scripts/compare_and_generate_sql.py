#!/usr/bin/env python3
"""
Script pentru compararea conturilor din documentație cu DB și generarea SQL pentru inserare
"""

import json
import csv
from typing import Dict, List, Set

def load_accounts_from_doc(filepath: str) -> Dict[str, Dict]:
    """Încarcă conturile din JSON generat de scriptul anterior"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_accounts_from_db(filepath: str) -> Dict[str, Dict]:
    """Încarcă conturile din CSV exportat din DB"""
    accounts = {}
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = row['code'].strip()
            accounts[code] = {
                'code': code,
                'name': row['name'].strip(),
                'account_function': row['account_function'].strip(),
                'group_code': row['group_code'].strip() if row['group_code'] else None
            }
    return accounts

def compare_accounts(doc_accounts: Dict, db_accounts: Dict) -> tuple:
    """Compară conturile și returnează ce lipsește și ce diferă"""
    doc_codes = set(doc_accounts.keys())
    db_codes = set(db_accounts.keys())
    
    missing_in_db = doc_codes - db_codes
    missing_in_doc = db_codes - doc_codes
    common = doc_codes & db_codes
    
    differences = {}
    for code in common:
        doc_acc = doc_accounts[code]
        db_acc = db_accounts[code]
        
        diff = {}
        if doc_acc['name'] != db_acc['name']:
            diff['name'] = {'doc': doc_acc['name'], 'db': db_acc['name']}
        if doc_acc['account_function'] != db_acc['account_function']:
            diff['account_function'] = {'doc': doc_acc['account_function'], 'db': db_acc['account_function']}
        
        if diff:
            differences[code] = diff
    
    return missing_in_db, missing_in_doc, differences

def generate_sql_for_missing(missing_codes: Set, doc_accounts: Dict, group_ids: Dict) -> str:
    """Generează SQL pentru inserarea conturilor lipsă"""
    sql_statements = []
    
    for code in sorted(missing_codes):
        acc = doc_accounts[code]
        group_code = acc['group_code']
        
        if group_code not in group_ids:
            print(f"⚠️  Warning: Grupa {group_code} nu există în DB pentru contul {code}")
            continue
        
        group_id = group_ids[group_code]
        name = acc['name'].replace("'", "''")  # Escape single quotes
        
        sql = f"""INSERT INTO synthetic_accounts (id, code, name, account_function, grade, group_id, created_at, updated_at)
VALUES (gen_random_uuid(), '{code}', '{name}', '{acc['account_function']}', 1, '{group_id}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  account_function = EXCLUDED.account_function,
  grade = EXCLUDED.grade,
  group_id = EXCLUDED.group_id,
  updated_at = CURRENT_TIMESTAMP;"""
        
        sql_statements.append(sql)
    
    return '\n\n'.join(sql_statements)

def get_group_ids() -> Dict[str, str]:
    """Returnează mapping între coduri de grupă și ID-uri UUID (hardcodat pentru acum)"""
    # Ar trebui extras din DB, dar pentru simplitate îl hardcodăm
    return {
        '10': 'UUID_HERE',  # Acestea vor fi completate dinamic
        # ... etc
    }

def main():
    # Încarcă datele
    doc_accounts = load_accounts_from_doc('/tmp/accounts_from_doc.json')
    db_accounts = load_accounts_from_db('/tmp/accounts_from_db.csv')
    
    # Compară
    missing_in_db, missing_in_doc, differences = compare_accounts(doc_accounts, db_accounts)
    
    # Raport
    print("=" * 100)
    print("📊 RAPORT AUDIT PLAN DE CONTURI")
    print("=" * 100)
    print(f"\n✅ Conturi în documentație: {len(doc_accounts)}")
    print(f"✅ Conturi în DB: {len(db_accounts)}")
    
    print(f"\n🔍 ANALIZA DIFERENȚELOR:")
    print(f"\n❌ Conturi LIPSĂ din DB (prezente în documentație): {len(missing_in_db)}")
    if missing_in_db:
        print("\nConturi de adăugat:")
        for code in sorted(missing_in_db):
            acc = doc_accounts[code]
            print(f"  {code} | {acc['name'][:60]:60s} | {acc['account_function']} | Grupa: {acc['group_code']}")
    
    print(f"\n⚠️  Conturi în DB dar NU în documentație: {len(missing_in_doc)}")
    if missing_in_doc:
        print("\nConturi să fie verificate (posibil greșite sau învechite):")
        for code in sorted(missing_in_doc):
            acc = db_accounts[code]
            print(f"  {code} | {acc['name'][:60]:60s} | {acc['account_function']}")
    
    print(f"\n⚠️  Conturi cu DIFERENȚE (nume sau tip): {len(differences)}")
    if differences:
        print("\nDiferențe găsite:")
        for code, diff in sorted(differences.items()):
            print(f"\n  Cont {code}:")
            if 'name' in diff:
                print(f"    Nume DOC: {diff['name']['doc']}")
                print(f"    Nume DB:  {diff['name']['db']}")
            if 'account_function' in diff:
                print(f"    Tip DOC: {diff['account_function']['doc']}")
                print(f"    Tip DB:  {diff['account_function']['db']}")
    
    print("\n" + "=" * 100)
    
    # Salvează lista conturilor lipsă pentru SQL
    if missing_in_db:
        with open('/tmp/missing_accounts.json', 'w', encoding='utf-8') as f:
            missing_data = {code: doc_accounts[code] for code in missing_in_db}
            json.dump(missing_data, f, ensure_ascii=False, indent=2)
        print(f"\n💾 Listă conturi lipsă salvată în: /tmp/missing_accounts.json")
    
    # Salvează diferențele
    if differences:
        with open('/tmp/account_differences.json', 'w', encoding='utf-8') as f:
            json.dump(differences, f, ensure_ascii=False, indent=2)
        print(f"💾 Diferențe salvate în: /tmp/account_differences.json")

if __name__ == '__main__':
    main()
