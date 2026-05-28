# Test Report — US61 Containerizzazione con docker-compose

## Obiettivo
Verificare che l'intero stack di AgriTrentino (MongoDB + backend Express + frontend
React/nginx) si avvii con un singolo comando `docker compose up --build` e funzioni
end-to-end senza configurazione manuale (RFN07 del D1).

## Ambiente di test
- Runtime: Docker (server 29.x) via Colima su macOS arm64
- Comando: `docker compose up --build`
- File coinvolti: `docker-compose.yml`, `server/Dockerfile`, `client/Dockerfile`,
  `client/nginx.conf`, `client/src/config.js`, `.env.example`

## Configurazione e build
- [x] `docker compose config` → configurazione valida (3 servizi: mongo, server, client)
- [x] Build immagine **backend** (`node:20-slim`, `npm ci --omit=dev`) → completata senza errori
- [x] Build immagine **frontend** multi-stage (build Vite → `nginx:alpine`) → completata senza errori
- [x] `VITE_API_URL` passato come **build arg** al frontend (Vite inlina le env al build time)

## Avvio dei servizi
- [x] `docker compose up -d` avvia 3 container: `agritrentino-mongo`, `agritrentino-server`, `agritrentino-client`
- [x] Tutti e 3 i container in stato **Up**
- [x] Port mapping corretto: mongo `27017`, server `3001`, client `5173→80`
- [x] Volume `mongo-data` creato per la persistenza del database

## Verifiche funzionali (end-to-end)
- [x] Log backend: `MongoDB connesso` (il server raggiunge mongo via hostname interno `mongo`)
- [x] Log backend: scheduler cron avviati (meteo, bilancio, fenologia, notifiche)
- [x] Frontend servito da nginx su `http://localhost:5173` → **HTTP 200**
- [x] `POST /api/v1/auth/register` su backend containerizzato → **HTTP 201**, utente salvato nel MongoDB del container
- [x] `POST /api/v1/auth/login` → restituisce token **JWT** valido
- [x] `GET /api/v1/auth/me` con header `Authorization: Bearer <token>` → **HTTP 200** con dati utente
- [x] CORS: il backend accetta richieste dall'origine del frontend (`CORS_ORIGIN` configurabile via env)

## Arresto
- [x] `docker compose down` ferma e rimuove i container
- [x] `docker compose down -v` rimuove anche il volume del database

## Coerenza con il design
- [x] **RFN07** (D1): "distribuibile tramite contenitori Docker, con un file docker-compose
      che consenta l'avvio completo dell'applicazione [...] senza configurazione manuale" → soddisfatto
- [x] **RFN05** (modularità): i tre layer (DB, API, UI) sono container separati e indipendenti
- [x] Nessuna modifica al comportamento dell'app: i percorsi API restano `/api/v1/...`

## Note
- Il frontend usa `client/src/config.js` (`API_URL` da `VITE_API_URL`) per evitare URL
  hardcoded: stesso codice funziona in locale, in Docker e in deploy.
- Il `CORS_ORIGIN` del backend è parametrizzato: default `http://localhost:5173`,
  sovrascrivibile in produzione (es. dominio Render in US64).
- Per il deploy cloud (US64) MongoDB sarà esterno (MongoDB Atlas); il container `mongo`
  del compose è pensato per sviluppo/demo locale.
