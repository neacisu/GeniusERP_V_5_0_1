# Instructiuni de Implementare Docker pentru GeniusERP

Această documentație oferă instrucțiuni pentru implementarea sistemului GeniusERP folosind Docker, inclusiv detalii despre backup-ul și restaurarea bazei de date.

## Cerințe preliminare

- Docker și Docker Compose instalate pe serverul VPS
- Acces la porturile 80 și 443 pentru trafic web
- Minim 2GB RAM și 10GB spațiu disk pe serverul VPS

## Structura Containerelor

Sistemul GeniusERP constă din următoarele containere:

1. **app** - Aplicația principală Node.js
2. **nginx** - Server web pentru servirea interfeței și proxy pentru API
3. **postgres** - Baza de date PostgreSQL
4. **db-backup** - Serviciu pentru backup-uri automate ale bazei de date
5. **db-seed** - Serviciu pentru popularea inițială a bazei de date

Notă: Sistemul utilizează Redis Cloud în loc de un container Redis local, pentru fiabilitate și scalabilitate îmbunătățite.

## Implementare rapidă

Pentru implementarea rapidă a sistemului, utilizați comanda:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Backup și Restaurare a bazei de date

### Backup automat

Containerul `db-backup` realizează automat backup-uri zilnice ale bazei de date și le stochează în volumul `db_backups`. Backup-urile sunt reținute pentru un număr de zile configurat prin variabila de mediu `BACKUP_RETENTION_DAYS` (implicit 7 zile).

### Backup manual

Pentru a realiza un backup manual al bazei de date, executați:

```bash
# Pe host, în directorul proiectului
./scripts/db-backup.sh

# Sau direct în containerul postgres
docker exec -it geniuserp-postgres pg_dump -U postgres geniuserp | gzip > ./db-backups/geniuserp-manual-$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restaurarea unei baze de date existente la pornirea containerelor

Pentru a restaura o bază de date existentă la pornirea inițială a containerelor, copiați fișierul de backup în directorul `db-backups` și specificați numele fișierului în variabila de mediu `INITIAL_BACKUP` înainte de a porni containerele:

```bash
# Copiați backup-ul în directorul db-backups
cp /path/to/backup/geniuserp-backup.sql.gz ./db-backups/

# Specificați backup-ul inițial și porniți containerele
export INITIAL_BACKUP=geniuserp-backup.sql.gz
docker-compose -f docker-compose.prod.yml up -d
```

### Restaurare manuală dintr-un backup

Pentru a restaura manual baza de date dintr-un backup existent:

```bash
# Utilizând scriptul de restaurare
./scripts/db-restore.sh --file geniuserp-backup.sql.gz --drop-db

# Sau direct în containerul postgres
docker exec -i geniuserp-postgres psql -U postgres -c "DROP DATABASE IF EXISTS geniuserp;"
docker exec -i geniuserp-postgres psql -U postgres -c "CREATE DATABASE geniuserp;"
gunzip -c ./db-backups/geniuserp-backup.sql.gz | docker exec -i geniuserp-postgres psql -U postgres -d geniuserp
```

## Migrarea datelor între instanțe 

Pentru a migra date dintr-o instanță existentă într-o nouă instanță Docker:

1. Realizați un backup al bazei de date existente:

```bash
# Pe serverul sursă
pg_dump -h host_sursa -U user_sursa baza_de_date_sursa | gzip > geniuserp-export.sql.gz
```

2. Copiați backup-ul pe serverul destinație:

```bash
scp geniuserp-export.sql.gz user@server_destinatie:/path/to/project/db-backups/
```

3. Restaurați backup-ul în noua instanță Docker:

```bash
# Pe serverul destinație
export INITIAL_BACKUP=geniuserp-export.sql.gz
docker-compose -f docker-compose.prod.yml up -d
```

## Verificarea backup-urilor

Pentru a verifica backup-urile existente:

```bash
# Listare backup-uri
ls -lh ./db-backups/

# Verificare conținut backup (fără a-l restaura)
gunzip -c ./db-backups/geniuserp-backup.sql.gz | head -n 100
```

## Script de implementare automată cu baza de date reală

Pentru a automatiza implementarea completă cu date reale, utilizați scriptul `db-deploy.sh`:

```bash
# Exportă baza de date actuală și o încarcă în containerul Docker
./scripts/db-deploy.sh [opțiuni]
```

Consultați ajutorul scriptului pentru opțiunile disponibile:

```bash
./scripts/db-deploy.sh --help
```

## Variabile de mediu importante

Configurați următoarele variabile de mediu pentru a personaliza implementarea:

```
# Variabile pentru baza de date
DB_USER=postgres                # Utilizator PostgreSQL
DB_PASSWORD=postgres_secure_pwd # Parolă PostgreSQL
DB_NAME=geniuserp              # Nume bază de date

# Variabile pentru Redis Cloud (obligatorii)
REDIS_URL=redis://...          # URL complet Redis Cloud
REDIS_HOST=host.cloud.redislabs.com  # Host Redis Cloud
REDIS_PORT=16379               # Port Redis Cloud
REDIS_PASSWORD=password        # Parolă Redis Cloud
REDIS_USERNAME=default         # Utilizator Redis Cloud (opțional)

# Variabile pentru backup
BACKUP_RETENTION_DAYS=7        # Număr zile de reținere backup-uri
INITIAL_BACKUP=backup_file.sql.gz # Backup inițial pentru restaurare

# Variabile pentru securitate
JWT_SECRET=secret_key          # Cheie secretă pentru tokene JWT
JWT_REFRESH_SECRET=refresh_key # Cheie pentru refresh de tokene
SESSION_SECRET=session_key     # Cheie pentru sesiuni

# Variabile pentru email
SMTP_HOST=smtp.example.com     # Server SMTP
SMTP_PORT=587                  # Port SMTP
SMTP_USER=user@example.com     # Utilizator SMTP
SMTP_PASS=password             # Parolă SMTP
EMAIL_FROM=noreply@example.com # Adresă email expeditor
```

### Instrucțiuni speciale pentru Redis Cloud

Sistemul utilizează Redis Cloud pentru caching și mecanismul de cozi. Pentru a obține credențialele Redis Cloud:

1. Creați un cont pe [Redis Cloud](https://redis.com/try-free/)
2. Creați o bază de date gratuită sau plătită, în funcție de necesități
3. Obțineți credențialele de conexiune din secțiunea "Configuration" a bazei de date
4. Adăugați aceste credențiale în variabilele de mediu înainte de a rula containerele

Notă: Asigurați-vă că toate secretele și credențialele sunt stocate în siguranță și nu sunt expuse în controlul sursei.