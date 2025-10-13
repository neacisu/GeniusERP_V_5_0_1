# Ghid de Deployment Securizat - GeniusERP v5.1.0

## Rezumat

Acest document oferă instrucțiuni complete pentru deployment-ul securizat al aplicației GeniusERP în mediul de producție, conform standardelor OWASP Top 10, ISO 27001 și celor mai bune practici din industrie.

## Măsuri de Securitate Implementate

### ✅ 1. Validare Environment Variables
- **Status**: Implementat
- **Fișier**: `server/config/env-validation.ts`
- **Descriere**: Aplicația validează toate variabilele de mediu critice la pornire și oprește execuția dacă acestea lipsesc sau sunt invalide.

### ✅ 2. Security Headers (Helmet + CORS)
- **Status**: Implementat
- **Fișier**: `server/index.ts`
- **Protecții**:
  - Content Security Policy (CSP)
  - HSTS (HTTP Strict Transport Security)
  - X-Frame-Options
  - X-Content-Type-Options
  - XSS-Protection
  - CORS explicit configurat

### ✅ 3. Rate Limiting
- **Status**: Implementat
- **Fișier**: `server/middlewares/rate-limit.middleware.ts`
- **Protecții**:
  - Autentificare: 5 încercări / 15 minute
  - API Global: 100 requests / minut
  - Operațiuni costisitoare: 10 requests / minut
  - Suport Redis pentru stocare distribuită

### ✅ 4. Cookie/Session Security
- **Status**: Implementat
- **Fișier**: `server/modules/auth/routes/auth.routes.ts`
- **Protecții**:
  - `sameSite: 'lax'` pentru protecție CSRF
  - `httpOnly: true` prevenire acces JavaScript
  - `secure: true` în producție (doar HTTPS)
  - Secret obligatoriu validat la startup

### ✅ 5. Password Policy
- **Status**: Implementat
- **Fișier**: `server/common/validators/password.validator.ts`
- **Cerințe**:
  - Minimum 12 caractere
  - Literă mare, mică, cifră, caracter special
  - Verificare parole comune
  - Prevenire caractere repetitive

### ✅ 6. XSS Protection
- **Status**: Implementat
- **Fișier**: `client/src/utils/sanitize.ts`
- **Protecții**:
  - DOMPurify pentru sanitizare HTML
  - Multiple nivele de configurare (strict, moderate, rich, email)
  - Componenta SafeHtml pentru randare sigură

### ✅ 7. File Upload Security
- **Status**: Implementat
- **Fișier**: `server/common/middleware/file-upload.middleware.ts`
- **Protecții**:
  - Validare tip MIME
  - Validare extensie fișier
  - Limitare dimensiune
  - Prevenire path traversal
  - Generare nume unice (UUID)

### ✅ 8. MFA/2FA Support
- **Status**: Implementat
- **Fișiere**: 
  - `server/modules/auth/services/mfa.service.ts`
  - `server/modules/auth/routes/mfa.routes.ts`
- **Funcționalități**:
  - TOTP (Time-based One-Time Password)
  - QR codes pentru setup
  - Backup codes pentru recovery
  - Verificare și dezactivare MFA

### ✅ 9. Test Endpoint Restriction
- **Status**: Implementat
- **Fișier**: `server/modules/auth/routes/auth.routes.ts`
- **Protecție**: Endpoint-uri de test accesibile doar în development

### ✅ 10. Docker Secrets Management
- **Status**: Implementat
- **Fișier**: `docker-compose.prod.yml`
- **Protecție**: Eliminare secrete default, validare obligatorie

## Checklist Pre-Deployment

### Environment Variables

**OBLIGATORII (aplicația nu va porni fără acestea):**

```bash
# Generate secrets
openssl rand -base64 32  # Pentru JWT_SECRET
openssl rand -base64 32  # Pentru SESSION_SECRET
openssl rand -base64 32  # Pentru JWT_REFRESH_SECRET
```

**Variabile necesare:**

```env
# Node Environment
NODE_ENV=production

# Security Secrets (CRITICE - Generați valori noi!)
JWT_SECRET=<secret-generat-32-caractere>
SESSION_SECRET=<secret-generat-32-caractere>
JWT_REFRESH_SECRET=<secret-generat-32-caractere>

# Database
DATABASE_URL=postgresql://user:password@host:5432/geniuserp
DB_USER=<user-specific-nu-postgres>
DB_PASSWORD=<parola-puternica-nu-postgres>

# Redis (Recomandat pentru rate limiting)
REDIS_URL=redis://redis-host:6379
REDIS_PASSWORD=<parola-redis>

# CORS (Specifică originile permise)
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Cookie Domain
COOKIE_DOMAIN=.yourdomain.com

# Monitoring (Opțional dar recomandat)
SENTRY_DSN=<your-sentry-dsn>
GRAFANA_ADMIN_PASSWORD=<parola-puternica-nu-admin123>
WAZUH_INDEXER_PASSWORD=<parola-puternica>
WAZUH_API_PASSWORD=<parola-puternica>

# Email (Dacă folosiți notificări)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=<smtp-user>
SMTP_PASS=<smtp-password>
```

### SSL/TLS Configuration

1. **Obțineți certificate SSL** (Let's Encrypt recomandat):
   ```bash
   certbot certonly --standalone -d yourdomain.com
   ```

2. **Decomentați secțiunea HTTPS** din `nginx/nginx.conf`

3. **Verificați că Nginx folosește TLS 1.2+**

### Database Security

1. **Creați utilizator specific pentru aplicație** (NU folosiți `postgres`):
   ```sql
   CREATE USER geniuserp_app WITH PASSWORD 'parola-puternica';
   CREATE DATABASE geniuserp OWNER geniuserp_app;
   GRANT ALL PRIVILEGES ON DATABASE geniuserp TO geniuserp_app;
   ```

2. **Configurați backup-uri automate** (incluse în docker-compose.prod.yml)

3. **Criptare volume Docker** (recomandat pentru date sensibile)

### Network Security

1. **Firewall Configuration**:
   ```bash
   # Permiteți doar porturile necesare
   ufw allow 80/tcp   # HTTP (redirect la HTTPS)
   ufw allow 443/tcp  # HTTPS
   ufw allow 22/tcp   # SSH (restricționați la IP-uri cunoscute)
   ufw enable
   ```

2. **Restricționare Acces Database**:
   - PostgreSQL să nu fie expus public
   - Folosiți rețea internă Docker

3. **Monitoring Ports**:
   - Grafana: accesibil doar prin VPN sau reverse proxy
   - Wazuh: accesibil doar din rețea internă

## Deployment Steps

### 1. Pregătire Sistem

```bash
# Actualizare sistem
sudo apt update && sudo apt upgrade -y

# Instalare Docker și Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose-plugin
```

### 2. Clone Repository

```bash
git clone https://github.com/your-org/GeniusERP_V_5.git
cd GeniusERP_V_5
```

### 3. Configurare Environment

```bash
# Creați fișierul .env din template
cp env.example.txt .env

# Editați .env și setați TOATE variabilele necesare
nano .env

# IMPORTANT: Verificați că nu există valori default nesecurizate!
```

### 4. Build & Deploy

```bash
# Build imagini
docker compose -f docker-compose.prod.yml build

# Porniți serviciile
docker compose -f docker-compose.prod.yml up -d

# Verificați logs
docker compose -f docker-compose.prod.yml logs -f app
```

### 5. Verificare Post-Deployment

```bash
# Test health check
curl https://yourdomain.com/health

# Verificare headers securitate
curl -I https://yourdomain.com

# Test autentificare
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

## Monitorizare Securitate

### Logs

**Verificați zilnic:**
- Grafana Dashboard: `https://yourdomain.com:4000`
- Wazuh Dashboard: Alerte securitate
- Loki: Log aggregation pentru erori

**Alerte critice de monitorizat:**
- Rate limit exceeded (posibil atac brute force)
- Failed authentication attempts
- File upload rejected (posibile încercări de exploit)
- CSP violations (posibile încercări XSS)

### Audit Trail

Toate operațiunile critice sunt loguite:
- Autentificări (succes/eșec)
- Schimbări de parole
- Activare/dezactivare MFA
- Upload fișiere
- Modificări date financiare

## Incident Response

### În caz de breach suspectat:

1. **Izolare**:
   ```bash
   # Opriți serviciul temporar
   docker compose -f docker-compose.prod.yml stop app
   ```

2. **Investigare**:
   - Verificați logs în Grafana/Loki
   - Analizați alerte Wazuh
   - Verificați activitate suspectă în database

3. **Remediere**:
   - Rotați toate secretele (JWT, SESSION, DB passwords)
   - Forțați logout toți utilizatorii
   - Aplicați patch-uri dacă este necesar

4. **Restaurare**:
   ```bash
   # Restaurare din backup dacă e necesar
   docker exec geniuserp-postgres psql -U $DB_USER -d geniuserp < /backups/latest.sql
   ```

## Mentenanță Regulată

### Zilnic
- ✅ Verificare logs erori
- ✅ Verificare alerte Wazuh

### Săptămânal
- ✅ Review failed authentication attempts
- ✅ Verificare backup-uri database
- ✅ Update package-uri cu vulnerabilități

### Lunar
- ✅ Rotație parole servicii (Grafana, Wazuh)
- ✅ Audit permisiuni utilizatori
- ✅ Review și actualizare politici securitate

### Trimestrial
- ✅ Penetration testing extern
- ✅ Code security audit
- ✅ Review și actualizare documentație

## Resurse Adiționale

### Standarde și Referințe
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [ISO 27001](https://www.iso.org/standard/27001)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

### Tools
- [Trivy](https://github.com/aquasecurity/trivy) - Vulnerability scanning
- [Let's Encrypt](https://letsencrypt.org/) - Free SSL certificates
- [ClamAV](https://www.clamav.net/) - Antivirus pentru upload-uri

## Contact & Support

Pentru probleme de securitate critice, contactați imediat echipa de securitate:
- Email: security@yourcompany.com
- Telefon: +40-XXX-XXX-XXX (24/7)

**NU publicați vulnerabilități de securitate în GitHub Issues!**

---

**Ultima actualizare**: 2025-10-13
**Versiune**: GeniusERP v5.1.0
**Conformitate**: OWASP Top 10 2021, ISO 27001

