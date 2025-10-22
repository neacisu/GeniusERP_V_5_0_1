# GeniusERP Backend

Sistemul modular de backend pentru aplicația de contabilitate românească GeniusERP.

## Arhitectura Modulară

Aplicația este structurată modular, fiecare modul fiind responsabil pentru un anumit domeniu de business:

### Structura de directoare

```
server/
├── common/               # Servicii comune și utilități
│   └── drizzle/          # Serviciu pentru conexiunea la baza de date
├── migrations/           # Migrațiile bazei de date și date inițiale
├── modules/              # Modulele aplicației
│   ├── auth/             # Modul de autentificare
│   │   ├── controllers/  # Controllere de autentificare
│   │   ├── middleware/   # Middleware-uri de autentificare
│   │   ├── routes/       # Rutele de autentificare
│   │   └── services/     # Servicii de autentificare
│   ├── users/            # Modul pentru gestionarea utilizatorilor
│   ├── accounting/       # Modul pentru operațiuni contabile
│   └── inventory/        # Modul pentru gestionarea inventarului
├── services/             # Servicii generale (Redis, Queue)
└── index.ts              # Punctul de intrare al aplicației
```

### Modulul de Autentificare

Modulul de autentificare gestionează:
- Înregistrarea utilizatorilor
- Autentificarea cu username și parolă
- Generarea și validarea token-urilor JWT
- Middleware-uri pentru rutele protejate

### Modulul de Utilizatori

Gestionează:
- CRUD pentru utilizatori
- Roluri și permisiuni
- Asocierea rolurilor cu utilizatorii

### Modulul de Contabilitate

Include:
- Planul de conturi românesc
- Jurnale contabile
- Rapoarte financiare

### Modulul de Inventar

Responsabil pentru:
- Produse și categorii
- Mișcări de stocuri
- Rapoarte de inventar

## Tehnologii Utilizate

- **Express**: Framework-ul principal pentru API
- **Drizzle ORM**: ORM pentru PostgreSQL
- **BullMQ**: Procesare asincronă a operațiunilor
- **Redis**: Caching și suport pentru BullMQ
- **Passport.js**: Strategii de autentificare
- **JWT**: Token-uri pentru autentificare

## Autentificare și Autorizare

Aplicația folosește:
- Strategia JWT pentru API-uri
- Verificarea rolurilor pentru acces granular
- Sesiuni Express pentru autentificarea tradițională