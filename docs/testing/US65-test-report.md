# Test Report — US65 Test automatizzati (RFN06)

## Obiettivo
Suite di test automatici con Jest + supertest sugli endpoint critici (autenticazione,
appezzamenti, interventi), come da RFN06 del D1 e spunto della retrospettiva Sprint #1.

## Stack di test
- **Jest** (runner), **supertest** (test HTTP), **mongodb-memory-server** (DB in-memory isolato)
- `index.js` rifattorizzato: bootstrap (DB/listen/cron) isolato con `require.main`

## Comandi
- `npm test` → esegue la suite
- `npm run test:coverage` → suite + copertura

## Esito
- [x] **3 test suite, 18 test, tutti verdi**
- [x] auth.test.js (8): register, login ok/ko, rotta protetta /me
- [x] fields.test.js (5): CRUD appezzamenti, auth richiesta, isolamento per utente
- [x] interventi.test.js (5): POST trattamento/irrigazione, validazione, GET lista

## Copertura componenti critici
- Modelli `Field`, `IndiceRischio`, `DatiMeteo`: 100%
- `classificazioneInterventoService` (RF19): 89%
- `User`: 88% · `Intervento`: 85%
- Rotte `auth`/`interventi`: ~46%

## Note
- La copertura globale (~32%) riflette la scelta di testare i **componenti critici**
  (auth, CRUD, classificazione interventi), come previsto da RFN06, lasciando fuori
  servizi non critici (es. scheduler meteo) per lo scope di questo sprint.
- Test isolati e ripetibili (DB in-memory, pulizia tra i test).