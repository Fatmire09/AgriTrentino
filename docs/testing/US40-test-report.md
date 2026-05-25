# Test Report — US40 Storico indici a 12 mesi

## Scelta architetturale

Gli indici di rischio (US33-US35) erano calcolati on-the-fly dai DatiMeteo, senza persistenza. Per US40 è stato necessario introdurre:

1. **Nuovo modello `IndiceRischio`** che persiste gli indici giornalieri (collezione MongoDB)
2. **Endpoint storico** che restituisce gli indici degli ultimi N giorni
3. **Seed script** che genera 12 mesi di indici simulati per la demo (in produzione il cron giornaliero alimenterà progressivamente la collezione)

## Modello `IndiceRischio`

- [x] Campi: `appezzamentoId`, `data`, `tipoRischio` (enum), `livello` (enum), `valore` (0-100), `minaccia`, `dettagli`
- [x] Coerente con UML D2 classe `IndiceRischio` (astratta) + sottoclassi `IndiceRischioFitosanitario` e `IndiceRischioClimatico` implementate via discriminator `tipoRischio`
- [x] Indice composito `{appezzamentoId, data, tipoRischio}` per query veloci
- [x] Indice univoco `{appezzamentoId, data, tipoRischio}` per garantire un solo record per giorno/campo/tipo

## Lato server (`GET /api/v1/fields/:fieldId/indici/storico`)

- [x] Richiesta senza token → 401
- [x] Richiesta con token valido + fieldId proprio → 200 con `{storico, totaleRecord, periodoGiorni}`
- [x] Richiesta su campo altrui → 403
- [x] Richiesta su fieldId inesistente → 404
- [x] Parametro `?giorni=N` opzionale (default 365, max 730)
- [x] Parametro `?tipo=fitosanitario|climatico` opzionale per filtrare un solo tipo
- [x] Records ordinati per `data` crescente (utile per grafici cronologici)
- [x] Response esclude `_id` e altri campi interni (payload minimale)

## Seed script `seedStoricoIndici.js`

- [x] Genera 365 giorni × 2 tipi per ogni campo
- [x] **Pattern stagionale realistico**:
  - Fitosanitario: picchi in primavera-estate (peronospora attiva con umidità + temperature 15-25°C)
  - Climatico: picchi in inverno (gelate tardive) e in piena estate (stress termico)
- [x] Aggiunta rumore casuale ±15 per simulare variabilità reale
- [x] Minaccia popolata in base a stagione: `gelate_tardive` (nov-feb), `stress_termico` (giu-ago), `eccesso_umidita` (resto anno)
- [x] Upsert idempotente: rieseguire lo script non duplica record

## Lato client (`FieldDetail.jsx`)

- [x] Caricamento automatico storico 365 giorni al mount del componente
- [x] Trasformazione dati per Recharts: aggrega fito + clima sulla stessa data
- [x] Grafico Recharts `LineChart` con 2 linee:
  - Rossa per fitosanitario
  - Blu per climatico
- [x] Y-axis bloccato 0-100 (range del punteggio)
- [x] X-axis con `interval={29}` per non sovrapporre le etichette (mostra una data ogni ~mese)
- [x] Tooltip al passaggio del mouse con valori esatti
- [x] Legend in alto con colori dei due tipi
- [x] Sotto al grafico: legenda delle soglie cromatiche (basso/medio/alto)
- [x] Se `storicoIndici.length === 0` la sezione non appare (no flash di sezione vuota)

## Coerenza con il design (D1)

- [x] **RF15 Storico degli indici di rischio**: *"L'applicazione deve conservare e rendere consultabile la serie storica degli indici di rischio calcolati per ciascun appezzamento. La visualizzazione storica deve supportare un orizzonte temporale di almeno un anno, con risoluzione giornaliera, e deve essere presentata attraverso grafici di andamento stagionale."* → soddisfatto al 100% con 365 giorni × risoluzione giornaliera × grafico Recharts
- [x] **UML D2 IndiceRischio**: collezione MongoDB persistente con tutti gli attributi previsti

## Coerenza con scelte precedenti

- [x] Riusa la libreria Recharts già introdotta in US30 (grafici meteo)
- [x] Pattern simile al `/meteo/storico` (param `giorni`, ordinamento, query opzionali)

## Casi limite

- [x] Campo senza storico (mai eseguito seed né cron) → sezione grafico non appare (`storicoIndici.length === 0`)
- [x] Periodo richiesto > 730 → clampato al massimo senza errore
- [x] Filtro `tipo` non valido → ignorato (restituisce entrambi i tipi)
- [x] Rieseguendo seed → upsert mantiene idempotenza

## Note

US40 introduce il primo "dato derivato persistente" del sistema. Negli sprint futuri (specialmente US49 dashboard sostenibilità) questi dati storici saranno usati anche per:
- Calcolo trend stagionale (US52)
- Confronto annate (US48)
- Classificazione efficacia interventi (US43 → "intervento giustificato se rischio era alto")

Il seed script è una scelta consapevole per la demo finale: in produzione i record si accumuleranno naturalmente dal cron giornaliero. Lo script va comunque considerato una utility di sviluppo, non parte del deployment di produzione.