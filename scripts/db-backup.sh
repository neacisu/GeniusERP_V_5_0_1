#!/bin/bash
# Script pentru exportul bazei de date PostgreSQL

# Setări implicite
BACKUP_DIR="./db-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME=${PGDATABASE:-"geniuserp"}
DB_USER=${PGUSER:-"postgres"}
DB_PASSWORD=${PGPASSWORD:-"postgres"}
DB_HOST=${PGHOST:-"localhost"}
DB_PORT=${PGPORT:-"5432"}
BACKUP_FILENAME="${DB_NAME}_${TIMESTAMP}.sql"
INCLUDE_SCHEMA=true
INCLUDE_DATA=true
COMPRESS=true

# Funcție pentru afișarea ajutorului
show_help() {
  echo "Utilizare: $0 [opțiuni]"
  echo ""
  echo "Acest script exportă baza de date PostgreSQL într-un fișier SQL."
  echo ""
  echo "Opțiuni:"
  echo "  -d, --directory DIR   Director de backup (implicit: $BACKUP_DIR)"
  echo "  -n, --name NAME       Nume bază de date (implicit: $DB_NAME)"
  echo "  -u, --user USER       Utilizator bază de date (implicit: $DB_USER)"
  echo "  -p, --password PASS   Parola utilizator (implicit: din variabila de mediu)"
  echo "  -h, --host HOST       Host bază de date (implicit: $DB_HOST)"
  echo "  --port PORT           Port bază de date (implicit: $DB_PORT)"
  echo "  -f, --filename NAME   Nume fișier (implicit: ${DB_NAME}_TIMESTAMP.sql)"
  echo "  --schema-only         Exportă doar schema, fără date"
  echo "  --data-only           Exportă doar datele, fără schema"
  echo "  --no-compress         Nu compresa fișierul de backup"
  echo "  --help                Afișează acest mesaj de ajutor"
  echo ""
  echo "Exemplu: $0 --directory /backup --name mydb --user dbuser"
  exit 0
}

# Parsăm argumentele
while [[ $# -gt 0 ]]; do
  case $1 in
    -d|--directory)
      BACKUP_DIR="$2"
      shift 2
      ;;
    -n|--name)
      DB_NAME="$2"
      shift 2
      ;;
    -u|--user)
      DB_USER="$2"
      shift 2
      ;;
    -p|--password)
      DB_PASSWORD="$2"
      shift 2
      ;;
    -h|--host)
      DB_HOST="$2"
      shift 2
      ;;
    --port)
      DB_PORT="$2"
      shift 2
      ;;
    -f|--filename)
      BACKUP_FILENAME="$2"
      shift 2
      ;;
    --schema-only)
      INCLUDE_SCHEMA=true
      INCLUDE_DATA=false
      shift
      ;;
    --data-only)
      INCLUDE_SCHEMA=false
      INCLUDE_DATA=true
      shift
      ;;
    --no-compress)
      COMPRESS=false
      shift
      ;;
    --help)
      show_help
      ;;
    *)
      echo "Opțiune necunoscută: $1"
      show_help
      ;;
  esac
done

# Creează directorul de backup dacă nu există
mkdir -p "$BACKUP_DIR"

# Pregătire opțiuni pg_dump
PG_DUMP_OPTS=""

if [ "$INCLUDE_SCHEMA" = true ] && [ "$INCLUDE_DATA" = false ]; then
  PG_DUMP_OPTS="$PG_DUMP_OPTS --schema-only"
fi

if [ "$INCLUDE_SCHEMA" = false ] && [ "$INCLUDE_DATA" = true ]; then
  PG_DUMP_OPTS="$PG_DUMP_OPTS --data-only"
fi

# Pregătire variabile de mediu pentru pg_dump
export PGPASSWORD="$DB_PASSWORD"

# Calea completă către fișierul de backup
BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILENAME"

echo "Începem backup-ul bazei de date $DB_NAME la $BACKUP_FILE..."

# Executăm pg_dump
if [ "$COMPRESS" = true ]; then
  pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" $PG_DUMP_OPTS | gzip > "$BACKUP_FILE.gz"
  BACKUP_FILE="$BACKUP_FILE.gz"
  echo "Backup comprimat salvat la: $BACKUP_FILE"
else
  pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" $PG_DUMP_OPTS > "$BACKUP_FILE"
  echo "Backup salvat la: $BACKUP_FILE"
fi

# Verifică dacă backup-ul a reușit
if [ $? -eq 0 ]; then
  echo "Backup realizat cu succes!"
  echo "Dimensiune fișier: $(du -h "$BACKUP_FILE" | cut -f1)"
else
  echo "Eroare la realizarea backup-ului!"
  exit 1
fi