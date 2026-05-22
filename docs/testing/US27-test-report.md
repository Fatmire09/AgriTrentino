# Test Report — US27 Aggiornamento periodico dati meteo

## Scheduler (`server/services/meteoScheduler.js`)

- [x] All'avvio del server (`npm run dev`) lo scheduler viene avviato automaticamente
- [x] Nei log compare il messaggio `[meteo scheduler] Avviato con cron "0 * * * *" (Ogni ora al minuto 0)`
- [x] La cron expression è `"0 * * * *"` → ogni ora al minuto 0 (10:00, 11:00, 12:00, ...)
- [x] Il timezone è impostato a `Europe/Rome` per evitare scostamenti UTC
- [x] La funzione `avvia()` è idempotente: se chiamata due volte, ignora la seconda
- [x] La funzione `ferma()` ferma correttamente il task cron (utile per test e shutdown puliti)
- [x] Lo stato interno tiene traccia di: `attivo`, `cronExpression`, `descrizione`, `ultimaEsecuzione`, `campiAggiornatiUltimaEsecuzione`, `campiErroriUltimaEsecuzione`
- [x] `getStato()` aggiunge dinamicamente `prossimaEsecuzione` calcolata al prossimo minuto 0

## Service (`meteoService.aggiornaTuttiICampi()`)

- [x] La funzione cicla **tutti** gli appezzamenti registrati (anche di utenti diversi) e chiama `aggiornaMeteoCampo()` per ognuno
- [x] Restituisce un oggetto `{ totaleCampi, aggiornati, errori, dettagliErrori }` con il riepilogo dell'esecuzione
- [x] Errori su un singolo campo NON bloccano il loop: si continua con gli altri campi
- [x] I dettagli degli errori (id campo, nome, messaggio) vengono salvati in `dettagliErrori`
- [x] Lo scheduler usa internamente questa funzione (refactoring di Task 3): non duplica il loop

## Lato server (`GET /api/v1/meteo/scheduler/status`)

- [x] Richiesta senza header `Authorization` → 401 `{ "error": "Token mancante" }`
- [x] Richiesta con token valido → 200 `{ scheduler: { attivo, cronExpression, descrizione, ultimaEsecuzione, campiAggiornatiUltimaEsecuzione, campiErroriUltimaEsecuzione, prossimaEsecuzione } }`
- [x] Endpoint accessibile via `/api/v1/meteo/scheduler/status` (mount globale, non scoped al campo)
- [x] Subito dopo l'avvio del server (prima della prima esecuzione cron): `ultimaEsecuzione: null`, `campiAggiornatiUltimaEsecuzione: 0`
- [x] Dopo la prima esecuzione cron: `ultimaEsecuzione` valorizzato, `prossimaEsecuzione` = minuto 0 dell'ora successiva

## Esecuzione cron (verifica funzionale)

- [x] Allo scoccare del minuto 0 di un'ora qualsiasi (es. 11:00, 12:00, ecc.), il log mostra:
  - `[meteo scheduler] Avvio aggiornamento alle YYYY-MM-DDTHH:00:00.xxxZ`
  - `[meteo scheduler] Fine: N/M campi aggiornati, X errori, YYYYms`
- [x] Se MeteoTrentino è temporaneamente irraggiungibile, gli errori vengono loggati ma il processo continua
- [x] Il campo `field.stazioneAssegnataCode` viene mantenuto tra esecuzioni (la stazione assegnata si calcola una volta sola)
- [x] L'indice univoco `{ appezzamentoId, timestamp }` di `DatiMeteo` impedisce doppioni se due esecuzioni ravvicinate cercano di salvare la stessa rilevazione

## Lato client (`FieldDetail.jsx` — badge scheduler)

- [x] Nella sezione "Dati meteo" appare un badge verde con icona orologio
- [x] Testo: **"Aggiornamento automatico attivo"** + sottotitolo con descrizione cron + ultimo + prossimo
- [x] Se lo scheduler non ha ancora girato (server appena riavviato): mostra solo "Ogni ora al minuto 0 · prossimo: HH:00"
- [x] Se lo scheduler ha già girato almeno una volta: mostra anche "· ultimo: X min fa"
- [x] L'ora "prossimo: HH:MM" è in formato 24h italiano (locale `it-IT`)
- [x] Se l'API `/meteo/scheduler/status` restituisce errore o `attivo: false`, il badge non appare (graceful fallback)

## Coerenza con il design (D1)

- [x] **RF08 Integrazione API meteo**: *"L'applicazione deve integrarsi con almeno un servizio meteorologico esterno per recuperare automaticamente, **a intervalli regolari**, i dati atmosferici"* → cron `0 * * * *` = aggiornamento orario regolare
- [x] **RF14 Sistema di allertamento**: gli indici di rischio (US33+) dipendono da dati meteo aggiornati. US27 garantisce che questi dati restino freschi senza intervento manuale dell'utente
- [x] **RFN10 Affidabilità**: errori isolati su singoli campi non bloccano l'aggiornamento degli altri

## Sicurezza

- [x] L'endpoint `/meteo/scheduler/status` è protetto da `requireAuth`: solo utenti autenticati possono vedere lo stato
- [x] Lo scheduler non espone direttamente i dati dei campi degli utenti, solo metadati aggregati (conteggio campi aggiornati, errori)
- [x] Nessuna PII (Personally Identifiable Information) nei log dello scheduler — solo id campo e messaggi di errore tecnici

## Casi limite

- [x] Server riavviato a metà esecuzione cron → il job in corso viene interrotto, ma il prossimo minuto 0 ricomincia regolarmente
- [x] Sistema con 0 campi registrati → l'esecuzione cron termina in pochi ms con `totaleCampi: 0, aggiornati: 0, errori: 0`
- [x] Tutti i campi falliscono il fetch (es. MeteoTrentino completamente offline) → `errori = totaleCampi`, scheduler continua a girare e rilancia all'ora successiva (resilienza)
- [x] Container Docker (futuro US62): lo scheduler partirà allo startup del container, comportamento identico a `npm run dev`

## Note

US27 introduce il primo job schedulato del sistema. La scelta della libreria `node-cron` è motivata da:
- Standard di fatto in ecosistema Node.js
- Sintassi cron classica (compatibile con Linux crontab)
- Supporto nativo timezone (essenziale per Europe/Rome con DST)
- Footprint minimo (~30 KB)
- Compatibilità con Docker e ambienti di produzione

L'intervallo di aggiornamento (60 minuti) è un compromesso tra:
- **Freschezza dei dati**: 60 minuti è sufficiente per indici di rischio agronomici (le condizioni meteorologiche per il calcolo della peronospora si valutano su finestre di 24-48h)
- **Carico sull'API esterna**: ~24 chiamate/giorno per campo, ben sotto qualsiasi rate limit ragionevole
- **Risorse server**: ogni esecuzione completa < 5 secondi per ~10-20 campi

In sprint futuri si potrebbe valutare di rendere l'intervallo configurabile via variabile d'ambiente per ambienti di test (es. ogni 5 min) o produzione (es. ogni 30 min in stagione attiva).