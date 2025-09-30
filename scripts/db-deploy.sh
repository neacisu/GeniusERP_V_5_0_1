#!/bin/bash
# Script pentru pregătirea și implementarea bazei de date într-un mediu de producție
# Acest script realizează backup-ul bazei de date locale, apoi implementează datele în containerul Docker

# Setări implicite
BACKUP_DIR="./db-backups"
LOCAL_DB_NAME=${PGDATABASE:-"geniuserp"}
LOCAL_DB_USER=${PGUSER:-"postgres"}
LOCAL_DB_PASSWORD=${PGPASSWORD:-"postgres"}
LOCAL_DB_HOST=${PGHOST:-"localhost"}
LOCAL_DB_PORT=${PGPORT:-"5432"}

REMOTE_DB_NAME="geniuserp"
REMOTE_DB_USER="postgres" 
REMOTE_DB_PASSWORD="postgres"
REMOTE_DB_HOST="postgres" # Numele serviciului în docker-compose
REMOTE_DB_PORT="5432"
DOCKER_CONTAINER="geniuserp-postgres" # Numele containerului pentru baza de date

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILENAME="${LOCAL_DB_NAME}_${TIMESTAMP}.sql.gz"
SCHEMA_ONLY=false
DATA_ONLY=false
SKIP_BACKUP=false
SKIP_RESTORE=false
DROP_DB=false

# Funcție pentru afișarea ajutorului
show_help() {
  echo "Utilizare: $0 [opțiuni]"
  echo ""
  echo "Acest script realizează backup-ul bazei de date locale și o implementează în containerul Docker."
  echo ""
  echo "Opțiuni:"
  echo "  --local-db NAME       Nume bază de date locală (implicit: $LOCAL_DB_NAME)"
  echo "  --local-user USER     Utilizator bază de date locală (implicit: $LOCAL_DB_USER)"
  echo "  --local-pass PASS     Parola utilizator local (implicit: din variabila de mediu)"
  echo "  --local-host HOST     Host bază de date locală (implicit: $LOCAL_DB_HOST)"
  echo "  --local-port PORT     Port bază de date locală (implicit: $LOCAL_DB_PORT)"
  echo "  --remote-db NAME      Nume bază de date remote (implicit: $REMOTE_DB_NAME)"
  echo "  --remote-user USER    Utilizator bază de date remote (implicit: $REMOTE_DB_USER)"
  echo "  --remote-pass PASS    Parola utilizator remote (implicit: $REMOTE_DB_PASSWORD)"
  echo "  --remote-host HOST    Host bază de date remote (implicit: $REMOTE_DB_HOST)"
  echo "  --remote-port PORT    Port bază de date remote (implicit: $REMOTE_DB_PORT)"
  echo "  --container NAME      Nume container Docker (implicit: $DOCKER_CONTAINER)"
  echo "  --schema-only         Backup/restaurare doar schema, fără date"
  echo "  --data-only           Backup/restaurare doar date, fără schema"
  echo "  --skip-backup         Nu realiza backup, folosește ultimul backup disponibil"
  echo "  --skip-restore        Realizează doar backup, nu restaura în containerul Docker"
  echo "  --drop-db             Șterge baza de date remote înainte de restaurare"
  echo "  --help                Afișează acest mesaj de ajutor"
  echo ""
  exit 0
}

# Parsăm argumentele
while [[ $# -gt 0 ]]; do
  case $1 in
    --local-db)
      LOCAL_DB_NAME="$2"
      shift 2
      ;;
    --local-user)
      LOCAL_DB_USER="$2"
      shift 2
      ;;
    --local-pass)
      LOCAL_DB_PASSWORD="$2"
      shift 2
      ;;
    --local-host)
      LOCAL_DB_HOST="$2"
      shift 2
      ;;
    --local-port)
      LOCAL_DB_PORT="$2"
      shift 2
      ;;
    --remote-db)
      REMOTE_DB_NAME="$2"
      shift 2
      ;;
    --remote-user)
      REMOTE_DB_USER="$2"
      shift 2
      ;;
    --remote-pass)
      REMOTE_DB_PASSWORD="$2"
      shift 2
      ;;
    --remote-host)
      REMOTE_DB_HOST="$2"
      shift 2
      ;;
    --remote-port)
      REMOTE_DB_PORT="$2"
      shift 2
      ;;
    --container)
      DOCKER_CONTAINER="$2"
      shift 2
      ;;
    --schema-only)
      SCHEMA_ONLY=true
      shift
      ;;
    --data-only)
      DATA_ONLY=true
      shift
      ;;
    --skip-backup)
      SKIP_BACKUP=true
      shift
      ;;
    --skip-restore)
      SKIP_RESTORE=true
      shift
      ;;
    --drop-db)
      DROP_DB=true
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

# Verifică dacă sunt instalate utilitarele necesare
for cmd in pg_dump psql docker docker-compose; do
  if ! command -v $cmd &> /dev/null; then
    echo "Eroare: $cmd nu este instalat sau nu este în PATH."
    exit 1
  fi
done

# Creează directorul de backup dacă nu există
mkdir -p "$BACKUP_DIR"

# Realizează backup-ul bazei de date locale
if [ "$SKIP_BACKUP" = false ]; then
  echo "Realizare backup pentru baza de date locală $LOCAL_DB_NAME..."
  
  # Pregătire opțiuni pg_dump
  PG_DUMP_OPTS=""
  
  if [ "$SCHEMA_ONLY" = true ]; then
    PG_DUMP_OPTS="$PG_DUMP_OPTS --schema-only"
  fi
  
  if [ "$DATA_ONLY" = true ]; then
    PG_DUMP_OPTS="$PG_DUMP_OPTS --data-only"
  fi
  
  # Setare variabilă de mediu pentru parola PostgreSQL
  export PGPASSWORD="$LOCAL_DB_PASSWORD"
  
  # Calea completă către fișierul de backup
  BACKUP_FILE="$BACKUP_DIR/$BACKUP_FILENAME"
  
  # Realizare backup
  pg_dump -h "$LOCAL_DB_HOST" -p "$LOCAL_DB_PORT" -U "$LOCAL_DB_USER" -d "$LOCAL_DB_NAME" $PG_DUMP_OPTS | gzip > "$BACKUP_FILE"
  
  # Verifică dacă backup-ul a reușit
  if [ $? -eq 0 ]; then
    echo "Backup realizat cu succes: $BACKUP_FILE"
    echo "Dimensiune fișier: $(du -h "$BACKUP_FILE" | cut -f1)"
  else
    echo "Eroare la realizarea backup-ului!"
    exit 1
  fi
else
  echo "Se omite realizarea backup-ului..."
  
  # Găsește cel mai recent backup
  LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/*.sql.gz 2>/dev/null | head -n 1)
  
  if [ -z "$LATEST_BACKUP" ]; then
    echo "Eroare: Nu s-a găsit niciun backup disponibil."
    exit 1
  fi
  
  BACKUP_FILE="$LATEST_BACKUP"
  echo "Se va folosi cel mai recent backup: $BACKUP_FILE"
fi

# Omite restaurarea dacă este specificat
if [ "$SKIP_RESTORE" = true ]; then
  echo "Se omite restaurarea bazei de date în containerul Docker."
  exit 0
fi

echo "Restaurare bază de date în containerul Docker $DOCKER_CONTAINER..."

# Verifică dacă containerul Docker rulează
if ! docker ps | grep -q "$DOCKER_CONTAINER"; then
  echo "Eroare: Containerul Docker $DOCKER_CONTAINER nu rulează."
  echo "Asigurați-vă că ați pornit containerele folosind docker-compose up -d."
  exit 1
fi

# Copiază fișierul de backup în container
echo "Copiere fișier backup în container..."
docker cp "$BACKUP_FILE" "$DOCKER_CONTAINER:/tmp/$(basename "$BACKUP_FILE")"

# Șterge baza de date remote dacă este specificat
if [ "$DROP_DB" = true ]; then
  echo "Ștergere bază de date remote $REMOTE_DB_NAME..."
  docker exec -e PGPASSWORD="$REMOTE_DB_PASSWORD" "$DOCKER_CONTAINER" \
    psql -h "$REMOTE_DB_HOST" -p "$REMOTE_DB_PORT" -U "$REMOTE_DB_USER" -c "DROP DATABASE IF EXISTS \"$REMOTE_DB_NAME\";"
  
  echo "Creare bază de date remote $REMOTE_DB_NAME..."
  docker exec -e PGPASSWORD="$REMOTE_DB_PASSWORD" "$DOCKER_CONTAINER" \
    psql -h "$REMOTE_DB_HOST" -p "$REMOTE_DB_PORT" -U "$REMOTE_DB_USER" -c "CREATE DATABASE \"$REMOTE_DB_NAME\";"
fi

# Verifică dacă baza de date remote există
DB_EXISTS=$(docker exec -e PGPASSWORD="$REMOTE_DB_PASSWORD" "$DOCKER_CONTAINER" \
  psql -h "$REMOTE_DB_HOST" -p "$REMOTE_DB_PORT" -U "$REMOTE_DB_USER" -lqt | grep -w "$REMOTE_DB_NAME" | wc -l)

if [ "$DB_EXISTS" -eq 0 ]; then
  echo "Creare bază de date remote $REMOTE_DB_NAME..."
  docker exec -e PGPASSWORD="$REMOTE_DB_PASSWORD" "$DOCKER_CONTAINER" \
    psql -h "$REMOTE_DB_HOST" -p "$REMOTE_DB_PORT" -U "$REMOTE_DB_USER" -c "CREATE DATABASE \"$REMOTE_DB_NAME\";"
fi

# Restaurează backup-ul în containerul Docker
echo "Restaurare date din backup..."
docker exec -e PGPASSWORD="$REMOTE_DB_PASSWORD" "$DOCKER_CONTAINER" \
  bash -c "gunzip -c /tmp/$(basename "$BACKUP_FILE") | psql -h \"$REMOTE_DB_HOST\" -p \"$REMOTE_DB_PORT\" -U \"$REMOTE_DB_USER\" -d \"$REMOTE_DB_NAME\""

# Verifică dacă restaurarea a reușit
if [ $? -eq 0 ]; then
  echo "Restaurare realizată cu succes în containerul Docker!"
  
  # Curăță fișierul temporar din container
  docker exec "$DOCKER_CONTAINER" rm "/tmp/$(basename "$BACKUP_FILE")"
else
  echo "Eroare la restaurarea bazei de date în containerul Docker!"
  exit 1
fi

echo "Procesul de backup și restaurare a fost finalizat cu succes."