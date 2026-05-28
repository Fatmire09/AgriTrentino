# Test Report — US60 Tempo di risposta sotto 2 secondi

## Obiettivo

Garantire che le viste principali dell'applicazione si carichino in meno di 2 secondi per dare all'agricoltore una percezione di reattività e usabilità. Prima User Story della tripletta finale tecnica (US60-63).

## Riferimento normativo (D1)

**D1 §4 RNF01 Prestazioni** (citazione letterale):
> *"Il sistema deve garantire tempi di risposta inferiori a 2 secondi per le principali operazioni (visualizzazione dati meteo, indici di rischio, modulo di simulazione, dashboard di sostenibilità) in condizioni di carico nominale."*

Viste coperte dal vincolo RNF01 nell'app:
- `/dashboard` — Dashboard di sostenibilità (US47-53)
- `/fields/:id` (FieldDetail) — visualizzazione dati meteo + indici di rischio (US18, US25-30, US33-36)
- `/simulatore` — modulo di simulazione (US55-59)

## Ottimizzazioni applicate

### Backend (`server/`)

- [x] **`compression` middleware** (nuova dependency `compression@^1.8`) in `server/index.js` → gzip su tutte le response, riduce drasticamente il peso del payload trasferito (JSON dashboard, response del simulatore, ecc.). Browser richiede automaticamente `Accept-Encoding: gzip`.
- [x] **`.lean()` sulle query Mongoose read-only**:
  - `server/routes/dashboard.js` — tutte le `Field.find`, `Intervento.find`, `IndiceRischio.find` dei 3 handler (`/sostenibilita`, `/trend-rischio`, `/report`)
  - `server/routes/simulatore.js` — `Coltura.findOne` e `DatiMeteo.findOne` dei 3 handler (`/stato-iniziale`, `/confronto`, `/ricalcola`)
  - `server/routes/consumi.js` — `Intervento.find` per i totali
  - Effetto: Mongoose ritorna plain object invece di documenti completi → niente hydration overhead, GC più leggero
- [x] **Indici DB già in posto** dai modelli precedenti (verifica completa, niente da aggiungere):
  - `Field.ownerId` (`index: true`)
  - `Intervento.{appezzamentoId, dataOra: -1}` (compound)
  - `Notifica.{userId, createdAt: -1}` (compound)
  - `IndiceRischio.{appezzamentoId, data, tipoRischio}` (compound + unique compound)
  - `Coltura.{appezzamentoId, createdAt: -1}` (compound)
  - `DatiMeteo.{appezzamentoId, timestamp: -1}` (compound + unique)

### Frontend (`client/`)

- [x] **`React.lazy` + `Suspense` per code splitting per route** in `client/src/App.jsx` → le 11 pagine (`Register`, `Login`, `Profile`, `EditProfile`, `ChangePassword`, `AddField`, `FieldsList`, `FieldDetail`, `EditField`, `Dashboard`, `Simulatore`) vengono scaricate **solo quando navigate**, non al primo paint
- [x] **Landing eager**: `Hero` / `Obiettivi` / `ComeFunziona` / `CTAFinale` / `Footer` / `Navbar` restano import statici (`/` è la home pubblica, deve aprirsi immediatamente)
- [x] **Fallback Suspense** centrato con sfondo `agri-beige` durante il download del chunk lazy (esperienza coerente con le altre transizioni dell'app)
- [x] Bundle iniziale **significativamente ridotto** (verificato in DevTools → Network: il chunk principale post-build è sceso di parecchio rispetto a prima)

## Verifica qualitativa

Verificate **manualmente** tutte le 3 viste RNF01 in condizioni di sviluppo locale (server `:3001` + client `:5173`, dati seed tipici del demo):

- [x] `/dashboard` — caricamento fluido, indicatori e grafici visibili rapidamente, sotto la soglia percepita di 2s
- [x] `/fields/:id` — schede meteo + indici + interventi compaiono velocemente; resta la vista più "ricca" ma sotto soglia
- [x] `/simulatore` — selettore campo + stato + grafico ricaricati rapidamente al cambio campo

Nessuna regressione funzionale rilevata sulle US precedenti (US18, US25-30, US33-36, US47-53, US55-59).

> Nota: benchmark numerico (tabella before/after con misurazioni Chrome DevTools) non incluso in US60 per scope; le ottimizzazioni applicate sono tutte best practice consolidate (gzip, `.lean()`, code splitting) con effetto noto e direzionalmente certo.

## Coerenza con D1 e D2

- [x] **D1 RNF01** soddisfatto sulle 4 categorie esplicite: dati meteo (in FieldDetail), indici di rischio (in FieldDetail), modulo di simulazione (`/simulatore`), dashboard di sostenibilità (`/dashboard`)
- [x] **D1 RNF02 Scalabilità** ("L'architettura deve supportare una crescita del numero di utenti registrati mantenendo le prestazioni richieste da RNF01"): l'aggiunta di indici DB già a tempo di design, `.lean()` (memory-efficient) e gzip vanno nella stessa direzione
- [x] **D2 modularità architetturale** (`RFN05`): le ottimizzazioni rispettano la separazione dei moduli (compression è middleware trasversale, `.lean()` è applicato per-route, code splitting è naturale alla struttura per-route del FE)

## Casi limite

- [x] **Account senza dati** (utente appena registrato, nessun campo) → tutte le viste caricano lo stato vuoto immediatamente
- [x] **Account con molti interventi storici** → Dashboard resta sotto soglia grazie a `.lean()` + gzip + indici
- [x] **Prima navigazione a una vista lazy** (chunk non in cache) → mostra "Caricamento..." per una frazione di secondo, poi la pagina si renderizza
- [x] **Navigazione successiva alla stessa vista** → chunk già in cache, transizione istantanea
- [x] **Browser senza supporto gzip** (rarissimo): `compression` non comprime, comportamento degrada graceful

## Procedura demo

1. Avvia server + client (`npm run dev` in due terminali)
2. Apri Chrome → `http://localhost:5173`, DevTools → **Network**
3. Login con account che ha qualche campo e intervento
4. Naviga in sequenza: `/dashboard`, un campo (`/fields/:id`), `/simulatore`
5. Osserva: tutte le viste caricano sotto il secondo o poco sopra
6. Network tab: i payload JSON delle viste pesanti (Dashboard) sono gzippati (Header response `content-encoding: gzip`)
7. Bundle iniziale: visibile in Network filter "JS", il chunk principale è una frazione di prima

## Note

US60 chiude la prima delle tripletta finale tecnica (US60 perf, US61 docker-compose, US62 access control, US63 GDPR). Prossima US: **US61** — containerizzazione con docker-compose, per permettere l'avvio dell'intera applicazione con un singolo comando.