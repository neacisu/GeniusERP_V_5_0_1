# GHID DE TESTARE - AUTENTIFICARE MODULUL INVENTORY

## TESTE PENTRU ENDPOINT-UL DE REFRESH TOKEN

### Test 1: Refresh Token Valid
```bash
# 1. Obține un token prin login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test_user", "password": "test_password"}'

# 2. Folosește token-ul pentru refresh
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Rezultat așteptat: 200 OK cu un token nou
```

### Test 2: Refresh Token Invalid
```bash
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid_token"

# Rezultat așteptat: 401 Unauthorized
```

## TESTE PENTRU STRUCTURA JWT ÎMBUNĂTĂȚITĂ

### Test 3: Verificare Payload JWT
```bash
# 1. Obține token prin login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test_user", "password": "test_password"}' | jq -r '.token')

# 2. Decodează token-ul (folosind jwt.io sau un tool local)
echo $TOKEN | cut -d'.' -f2 | base64 -d | jq

# Verifică că payload-ul conține:
# - id
# - userId (alias pentru id)
# - companyId
# - company_id (pentru compatibilitate)
# - permissions
# - roles
```

## TESTE PENTRU VALIDAREA COMPANY ACCESS

### Test 4: Acces la Warehouses - Companie Proprie
```bash
curl -X GET http://localhost:5000/api/inventory/warehouses \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Rezultat așteptat: 200 OK cu lista warehouse-urilor companiei
```

### Test 5: Acces Cross-Company (Trebuie să eșueze)
```bash
curl -X GET http://localhost:5000/api/inventory/warehouses?companyId=other_company_id \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Rezultat așteptat: 403 Forbidden
```

### Test 6: Creare Warehouse cu Company ID Automat
```bash
curl -X POST http://localhost:5000/api/inventory/warehouses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Test Warehouse",
    "type": "depozit",
    "location": "Test Location"
  }'

# Verifică că warehouse-ul este creat cu company ID-ul utilizatorului
```

## TESTE PENTRU FRONTEND

### Test 7: Verificare Eliminare Header-uri Custom
```javascript
// În browser console, pe o pagină inventory:
// Verifică că request-urile nu mai conțin X-Company-ID sau X-User-ID
console.log('Monitoring network requests...');

// Deschide Network tab în DevTools și fă o acțiune în inventory
// Verifică că request-urile conțin doar Authorization: Bearer token
```

### Test 8: Testare Refresh Automat
```javascript
// În browser console:
// Simulează expirarea token-ului
localStorage.setItem('user', JSON.stringify({
  ...JSON.parse(localStorage.getItem('user')),
  token: 'expired_token'
}));

// Încearcă o acțiune în inventory - ar trebui să se facă refresh automat
```

## TESTE DE SECURITATE

### Test 9: Verificare Cross-Company Data Leak
```bash
# 1. Creează 2 utilizatori în companii diferite
# 2. Obține token pentru primul utilizator
# 3. Încearcă să accesezi datele celei de-a doua companii

curl -X GET http://localhost:5000/api/inventory/warehouses \
  -H "Authorization: Bearer USER1_TOKEN" \
  -H "X-Company-ID: COMPANY2_ID"

# Rezultat așteptat: 403 Forbidden (header-ul X-Company-ID nu mai este folosit)
```

### Test 10: Verificare Token Expiry Handling
```bash
# Folosește un token expirat
curl -X GET http://localhost:5000/api/inventory/warehouses \
  -H "Authorization: Bearer EXPIRED_TOKEN"

# Rezultat așteptat: 401 Unauthorized
```

## TESTE DE PERFORMANȚĂ

### Test 11: Verificare Overhead Middleware
```bash
# Măsoară timpul de răspuns cu și fără middleware
time curl -X GET http://localhost:5000/api/inventory/warehouses \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Overhead-ul ar trebui să fie minimal (<10ms)
```

## CHECKLIST FINAL

- [ ] Endpoint `/api/auth/refresh` funcționează
- [ ] Token-urile JWT conțin toate câmpurile necesare
- [ ] Header-urile custom au fost eliminate din frontend
- [ ] Middleware-ul de validare company access funcționează
- [ ] Nu există cross-company data leaks
- [ ] Refresh-ul automat funcționează în frontend
- [ ] Erorile de autentificare sunt gestionate corect
- [ ] Performanța nu este afectată semnificativ

## DEBUGGING

### Verificare Logs
```bash
# Server logs pentru autentificare
grep "AuthService\|AuthGuard\|CompanyAccess" server.log

# Frontend logs în browser console
# Caută mesaje despre token refresh și autentificare
```

### Verificare Database
```sql
-- Verifică că utilizatorii au company_id setat corect
SELECT id, username, company_id, role FROM users WHERE company_id IS NOT NULL;

-- Verifică că warehouse-urile sunt asociate cu companii
SELECT id, name, company_id FROM warehouses WHERE company_id IS NOT NULL;
``` 