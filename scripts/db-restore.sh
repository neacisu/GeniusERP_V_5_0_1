#!/bin/bash
# Script pentru restaurarea bazei de date PostgreSQL

# Încarcă Loki Logger
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/loki-logger.sh" 2>/dev/null || echo "⚠ Loki Logger indisponibil, se continuă fără logging."

# Setări implicite
BACKUP_DIR="./db-backups"
DB_NAME=${PGDATABASE:-"geniuserp"}
DB_USER=${PGUSER:-"postgres"}
DB_PASSWORD=${PGPASSWORD:-"postgres"}
DB_HOST=${PGHOST:-"localhost"}
DB_PORT=${PGPORT:-"5432"}
BACKUP_FILE=""
DROP_DB=false
CREATE_DB=false
DROP_ROLES=false
FORCE_RESTORE=false

# Funcție pentru afișarea ajutorului
show_help() {
  echo "Utilizare: $0 [opțiuni] -f FIȘIER_BACKUP"
  echo ""
  echo "Acest script restaurează o bază de date PostgreSQL dintr-un fișier SQL."
  echo ""
  echo "Opțiuni:"
  echo "  -d, --directory DIR   Director de backup (implicit: $BACKUP_DIR)"
  echo "  -n, --name NAME       Nume bază de date (implicit: $DB_NAME)"
  echo "  -u, --user USER       Utilizator bază de date (implicit: $DB_USER)"
  echo "  -p, --password PASS   Parola utilizator (implicit: din variabila de mediu)"
  echo "  -h, --host HOST       Host bază de date (implicit: $DB_HOST)"
  echo "  --port PORT           Port bază de date (implicit: $DB_PORT)"
  echo "  -f, --file FILE       Fișier backup (obligatoriu)"
  echo "  --drop-db             Șterge baza de date înainte de restaurare (dacă există)"
  echo "  --create-db           Creează baza de date înainte de restaurare (dacă nu există)"
  echo "  --drop-roles          Include opțiunea de ștergere a rolurilor în restaurare"
  echo "  --force               Forțează restaurarea fără confirmare"
  echo "  --help                Afișează acest mesaj de ajutor"
  echo ""
  echo "Exemplu: $0 --name mydb --user dbuser --file backup.sql"
  exit 0
}

# Verifică dacă pg_restore/psql sunt disponibile
check_dependencies() {
  if ! command -v psql &> /dev/null; then
    echo "Eroare: psql nu este instalat sau nu este în PATH."
    exit 1
  fi
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
    -f|--file)
      BACKUP_FILE="$2"
      shift 2
      ;;
    --drop-db)
      DROP_DB=true
      shift
      ;;
    --create-db)
      CREATE_DB=true
      shift
      ;;
    --drop-roles)
      DROP_ROLES=true
      shift
      ;;
    --force)
      FORCE_RESTORE=true
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

# Verifică dependențele
check_dependencies

# Verifică dacă s-a specificat un fișier de backup
if [ -z "$BACKUP_FILE" ]; then
  echo "Eroare: Nu s-a specificat un fișier de backup."
  show_help
fi

# Determină calea completă a fișierului de backup
if [[ "$BACKUP_FILE" != /* ]]; then
  BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILE"
fi

# Verifică dacă fișierul există
if [ ! -f "$BACKUP_FILE" ] && [ ! -f "$BACKUP_FILE.gz" ]; then
  echo "Eroare: Fișierul de backup nu există: $BACKUP_FILE"
  exit 1
fi

# Verifică dacă fișierul este comprimat
IS_COMPRESSED=false
if [ ! -f "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE.gz" ]; then
  IS_COMPRESSED=true
  BACKUP_FILE="$BACKUP_FILE.gz"
fi

# Setare variabilă de mediu pentru parola PostgreSQL
export PGPASSWORD="$DB_PASSWORD"

# Verifică dacă baza de date există
DB_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | grep -w "$DB_NAME" | wc -l)

# Procesează opțiunile pentru baza de date
if [ "$DB_EXISTS" -gt 0 ] && [ "$DROP_DB" = true ]; then
  if [ "$FORCE_RESTORE" = false ]; then
    read -p "Baza de date $DB_NAME există și va fi ștearsă. Continuați? (y/n): " CONFIRM
    if [[ "$CONFIRM" != [yY] ]]; then
      echo "Restaurare anulată."
      exit 0
    fi
  fi
  
  echo "Se șterge baza de date $DB_NAME..."
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
  DB_EXISTS=0
fi

if [ "$DB_EXISTS" -eq 0 ] && [ "$CREATE_DB" = true ]; then
  echo "Se creează baza de date $DB_NAME..."
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE \"$DB_NAME\";"
fi

# Verifică din nou dacă baza de date există (după crearea ei)
DB_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | grep -w "$DB_NAME" | wc -l)
if [ "$DB_EXISTS" -eq 0 ]; then
  echo "Eroare: Baza de date $DB_NAME nu există și nu s-a specificat opțiunea --create-db."
  exit 1
fi

# Restaurează baza de date
log_info "🔄 Începe restaurare: Database=$DB_NAME, File=$BACKUP_FILE" '"operation": "restore"'
echo "Restaurare baza de date $DB_NAME din $BACKUP_FILE..."

# Adaugă opțiunea de ștergere a rolurilor dacă este specificată
PSQL_OPTS=""
if [ "$DROP_ROLES" = true ]; then
  PSQL_OPTS="--clean"
fi

# Restaurează folosind psql
if [ "$IS_COMPRESSED" = true ]; then
  gunzip -c "$BACKUP_FILE" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" $PSQL_OPTS
else
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" $PSQL_OPTS < "$BACKUP_FILE"
fi

# Verifică dacă restaurarea a reușit
if [ $? -eq 0 ]; then
  echo "Restaurare finalizată cu succes!"
  log_info "✅ Restaurare finalizată cu succes: Database=$DB_NAME" '"operation": "restore", "status": "success"'
else
  echo "Eroare la restaurarea bazei de date!"
  log_error "❌ Eroare la restaurare: Database=$DB_NAME, File=$BACKUP_FILE" '"operation": "restore", "status": "error"'
  exit 1
fi