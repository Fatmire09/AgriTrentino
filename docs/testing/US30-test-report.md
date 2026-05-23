# Test Report — US30 Grafici andamento meteo

## Libreria scelta: Recharts

Per i grafici è stata scelta la libreria **Recharts** (versione ^2.x), libreria React di riferimento per grafici dichiarativi basati su SVG. Motivazioni:
- Standard de-facto nell'ecosistema React
- API dichiarativa coerente con JSX
- Componenti ResponsiveContainer per layout responsive automatico
- Tooltip e interazioni native
- ~150KB minified (accettabile per uno strumento usato in più pagine)

Installata via `npm install recharts` nel modulo `client/`.

## Lato server (`GET /api/v1/fields/:fieldId/meteo/storico?periodoOre=N`)

- [x] L'endpoint esistente da US25 è stato esteso con il parametro opzionale `periodoOre`
- [x] Valore default: `48` ore (mantiene il comportamento precedente, no breaking changes)
- [x] Validazione robusta: se `periodoOre` non è valido (NaN, < 1) → fallback a default
- [x] Limite massimo: `720` ore (= 30 giorni). Richieste oltre vengono clampate senza errore
- [x] Test A: `GET /storico` (senza parametri) → 48 ore di dati come prima
- [x] Test B: `GET /storico?periodoOre=24` → solo ultime 24 ore
- [x] Test C: `GET /storico?periodoOre=168` → ultime 7 giorni
- [x] Test D: `GET /storico?periodoOre=9999` → 200 OK con max 720h (no errore)
- [x] Test E: `GET /storico?periodoOre=abc` → 200 OK con default 48h
- [x] Autenticazione e controllo `ownerId` continuano a funzionare (no regressione US25)

## Lato client (`FieldDetail.jsx` — sezione meteo)

- [x] Caricamento storico: al mount del componente parte una `GET /storico?periodoOre=48`
- [x] I dati vengono trasformati in formato compatibile con Recharts: array di `{ ora, temperatura, umidita, pioggia }` ordinati dal più vecchio al più recente
- [x] Sotto la sezione "Oggi al tuo campo" appaiono **3 grafici impilati**:
  1. **Temperatura** (line chart arancione `#ea580c`) — unità °C, asse Y automatico
  2. **Umidità relativa** (line chart blu `#2563eb`) — unità %, asse Y bloccato 0-100
  3. **Precipitazioni** (bar chart ciano `#06b6d4`) — unità mm, asse Y base 0
- [x] Tutti i grafici hanno: griglia di sfondo, asse X con date "DD/MM HH:MM", tooltip al passaggio del mouse, etichette font 10px per leggibilità
- [x] Layout responsive: ogni grafico usa `ResponsiveContainer width="100%" height={140}` quindi si adatta al container
- [x] Tooltip mostra: ora completa + valore della grandezza al passaggio sui punti
- [x] L'asse X usa `interval="preserveStartEnd"` per evitare sovrapposizione delle etichette

## Casi limite gestiti

- [x] Storico vuoto (campo appena creato senza rilevazioni): la sezione grafici non appare (condizione `storicoMeteo.length > 1`)
- [x] Storico con 1 sola rilevazione: la sezione grafici non appare (servono almeno 2 punti per una linea)
- [x] Storico con stazione che non misura tutti i parametri (es. niente umidità): Recharts gestisce automaticamente i `null` saltando i punti corrispondenti
- [x] Refresh manuale dei dati: la sezione "Oggi al tuo campo" si aggiorna, ma i grafici NO automaticamente (sono caricati una volta al mount). Questo è accettabile: l'utente può ricaricare la pagina (F5) per aggiornare lo storico

## Sicurezza e performance

- [x] Endpoint protetto da `requireAuth` + controllo `ownerId` (riusato da US25)
- [x] Volume dati ragionevole: 48h × ~4 rilevazioni/ora = ~200 punti per grafico → render veloce in <100ms
- [x] Limite max 720h previene download di volumi enormi via `?periodoOre=99999`

## Coerenza con il design (D1)

- [x] **RF09 Visualizzazione dati meteo**: *"Il sistema deve presentare i dati meteorologici correnti (temperatura, umidità relativa, precipitazioni) attraverso grafici chiari e leggibili. La visualizzazione deve essere contestualizzata per il singolo appezzamento selezionato."* → soddisfatto: 3 grafici contestualizzati al campo, con tooltip e legenda
- [x] **RFN03 Usabilità**: codifiche visive immediate (colori naturali: arancione per caldo, blu per umidità, ciano per acqua)

## Note

I grafici lavorano sui dati già presenti in `DatiMeteo` (popolati da US25 + US27 cron). Non è stata necessaria alcuna ingegnerizzazione del backend di calcolo: l'endpoint `/storico` era già pronto per restituire serie temporali, e Recharts è progettato esattamente per visualizzare questo tipo di dati.

Per estensioni future (sprint successivi):
- **US40 (Storico indici a 12 mesi)** userà lo stesso approccio Recharts ma su orizzonte temporale ampio (`periodoOre=8760`) e con un componente `LineChart` simile
- **US53 (Trend stagionale rischio medio)** beneficerà del medesimo pattern
- **US58 (Grafico comparativo simulatore)** userà due `Line` sovrapposte nello stesso `LineChart` per il confronto reale vs simulato

Il fatto di aver introdotto Recharts in US30 prepara il terreno per tutte queste US successive senza altre installazioni.