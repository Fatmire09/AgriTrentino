# AgriTrentino

Piattaforma digitale di supporto decisionale (DSS) per la filiera agricola trentina.

## Descrizione

AgriTrentino è una Web Application che affianca gli agricoltori del Trentino nelle decisioni operative quotidiane, trasformando dati meteorologici, fitosanitari e ambientali in indicazioni concrete e personalizzate per ogni appezzamento.

Il sistema sposta la gestione agricola da una logica **reattiva** a una logica **proattiva**, riducendo sprechi di risorse e aumentando la sostenibilità delle coltivazioni locali.

## Funzionalità principali

- **Indici di rischio personalizzati**: scala cromatica semaforica basata su dati meteo in tempo reale e profilo dell'appezzamento
- **Modulo di simulazione**: scenari ipotetici per pianificare interventi in anticipo
- **Monitoraggio della sostenibilità**: registro digitale degli interventi con feedback sull'efficienza decisionale

## Stack tecnologico

| Layer       | Tecnologia                                  |
|-------------|---------------------------------------------|
| Frontend    | React 18, Vite, Tailwind CSS, React Router  |
| Backend     | Node.js, Express, MongoDB (Mongoose)        |
| Auth        | JWT (jsonwebtoken), bcrypt                  |
| Docs API    | Apiary (API Blueprint)                      |

## Struttura del progetto

```
AgriTrentino/
├── client/                    
│   └── src/
│       ├── pages/             
│       └── components/        
├── server/                   
│   ├── models/                
│   ├── routes/                
│   └── middleware/          
└── docs/
    ├── apiary/                
    └── testing/               
```

## Stato attuale (Sprint #1 completato)

- Landing page informativa
- Registrazione, login, logout (JWT)
- Visualizzazione, modifica profilo e cambio password
- Aggiunta e lista appezzamenti

## Avvio in locale

### Prerequisiti
- Node.js ≥ 18
- MongoDB attivo in locale (o stringa MongoDB Atlas)

### Configurazione
Crea un file `server/.env` con:
```
MONGODB_URI=mongodb://localhost:27017/agritrentino
JWT_SECRET=una-stringa-segreta-qualsiasi
PORT=3001

```

### Setup
```bash

# Backend (avvia per prima)
cd server
npm install
npm run dev          # http://localhost:3001

# Frontend (in un altro terminale)
cd client
npm install
npm run dev          # http://localhost:5173
```
## Avvio con Docker (docker-compose)

In alternativa all'avvio manuale, l'intero stack (MongoDB + backend + frontend)
si avvia con un solo comando grazie a Docker (RFN07 del D1).

### Prerequisiti
- Docker e Docker Compose installati

### Avvio
```bash
# (opzionale) personalizza le variabili d'ambiente
cp .env.example .env

# build e avvio di tutti i servizi
docker compose up --build
```

L'applicazione sarà disponibile su:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001/api/v1
- MongoDB: localhost:27017

### Arresto
```bash
docker compose down        # ferma i container
docker compose down -v     # ferma e cancella anche il volume del database
```

### Servizi
| Servizio | Immagine / Build  | Porta |
|----------|-------------------|-------|
| mongo    | mongo:7           | 27017 |
| server   | ./server          | 3001  |
| client   | ./client (nginx)  | 5173  |

## Applicazione online (Render)

L'applicazione è deployata su Render ed è accessibile pubblicamente:

- **Frontend**: https://agritrentino-web.onrender.com
- **Backend API**: https://agritrentino-api.onrender.com/api/v1
- **Health check**: https://agritrentino-api.onrender.com/api/v1/health

> Nota: sul piano gratuito di Render i servizi vanno in stand-by dopo inattività;
> il primo accesso può richiedere ~50 secondi per il "risveglio".

## Team

- Ada Sofia Antico: adasofia.antico@studenti.unitn.it
- Fatmire Emush: fatmire.emush@studenti.unitn.it
- Alessia Giunta: alessia.giunta@studenti.unitn.it

## Corso

Ingegneria del Software: Università di Trento, A.A. 2025/2026
