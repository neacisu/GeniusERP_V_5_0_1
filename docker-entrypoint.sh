#!/bin/sh
set -e

# Funcție pentru a verifica dacă un serviciu este disponibil
wait_for() {
  echo "Așteptăm ca $1 să fie disponibil la $2:$3..."
  until nc -z -v -w30 "$2" "$3"; do
    echo "Serviciul $1 nu este încă disponibil - așteptăm..."
    sleep 2
  done
  echo "$1 este disponibil!"
}

# Funcție pentru a verifica și a testa conexiunea Redis Cloud
check_redis_cloud() {
  echo "Verificare conexiune Redis Cloud la $1:$2..."
  if command -v redis-cli >/dev/null 2>&1; then
    if [ -n "$REDIS_PASSWORD" ]; then
      if redis-cli -h "$1" -p "$2" -a "$REDIS_PASSWORD" ping > /dev/null 2>&1; then
        echo "Conexiune Redis Cloud testată cu succes!"
        return 0
      else
        echo "AVERTISMENT: Nu se poate conecta la Redis Cloud. Verificați credențialele."
        return 1
      fi
    else
      if redis-cli -h "$1" -p "$2" ping > /dev/null 2>&1; then
        echo "Conexiune Redis Cloud testată cu succes!"
        return 0
      else
        echo "AVERTISMENT: Nu se poate conecta la Redis Cloud. Verificați credențialele."
        return 1
      fi
    fi
  else
    echo "NOTĂ: redis-cli nu este instalat. Nu se poate testa conexiunea Redis Cloud."
    return 0
  fi
}

# Verifică dacă un director backup există
verify_backup_dir() {
  if [ ! -d "/app/db-backups" ]; then
    echo "Creăm directorul pentru backup-uri..."
    mkdir -p /app/db-backups
  fi
}

# Verifică dacă există un backup inițial pentru restaurare
check_initial_backup() {
  if [ -n "$INITIAL_BACKUP" ]; then
    if [ -f "/app/db-backups/$INITIAL_BACKUP" ]; then
      echo "Backup inițial găsit: $INITIAL_BACKUP"
      return 0
    else
      echo "AVERTISMENT: Backup-ul inițial specificat nu a fost găsit: $INITIAL_BACKUP"
      return 1
    fi
  fi
  return 0
}

# Inițializarea mediului
echo "Inițializarea mediului Docker pentru GeniusERP..."
verify_backup_dir
check_initial_backup

# Asigurăm că baza de date PostgreSQL este disponibilă
if [ -n "$DATABASE_URL" ] || [ -n "$POSTGRES_HOST" ]; then
  # Extragem host și port din URL sau folosim valorile explicite
  if [ -n "$DATABASE_URL" ]; then
    # Exemplu: postgres://user:pass@postgres:5432/dbname
    DB_HOST=$(echo $DATABASE_URL | sed -e 's/^.*\/\/[^:]*:[^@]*@\([^:]*\).*$/\1/')
    DB_PORT=$(echo $DATABASE_URL | sed -e 's/^.*\/\/[^:]*:[^@]*@[^:]*:\([0-9]*\).*$/\1/')
  else
    DB_HOST=$POSTGRES_HOST
    DB_PORT=${POSTGRES_PORT:-5432}
  fi

  wait_for "PostgreSQL" "$DB_HOST" "$DB_PORT"
fi

# Verificarea Redis Cloud
if [ -n "$REDIS_URL" ] || [ -n "$REDIS_HOST" ]; then
  # Extragem host și port din URL sau folosim valorile explicite
  if [ -n "$REDIS_URL" ] && [ -z "$REDIS_HOST" ]; then
    # Extragem host și port din URL
    # Exemplu: redis://default:password@host:15158
    REDIS_HOST_FROM_URL=$(echo $REDIS_URL | sed -E 's/^.*@([^:]+).*$/\1/')
    REDIS_PORT_FROM_URL=$(echo $REDIS_URL | sed -E 's/^.*:([0-9]+).*$/\1/')
    
    if [ -n "$REDIS_HOST_FROM_URL" ]; then
      REDIS_HOST_TO_USE=$REDIS_HOST_FROM_URL
    else
      REDIS_HOST_TO_USE=$REDIS_HOST
    fi
    
    if [ -n "$REDIS_PORT_FROM_URL" ]; then
      REDIS_PORT_TO_USE=$REDIS_PORT_FROM_URL
    else
      REDIS_PORT_TO_USE=${REDIS_PORT:-6379}
    fi
  else
    REDIS_HOST_TO_USE=$REDIS_HOST
    REDIS_PORT_TO_USE=${REDIS_PORT:-6379}
  fi

  echo "Verificare Redis Cloud: $REDIS_HOST_TO_USE:$REDIS_PORT_TO_USE"
  
  # Verificăm conexiunea la Redis Cloud, dar nu eșuăm dacă nu putem conecta
  # Deoarece aplicația poate să se pornească oricum
  check_redis_cloud "$REDIS_HOST_TO_USE" "$REDIS_PORT_TO_USE"
fi

# Creăm/actualizăm fișierele necesare
echo "Verificăm existența fișierelor de configurare..."

# Rulăm migrările bazei de date dacă e necesar
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "Rulăm migrările bazei de date..."
  npm run db:push
fi

# ================================================================================================
# Code Quality Monitoring Cron Setup
# ================================================================================================
echo "📝 Configurare cron jobs pentru monitorizare calitate cod..."

# Facem scripturile executabile
chmod +x /app/scripts/typescript-errors-collector.py 2>/dev/null || true
chmod +x /app/scripts/eslint-errors-collector.py 2>/dev/null || true

# Creăm directoare log dacă nu există
mkdir -p /var/log 2>/dev/null || true

# Instalăm crontab doar dacă fișierul există și cron este disponibil
if [ -f "/app/scripts/code-quality-crontab" ] && command -v crontab >/dev/null 2>&1; then
  echo "Instalare crontab pentru monitorizare cod..."
  crontab /app/scripts/code-quality-crontab
  
  # Pornim cron daemon în background (doar dacă există)
  if command -v cron >/dev/null 2>&1; then
    echo "Pornire cron daemon..."
    cron
  elif command -v crond >/dev/null 2>&1; then
    echo "Pornire crond daemon..."
    crond
  else
    echo "⚠️ AVERTISMENT: Cron nu este instalat în container. Monitorizarea automată este dezactivată."
  fi
else
  echo "⚠️ AVERTISMENT: Crontab nu este disponibil. Monitorizarea automată este dezactivată."
fi

echo "✅ Configurare cron jobs finalizată."

# Executăm comanda primită
echo "Pornire aplicație: $@"
exec "$@"