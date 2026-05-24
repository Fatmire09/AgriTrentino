# Test Report — US32 Calcolo automatico avanzamento fase fenologica

## Modello matematico

US32 implementa il modello **Growing Degree Days (GDD)** per stimare l'avanzamento fenologico delle colture senza input manuale.

**Formula GDD giornaliero**: `GDD = max(0, Tmedia - Tbase)` con `Tmedia = (Tmin + Tmax) / 2`

**Tbase vite**: 10 °C

I GDD si accumulano dalla `dataAggiornamento` della coltura (ultima transizione) ad oggi. Al superamento della soglia, la fase avanza alla successiva.

Soglie GDD cumulative (vite):

| Fase corrente | Successiva | Soglia |
|---|---|---|
| gemma_dormiente | germogliamento | 50 |
| germogliamento | fioritura | 350 |
| fioritura | allegagione | 200 |
| allegagione | invaiatura | 600 |
| invaiatura | maturazione | 400 |
| maturazione | caduta_foglie | 800 |
| caduta_foglie | — (fase finale) | — |

## Schema dati

- [x] Nessun nuovo modello: riusa `Coltura` (campi `fase`, `dataAggiornamento`, `appezzamentoId`) e `DatiMeteo` (temperature)
- [x] La transizione automatica aggiorna `fase` e resetta `dataAggiornamento` alla data dell'avanzamento
- [x] Coerente con UML classe Coltura (attributo fase + metodo di aggiornamento fase)

## Service `avanzamentoFenologicoService.js`

- [x] `calcolaGddAccumulati(appezzamentoId, dataInizio, dataFine)` — aggrega DatiMeteo per giorno (min/max → media), somma `max(0, Tmedia - 10)`, arrotonda a 1 decimale
- [x] `calcolaStatoFenologico(coltura)` — stato corrente senza modificare il DB: GDD accumulati, soglia prossima, % progresso (cap 100), prossima fase
- [x] `avanzaFaseSeNecessario(coltura)` — se GDD ≥ soglia avanza la fase, resetta `dataAggiornamento`, salva; ritorna true/false
- [x] `avanzaFasiTutteColture()` — itera tutte le colture con `fase != null`, gestione errori isolata, ritorna `{totaleColture, avanzate, errori, dettagli}`
- [x] Sanity check: fase fioritura (soglia 200), 7 giorni con Tmedia 22 °C → GDD/giorno = 12 → 84 GDD cumulati (42% verso allegagione), nessun avanzamento; con Tmedia 25 °C per ~14 giorni → ≥ 210 GDD → avanza ad allegagione

## Cron giornaliero

- [x] Cron expression `0 1 * * *` (ogni notte all'01:00 Europe/Rome)
- [x] All'avvio del server compare nel log: `[fenologia cron] Avviato...`
- [x] Avviato in `index.js` dopo meteo (US27) e bilancio (US31)
- [x] Errore su una coltura non blocca le altre (loop resiliente) + log per ogni avanzamento

## Endpoint `GET /api/v1/fields/:fieldId/fenologia`

- [x] Senza token → 401
- [x] Token + campo proprio con coltura+fase → 200 con `{fenologia: {...}}` (GDD, soglia, % progresso, prossima fase, ultimoCalcolo)
- [x] Token + campo proprio senza coltura → 200 con `{fenologia: null, message: "Nessuna coltura associata..."}`
- [x] Token + coltura senza fase (o fase finale) → 200 con `{fenologia: null, message: "La coltura non ha una fase fenologica impostata"}`
- [x] Campo altrui → 403
- [x] Campo inesistente → 404
- [x] ID malformato → 400

## Frontend

- [x] Badge "Fase aggiornata automaticamente il DD/MM/YYYY" nella card Coltura della scheda campo
- [x] Barra di progresso GDD verso la fase successiva + testo `X / Y GDD verso <fase> (Z%)`
- [x] Tooltip al passaggio del mouse: GDD accumulati/soglia, Tbase, prossima fase, ultimo calcolo
- [x] Badge nascosto senza errori se la fenologia non è disponibile (campo senza coltura/fase o fase finale)

## Coerenza con il design

- [x] **Criterio di accettazione backlog**: "Simulare l'accumulo di gradi-giorno per una settimana; verificare che il sistema avanzi la fase senza input manuale e gli indici si ricalcolino" ✓
- [x] Avanzamento **senza intervento manuale** (cron notturno) ✓
- [x] L'avanzamento manuale (PATCH US24) ha **precedenza**: reimposta `dataAggiornamento`, da cui riparte il conteggio GDD

## Casi limite

- [x] Coltura in fase finale `caduta_foglie` → nessun avanzamento, endpoint ritorna `fenologia: null` senza crash
- [x] Coltura senza fase → saltata dal cron
- [x] Giorni freddi (Tmedia < 10 °C) → `max(0, …)` evita GDD negativi
- [x] Campo senza dati meteo nel periodo → GDD = 0, nessun avanzamento
- [x] Idempotenza: dopo l'avanzamento `dataAggiornamento` si resetta, quindi non ri-avanza nella stessa notte

## Procedura demo

1. Avere un campo con coltura Vite e fase impostata (es. fioritura) + dati meteo
2. (Per simulare una settimana) inserire/seed dati meteo con T sopra soglia per N giorni, oppure attendere l'esecuzione del cron alle 01:00
3. `GET /api/v1/fields/:id/fenologia` → verificare GDD accumulati e % progresso
4. Quando i GDD superano la soglia → la `faseCorrente` avanza automaticamente alla successiva e `dataAggiornamento` si aggiorna
5. Nella scheda campo: il badge mostra la nuova data e la barra di progresso riparte verso la fase successiva

## Note

US32 estende l'"intelligenza agronomica" del DSS (avviata con US31): a partire dai dati meteo accumulati, il sistema fa evolvere autonomamente lo stato fenologico della coltura. La fase fenologica alimenta a sua volta il coefficiente Kc del bilancio idrico (US31) e gli indici di rischio futuri (US33+).