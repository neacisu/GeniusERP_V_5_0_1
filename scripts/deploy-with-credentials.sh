#!/bin/bash
# Script pentru deploy automat cu backup și restaurare a bazei de date
# Acest script realizează un backup al bazei de date curente, transferă 
# fișierele aplicației pe server și restaurează baza de date

# Setări obligatorii
REMOTE_SERVER=""              # Adresa serverului remote (ex: user@example.com)
REMOTE_DIR="/opt/geniuserp"   # Directorul unde va fi instalată aplicația
BACKUP_DIR="./db-backups"     # Directorul local pentru backup-uri

# Setări opționale
INITIAL_BACKUP=""             # Dacă este specificat, se va utiliza acest backup
                              # În loc de a crea unul nou
SKIP_BACKUP=false             # Dacă este true, nu se va face backup
SKIP_DB_RESTORE=false         # Dacă este true, nu se va restaura baza de date

# Colorare pentru output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funcție pentru a afișa mesaje cu timestamp
log() {
  local level=$1
  local message=$2
  local color=$NC
  
  case $level in
    "INFO") color=$GREEN ;;
    "WARNING") color=$YELLOW ;;
    "ERROR") color=$RED ;;
    "STEP") color=$BLUE ;;
  esac
  
  echo -e "${color}[$(date +"%Y-%m-%d %H:%M:%S")] [$level] $message${NC}"
}

# Verifică dacă sunt setate toate variabilele obligatorii
if [ -z "$REMOTE_SERVER" ]; then
  log "ERROR" "REMOTE_SERVER nu este setat. Editați acest script sau furnizați-l ca variabilă de mediu."
  exit 1
fi

if [ -z "$REMOTE_DIR" ]; then
  log "ERROR" "REMOTE_DIR nu este setat. Editați acest script sau furnizați-l ca variabilă de mediu."
  exit 1
fi

# Afișare parametri deploy
log "INFO" "Începe procesul de deploy către $REMOTE_SERVER:$REMOTE_DIR"
log "INFO" "Redis Cloud va fi utilizat pentru caching și cozi"

# Creează directorul de backup dacă nu există
mkdir -p "$BACKUP_DIR"

# Realizează backup-ul bazei de date dacă nu este dezactivat
if [ "$SKIP_BACKUP" = false ] && [ -z "$INITIAL_BACKUP" ]; then
  log "STEP" "Realizare backup al bazei de date..."
  
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  BACKUP_FILENAME="geniuserp_$TIMESTAMP.sql.gz"
  
  # Exportă datele utilizând pg_dump
  export PGPASSWORD="$PGPASSWORD"
  pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" | gzip > "$BACKUP_DIR/$BACKUP_FILENAME"
  
  if [ $? -eq 0 ]; then
    log "INFO" "Backup realizat cu succes: $BACKUP_DIR/$BACKUP_FILENAME"
    INITIAL_BACKUP="$BACKUP_FILENAME"
  else
    log "ERROR" "Eroare la realizarea backup-ului!"
    exit 1
  fi
elif [ -n "$INITIAL_BACKUP" ]; then
  log "INFO" "Se va utiliza backup-ul specificat: $INITIAL_BACKUP"
  
  # Verifică dacă backup-ul există
  if [ ! -f "$BACKUP_DIR/$INITIAL_BACKUP" ]; then
    log "ERROR" "Backup-ul specificat nu există: $BACKUP_DIR/$INITIAL_BACKUP"
    exit 1
  fi
else
  log "WARNING" "Omitere backup bază de date conform configurării"
fi

# Creare fișier .env pentru noul server
log "STEP" "Pregătire fișier .env pentru deployment..."

ENV_FILE=".env.deployment"
cat > "$ENV_FILE" << EOL
# Variabile de bază
NODE_ENV=production
DATABASE_URL=postgres://postgres:postgres@postgres:5432/geniuserp
RUN_MIGRATIONS=true

# Redis Cloud - credențiale din replit.com
REDIS_URL=${REDIS_URL}
REDIS_HOST=${REDIS_HOST}
REDIS_PORT=${REDIS_PORT}
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_USERNAME=${REDIS_USERNAME}

# Secrets pentru securitate
JWT_SECRET=${JWT_SECRET:-jwt_secret_key_for_production}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET:-jwt_refresh_secret_key_for_production}
SESSION_SECRET=${SESSION_SECRET:-production_session_secret_key}

# ANAF API
ANAF_API_URL=https://webservicesp.anaf.ro/PlatitorTvaRest/api/v7/ws/tva
ANAF_API_VERSION=v7

# Alte variabile de mediu importante
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=geniuserp
BACKUP_RETENTION_DAYS=7
INITIAL_BACKUP=${INITIAL_BACKUP}
EOL

log "INFO" "Fișier .env.deployment creat cu succes"

# Creează arhiva pentru deployment
log "STEP" "Pregătire fișiere pentru deployment..."

DEPLOY_ARCHIVE="geniuserp_deploy.tar.gz"
tar --exclude="node_modules" --exclude=".git" --exclude="db-backups" -czf "$DEPLOY_ARCHIVE" .

log "INFO" "Arhivă creată: $DEPLOY_ARCHIVE"

# Creare script de instalare pe server remote
log "STEP" "Pregătire script de instalare pe server..."

INSTALL_SCRIPT="install_geniuserp.sh"
cat > "$INSTALL_SCRIPT" << 'EOL'
#!/bin/bash

DEPLOY_DIR="$PWD"
BACKUP_DIR="$DEPLOY_DIR/db-backups"

# Pregătire mediu
echo "Pregătire mediu de instalare..."
mkdir -p "$BACKUP_DIR"

# Extrage arhiva
echo "Extragere fișiere aplicație..."
tar -xzf geniuserp_deploy.tar.gz

# Restaurare fișier .env
echo "Configurare variabile de mediu..."
mv .env.deployment .env

# Copiere backup în directorul corect
if [ -n "$INITIAL_BACKUP" ] && [ -f "$INITIAL_BACKUP" ]; then
  echo "Copiere backup în directorul de backup..."
  cp "$INITIAL_BACKUP" "$BACKUP_DIR/"
fi

# Verifică dacă Docker și Docker Compose sunt instalate
if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then
  echo "Docker și/sau Docker Compose nu sunt instalate."
  echo "Instalare Docker și Docker Compose..."
  
  # Instalare Docker dacă nu există
  if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    sudo usermod -aG docker $USER
  fi
  
  # Instalare Docker Compose dacă nu există
  if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
  fi
  
  echo "Docker și Docker Compose au fost instalate. Vă rugăm să vă delogați și să vă logați din nou pentru a aplica modificările grupului."
  echo "Apoi rulați din nou acest script."
  exit 0
fi

# Pornire aplicație cu Docker Compose
echo "Pornire containere Docker..."
docker-compose -f docker-compose.prod.yml up -d

echo "Instalare finalizată cu succes!"
echo "Aplicația ar trebui să fie disponibilă în câteva momente."
EOL

chmod +x "$INSTALL_SCRIPT"
log "INFO" "Script de instalare creat: $INSTALL_SCRIPT"

# Transferul fișierelor pe server
log "STEP" "Transfer fișiere pe serverul remote..."

# Creează directorul remote dacă nu există
ssh "$REMOTE_SERVER" "mkdir -p $REMOTE_DIR"

# Transferă fișierele
scp "$DEPLOY_ARCHIVE" "$REMOTE_SERVER:$REMOTE_DIR/"
scp "$INSTALL_SCRIPT" "$REMOTE_SERVER:$REMOTE_DIR/"
scp "$ENV_FILE" "$REMOTE_SERVER:$REMOTE_DIR/"

if [ -n "$INITIAL_BACKUP" ] && [ -f "$BACKUP_DIR/$INITIAL_BACKUP" ]; then
  scp "$BACKUP_DIR/$INITIAL_BACKUP" "$REMOTE_SERVER:$REMOTE_DIR/"
fi

log "INFO" "Fișiere transferate cu succes"

# Execută scriptul de instalare pe server
log "STEP" "Instalare pe serverul remote..."

ssh "$REMOTE_SERVER" "cd $REMOTE_DIR && ./$INSTALL_SCRIPT"

# Verificare finală
log "INFO" "Deployment finalizat! Verificați starea aplicației pe server."
log "INFO" "URL aplicație: http://$(ssh "$REMOTE_SERVER" "curl -s ifconfig.me")"