#!/usr/bin/env python3
"""
Script pentru auditarea și sincronizarea planului de conturi din documentație cu DB
"""

import re
import json
from typing import Dict, List, Tuple

def parse_account_function(tip: str) -> str:
    """Convertește tipul de cont din documentație în funcția contului"""
    tip = tip.strip()
    if tip == 'A':
        return 'A'  # Activ
    elif tip == 'P':
        return 'P'  # Pasiv
    elif tip in ('A/P', '(A/P)'):
        return 'B'  # Bifuncțional
    elif tip == 'X':
        return 'X'  # Extrabilanțier
    else:
        return 'B'  # Default la Bifuncțional pentru cazuri necunoscute

def extract_accounts_from_doc(filepath: str) -> Dict[str, Dict]:
    """Extrage conturile sintetice de grad 1 din documentație"""
    accounts = {}
    
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    current_group = None
    
    for line in lines:
        line = line.strip()
        
        if not line:
            continue
        
        # Detectează grupele (2 cifre exact, urmate de punct și spațiu)
        group_match = re.match(r'^(\d{2})\.\s+(.+)$', line)
        if group_match and line.find('.') == 2:  # Asigură că punctul e după 2 cifre
            current_group = group_match.group(1)
            continue
        
        # Detectează conturile grad 1 (3 cifre exact, urmate de punct și spațiu)
        # Pattern strict: "XXX. Denumire" sau "XXX. Denumire (Tip)"
        account_match = re.match(r'^(\d{3})\.\s+([^(]+?)(?:\s*\(([APX](?:/[APX])?)\))?\s*$', line)
        
        if account_match and line.find('.') == 3:  # Asigură că punctul e după 3 cifre
            code = account_match.group(1)
            name = account_match.group(2).strip()
            tip = account_match.group(3)
            
            # Determină tipul contului
            if tip:
                account_function = parse_account_function(tip)
            else:
                # Pentru conturi fără tip specificat explicit, determină pe bază de clasă
                first_digit = code[0]
                if first_digit == '1':
                    account_function = 'P'  # Clasa 1 - Pasiv (capitaluri)
                elif first_digit == '2':
                    account_function = 'A'  # Clasa 2 - Activ (imobilizări)
                elif first_digit == '3':
                    account_function = 'A'  # Clasa 3 - Activ (stocuri)
                elif first_digit == '4':
                    account_function = 'B'  # Clasa 4 - Bifuncțional (terți)
                elif first_digit == '5':
                    account_function = 'A'  # Clasa 5 - Activ (trezorerie)
                elif first_digit == '6':
                    account_function = 'A'  # Clasa 6 - Cheltuieli (debit)
                elif first_digit == '7':
                    account_function = 'P'  # Clasa 7 - Venituri (credit)
                elif first_digit == '8':
                    account_function = 'X'  # Clasa 8 - Extrabilanțier
                elif first_digit == '9':
                    account_function = 'B'  # Clasa 9 - Gestiune
                else:
                    account_function = 'B'
            
            accounts[code] = {
                'code': code,
                'name': name,
                'account_function': account_function,
                'group_code': code[:2] if current_group else None
            }
    
    return accounts

def main():
    # Extrage conturile din documentație
    doc_path = '/Volumes/Storage/Data/Proiecte/GeniusERP/GeniusERP_V_5/attached_assets/accounting/Planul de conturi 2025.md'
    accounts_from_doc = extract_accounts_from_doc(doc_path)
    
    # Salvează rezultatul
    output_path = '/tmp/accounts_from_doc.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(accounts_from_doc, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Extrase {len(accounts_from_doc)} conturi din documentație")
    print(f"📁 Salvat în: {output_path}")
    
    # Afișează primele 30 pentru verificare
    print("\n📋 Primele 30 conturi extrase:")
    print("-" * 90)
    print(f"{'Cod':4s} | {'Denumire':55s} | {'Tip':3s} | {'Grupa':5s}")
    print("-" * 90)
    for i, (code, acc) in enumerate(sorted(accounts_from_doc.items())[:30]):
        print(f"{acc['code']:4s} | {acc['name']:55s} | {acc['account_function']:3s} | {acc['group_code']:5s}")
    
    print("\n" + "=" * 90)
    print(f"TOTAL: {len(accounts_from_doc)} conturi de grad 1 găsite în documentație")
    
    # Statistici pe clase
    print("\n📊 Distribuție pe clase:")
    by_class = {}
    for code, acc in accounts_from_doc.items():
        class_code = code[0]
        by_class[class_code] = by_class.get(class_code, 0) + 1
    
    for class_code in sorted(by_class.keys()):
        print(f"  Clasa {class_code}: {by_class[class_code]} conturi")

if __name__ == '__main__':
    main()