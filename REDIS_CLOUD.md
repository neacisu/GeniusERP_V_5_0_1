# Instrucțiuni pentru utilizarea Redis Cloud cu GeniusERP

Acest document oferă instrucțiuni detaliate pentru configurarea și utilizarea Redis Cloud cu sistemul GeniusERP, eliminând necesitatea unui container Redis local și îmbunătățind fiabilitatea și scalabilitatea aplicației.

## De ce Redis Cloud?

Redis Cloud oferă numeroase avantaje față de un container Redis local:

1. **Disponibilitate ridicată**: Redis Cloud oferă un SLA de 99,99% uptime
2. **Scalabilitate automată**: Fără limitări de memorie sau conexiuni
3. **Backup-uri automate**: Datele sunt protejate prin backup-uri regulate
4. **Monitorizare și alerte**: Vizibilitate completă a performanței
5. **Securitate îmbunătățită**: Criptare TLS, firewall și autentificare robustă

## Obținerea credențialelor Redis Cloud

Pentru a configura Redis Cloud pentru GeniusERP:

1. Creați un cont gratuit pe [Redis Cloud](https://redis.com/try-free/)
2. Creați o bază de date nouă (plan gratuit disponibil cu 30MB)
3. Selectați regiunea cea mai apropiată de locația serverului VPS
4. După crearea bazei de date, accesați pagina de detalii a bazei de date
5. Obțineți următoarele informații din secțiunea "Configuration":
   - **REDIS_URL**: URL-ul complet de conectare
   - **REDIS_HOST**: Numele de host (exemplu: redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com)
   - **REDIS_PORT**: Portul (exemplu: 12345)
   - **REDIS_PASSWORD**: Parola
   - **REDIS_USERNAME**: De obicei "default" pentru versiunea gratuită

## Configurarea GeniusERP cu Redis Cloud

### Variabile de mediu

Pentru ca GeniusERP să utilizeze Redis Cloud, trebuie să setați următoarele variabile de mediu:

```
REDIS_URL=redis://username:password@host:port
REDIS_HOST=host.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=your_password
REDIS_USERNAME=default
```

### Configurare Docker Compose

Configurațiile `docker-compose.yml` și `docker-compose.prod.yml` au fost actualizate pentru a utiliza Redis Cloud. Principalele modificări:

1. Eliminarea containerului Redis local
2. Adăugarea variabilelor de mediu Redis Cloud în serviciul app
3. Eliminarea dependinței de containerul Redis
4. Eliminarea volumului redis_data

### Testarea conexiunii Redis Cloud

Pentru a verifica dacă aplicația se conectează corect la Redis Cloud:

1. Verificați logurile aplicației, ar trebui să vedeți:
   ```
   Redis Cloud note: Using volatile-lru policy instead of noeviction. Some features may be affected.
   Connected to Redis Cloud successfully
   [bullmq] Redis connection established for BullMQ queues
   ```

2. Sau puteți testa direct conexiunea cu:
   ```bash
   redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD ping
   ```
   Ar trebui să primiți răspunsul `PONG`.

## Migrarea datelor către Redis Cloud

Dacă aveți date importante în Redis-ul local, puteți migra datele către Redis Cloud astfel:

1. Obțineți un dump al datelor Redis locale:
   ```bash
   docker exec -it geniuserp-redis redis-cli SAVE
   docker cp geniuserp-redis:/data/dump.rdb ./dump.rdb
   ```

2. Utilizați utilitarul `redis-rdb-tools` pentru a converti dump-ul în format Redis commands:
   ```bash
   rdb --command protocol ./dump.rdb > redis_commands.txt
   ```

3. Încărcați datele în Redis Cloud:
   ```bash
   cat redis_commands.txt | redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD --pipe
   ```

## Monitorizarea și administrarea Redis Cloud

Redis Cloud oferă un dashboard complet pentru monitorizarea și administrarea bazei de date:

1. **Monitorizare performanță**: Vizualizați statistici despre utilizarea memoriei, CPU, etc.
2. **Gestionare conexiuni**: Vedeți și administrați conexiunile active
3. **Browser de date**: Vizualizați și editați datele stocate
4. **Configurare**: Ajustați setările bazei de date după necesități

## Troubleshooting Redis Cloud

Probleme comune și soluții:

1. **Connection refused**:
   - Verificați dacă host-ul și portul sunt corecte
   - Verificați dacă firewall-ul permite conexiuni pe portul specificat

2. **Authentication failed**:
   - Verificați dacă parola și username-ul sunt corecte
   - Asigurați-vă că utilizați URL-ul complet cu credențialele

3. **Out of memory errors**:
   - Considerați upgrade-ul planului Redis Cloud
   - Optimizați aplicația pentru a stoca mai puține date în Redis

4. **Performanță scăzută**:
   - Verificați latența rețelei între serverul VPS și Redis Cloud
   - Alegeți o regiune Redis Cloud mai apropiată de serverul VPS

Pentru asistență suplimentară, consultați [documentația Redis Cloud](https://docs.redis.com/latest/rc/).