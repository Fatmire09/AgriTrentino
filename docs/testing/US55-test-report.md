# Test Report — US55 Modifica parametri meteo nel simulatore

## Obiettivo

Permettere all'agricoltore autenticato di modificare manualmente i parametri meteorologici di base (temperatura min/max, UR media, precipitazioni) di un appezzamento, per costruire scenari ipotetici e valutare interventi futuri. Prima User Story del modulo **simulatore meteo** (US55-59).

## Backend — `GET /api/v1/fields/:fieldId/simulatore/stato-iniziale` (`routes/simulatore.js`)

- [x] auth + ownerId → campo altrui = 403, inesistente = 404, ID malformato = 400
- [x] `meteoReale`: aggregazione `$min`/`$max`/`$avg`/`$sum` di `DatiMeteo` nelle **ultime 24h** → `{ tMin, tMax, urMedia, precipitazioni }` (singoli campi `null` se non ci sono rilevazioni; tMin/tMax in °C arrotondati a 1 decimale, urMedia in % intera, precipitazioni in mm a 1 decimale)
- [x] `fase`: fase fenologica della **coltura più recente** del campo (`null` se nessuna coltura)
- [x] `indici`: riuso di `rischioFitosanitarioService.calcolaRischioFitosanitario` (US33) e `rischioClimaticoService.calcolaRischioClimatico` (US35) — calcolo on-demand sulle ultime 48h; possono essere `null` se mancano dati meteo o coltura
- [x] Risposta finale: `{ campoNome, meteoReale, fase, indici: { fitosanitario, climatico } }`
- [x] Mount in `index.js`: `app.use('/api/v1/fields/:fieldId/simulatore', simulatoreRoutes)` (router con `mergeParams: true`)

## Frontend — pagina top-level `/simulatore` (`pages/Simulatore.jsx`)

- [x] **Pagina top-level**, non integrata in FieldDetail — voce **"Simulatore"** nella Navbar (desktop + mobile) accanto a "Dashboard", come da scelta architetturale
- [x] Include `Navbar` (coerente con Dashboard, anche essa top-level)
- [x] Carica i campi dell'utente via `GET /api/v1/fields` → **selettore campo** (dropdown); default = primo campo, ricarica lo stato al cambio
- [x] Sezione **"Stato reale del campo (ultime 24h)"**: 4 tile con i valori reali (T min, T max, UR media, Precipitazioni)
- [x] Sezione **"Parametri simulati"**: 4 input numerici (`type="number"` + `step`), precompilati con i valori reali, modificabili — state locale `params` (servirà a US56 per il ricalcolo)
- [x] Mostra `fase` fenologica corrente se presente
- [x] Stato vuoto: nessun campo → messaggio + link "Vai ai tuoi campi"

## Coerenza con il design

- [x] **Criterio di accettazione backlog**: modificare manualmente i parametri meteorologici per costruire scenari ipotetici ✓
- [x] Architettura: simulatore = sezione **separata** dell'app (non sotto FieldDetail), per dare visibilità al modulo simulatore (US55-59)
- [x] L'endpoint backend resta scoped al campo (`/fields/:id/simulatore/stato-iniziale`): il frontend top-level seleziona il campo e poi chiama lo stesso endpoint
- [x] Documentato in `docs/apiary/apiary.apib` nel nuovo `# Group Simulatore meteo`

## Casi limite

- [x] Utente con 0 campi → stato vuoto con CTA "Vai ai tuoi campi"
- [x] Campo senza coltura → `fase = null` e `indici.fitosanitario = null`
- [x] Campo senza dati meteo nelle ultime 24h → `meteoReale` con campi a `null`, input precompilati vuoti (l'utente li riempie a mano)
- [x] Token mancante o scaduto → redirect a `/login`
- [x] Campo altrui (es. URL manipolato a livello backend) → 403, mostrato come messaggio di errore
- [x] Cambio campo nel dropdown → stato e form ricaricati col nuovo campo

## Procedura demo

1. Login → click su **"Simulatore"** nella Navbar
2. La pagina mostra il selettore campo (con il primo campo già scelto)
3. Verifica "Stato reale del campo (ultime 24h)" coi 4 valori meteo aggregati
4. Verifica "Parametri simulati" coi 4 input **precompilati con i valori reali**
5. Modifica uno o più valori (es. T max da 24.8 a 30.0) → lo state si aggiorna, gli input restano sincronizzati
6. Cambia campo nel dropdown → stato reale e form ricaricano sul nuovo campo

## Note

US55 introduce il modulo **simulatore meteo** con la pagina dedicata e il form di modifica dei parametri. **Architettura scelta**: pagina top-level `/simulatore` (non sezione di FieldDetail) per dare al modulo simulatore (US55-59) la propria area dell'app. Nessuna nuova dipendenza. Prossima US: **US56** — i 4 parametri simulati alimenteranno un ricalcolo in tempo reale degli indici di rischio (fitosanitario + climatico), in modo che l'agricoltore veda immediatamente l'impatto degli scenari ipotetici.