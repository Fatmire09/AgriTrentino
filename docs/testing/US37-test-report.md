# Test Report — US37 Generazione notifiche al superamento soglia

## Obiettivo

Generare automaticamente una notifica in-app quando un indice di rischio (fitosanitario o climatico) raggiunge il livello **alto**, così che l'agricoltore reagisca senza controllare la dashboard.

## Schema dati — modello `Notifica`

- [x] Campi: `userId`, `appezzamentoId`, `campoNome`, `tipoRischio` (`fitosanitario`|`climatico`), `minaccia`, `livello`, `messaggio`, `letta` (default false), timestamps
- [x] Indice `userId + createdAt` per recupero veloce delle notifiche dell'utente

## Service `notificheService.js`

- [x] `generaNotifiche()` — itera tutti i campi, calcola indice fitosanitario + climatico, crea notifica se livello "alto"
- [x] `creaNotificaSeNecessario()` — **dedup**: non crea una nuova notifica se ne esiste già una **non letta** per lo stesso campo + tipo di rischio
- [x] Errore su un campo non blocca gli altri (loop resiliente)
- [x] Riusa i service indici di US33/US35 (nessuna duplicazione del calcolo)

## Cron giornaliero

- [x] Cron `0 2 * * *` (02:00 Europe/Rome), dopo il cron fenologia (01:00)
- [x] Log all'avvio: `[notifiche cron] Avviato...`
- [x] Log a fine esecuzione con il numero di notifiche create

## Endpoint `GET /api/v1/notifiche`

- [x] Senza token → 401
- [x] Con token → 200 con `{ notifiche: [...], nonLette: N }` (solo dell'utente, max 100, più recenti prima)

## Frontend

- [x] Campanello in `Navbar` (desktop), visibile da loggati
- [x] Badge rosso col conteggio non lette (`9+` se > 9), nascosto se 0
- [x] Click sul campanello → apertura del centro notifiche demandata a US38

## Coerenza con il design

- [x] **Criterio di accettazione backlog**: "rischio alto su un campo → notifica con campo, tipo di rischio e livello" ✓ (il `messaggio` contiene `campoNome`, `tipoRischio`, `livello`)
- [x] "senza dover controllare la dashboard" → indicatore sempre visibile in Navbar ✓
- [x] Prepara US38 (centro notifiche) e US39 (segna come letta — il campo `letta` è già nel modello)

## Casi limite

- [x] Campo senza coltura/fase → indice fitosanitario null (nessuna notifica fito); climatico comunque valutato
- [x] Nessun dato meteo nelle 48h → indici null → nessuna notifica
- [x] Doppia esecuzione del cron → nessun duplicato (dedup sulle non lette)
- [x] Indici a livello basso/medio → nessuna notifica (solo "alto")

## Procedura demo / generazione manuale

Per testare senza aspettare le 02:00:

1. Prepara un campo con condizioni di rischio **alto** (es. climatico-gelate: 48h con `Tmin -3°C`, esposizione Nord, fase germogliamento; oppure fitosanitario: 48h con `UR > 80%` e `15-25°C`, fase fioritura) inserendo/seedando i `DatiMeteo`.
2. Esegui la generazione a mano:
```bash
cd ~/AgriTrentino/server
node -e "require('dotenv').config({path:'../.env'}); const m=require('mongoose'); const s=require('./services/notificheService'); (async()=>{await m.connect(process.env.MONGODB_URI||'mongodb://localhost:27017/agritrentino'); console.log(await s.generaNotifiche()); await m.disconnect();})();"
```
Atteso: `{ totaleCampi: N, create: >= 1, errori: 0 }`
3. `GET /api/v1/notifiche` → la notifica compare con `campoNome`, `tipoRischio`, `livello: "alto"`.
4. In Navbar (da loggati) → il campanello mostra il badge col conteggio.
5. Riesegui il comando → `create: 0` (la dedup funziona: la notifica è ancora non letta).

## Note

US37 introduce la prima **persistenza derivata dagli indici** (modello `Notifica`). Gli indici restano calcolati on-demand per la consultazione, ma il cron li valuta periodicamente per generare gli alert. Il centro notifiche (US38) e "segna come letta" (US39) si costruiscono sopra questa base (campo `letta` già predisposto).