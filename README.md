# AgriTrentino

Piattaforma digitale di supporto decisionale (DSS) per la filiera agricola trentina.

## Descrizione

AgriTrentino è una Web Application che affianca gli agricoltori del Trentino nelle decisioni operative quotidiane, trasformando dati meteorologici, fitosanitari e ambientali in indicazioni concrete e personalizzate per ogni appezzamento.

Il sistema sposta la gestione agricola da una logica **reattiva** a una logica **proattiva**, riducendo sprechi di risorse e aumentando la sostenibilità delle coltivazioni locali.

## Funzionalità principali

- **Indici di rischio personalizzati** — scala cromatica semaforica basata su dati meteo in tempo reale e profilo dell'appezzamento
- **Modulo di simulazione** — scenari ipotetici per pianificare interventi in anticipo
- **Monitoraggio della sostenibilità** — registro digitale degli interventi con feedback sull'efficienza decisionale

## Stack tecnologico

| Layer    | Tecnologia                          |
|----------|-------------------------------------|
| Frontend | React 18, Vite, Tailwind CSS v3     |
| Backend  | Node.js, Express, MongoDB (Mongoose)|
| Docs API | Apiary (API Blueprint)              |

## Struttura del progetto

```
AgriTrentino/
├── client/          # Frontend React
├── server/          # Backend Express
└── docs/            # Documentazione API
```

## Avvio in locale

```bash
# Frontend
cd client
npm install
npm run dev          # http://localhost:5173

# Backend
cd server
npm install
npm run dev          # http://localhost:3001
```

## Team

- Ada Antico
- Fatmire Emush
- Alessia Giunta

## Corso

Ingegneria del Software — Università di Trento, A.A. 2024/2025
