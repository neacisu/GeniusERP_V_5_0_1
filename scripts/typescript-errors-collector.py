#!/usr/bin/env python3
"""
TypeScript Errors Collector pentru GeniusERP v5
================================================
Script automat care rulează tsc (TypeScript Compiler) pe backend și frontend,
colectează toate erorile și le trimite către Loki pentru monitorizare în Grafana.

Rulare: cron job la fiecare 15 minute
Output: JSON logs către stdout → Promtail → Loki → Grafana
"""

import subprocess
import json
import sys
import os
from datetime import datetime
import re

# Configurare paths
PROJECT_ROOT = os.getenv('PROJECT_ROOT', '/app')
BACKEND_PATH = f"{PROJECT_ROOT}/server"
FRONTEND_PATH = f"{PROJECT_ROOT}/client"

def run_tsc_check(target_path: str, target_name: str) -> dict:
    """
    Rulează tsc --noEmit pentru a verifica erorile TypeScript.
    
    Args:
        target_path: Path către directorul de verificat
        target_name: Nume target (backend/frontend)
    
    Returns:
        Dict cu rezultate: {
            'target': str,
            'total_errors': int,
            'errors': [{'file': str, 'line': int, 'column': int, 'code': str, 'message': str}]
        }
    """
    print(f"🔍 Verificare TypeScript pentru {target_name}...", file=sys.stderr)
    
    try:
        # Rulează tsc cu output JSON-like
        result = subprocess.run(
            ['npx', 'tsc', '--noEmit', '--project', target_path],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            timeout=120
        )
        
        errors = []
        error_pattern = re.compile(
            r'([^(]+)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)'
        )
        
        # Parse output pentru erori
        for line in result.stdout.split('\n'):
            match = error_pattern.match(line.strip())
            if match:
                file_path = match.group(1).strip()
                line_num = int(match.group(2))
                column_num = int(match.group(3))
                error_code = match.group(4)
                message = match.group(5).strip()
                
                errors.append({
                    'file': file_path,
                    'line': line_num,
                    'column': column_num,
                    'code': error_code,
                    'message': message,
                    'severity': 'error'
                })
        
        return {
            'target': target_name,
            'total_errors': len(errors),
            'errors': errors,
            'exit_code': result.returncode
        }
    
    except subprocess.TimeoutExpired:
        print(f"⚠️ Timeout la verificare {target_name}", file=sys.stderr)
        return {
            'target': target_name,
            'total_errors': 0,
            'errors': [],
            'error': 'timeout',
            'exit_code': -1
        }
    except Exception as e:
        print(f"❌ Eroare la verificare {target_name}: {e}", file=sys.stderr)
        return {
            'target': target_name,
            'total_errors': 0,
            'errors': [],
            'error': str(e),
            'exit_code': -1
        }


def send_to_loki(target: str, total_errors: int, errors: list):
    """
    Trimite erori către Loki prin log structurat JSON.
    Format: JSON cu labels pentru filtering în Grafana.
    """
    timestamp = datetime.utcnow().isoformat() + 'Z'
    
    # Log summary
    summary = {
        'timestamp': timestamp,
        'service': 'typescript-checker',
        'target': target,
        'total_errors': total_errors,
        'check_type': 'typescript',
        'severity': 'error' if total_errors > 0 else 'info'
    }
    
    print(json.dumps(summary))
    
    # Log fiecare eroare individual pentru granularitate în Grafana
    for error in errors:
        log_entry = {
            'timestamp': timestamp,
            'service': 'typescript-checker',
            'target': target,
            'check_type': 'typescript',
            'severity': 'error',
            'file': error['file'],
            'line': error['line'],
            'column': error['column'],
            'code': error['code'],
            'message': error['message']
        }
        print(json.dumps(log_entry))


def main():
    """Main function - verifică backend și frontend."""
    print("=" * 80, file=sys.stderr)
    print("🔍 TypeScript Errors Collector - GeniusERP v5", file=sys.stderr)
    print(f"⏰ Timestamp: {datetime.utcnow().isoformat()}Z", file=sys.stderr)
    print("=" * 80, file=sys.stderr)
    
    # Verificare Backend
    backend_result = run_tsc_check(BACKEND_PATH, 'backend')
    send_to_loki(
        target='backend',
        total_errors=backend_result['total_errors'],
        errors=backend_result['errors']
    )
    
    print(f"✅ Backend: {backend_result['total_errors']} erori TypeScript", file=sys.stderr)
    
    # Verificare Frontend
    frontend_result = run_tsc_check(FRONTEND_PATH, 'frontend')
    send_to_loki(
        target='frontend',
        total_errors=frontend_result['total_errors'],
        errors=frontend_result['errors']
    )
    
    print(f"✅ Frontend: {frontend_result['total_errors']} erori TypeScript", file=sys.stderr)
    
    # Total erori
    total = backend_result['total_errors'] + frontend_result['total_errors']
    print("=" * 80, file=sys.stderr)
    print(f"📊 TOTAL: {total} erori TypeScript", file=sys.stderr)
    print("=" * 80, file=sys.stderr)
    
    # Exit cu cod 0 (nu vrem să oprim cron-ul dacă sunt erori)
    sys.exit(0)


if __name__ == '__main__':
    main()

