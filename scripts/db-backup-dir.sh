#!/bin/bash
# Script pentru realizarea backup-ului bazei de date și salvarea în directorul de backup
# Utilizat pentru a fi apelat automat din cron sau din alte scripturi

# Creează directorul pentru backup-uri dacă nu există
mkdir -p db-backups

# Rulează scriptul de backup cu opțiunile implicite
./scripts/db-backup.sh

# Asigură-te că scriptul de backup a fost rulat cu succes
if [ $? -ne 0 ]; then
  echo "Eroare la realizarea backup-ului!"
  exit 1
fi

echo "Backup realizat cu succes!"