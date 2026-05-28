# Test Report — US56 Ricalcolo indici in tempo reale nel simulatore

## Obiettivo

Permettere all'agricoltore autenticato di vedere gli indici di rischio (fitosanitario + climatico) aggiornarsi in tempo reale quando modifica i parametri meteo del simulatore, per capire subito l'impatto delle variazioni. Seconda User Story del modulo simulatore meteo (US55-59), sopra US55 (modifica parametri).

## Backend — `services/simulatoreService.js` + `POST /api/v1/fields/:fieldId/simulatore/ricalcola`

- [x] **Nuovo service** `simulatoreService.js` con `calcolaIndiciSimulati({ tMin, tMax, urMedia, precipitazioni, fase })`:
  - **Fitosanitario** (modello peronospora semplificato per scalari): UR ≥ 80% e T media in [15, 25] °C → valore 80; UR ≥ 80% fuori range → 50; UR ≥ 60% → 35; secco → 10. Pioggia ≥ 5 mm → +10. Modulazione fase (Fioritura/Allegagione/Sviluppo grappolo +15; Maturazione/Riposo -10). Clamp [0, 100].
  - **Climatico**: tre sotto-minacce valutate in parallelo (`gelate` da tMin < 0/2/5 → 90/60/30; `stress_termico` da tMax > 35/32/28 → 90/65/35; `eccesso_umidita` da UR > 95/90/80 → 75/55/30). Restituisce la **minaccia dominante** col suo punteggio.
  - Livello derivato da valore: `<34`=basso · `34-66`=medio · `≥67`=alto.
- [x] **Endpoint** `POST /api/v1/fields/:fieldId/simulatore/ricalcola` in `routes/simulatore.js` con `requireAuth` + helper `trovaCampoAutorizzato` (campo altrui = 403, inesistente = 404, ID malformato = 400)
- [x] La `fase` non viene passata dal client: è letta dalla `Coltura` più recente del campo
- [x] Risposta: `{ fitosanitario: {livello, valore}, climatico: {livello, valore, minaccia} }`
- [x] I service reali (US33 fitosanitario, US35 climatico) restano intatti — la logica simulata è isolata in `simulatoreService.js`

## Frontend — sezione "Indici simulati" in `Simulatore.jsx`

- [x] Nuovi state: `indiciSimulati` (response del backend), `ricalcolando` (indicatore di fetch in corso)
- [x] **Debounce 500 ms** sul cambio di un qualsiasi parametro: `useEffect` con `setTimeout` + cleanup, dipende da `[params, campoId, stato]`
- [x] POST a `/simulatore/ricalcola` con header `Authorization: Bearer ...` e body `{ tMin, tMax, urMedia, precipitazioni }`
- [x] Reset di `indiciSimulati` al cambio campo (l'utente non vede gli indici del campo precedente)
- [x] **Blocco JSX a 2 colonne** sotto "Parametri simulati": **"Indici reali"** (dai dati di `stato-iniziale`, US55) e **"Indici simulati"** (dal nuovo endpoint)
- [x] Entrambe le sezioni mostrano fitosanitario + climatico con il componente `SemaforoRischio` (riuso US34) + tooltip con `valore/100` e (per climatico) etichetta della minaccia tradotta in italiano (`ETICHETTA_MINACCIA`)
- [x] Indicatore "Ricalcolo..." visibile mentre la fetch è in corso

## Coerenza con il design

- [x] **Criterio di accettazione backlog**: muovere uno qualsiasi dei parametri → gli indici si aggiornano in tempo reale ✓
- [x] La sezione "Indici reali" funge da **baseline di confronto** per l'utente
- [x] Nessuna modifica ai service reali (US33/US35) né allo storico (US40): il simulatore è completamente isolato
- [x] Documentato in `docs/apiary/apiary.apib` dentro `# Group Simulatore meteo`

## Casi limite

- [x] Token mancante → 401, il client non aggiorna `indiciSimulati` (l'errore è silenzioso, non blocca l'UI)
- [x] Parametri tutti vuoti (es. dopo un reset/clear) → niente fetch, `indiciSimulati` viene azzerato
- [x] Campo senza `Coltura` → `fase = null` lato backend, il fitosanitario è calcolato senza modulazione di fase (nessun crash)
- [x] Cambio rapido di più parametri entro 500 ms → il debounce annulla i timer precedenti, parte una sola fetch
- [x] Campo altrui (ID manipolato) → 403, gli indici simulati non si aggiornano
- [x] Numeri molto fuori scala (es. tMin = -50, urMedia = 150) → la logica del service non crasha, ma i valori sono clampati a [0,100] (sarà US58 a segnalare valori atipici)

## Procedura demo

1. Login → click su **"Simulatore"** in Navbar
2. Seleziona un campo → dopo ~500 ms compaiono entrambi i pannelli "Indici reali" e "Indici simulati" (livelli simili, con piccoli scostamenti dovuti alla logica semplificata)
3. Cambia `tMin` a **-3** → entro ~500 ms il pannello "Indici simulati" mostra **Climatico: Alto · Rischio gelate** (hover sul semaforo per il tooltip)
4. Riporta `tMin` al valore reale e cambia `tMax` a **35** → "Stress termico" alto
5. Cambia `urMedia` a **95** + `tMin/tMax` valori miti → "Eccesso di umidità" alto e fitosanitario alto
6. Cambia campo nel dropdown → entrambi i pannelli si resettano e poi si ricalcolano sul nuovo campo

## Note

US56 chiude il ciclo "modifica parametri → vedi indici" del simulatore. Nessuna nuova dipendenza. Prossima US: **US57** — grafico comparativo reale vs simulato (visualizzazione lato-a-lato dell'andamento degli indici nei due scenari per quantificare visivamente la differenza).