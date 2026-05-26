# Test Report — US47 Stato vuoto dashboard sostenibilità

## Obiettivo

Mostrare un messaggio utile (con link al registro) quando un account apre la dashboard sostenibilità senza dati, così da capire il prossimo passo.

## Backend — `GET /api/v1/dashboard/sostenibilita` (`routes/dashboard.js`)

- [x] Endpoint **globale** (non scoped sul campo): aggrega tutti gli appezzamenti dell'utente (`ownerId`)
- [x] Conta gli interventi su tutti i campi → `{ haInterventi, interventiTotali }`
- [x] Senza token → 401
- [x] Account senza interventi → `haInterventi: false`, `interventiTotali: 0`

## Frontend — pagina Dashboard

- [x] Pagina **top-level**: route `/dashboard` in `App.jsx` (NON una sottosezione)
- [x] Voce **"Dashboard"** nel menu principale (`Navbar`), desktop + mobile
- [x] Stato vuoto: "Nessun dato ancora" + bottone "Vai ai tuoi campi"
- [x] Con interventi: conteggio + nota "indicatori in arrivo"
- [x] Redirect a `/login` se non autenticato

## Coerenza con il design

- [x] **Criterio di accettazione backlog**: account nuovo senza interventi → messaggio informativo con link al registro ✓
- [x] **Requisito esplicito**: la dashboard è nella sezione principale dell'app, non in una sottosezione ✓
- [x] Prepara US48-54 (indicatori di sostenibilità)

## Casi limite

- [x] Nessun campo / nessun intervento → stato vuoto
- [x] Token assente o scaduto → redirect al login
- [x] `haInterventi: true` ma indicatori non ancora implementati → placeholder col conteggio

## Procedura demo

1. Login con un account senza interventi
2. Menu principale → **"Dashboard"**
3. Compare "Nessun dato ancora" + "Vai ai tuoi campi"
4. Registra un intervento su un campo, torna alla Dashboard → mostra il conteggio

## Note

US47 introduce la dashboard sostenibilità come **pagina principale**, con il solo stato vuoto. Gli indicatori veri (% interventi giustificati, risparmio idrico/chimico, trend, export) saranno aggiunti in US48-54 estendendo l'endpoint `/dashboard/sostenibilita`.