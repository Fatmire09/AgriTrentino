# Test Report — US59 Reset simulatore ai valori reali

## Obiettivo

Permettere all'agricoltore di ripristinare i parametri del simulatore ai valori meteo reali correnti con un singolo click, annullando le modifiche manuali e ricominciando uno scenario senza ricaricare la pagina. Quinta e **ultima** User Story del modulo simulatore meteo (US55-59).

## Backend — `timestampUltimaSync` in `GET /simulatore/stato-iniziale`

- [x] In `routes/simulatore.js`, handler `/stato-iniziale`: nuova query `DatiMeteo.findOne({appezzamentoId}).sort({timestamp:-1}).select('timestamp')` per recuperare il record meteo più recente del campo
- [x] Nuovo campo `timestampUltimaSync` (ISO 8601 string del `timestamp`, oppure `null` se il campo non ha mai sincronizzato meteo) aggiunto alla response 200
- [x] L'helper esistente `aggregaMeteoCampo` (US57) non viene toccato — il timestamp è calcolato separatamente, evitando di mescolare le responsabilità del meteo aggregato e dei metadata di sincronizzazione
- [x] Nessuna modifica a `/confronto` o `/ricalcola`: il refetch del Reset usa solo `/stato-iniziale`

## Frontend — bottone "Ripristina valori reali" in `Simulatore.jsx`

- [x] Import di `RotateCcw` (lucide-react) per l'icona ↻
- [x] Helper modulo `tempoFa(ts)` — formatta `min/ore/g fa` da un ISO timestamp (stesso pattern del campanello notifiche in Navbar, US37)
- [x] Funzione `handleReset` async: refetch `GET /simulatore/stato-iniziale` con `Authorization: Bearer ...`, su successo riassegna `stato`, riporta `params` ai valori `meteoReale` aggiornati, azzera `confronto`
- [x] Bottone **"↻ Ripristina valori reali"** (border verde, hover pieno) nella barra azioni sotto i Parametri simulati, **accanto a "Avvia simulazione"** in un flex container `mt-4 flex flex-wrap items-center gap-3`
- [x] Bottone disabilitato durante il refetch (`loadingStato`) o se lo stato non è ancora caricato
- [x] Testo grigio piccolo **"Valori reali aggiornati X min fa"** dopo i due bottoni — mostrato solo quando `stato.timestampUltimaSync` è valorizzato (campo senza meteo → niente testo)
- [x] Tooltip nativo sul bottone: "Annulla le modifiche e riporta i parametri al meteo reale corrente"
- [x] Dopo il reset il debounce (US56) riparte automaticamente: `confronto` viene ripopolato con parametri == reali → barre Simulato del BarChart si allineano alle Reale (Δ ≈ 0)

## Coerenza con D1 e D2

- [x] **D2 §2.5.1 `Simulazione.reset()`** ("Ripristina tutti i parametri della simulazione ai valori meteorologici reali di partenza, annullando le modifiche manuali effettuate dall'utente e riportando la simulazione allo stato iniziale"): realizzato `1:1` dal bottone "Ripristina valori reali" + `handleReset` che refetcha lo stato iniziale e resetta i parametri
- [x] **Refetch invece di reset offline**: l'implementazione recupera valori reali aggiornati (lo scheduler meteo US27 può aver sincronizzato dopo il caricamento della pagina), coerente con lo spirito di D2 "stato iniziale" che è dinamico nel tempo
- [x] Il campo `timestampUltimaSync` non era previsto esplicitamente da D2 ma rinforza il principio del reset "consapevole": l'utente sa da quando provengono i valori reali a cui viene riportato

## Casi limite

- [x] Click su Reset durante una fetch già in corso → bottone disabilitato (no race condition)
- [x] Campo senza meteo (`meteoReale` con tutti `null` e `timestampUltimaSync = null`) → Reset funziona ma riporta a un form vuoto; nessun testo "X min fa"
- [x] Refetch fallisce (network/401) → silenzioso, lo state precedente resta; l'utente può riprovare
- [x] Cambio campo nel dropdown durante il refetch → l'useEffect di `[campoId]` resetta `stato` e fa partire una nuova fetch (state in flight viene scartato logicamente)
- [x] Reset dopo aver inserito valori atipici (US58) → banner warning sparisce perché `confronto` viene azzerato + nuovo `confronto` con parametri plausibili
- [x] `timestampUltimaSync` di pochi minuti fa → mostra "X min fa"; oltre 24h → "X g fa"; meno di 1 min → "ora"

## Procedura demo

1. Login → click su "Simulatore" in Navbar → seleziona un campo
2. Verifica che sotto i due bottoni compaia "Valori reali aggiornati X min fa" (es. "12 min fa")
3. Modifica più parametri (es. `tMin=-50`, `urMedia=120`, `precipitazioni=300`) → banner US58 warning attivo, BarChart con barre Simulato molto sbilanciate
4. Click su **"↻ Ripristina valori reali"** → entro un attimo il form torna ai valori reali, banner warning sparisce, BarChart si rialinea (Δ ≈ 0)
5. Cambia campo nel dropdown e ripeti → "X min fa" si aggiorna sul nuovo campo
6. Su un campo senza meteo sincronizzato → niente testo "X min fa", ma il bottone funziona comunque (riporta a un form vuoto)

## Note

US59 chiude **il modulo simulatore meteo** (US55–59):

| US | Funzionalità | Mapping D1/D2 |
|----|------|------|
| US55 | Modifica manuale parametri meteo + pagina top-level `/simulatore` | RF16 input; UC-06 passi 1-3; D2 `ParametriSimulazione` |
| US56 | Ricalcolo indici in tempo reale (debounce 500ms) | RF16 "tempo reale"; UC-06 passo 6 |
| US57 | Grafico comparativo reale vs simulato + bottone "Avvia" | UC-06 passo 5+7; D2 `Simulazione.generaGraficoComparativo` |
| US58 | Avviso valori atipici | UC-06 estensione p.3; D2 `ParametriSimulazione.isValid()` |
| **US59** | **Reset ai valori reali** | **D2 `Simulazione.reset()`** |

Debito tecnico noto (annotato in US57): l'orizzonte forecast a **7 giorni** di UC-06 non è implementato — calcolo istantaneo per ora; da valutare in una US futura del progetto.

Prossima US: **US60** — tempo di risposta sotto 2 secondi (performance sulle viste principali). Cambio modulo: esce il simulatore, entrano performance/docker/access-control/GDPR (US60-63).