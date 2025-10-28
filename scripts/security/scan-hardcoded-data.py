#!/usr/bin/env python3
"""
Script de Scanare Date Hardcodate - GeniusERP Security Audit

Scanează întregul codebase pentru:
- Porturi hardcodate
- URL-uri hardcodate  
- UUID-uri hardcodate
- Credențiale hardcodate
- IP-uri hardcodate
- Email-uri hardcodate
- API keys hardcodate

Generează raport detaliat în format Markdown.
"""

import re
import os
import sys
from pathlib import Path
from typing import List, Dict, Tuple
from dataclasses import dataclass
from enum import Enum

class Severity(Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"

@dataclass
class Finding:
    file_path: str
    line_number: int
    severity: Severity
    type: str
    value: str
    context: str
    recommendation: str

class HardcodedDataScanner:
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.findings: List[Finding] = []
        
        # Patterns pentru detectare
        self.patterns = {
            # Porturi de aplicație (nu timeout-uri)
            'PORT': (
                r'\b(5000|5001|5002|8080|3000|3001|4000|4001)\b(?!.*timeout|.*delay|.*ms\))',
                Severity.HIGH,
                "Migrare în .ENV"
            ),
            
            # UUID-uri  
            'UUID': (
                r'["\']([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})["\']',
                Severity.MEDIUM,
                "Generare dinamic sau citire din DB"
            ),
            
            # URL-uri HTTP/HTTPS
            'URL': (
                r'https?://(?!example\.com|localhost|127\.0\.0\.1)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
                Severity.HIGH,
                "Migrare în .ENV sau config"
            ),
            
            # Credențiale (parole, usernames în context sensibil)
            'PASSWORD': (
                r'password\s*[:=]\s*["\'](?!process\.env|import\.meta)[^"\']+["\']',
                Severity.CRITICAL,
                "ELIMINĂ IMEDIAT - Folosește .ENV"
            ),
            
            # API Keys pattern
            'API_KEY': (
                r'["\'](?:sk_|pk_|key_)[a-zA-Z0-9]{20,}["\']',
                Severity.CRITICAL,
                "ELIMINĂ IMEDIAT - Folosește .ENV"
            ),
            
            # IP-uri hardcodate
            'IP_ADDRESS': (
                r'\b(?:\d{1,3}\.){3}\d{1,3}\b(?!.*127\.0\.0\.1|.*0\.0\.0\.0|.*localhost)',
                Severity.MEDIUM,
                "Folosește variabile de configurare"
            ),
            
            # Email-uri hardcodate (exclude placeholders)
            'EMAIL': (
                r'["\']([a-zA-Z0-9._%+-]+@(?!example\.com|test\.com|domain\.com)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})["\']',
                Severity.LOW,
                "Verifică dacă e placeholder sau real"
            ),
        }
        
        # Directoare de exclus
        self.exclude_dirs = {
            'node_modules', 'dist', '.nx', '.git', '__pycache__', 
            'build', 'coverage', '.next', 'static/archived'
        }
        
        # Fișiere de exclus (acceptable)
        self.exclude_patterns = [
            r'\.example$',  # .env.example files
            r'\.test\.',    # Test files pot avea mock data
            r'\.spec\.',    # Spec files
            r'\.md$',       # Documentation
            r'security-logger\.ts$',  # Utilitar de securitate (conține patterns)
        ]
    
    def should_exclude_file(self, file_path: str) -> bool:
        """Verifică dacă fișierul ar trebui exclus din scanare"""
        for pattern in self.exclude_patterns:
            if re.search(pattern, file_path):
                return True
        return False
    
    def scan_file(self, file_path: Path) -> None:
        """Scanează un fișier pentru date hardcodate"""
        if self.should_exclude_file(str(file_path)):
            return
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
                
            for line_num, line in enumerate(lines, 1):
                for data_type, (pattern, severity, recommendation) in self.patterns.items():
                    matches = re.finditer(pattern, line, re.IGNORECASE)
                    
                    for match in matches:
                        # Skip dacă e comentariu
                        if line.strip().startswith('//') or line.strip().startswith('*'):
                            continue
                        
                        # Skip dacă e în process.env sau import.meta.env
                        if 'process.env' in line or 'import.meta.env' in line:
                            continue
                        
                        value = match.group(0) if match.groups() == () else match.group(1)
                        
                        self.findings.append(Finding(
                            file_path=str(file_path.relative_to(self.root_dir)),
                            line_number=line_num,
                            severity=severity,
                            type=data_type,
                            value=value[:50],  # Limitează lungimea
                            context=line.strip()[:100],
                            recommendation=recommendation
                        ))
        except Exception as e:
            print(f"Error scanning {file_path}: {e}", file=sys.stderr)
    
    def scan_directory(self, directory: Path) -> None:
        """Scanează recursiv un director"""
        for item in directory.iterdir():
            # Skip directoare excluse
            if item.is_dir():
                if item.name in self.exclude_dirs:
                    continue
                self.scan_directory(item)
            
            # Scanează fișiere relevante
            elif item.is_file():
                if item.suffix in {'.ts', '.tsx', '.js', '.jsx', '.json', '.yml', '.yaml'}:
                    self.scan_file(item)
    
    def generate_report(self) -> str:
        """Generează raport Markdown"""
        # Grupează findings by severity
        by_severity = {severity: [] for severity in Severity}
        for finding in self.findings:
            by_severity[finding.severity].append(finding)
        
        report = [
            "# Raport Scanare Date Hardcodate - Automated",
            "",
            f"**Total Fișiere Scanate:** {self._count_scanned_files()}",
            f"**Total Findings:** {len(self.findings)}",
            "",
            "## Sumar",
            "",
            "| Severitate | Count |",
            "|------------|-------|",
        ]
        
        for severity in Severity:
            count = len(by_severity[severity])
            if count > 0:
                emoji = {
                    Severity.CRITICAL: "🔴",
                    Severity.HIGH: "🟠",
                    Severity.MEDIUM: "🟡",
                    Severity.LOW: "🔵",
                    Severity.INFO: "⚪"
                }[severity]
                report.append(f"| {emoji} {severity.value} | {count} |")
        
        report.append("")
        report.append("---")
        report.append("")
        
        # Findings by severity
        for severity in [Severity.CRITICAL, Severity.HIGH, Severity.MEDIUM, Severity.LOW]:
            items = by_severity[severity]
            if not items:
                continue
            
            report.append(f"## {severity.value} Findings")
            report.append("")
            
            # Grupează by type
            by_type: Dict[str, List[Finding]] = {}
            for item in items:
                if item.type not in by_type:
                    by_type[item.type] = []
                by_type[item.type].append(item)
            
            for data_type, type_findings in by_type.items():
                report.append(f"### {data_type} ({len(type_findings)} ocurențe)")
                report.append("")
                report.append("| Fișier | Linie | Valoare | Recomandare |")
                report.append("|--------|-------|---------|-------------|")
                
                for finding in type_findings[:20]:  # Max 20 per tip
                    file_short = finding.file_path.replace('/var/www/GeniusERP/', '')
                    report.append(
                        f"| `{file_short}` | {finding.line_number} | "
                        f"`{finding.value}` | {finding.recommendation} |"
                    )
                
                if len(type_findings) > 20:
                    report.append(f"| ... | ... | ... | *+{len(type_findings) - 20} mai multe* |")
                
                report.append("")
        
        return "\n".join(report)
    
    def _count_scanned_files(self) -> int:
        """Aproximare fișiere scanate"""
        count = 0
        for directory in [self.root_dir / 'apps', self.root_dir / 'libs']:
            if directory.exists():
                for item in directory.rglob('*'):
                    if item.is_file() and item.suffix in {'.ts', '.tsx', '.js', '.jsx'}:
                        if not any(ex in str(item) for ex in self.exclude_dirs):
                            count += 1
        return count

def main():
    """Main entry point"""
    if len(sys.argv) > 1:
        root_dir = sys.argv[1]
    else:
        root_dir = "/var/www/GeniusERP"
    
    print(f"🔍 Scanare date hardcodate în: {root_dir}")
    print("📂 Scanare directoare: apps/, libs/")
    print()
    
    scanner = HardcodedDataScanner(root_dir)
    
    # Scanează apps și libs
    for subdir in ['apps', 'libs']:
        dir_path = scanner.root_dir / subdir
        if dir_path.exists():
            print(f"📁 Scanare {subdir}/...")
            scanner.scan_directory(dir_path)
    
    print(f"\n✅ Scanare completă!")
    print(f"📊 Total findings: {len(scanner.findings)}")
    
    # Generează raport
    report = scanner.generate_report()
    
    # Salvează raport
    output_file = scanner.root_dir / "HARDCODED_DATA_SCAN_AUTOMATED.md"
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"📄 Raport salvat: {output_file}")
    
    # Exit code bazat pe severitate
    critical_count = sum(1 for f in scanner.findings if f.severity == Severity.CRITICAL)
    if critical_count > 0:
        print(f"\n⚠️  ATENȚIE: {critical_count} findings CRITICE găsite!")
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == '__main__':
    main()

