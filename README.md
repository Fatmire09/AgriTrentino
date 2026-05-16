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

# Backend (avvia prima!)
cd server
npm install
npm run dev          # http://localhost:3001

# Frontend (in un altro terminale)
cd client
npm install
npm run dev          # http://localhost:5173
```

## Team

- Ada Sofia Antico: adasofia.antico@studenti.unitn.it
- Fatmire Emush: fatmire.emush@studenti.unitn.it
- Alessia Giunta: alessia.giunta@studenti.unitn.it

## Corso

Ingegneria del Software: Università di Trento, A.A. 2025/2026
