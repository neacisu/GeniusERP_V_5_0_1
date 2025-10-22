#!/usr/bin/env python3
"""
ESLint Errors & Warnings Collector pentru GeniusERP v5
=======================================================
Script automat care rulează eslint pe backend și frontend,
colectează toate erorile ȘI warnings și le trimite către Loki pentru monitorizare în Grafana.

Rulare: cron job la fiecare 15 minute
Output: JSON logs către stdout → Promtail → Loki → Grafana
"""

import subprocess
import json
import sys
import os
from datetime import datetime

# Configurare paths
PROJECT_ROOT = os.getenv('PROJECT_ROOT', '/app')
BACKEND_PATH = f"{PROJECT_ROOT}/server"
FRONTEND_PATH = f"{PROJECT_ROOT}/client"

def run_eslint_check(target_path: str, target_name: str) -> dict:
    """
    Rulează eslint pentru a verifica erorile și warnings.
    
    Args:
        target_path: Path către directorul de verificat
        target_name: Nume target (backend/frontend)
    
    Returns:
        Dict cu rezultate: {
            'target': str,
            'total_errors': int,
            'total_warnings': int,
            'issues': [{'file': str, 'line': int, 'column': int, 'severity': str, 'message': str, 'rule': str}]
        }
    """
    print(f"🔍 Verificare ESLint pentru {target_name}...", file=sys.stderr)
    
    try:
        # Rulează eslint cu output JSON
        result = subprocess.run(
            ['npx', 'eslint', target_path, '--format', 'json', '--ext', '.ts,.tsx,.js,.jsx'],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            timeout=120
        )
        
        # Parse JSON output
        try:
            eslint_output = json.loads(result.stdout)
        except json.JSONDecodeError:
            print(f"⚠️ Nu pot parsa output ESLint pentru {target_name}", file=sys.stderr)
            return {
                'target': target_name,
                'total_errors': 0,
                'total_warnings': 0,
                'issues': [],
                'error': 'json_parse_error'
            }
        
        issues = []
        total_errors = 0
        total_warnings = 0
        
        # Parse fiecare fișier
        for file_result in eslint_output:
            file_path = file_result.get('filePath', 'unknown')
            
            for message in file_result.get('messages', []):
                severity_level = message.get('severity', 1)
                severity = 'error' if severity_level == 2 else 'warning'
                
                if severity == 'error':
                    total_errors += 1
                else:
                    total_warnings += 1
                
                issues.append({
                    'file': file_path,
                    'line': message.get('line', 0),
                    'column': message.get('column', 0),
                    'severity': severity,
                    'message': message.get('message', ''),
                    'rule': message.get('ruleId', 'unknown'),
                    'endLine': message.get('endLine'),
                    'endColumn': message.get('endColumn')
                })
        
        return {
            'target': target_name,
            'total_errors': total_errors,
            'total_warnings': total_warnings,
            'issues': issues,
            'exit_code': result.returncode
        }
    
    except subprocess.TimeoutExpired:
        print(f"⚠️ Timeout la verificare {target_name}", file=sys.stderr)
        return {
            'target': target_name,
            'total_errors': 0,
            'total_warnings': 0,
            'issues': [],
            'error': 'timeout',
            'exit_code': -1
        }
    except Exception as e:
        print(f"❌ Eroare la verificare {target_name}: {e}", file=sys.stderr)
        return {
            'target': target_name,
            'total_errors': 0,
            'total_warnings': 0,
            'issues': [],
            'error': str(e),
            'exit_code': -1
        }


def send_to_loki(target: str, total_errors: int, total_warnings: int, issues: list):
    """
    Trimite erori și warnings către Loki prin log structurat JSON.
    Format: JSON cu labels pentru filtering în Grafana.
    """
    timestamp = datetime.utcnow().isoformat() + 'Z'
    
    # Log summary
    summary = {
        'timestamp': timestamp,
        'service': 'eslint-checker',
        'target': target,
        'total_errors': total_errors,
        'total_warnings': total_warnings,
        'check_type': 'eslint',
        'severity': 'error' if total_errors > 0 else ('warning' if total_warnings > 0 else 'info')
    }
    
    print(json.dumps(summary))
    
    # Log fiecare issue individual pentru granularitate în Grafana
    for issue in issues:
        log_entry = {
            'timestamp': timestamp,
            'service': 'eslint-checker',
            'target': target,
            'check_type': 'eslint',
            'severity': issue['severity'],
            'file': issue['file'],
            'line': issue['line'],
            'column': issue['column'],
            'message': issue['message'],
            'rule': issue['rule']
        }
        print(json.dumps(log_entry))


def main():
    """Main function - verifică backend și frontend."""
    print("=" * 80, file=sys.stderr)
    print("🔍 ESLint Errors & Warnings Collector - GeniusERP v5", file=sys.stderr)
    print(f"⏰ Timestamp: {datetime.utcnow().isoformat()}Z", file=sys.stderr)
    print("=" * 80, file=sys.stderr)
    
    # Verificare Backend
    backend_result = run_eslint_check(BACKEND_PATH, 'backend')
    send_to_loki(
        target='backend',
        total_errors=backend_result['total_errors'],
        total_warnings=backend_result['total_warnings'],
        issues=backend_result['issues']
    )
    
    print(f"✅ Backend: {backend_result['total_errors']} erori, {backend_result['total_warnings']} warnings ESLint", file=sys.stderr)
    
    # Verificare Frontend
    frontend_result = run_eslint_check(FRONTEND_PATH, 'frontend')
    send_to_loki(
        target='frontend',
        total_errors=frontend_result['total_errors'],
        total_warnings=frontend_result['total_warnings'],
        issues=frontend_result['issues']
    )
    
    print(f"✅ Frontend: {frontend_result['total_errors']} erori, {frontend_result['total_warnings']} warnings ESLint", file=sys.stderr)
    
    # Total
    total_errors = backend_result['total_errors'] + frontend_result['total_errors']
    total_warnings = backend_result['total_warnings'] + frontend_result['total_warnings']
    
    print("=" * 80, file=sys.stderr)
    print(f"📊 TOTAL: {total_errors} erori, {total_warnings} warnings ESLint", file=sys.stderr)
    print("=" * 80, file=sys.stderr)
    
    # Exit cu cod 0 (nu vrem să oprim cron-ul dacă sunt erori)
    sys.exit(0)


if __name__ == '__main__':
    main()

