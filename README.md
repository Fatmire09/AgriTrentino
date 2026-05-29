# AgriTrentino

> Sistema di supporto decisionale (DSS) per la filiera agricola trentina

AgriTrentino è una web application che affianca l'agricoltore trentino nelle decisioni operative quotidiane, trasformando dati meteorologici e ambientali in indicazioni concrete e personalizzate per ogni appezzamento. Sposta la gestione agricola da una logica **reattiva** a una **proattiva**, riducendo gli sprechi di risorse e aumentando la sostenibilità delle coltivazioni locali.

🌐 **Applicazione live**: https://agritrentino-web.onrender.com

---

## Indice

1. [Funzionalità](#funzionalità)
2. [Stack tecnologico](#stack-tecnologico)
3. [Architettura](#architettura)
4. [Mapping ai requisiti del corso](#mapping-ai-requisiti-del-corso)
5. [Avvio in locale](#avvio-in-locale)
6. [Avvio con Docker](#avvio-con-docker)
7. [Test automatici](#test-automatici)
8. [Applicazione online](#applicazione-online)
9. [Documentazione](#documentazione)
10. [Scelte architetturali e debiti tecnici](#scelte-architetturali-e-debiti-tecnici)
11. [Team e corso](#team-e-corso)

---

## Funzionalità

Il progetto copre due sprint completi per un totale di **65 User Story** (US1–US65).

### Autenticazione e profilo (Sprint #1, US1–US10)
- Registrazione con validazione email/password
- Login con JWT salvato in `localStorage`
- Visualizzazione e modifica del profilo (nome, email, nome azienda)
- Cambio password con verifica della corrente
- Logout

### Gestione appezzamenti e colture (US11–US24)
- CRUD completo degli appezzamenti (nome, coordinate, superficie, pendenza, esposizione)
- Selezione tipologia coltura, varietà e fase fenologica iniziale
- Aggiornamento manuale della fase fenologica durante la stagione
- Calcolo automatico dell'avanzamento fenologico tramite Growing Degree Days (GDD, T<sub>base</sub> 10 °C per Vite)

### Meteo e bilancio idrico (US25–US31)
- Integrazione con **MeteoTrentino** (GeoJSON stazioni + parsing XML)
- Assegnazione automatica della stazione più vicina all'appezzamento (distanza haversine)
- Sincronizzazione periodica con scheduler `node-cron`
- Cache offline + indicatore di stato (`ok` / `offline_con_cache` / `offline_senza_cache` / `mai_sincronizzato`)
- Grafici dell'andamento delle ultime 48 ore (temperatura, umidità, precipitazioni)
- Bilancio idrico giornaliero con modello **Hargreaves-Samani** + tank model

### Indici di rischio (US32–US36, US40)
- **Indice fitosanitario** (peronospora della Vite): modello UR > 80% + T in [15, 25] °C su finestra di 48h, pesato per suscettibilità della fase fenologica
- **Indice climatico**: tre minacce valutate in parallelo (gelate da T<sub>min</sub>, stress termico da T<sub>max</sub>, eccesso di umidità) con minaccia dominante
- Scala cromatica semaforica (basso / medio / alto) tramite componente `SemaforoRischio` riusabile
- Storico indici a 12 mesi con seed per il demo
- Raccomandazioni operative per ogni livello

### Notifiche (US37–US39)
- Generazione automatica al superamento di soglie critiche, con deduplicazione sulle non-lette
- Centro notifiche in-app con badge non-lette in Navbar
- Marcatura come letta al click sulla singola notifica

### Registro interventi (US41–US46)
- Registrazione di trattamenti fitosanitari (principio attivo, quantità, unità di misura) e irrigazioni (volume d'acqua)
- **Classificazione automatica** rispetto al rischio del momento: `Giustificato`, `Superfluo`, `Non valutabile`
- Filtri per tipologia e periodo, modifica e cancellazione con conferma

### Dashboard di sostenibilità (US47–US53)
- Stato vuoto per nuovi account con CTA
- **Percentuale di interventi giustificati** con grafico ciambella (recharts PieChart)
- Selezione annata storica
- Stima del **risparmio idrico** vs. gestione "a calendario" (200 L/sett × 26 sett per campo irrigato)
- Stima del **risparmio chimico** vs. baseline (8 trattamenti × 2 kg per campo trattato)
- Trend stagionale del rischio medio (LineChart 12 mesi)
- Monitoraggio dei consumi per appezzamento + periodo selezionabile

### Export PDF del report (US54)
- Generazione lato server con `pdfkit`
- Download via `fetch` + `blob` (header `Authorization` richiesto)
- Contenuto: dati azienda + indicatori chiave dell'annata

### Modulo di simulazione meteo (US55–US59)
> Mappa diretta su **D1 RF16** e **D2 §2.5**.

- Pagina top-level `/simulatore` con selettore campo
- Modifica manuale dei 4 parametri (T<sub>min</sub>, T<sub>max</sub>, UR media, precipitazioni)
- **Ricalcolo in tempo reale** degli indici (debounce 500 ms) tramite `simulatoreService` dedicato
- **Grafico comparativo** reale vs simulato (BarChart recharts) + tabella delta meteo
- **Avviso valori atipici** (D2 §2.5.2 `ParametriSimulazione.isValid()`): banner + bordi rossi sugli input fuori range plausibile
- **Reset** ai valori reali (D2 §2.5.1 `Simulazione.reset()`) con refetch della sync più recente

### Requisiti non funzionali (US60–US65)
- **Prestazioni < 2s** (RFN01): gzip compression + Mongoose `.lean()` + indici DB + code splitting `React.lazy`
- **Modularità** (RFN05): separazione netta dei layer (modelli, route, servizi, componenti)
- **Test automatici** (RFN06): Jest + supertest + `mongodb-memory-server`, copertura 100% sui modelli critici
- **Containerizzazione** (RFN07): `docker-compose` con tre servizi (mongo, server, client/nginx)
- **Controllo accessi** (RFN08): JWT + filtro `ownerId` su ogni risorsa, suite test dedicata
- **Conformità GDPR** (RFN09): bcrypt per password, HTTPS via Render, cancellazione a cascata (`DELETE /auth/me`), documentazione in `docs/gdpr.md`

### Deploy in produzione (US64)
- Render Blueprint (`render.yaml`) con Web Service backend + Static Site frontend
- MongoDB Atlas come database cloud
- HTTPS/TLS gestito automaticamente da Render
- Health check endpoint `/api/v1/health`

---

## Stack tecnologico

| Layer | Tecnologia |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router, recharts, lucide-react |
| Backend | Node.js, Express, MongoDB con Mongoose |
| Auth | JWT (`jsonwebtoken`), bcrypt |
| Schedulazione | `node-cron` |
| API esterne | MeteoTrentino (REST + XML) |
| Export PDF | `pdfkit` |
| Compressione | `compression` (gzip) |
| Test | Jest, supertest, `mongodb-memory-server` |
| Container | Docker, docker-compose, nginx (per il frontend statico) |
| Hosting | Render (Web Service + Static Site) |
| Database cloud | MongoDB Atlas |
| Documentazione API | API Blueprint (Apiary) |

---

## Architettura

```
AgriTrentino/
├── client/                      # Single Page Application React
│   ├── src/
│   │   ├── pages/               # 11 pagine top-level (Dashboard, FieldDetail, Simulatore, ...)
│   │   ├── components/          # Componenti riusabili (SemaforoRischio, ConfirmDialog, Navbar, ...)
│   │   └── config.js            # API_URL parametrizzato per locale / Docker / produzione
│   ├── Dockerfile               # Multi-stage build Vite → nginx:alpine
│   └── nginx.conf               # Rewrite SPA + headers
├── server/                      # API REST Express
│   ├── models/                  # Schema Mongoose con indici DB già a tempo di design
│   ├── routes/                  # 14 file di route (auth, fields, colture, meteo, indici, ...)
│   ├── services/                # Logica business (rischio fitosanitario/climatico, classificazione interventi, simulatore, cancellazione GDPR)
│   ├── middleware/              # requireAuth (JWT)
│   ├── tests/                   # 5 suite Jest + setup
│   └── Dockerfile               # node:20-slim + npm ci --omit=dev
├── docs/
│   ├── apiary/apiary.apib       # Documentazione API completa (Apiary Blueprint)
│   ├── testing/                 # 65 test report (uno per User Story)
│   ├── controllo-accessi.md     # Note RFN08
│   └── gdpr.md                  # Note RFN09
├── docker-compose.yml           # Tre servizi: mongo + server + client
├── render.yaml                  # Blueprint deploy Render
└── .env.example                 # Template per la configurazione locale
```

**Convenzioni del progetto:**
- API REST montate su `/api/v1/...`
- Risorse nidificate al campo: `/api/v1/fields/:fieldId/...` (interventi, meteo, indici, simulatore, ...)
- Tutte le route che leggono o modificano dati richiedono header `Authorization: Bearer <token>` JWT
- Filtro `ownerId` applicato server-side su ogni risorsa per garantire l'isolamento dei dati tra utenti (RFN08)

---

## Mapping ai requisiti del corso

I documenti **D1** (requisiti) e **D2** (modello di analisi) sono mappati esplicitamente nelle User Story e nelle sezioni "Coerenza con D1/D2" dei test report.

| Requisito D1 | Coperto da | Note |
|---|---|---|
| RF01–RF11 | US1–US11 (Sprint #1) | Auth + gestione utente + lista appezzamenti |
| RF12 — Calcolo indice fitosanitario | US33 | Modello peronospora pesato per fase fenologica |
| RF13 — Visualizzazione semaforica | US34, US36 | Componente `SemaforoRischio` con tooltip |
| RF14 — Indice climatico alpino | US35 | Gelate + stress termico + eccesso UR |
| RF15 — Notifiche | US37–US39 | Centro notifiche + cron di generazione |
| RF16 — Modulo simulazione | US55–US59 | Vedi sezione *Modulo di simulazione meteo* |
| RF17 — Registro interventi | US41–US46 | CRUD + filtri + modifica + eliminazione |
| RF18 — Classificazione interventi | US43 | Confronto con indice di rischio del giorno |
| RF19 — Dashboard sostenibilità | US47–US53 | Indicatori + grafici + monitoraggio consumi |
| RF20 — Report PDF | US54 | Generato lato server con `pdfkit` |
| **RFN01 Prestazioni < 2s** | US60 | gzip + `.lean()` + indici DB + code splitting |
| **RFN02 Scalabilità** | trasversale | Indici DB, cache, statelessness API |
| **RFN05 Modularità** | trasversale + US61 | Layer separati + tre container indipendenti |
| **RFN06 Qualità + test** | US65 | Suite Jest con copertura ≥ 89% sui componenti critici |
| **RFN07 Containerizzazione** | US61 | `docker-compose` con 3 servizi |
| **RFN08 Controllo accessi** | US62 | JWT + `ownerId` + suite di test dedicata |
| **RFN09 GDPR** | US63 | bcrypt + HTTPS + cancellazione a cascata |

**Mapping a D2 (classi del modulo simulazione, §2.5):**

| Classe D2 | Operazione | Implementazione |
|---|---|---|
| `Simulazione` | `generaGraficoComparativo(reali, simulati)` | `Simulatore.jsx`: BarChart recharts con i due scenari + delta |
| `Simulazione` | `confrontaConReale` | Tabella delta meteo + delta indici sotto il grafico |
| `Simulazione` | `reset()` | Bottone "Ripristina valori reali" + refetch `/stato-iniziale` (US59) |
| `ParametriSimulazione` | `isValid()` | `validaParametriSimulazione` in `simulatoreService.js` + banner UI (US58) |

---

## Avvio in locale

### Prerequisiti
- **Node.js** ≥ 18
- **MongoDB** in locale (oppure stringa di connessione MongoDB Atlas)

### Configurazione
Crea un file `server/.env` (copia da `.env.example` e adatta):

```env
MONGODB_URI=mongodb://localhost:27017/agritrentino
JWT_SECRET=stringa-segreta-randomica-min-32-caratteri
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

### Setup

Terminale 1 — backend (da avviare per primo):
```bash
cd server
npm install
npm run dev          # → http://localhost:3001
```

Terminale 2 — frontend:
```bash
cd client
npm install
npm run dev          # → http://localhost:5173
```

Apri il browser su http://localhost:5173, registrati e procedi.

---

## Avvio con Docker

L'intero stack (MongoDB + backend + frontend) si avvia con un **singolo comando** grazie a Docker Compose (D1 RFN07).

### Prerequisiti
- **Docker** e **Docker Compose** installati

### Avvio
```bash
# Personalizza le variabili d'ambiente (facoltativo)
cp .env.example .env

# Build e avvio dei tre servizi
docker compose up --build
```

L'applicazione sarà disponibile su:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001/api/v1
- **MongoDB**: localhost:27017

### Arresto
```bash
docker compose down       # ferma e rimuove i container
docker compose down -v    # rimuove anche il volume del database
```

### Servizi
| Servizio | Immagine / Build | Porta |
|---|---|---|
| `mongo` | `mongo:7` | 27017 |
| `server` | `./server` (node:20-slim) | 3001 |
| `client` | `./client` (multi-stage Vite → nginx:alpine) | 5173 |

---

## Test automatici

Suite Jest + supertest + `mongodb-memory-server` (database in-memory per test isolati e ripetibili).

```bash
cd server
npm test                  # esegue tutte le suite
npm run test:coverage     # con report di copertura
```

**Suite presenti:**

| File | User Story | Test | Cosa verifica |
|---|---|---|---|
| `auth.test.js` | US1–US7 | 8 | Register, login (ok/ko), rotta protetta `/me`, change password |
| `fields.test.js` | US11–US19 | 5 | CRUD appezzamenti + isolamento per utente |
| `interventi.test.js` | US41–US46 | 5 | POST trattamento/irrigazione + validazione + GET lista |
| `access-control.test.js` | US62 | 7 | Cross-user 403 su tutte le risorse |
| `gdpr.test.js` | US63 | 3 | Cancellazione a cascata + 401 |

**Copertura sui componenti critici (RFN06):**
- Modelli `Field`, `IndiceRischio`, `DatiMeteo`: **100%**
- `classificazioneInterventoService` (RF18): **89%**
- `User`: 88% · `Intervento`: 85%
- Rotte `auth` e `interventi`: ~46%

> La copertura globale (~32%) è concentrata sui componenti business-critical come previsto da RFN06, lasciando fuori dallo scope di Sprint #2 i servizi non critici (es. scheduler periodico meteo).

---

## Applicazione online

L'applicazione è deployata su **Render** ed è accessibile pubblicamente:

- **Frontend**: https://agritrentino-web.onrender.com
- **Backend API**: https://agritrentino-api.onrender.com/api/v1
- **Health check**: https://agritrentino-api.onrender.com/api/v1/health

Architettura del deploy:
- **Backend**: Render Web Service Node con `process.env.PORT`
- **Frontend**: Render Static Site servito da CDN, build Vite con `VITE_API_URL` configurabile come build-arg
- **Database**: MongoDB Atlas (cluster cloud, network access aperto a Render)
- **HTTPS/TLS** gestito automaticamente da Render

<<<<<<< HEAD
> **Cold start (piano gratuito Render)**: i servizi vanno in stand-by dopo periodi di inattività; il primo accesso può richiedere ~50 secondi per il "risveglio". Le richieste successive sono immediate.
=======
## Crediti immagini

Le immagini della landing page provengono da fonti libere:
- Foto Unsplash (licenza Unsplash, libera per uso commerciale)
- "Val di Cembra - Cembra e Faver visti da Sevignano" — Syrio, CC BY-SA 3.0, via Wikimedia Commons
- "Vigneti con vista su Paganella e Brenta" — CC BY-SA 4.0, via Wikimedia Commons

## Team
>>>>>>> a94a651bc0787acd2678d6d6665f4c57fbd2d14c

---

## Documentazione

| Documento | Contenuto |
|---|---|
| [`docs/apiary/apiary.apib`](docs/apiary/apiary.apib) | Specifica completa dell'API REST in API Blueprint (Auth, Appezzamenti, Colture, Meteo, Indici di rischio, Notifiche, Interventi, Dashboard sostenibilità, Consumi, Simulatore meteo) |
| [`docs/testing/`](docs/testing/) | 65 test report (uno per User Story) con sezioni "Coerenza con D1/D2" dove pertinente |
| [`docs/controllo-accessi.md`](docs/controllo-accessi.md) | Note sull'implementazione di RFN08 |
| [`docs/gdpr.md`](docs/gdpr.md) | Note sull'implementazione di RFN09 |

L'Apiary può essere visualizzata su [apiary.io](https://apiary.io/) caricando il file `.apib`, oppure resa offline con tool come `aglio`.

---

## Scelte architetturali e debiti tecnici

Trasparenza sulle decisioni del team durante lo sviluppo, annotate per consapevolezza piuttosto che lasciate implicite.

- **Logica simulatore distinta da quella degli indici reali**. Il `simulatoreService` (US56) applica una versione semplificata-ma-coerente del modello peronospora/gelate/UR su input scalari, lasciando intatti i service reali `rischioFitosanitarioService` (US33) e `rischioClimaticoService` (US35) che lavorano su serie di 48h dal DB. Questo isola il simulatore senza accoppiarsi al modello "pesante" usato in dashboard.
- **Orizzonte di simulazione**: UC-06 del D1 menziona una proiezione su 7 giorni. L'implementazione di Sprint #2 calcola un **valore istantaneo** dello scenario simulato; un forecast a 7 giorni richiederebbe un nuovo modello previsionale + un `LineChart` temporale. Annotato come debito tecnico nel test report US57.
- **Soglie e baseline della dashboard di sostenibilità** (200 L/sett × 26 sett per il risparmio idrico, 8 trattamenti × 2 kg per il risparmio chimico) sono fissate come costanti riferite a uno scenario tipico di Vite in Trentino. Sono parametri esposti nel codice (`server/routes/dashboard.js`) e facilmente estendibili a tabelle per coltura nelle iterazioni successive.
- **Copertura test ~32% globale** ma 100%/89% sui componenti critici, in linea con l'ambito di RFN06.

---

## Team e corso

| Membro | Email |
|---|---|
| Ada Sofia Antico | adasofia.antico@studenti.unitn.it |
| Fatmire Emush | fatmire.emush@studenti.unitn.it |
| Alessia Giunta | alessia.giunta@studenti.unitn.it |

**Corso**: Ingegneria del Software — Università di Trento, A.A. 2025/2026