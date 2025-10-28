# Ghid de Securitate GeniusERP

## Cuprins
1. [Introducere](#introducere)
2. [Configurare Sigură](#configurare-sigură)
3. [Logging Securizat](#logging-securizat)
4. [Autentificare și Autorizare](#autentificare-și-autorizare)
5. [Protecție Împotriva Atacurilor](#protecție-împotriva-atacurilor)
6. [Gestionarea Secretelor](#gestionarea-secretelor)
7. [Deployment Securizat](#deployment-securizat)
8. [Incident Response](#incident-response)
9. [Security Checklist](#security-checklist)

---

## Introducere

GeniusERP implementează un sistem complet de securitate conform standardelor OWASP Top 10 2021. Acest ghid documentează toate aspectele de securitate și procedurile recomandate.

### Principii de Securitate

1. **Defense in Depth** - Securitate pe multiple niveluri
2. **Least Privilege** - Acces minimal necesar
3. **Secure by Default** - Configurări sigure din start
4. **Zero Trust** - Verificare continuă
5. **Privacy by Design** - Protecția datelor încorporată

---

## Configurare Sigură

### Variabile de Mediu Obligatorii

#### Production (.env.production)

```env
# ===========================================
# CONFIGURARE MINIMĂ NECESARĂ PENTRU PRODUCȚIE
# ===========================================

# ----------------
# URLs și Porturi
# ----------------
VITE_API_BASE_URL=https://geniuserp.app/api
VITE_APP_URL=https://geniuserp.app
VITE_FRONTEND_PORT=443
VITE_BACKEND_PORT=5001
VITE_DB_PORT=5432

# ----------------
# CORS (CRITIC!)
# ----------------
CORS_ORIGINS=https://geniuserp.app

# ----------------
# Logging
# ----------------
VITE_LOG_LEVEL=error
VITE_ENABLE_SENSITIVE_LOGS=false
VITE_ENABLE_DEBUG_LOGS=false

# ----------------
# JWT (GENERAT SECURIZAT!)
# ----------------
JWT_SECRET=[GENERAT CU: openssl rand -base64 64]
JWT_REFRESH_SECRET=[DIFERIT DE JWT_SECRET]
JWT_EXPIRY=900

# ----------------
# Database
# ----------------
DATABASE_URL=postgresql://[USER]:[PASS]@[HOST]:[PORT]/[DB]
DB_SSL_MODE=require

# ----------------
# Sentry
# ----------------
VITE_SENTRY_DSN=https://[KEY]@[ORG].ingest.sentry.io/[PROJECT]
VITE_SENTRY_ENVIRONMENT=production
VITE_ENABLE_SENTRY=true

# ----------------
# Security
# ----------------
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_TIMEOUT=1800000
```

#### Development (.env.development)

```env
# Logging verbose pentru debugging
VITE_LOG_LEVEL=debug
VITE_ENABLE_SENSITIVE_LOGS=true
VITE_ENABLE_DEBUG_LOGS=true

# URLs locale
VITE_API_BASE_URL=http://localhost:5001/api
VITE_APP_URL=http://localhost:5000

# CORS permissive pentru development
CORS_ORIGINS=http://localhost:5000,http://0.0.0.0:5000,http://127.0.0.1:5000

# JWT pentru development (NU folosiți în production!)
JWT_SECRET=dev-secret-key-DO-NOT-USE-IN-PRODUCTION
JWT_REFRESH_SECRET=dev-refresh-secret-DO-NOT-USE-IN-PRODUCTION

# Sentry disable în development (opțional)
VITE_ENABLE_SENTRY=false
```

### Generare Secrete Sigure

```bash
# JWT Secret (64 bytes)
openssl rand -base64 64

# JWT Refresh Secret (diferit!)
openssl rand -base64 64

# Database Password (32 caractere alfanumerice + simboluri)
openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
```

⚠️ **IMPORTANT:** Nu folosiți niciodată același secret pentru JWT_SECRET și JWT_REFRESH_SECRET!

---

## Logging Securizat

### Utilizare Security Logger

GeniusERP include un sistem complet de logging securizat care **obfuscă automat** datele sensibile.

#### Import și Utilizare

```typescript
import { logger, maskToken, maskUUID } from '@/lib/utils/security-logger';

// Logging de bază (obfuscare automată)
logger.debug('User authenticated', { 
  userId: user.id,           // Va fi obfuscat automat
  companyId: user.companyId, // Va fi obfuscat automat
  token: user.token          // Va fi obfuscat automat
});

// Output în DEV: "userId: f74b89a3-...-cff7039b8c2d"
// Output în PROD: Silent (doar errors)
```

#### Nivele de Logging

```typescript
logger.debug(message, data);  // Doar în development
logger.info(message, data);   // Important info în ambele medii
logger.warn(message, data);   // Warning-uri în ambele medii
logger.error(message, data);  // Errors în ambele medii
```

#### Funcții Speciale

```typescript
// Log token securizat
logger.logToken('Auth context', jwtToken);
// Output: "Auth context: eyJhbG...c2d"

// Log UUID securizat
logger.logUUID('Company ID', companyId);
// Output: "Company ID: c2e78d7d-...-f68d8cc6e4a1"

// Log API request (URL obfuscat)
logger.logRequest('POST', '/api/auth/login', { username });
// Output: "API Request: POST https://***"

// Log API response (date obfuscate)
logger.logResponse(url, 200, responseData);
// Toate datele sensibile din response sunt obfuscate automat
```

### Ce Date Sunt Obfuscate Automat

Funcția `maskSensitiveData()` detectează și obfuscă automat:

| Tip Date | Pattern Detectat | Format Obfuscat | Exemplu |
|----------|------------------|-----------------|---------|
| JWT Token | `token`, `jwt`, `authorization`, `bearer` | eyJhbG...c2d | eyJhbGciOi...9b8c |
| UUID | `uuid`, `id` + format valid | f74b89a3-...-cff7039b8c2d | f74b89a3-5801-...-cff7039b8c2d |
| Password | `password`, `pwd`, `secret` | ***PASSWORD:LENGTH_X*** | ***PASSWORD:LENGTH_12*** |
| Email | `email`, `mail` | u***@domain.com | a***@example.com |
| API Key | `apikey`, `api_key` | sk_...xyz | sk_live...xyz |
| IP Address | `ip`, `address` | 192.168.***.** | 192.168.***.** |
| URL | `url`, `uri` | https://domain.com/*** | https://example.com/*** |

### Best Practices Logging

#### ✅ DO (Bine)

```typescript
// 1. Folosește logger, NU console.log direct
logger.info('User logged in');

// 2. Adaugă context util (va fi obfuscat automat)
logger.debug('Processing payment', {
  userId: user.id,        // Auto-obfuscat
  amount: payment.amount, // OK să logezi
  currency: 'RON'         // OK să logezi
});

// 3. Log-uri structurate pentru analiză
logger.error('Payment failed', {
  error: error.message,
  code: error.code,
  userId: maskUUID(user.id) // Explicit masking
});
```

#### ❌ DON'T (Greșit)

```typescript
// 1. NU folosi console.log direct pentru date sensibile
console.log('Token:', user.token); // ❌ VULNERABIL

// 2. NU loga credențiale NICIODATĂ
logger.debug('Login attempt', { 
  username: credentials.username, // ❌ NU FACE ASTA
  password: credentials.password  // ❌ NU FACE ASTA NICIODATĂ
});

// 3. NU loga UUID-uri întregi neobfuscate
console.log('User ID:', user.id); // ❌ Folosește maskUUID()
```

---

## Autentificare și Autorizare

### Flux Autentificare

```
1. User -> POST /api/auth/login { username, password }
2. Backend verifică credențiale
3. Backend generează JWT cu expiry 15 min
4. Frontend stochează { user, token } în localStorage
5. Frontend adaugă Bearer token în toate request-uri
6. Auto-refresh la fiecare 15 minute
7. Logout -> invalidare token + clear localStorage
```

### JWT Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "id": "user-uuid",
    "companyId": "company-uuid",
    "roles": ["user"],
    "iat": 1234567890,
    "exp": 1234568790
  }
}
```

### Protected Route Example

```typescript
import { useAuth } from '@/hooks/use-auth';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  return <>{children}</>;
}
```

### API Authorization Check

```typescript
// Backend middleware
export function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}
```

---

## Protecție Împotriva Atacurilor

### SQL Injection Protection ✅

**Mecanism:** Drizzle ORM cu prepared statements

```typescript
// ✅ SIGUR - Parametrizat
const users = await db
  .select()
  .from(usersTable)
  .where(eq(usersTable.email, email));

// ❌ NESIGUR - NU FACE NICIODATĂ
const users = await db.execute(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

### XSS Protection ✅

**Mecanism:** React auto-escaping

```typescript
// ✅ SIGUR - React escapes automat
<div>{userInput}</div>

// ⚠️ PERICULOS - Folosește doar cu sanitizare
import DOMPurify from 'dompurify';
const clean = DOMPurify.sanitize(dirtyHTML);
<div dangerouslySetInnerHTML={{ __html: clean }} />
```

### CSRF Protection 🟡

**Status:** Parțial implementat (JWT în Authorization header oferă protecție)

**Recomandare Viitoare:**
```typescript
// Adaugă CSRF token în formulare
<form>
  <input type="hidden" name="_csrf" value={csrfToken} />
  {/* ... */}
</form>
```

### Rate Limiting ⚠️

**Status:** Necesită implementare

**Recomandare:**
```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute
  max: 5,
  message: 'Prea multe încercări. Încercați peste 15 minute.'
});

app.post('/api/auth/login', loginLimiter, authController.login);
```

---

## Gestionarea Secretelor

### Hierarchy of Secrets

1. **Secrets Manager** (Producție) - AWS Secrets Manager, HashiCorp Vault
2. **Environment Variables** (.env files) - Pentru development/staging
3. **Never in Code** - Niciodată hardcodate în cod

### .env File Security

```bash
# 1. Adaugă .env în .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore

# 2. Creează .env.example (fără valori reale)
cp .env .env.example
# Editează .env.example și înlocuiește valori cu placeholders

# 3. Setează permisiuni restrictive
chmod 600 .env
```

### Secret Rotation

**Frecvență Recomandată:**
- JWT_SECRET: La fiecare 90 zile
- Database passwords: La fiecare 90 zile
- API keys externe: Conform provider policy
- După orice incident de securitate: IMEDIAT

**Procedură Rotație JWT:**
```bash
# 1. Generează nou secret
NEW_SECRET=$(openssl rand -base64 64)

# 2. Adaugă ca JWT_SECRET_NEXT în .env
JWT_SECRET_NEXT=$NEW_SECRET

# 3. Modifică backend să accepte ambele
# (verifică token cu JWT_SECRET, apoi cu JWT_SECRET_NEXT)

# 4. După 24h, promovează:
JWT_SECRET=$NEW_SECRET
# Șterge JWT_SECRET_NEXT
```

---

## Deployment Securizat

### Pre-Deployment Checklist

```bash
# 1. Verificare vulnerabilități dependencies
npm audit --production
npm audit fix

# 2. Verificare secrete nu sunt în cod
grep -r "password\|secret\|api[_-]key" apps/ libs/ \
  --include="*.ts" --include="*.tsx" | grep -v "process.env"

# 3. Verificare configurare .ENV production
cat .env.production | grep -E "SECRET|PASSWORD|KEY"
# Toate trebuie să aibă valori unice, nu "changeme"!

# 4. Build production
npm run build

# 5. Test rulare production build local
npm run start:prod

# 6. Verificare logs în production (nu trebuie să aibă debug)
# Accesează aplicația și verifică console
```

### Production Environment Setup

```bash
# 1. Server hardening
apt update && apt upgrade -y
ufw enable
ufw allow 443/tcp
ufw allow 80/tcp
ufw allow 22/tcp

# 2. SSL/TLS Configuration (Let's Encrypt)
certbot --nginx -d geniuserp.app -d www.geniuserp.app

# 3. Nginx reverse proxy cu security headers
# Vezi /configs/nginx.conf

# 4. Database configuration
# - SSL/TLS required
# - Strong password
# - Network isolation

# 5. Monitoring
# - Sentry pentru errors
# - Prometheus + Grafana pentru metrics
# - Wazuh pentru security events
```

### Docker Security

```yaml
# docker-compose.production.yml

services:
  backend:
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET} # Din .env, nu hardcodat!
    networks:
      - internal # Nu expune direct
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
    
  database:
    environment:
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    networks:
      - internal # Doar backend accesează DB
    volumes:
      - postgres_data:/var/lib/postgresql/data:rw
    # NICIODATĂ expune portul 5432 public!
```

---

## Incident Response

### Procedură Incident de Securitate

#### 1. Detectare

**Indicatori de Compromis:**
- Tokeni JWT invalidați masiv
- Spike în failed login attempts
- Access la date din companii nea autorizate
- Modificări neautorizate în DB
- Erori Sentry neobișnuite

#### 2. Containment (Primele 15 minute)

```bash
# IMEDIAT:

# 1. Rotește JWT secrets (invalidează toate sesiunile)
NEW_JWT_SECRET=$(openssl rand -base64 64)
# Actualizează în .env și restart backend

# 2. Verifică logs pentru IP-uri suspecte
grep "Authentication failed" /var/log/geniuserp/backend.log | \
  awk '{print $1}' | sort | uniq -c | sort -rn

# 3. Block IP-uri malițioase în firewall
ufw deny from [SUSPICIOUS_IP]

# 4. Backup database urgent
pg_dump geniuserp > /backups/incident-$(date +%Y%m%d_%H%M%S).sql

# 5. Notifică echipa
```

#### 3. Eradication (Primele 2 ore)

```bash
# 1. Identifică breach point
# - Verifică Sentry errors
# - Verifică access logs
# - Verifică modifications în DB

# 2. Patch vulnerabilitatea
# - Actualizează cod
# - Deploy fix urgent

# 3. Verificare nicio backdoor
grep -r "eval\|exec\|system" apps/ libs/
```

#### 4. Recovery

```bash
# 1. Restore de la backup dacă necesar
# 2. Verificare integritate date
# 3. Test complet funcționalitate
# 4. Monitor încontinuu pentru 48h
```

#### 5. Post-Incident

```markdown
# Incident Report Template

## Incident ID: INC-2025-XXX
**Data:** YYYY-MM-DD HH:MM
**Severitate:** Critical/High/Medium/Low
**Status:** Resolved/In Progress/Investigating

### Timeline
- HH:MM - Incident detectat
- HH:MM - Containment started
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Incident resolved

### Root Cause
[Descriere detaliată]

### Impact
- Utilizatori afectați: X
- Date compromise: Yes/No
- Downtime: X minute

### Remediere
1. [Acțiune 1]
2. [Acțiune 2]

### Prevention
1. [Măsură preventivă 1]
2. [Măsură preventivă 2]

### Lessons Learned
[Ce am învățat]
```

---

## Security Checklist

### Development Checklist (Daily)

- [ ] Nu commit-ui niciodată .env files
- [ ] Folosește `logger` în loc de `console.log`
- [ ] Verifică că nicio parolă/secret nu e hardcodat
- [ ] Run `npm audit` înainte de commit
- [ ] Review code pentru XSS vulnerabilities
- [ ] Test cu user input malițios

### Pre-Commit Checklist

```bash
# Rulează automat cu git hooks

# 1. Linting
npm run lint

# 2. Type checking
npm run type-check

# 3. Security audit
npm audit

# 4. Check pentru secrete expuse
npm run security:check-secrets

# 5. Check pentru hardcoded data
npm run security:check-hardcoded
```

### Pre-Deployment Checklist (Production)

- [ ] ✅ Toate .ENV vars configurate corect
- [ ] ✅ JWT secrets generate securizat (NOT "changeme")
- [ ] ✅ CORS origins set la domeniu production exact
- [ ] ✅ Log level = "error" în production
- [ ] ✅ Sentry configurat și testat
- [ ] ✅ SSL/TLS certificat valid
- [ ] ✅ Database backup automat configurat
- [ ] ✅ Firewall configurat (ufw/iptables)
- [ ] ✅ Rate limiting activat
- [ ] ✅ npm audit fără critical/high vulnerabilities
- [ ] ✅ Monitoring și alerting configurat
- [ ] ✅ Incident response plan documented
- [ ] ✅ Team awareness training completat

### Monthly Security Review

- [ ] Review access logs pentru activitate suspectă
- [ ] Update dependencies (npm update)
- [ ] Run security audit (npm audit)
- [ ] Review Sentry errors pentru patterns
- [ ] Verify backup restoration procedure
- [ ] Review user permissions și roles
- [ ] Check pentru deprecated dependencies
- [ ] Review și update documentație securitate

### Quarterly Security Tasks

- [ ] Rotație JWT secrets
- [ ] Rotație database passwords
- [ ] External penetration testing
- [ ] Security training pentru echipă
- [ ] Review și update incident response plan
- [ ] Audit complet conform OWASP
- [ ] Update security documentation

---

## Raportare Vulnerabilități

### Dacă Descoperi o Vulnerabilitate

**NU:**
- ❌ Nu posta public pe GitHub
- ❌ Nu distribui details înainte de patch

**DA:**
1. ✅ Email urgent la: security@geniuserp.app
2. ✅ Include:
   - Descriere detaliată
   - Steps to reproduce
   - Potential impact
   - Suggested fix (dacă ai)
3. ✅ Așteaptă confirmare (răspuns în 24h)
4. ✅ Permite 90 zile pentru remediere înainte de disclosure public

### Reward Program

Vulnerabilități critice remediate rapid pot fi eligibile pentru:
- Credit în SECURITY.md
- Bounty reward (dacă program activ)
- Mulțumiri publice (cu permisiune)

---

## Resurse și Referințe

### Standards și Guidelines
- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [CWE Top 25](https://cwe.mitre.org/top25/)

### Tools
- [Sentry](https://sentry.io) - Error tracking
- [Snyk](https://snyk.io) - Dependency scanning
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - Vulnerability scanning

### Training
- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
- [Web Security Academy](https://portswigger.net/web-security)

---

## Contact Security Team

**Email:** security@geniuserp.app  
**Response Time:** < 24h pentru critical, < 72h pentru high  
**PGP Key:** [Link to public key]

---

**Versiune Document:** 1.0.0  
**Ultima Actualizare:** 28 Octombrie 2025  
**Următoarea Revizuire:** Decembrie 2025


