# 🔥 Hot Module Replacement (HMR) Setup

## 📋 Despre HMR

**Hot Module Replacement (HMR)** permite aplicației să se actualizeze **automat în browser** la modificări de cod, **fără restart** și **fără refresh complet al paginii**. Starea aplicației este păstrată!

### ✅ Beneficii:

- ⚡ **Dezvoltare rapidă** - vezi modificările instant
- 🔄 **Păstrarea stării** - nu pierzi datele din formulare
- 🚀 **Productivitate** - nu mai reîncarci manual pagina
- 🎯 **Clear cache automat** - cache-ul este actualizat automat

## 🔧 Configurare

### 1. Setări Vite (`vite.config.ts`)

```typescript
server: {
  watch: {
    usePolling: true,  // Necesar pentru Docker volumes
    interval: 100,     // Verifică fișiere la fiecare 100ms
  },
  hmr: {
    port: 5000,        // Port websocket HMR
    host: '0.0.0.0',   // Permite toate host-urile
    protocol: 'ws',    // Protocol websocket
    clientPort: 5000,  // Browser se conectează la localhost:5000
  },
}
```

### 2. Setări Docker (`docker-compose.yml`)

```yaml
environment:
  # Vite HMR
  - VITE_HMR_PROTOCOL=ws
  - VITE_HMR_HOST=localhost
  - VITE_HMR_PORT=5000
  - VITE_HMR_CLIENT_PORT=5000
  
  # File watching pentru Docker
  - CHOKIDAR_USEPOLLING=true
  - CHOKIDAR_INTERVAL=100
```

### 3. Volumele Docker

Asigură-te că ai volume mount corect pentru a permite watch-ul fișierelor:

```yaml
volumes:
  - .:/app                    # Mount directorul curent
  - /app/node_modules         # Exclude node_modules
```

## 🚀 Cum Funcționează

### 1. **File Watcher (Chokidar)**
   - Monitorizează fișierele pentru modificări
   - Folosește **polling** în Docker (necesita `CHOKIDAR_USEPOLLING=true`)
   - Verifică la fiecare 100ms dacă sunt modificări

### 2. **Vite HMR Server**
   - Procesează modificările detectate
   - Creează patch-uri pentru modulele modificate
   - Trimite update-uri prin websocket

### 3. **Browser Client**
   - Se conectează la websocket HMR (localhost:5000)
   - Primește patch-uri pentru modulele modificate
   - Aplică modificările **fără refresh complet**
   - Păstrează starea aplicației (Redux, React state, etc.)

## 📊 Flow Diagram

```
Modificare cod → Chokidar detectează → Vite procesează
                                              ↓
Browser ← Websocket (ws://localhost:5000) ← HMR Server
   ↓
Aplică patch
   ↓
UI actualizat (stare păstrată!)
```

## 🐛 Troubleshooting

### Problema: HMR nu funcționează în Docker

**Cauze posibile:**

1. **Polling dezactivat**
   ```bash
   # Verifică în docker-compose.yml:
   - CHOKIDAR_USEPOLLING=true
   ```

2. **Volume nu este mounted**
   ```yaml
   # Trebuie să ai:
   volumes:
     - .:/app
   ```

3. **Port blocat**
   ```bash
   # Verifică că portul 5000 este expus:
   ports:
     - "5000:5000"
   ```

4. **Websocket connection failed**
   ```bash
   # În browser console, verifică:
   # WebSocket connection to 'ws://localhost:5000' failed
   
   # Soluție: Repornește containerul
   docker-compose restart app
   ```

### Problema: Modificările nu apar instant

**Soluție:**

1. **Verifică interval-ul de polling:**
   ```bash
   # În docker-compose.yml, scade intervalul:
   - CHOKIDAR_INTERVAL=100  # sau chiar 50
   ```

2. **Hard refresh în browser:**
   ```
   Cmd+Shift+R (Mac)
   Ctrl+Shift+R (Windows/Linux)
   ```

3. **Clear Vite cache:**
   ```bash
   docker-compose exec app rm -rf node_modules/.vite
   docker-compose restart app
   ```

## 🧪 Testare HMR

### Test 1: Modificare componentă React

1. Deschide `client/src/App.tsx`
2. Modifică un text
3. Salvează fișierul (Cmd+S / Ctrl+S)
4. **Rezultat așteptat:** Browser-ul se actualizează instant, fără refresh complet

### Test 2: Modificare CSS/Tailwind

1. Deschide orice componentă cu clase Tailwind
2. Modifică o clasă (ex: `bg-blue-500` → `bg-red-500`)
3. Salvează
4. **Rezultat așteptat:** Culoarea se schimbă instant, fără flash

### Test 3: Modificare hooks/state

1. Completează un formular cu date
2. Modifică logica unui hook
3. Salvează
4. **Rezultat așteptat:** Formularul rămâne completat, logica se actualizează

## 📝 Best Practices

1. **✅ Folosește polling în Docker** - Docker volumes nu emit events native
2. **✅ Verifică websocket connection** - HMR necesită websocket functional
3. **✅ Exclude node_modules** - Nu lăsa volume-ul să suprascrie node_modules
4. **✅ Monitorizează console** - Vite loghează HMR updates în browser console
5. **❌ Nu dezactiva HMR** - Este esențial pentru development experience

## 🔗 Resurse Utile

- [Vite HMR API](https://vitejs.dev/guide/api-hmr.html)
- [Chokidar Documentation](https://github.com/paulmillr/chokidar)
- [Docker Volume Best Practices](https://docs.docker.com/storage/volumes/)

---

**🎉 Cu HMR configurat corect, dezvoltarea devine mult mai rapidă și plăcută!**
