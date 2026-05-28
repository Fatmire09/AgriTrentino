# Test Report — US64 Deploy dell'applicazione su Render

## Obiettivo
Verificare che l'applicazione sia pubblicata online su Render (backend + frontend)
con database MongoDB Atlas, accessibile pubblicamente da un URL senza installazioni
lato utente.

## Ambiente di test
- Piattaforma: **Render** (Blueprint da `render.yaml`)
- Database: **MongoDB Atlas** (cluster cloud, network access aperto a Render)
- Branch deployato: `feature/US64-deploy-render`
- URL pubblici:
  - Frontend: https://agritrentino-web.onrender.com
  - Backend: https://agritrentino-api.onrender.com/api/v1

## Configurazione deploy
- [x] Blueprint Render creato dal file `render.yaml` nella root del repo
- [x] Servizio **backend** `agritrentino-api` (Web Service Node, `rootDir: server`)
- [x] Servizio **frontend** `agritrentino-web` (Static Site, `rootDir: client`, publish `dist`)
- [x] Variabili segrete impostate nel dashboard (`sync: false`): `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`, `VITE_API_URL`
- [x] `healthCheckPath: /api/v1/health` configurato per il monitoraggio del backend
- [x] Rewrite SPA (`/* → /index.html`) per il React Router sul Static Site

## Verifiche funzionali (sull'app online)
- [x] `GET /api/v1/health` → **HTTP 200**, body `{"status":"ok","database":"connected"}`
- [x] Backend connesso a **MongoDB Atlas** (`database: connected`)
- [x] Frontend servito su `https://agritrentino-web.onrender.com` → **HTTP 200**
- [x] **CORS**: richiesta con `Origin: https://agritrentino-web.onrender.com` →
      header `access-control-allow-origin` corretto, il frontend può chiamare il backend
- [x] HTTPS attivo su entrambi i servizi (certificati TLS gestiti da Render)

## Coerenza con il design e i requisiti del corso
- [x] Deploy su **Render** come indicato nelle slide del corso ("Deploying")
- [x] Backend: `process.env.PORT` e script `start` già predisposti (richiesti dalle slide)
- [x] Frontend: build Vite servito come Static Site
- [x] `VITE_API_URL` e `CORS_ORIGIN` parametrizzati (US61) → nessun URL hardcoded da cambiare
- [x] L'app è accessibile a chiunque (incluso il docente) senza installare nulla

## Casi limite / note
- [x] Free tier Render: i servizi vanno in stand-by dopo inattività; primo accesso ~50s (cold start). Documentato nel README.
- [x] Stessa `MONGODB_URI` del `.env` locale → l'app online condivide i dati già popolati (utile per la demo).
- [ ] Dopo il merge di US64 in `main`, valutare lo switch del branch di deploy Render da
      `feature/US64-deploy-render` a `main` per gli auto-deploy futuri.

## Segreti e sicurezza
- [x] `JWT_SECRET` di produzione = stringa casuale a 64 hex (non il placeholder)
- [x] `MONGODB_URI` e `JWT_SECRET` impostati solo nel dashboard Render, mai nel repo
- [x] `.env` non tracciato da git (coperto da `.gitignore`)
