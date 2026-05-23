# Test Report — US31 Calcolo bilancio idrico giornaliero

## Modello matematico

US31 implementa il modello FAO-56 Hargreaves-Samani per la stima dell'evapotraspirazione e il bilancio idrico del suolo.

**Formula ET0**: `ET0 = 0.0023 × (Tmedia + 17.8) × √(Tmax - Tmin) × Ra`

**Formula ETc**: `ETc = ET0 × Kc(fase fenologica)`

**Bilancio**: `riservaIdrica = clamp(riservaIeri + precipitazioni - ETc, 0, 150mm)`

Coefficienti Kc per la vite: gemma_dormiente 0.2, germogliamento 0.3, fioritura 0.7, allegagione 0.85, invaiatura 0.7, maturazione 0.4, caduta_foglie 0.2.

## Schema dati

- [x] Modello `BilancioIdricoGiornaliero` con campi: appezzamentoId, data, precipitazioniMm, evapotraspirazioneMm, bilancio, riservaIdricaMm, umiditaSuoloPerc
- [x] Indice composito appezzamentoId + data per query efficienti
- [x] Indice univoco per garantire un solo record/giorno/campo (idempotenza del cron)
- [x] Coerente con UML D2 classe BilancioIdricoGiornaliero

## Service `bilancioIdricoService.js`

- [x] `calcolaRa(lat, giornoDelAnno)` — radiazione extraterrestre da formule astronomiche FAO-56
- [x] `calcolaET0(tMax, tMin, lat, data)` — Hargreaves-Samani, mm/giorno
- [x] `calcolaBilancioGiorno(field, data)` — pipeline completa: meteo → ET0 → ETc → bilancio → upsert DB
- [x] `calcolaBilancioTuttiCampi(data)` — itera tutti i campi, gestione errori isolata
- [x] Sanity check: Trento (46.07°N) a giugno con T 15-25°C → ET0 ~5 mm/giorno, consistente con misure reali estive

## Cron giornaliero

- [x] Cron expression `30 0 * * *` (ogni notte alle 00:30 Europe/Rome)
- [x] All'avvio del server compare nel log: `[bilancio cron] Avviato...`
- [x] Calcola il bilancio del giorno PRECEDENTE (alle 00:30 il giorno è appena finito)
- [x] Errore su un campo non blocca gli altri (loop resiliente)

## Endpoint `GET /api/v1/fields/:fieldId/bilancio-idrico`

- [x] Senza token → 401
- [x] Token + campo proprio con bilancio → 200 con `{corrente, storico}`
- [x] Token + campo proprio senza bilancio → 200 con `{corrente: null, message: "..."}`
- [x] Campo altrui → 403
- [x] Campo inesistente → 404
- [x] Param `?giorni=N` opzionale (default 30, max 365)

## Frontend

- [x] Card "💧 Bilancio idrico del suolo" nella scheda campo
- [x] Caso senza bilancio: messaggio grigio informativo
- [x] Caso con bilancio: barra colorata (rosso < 30%, giallo < 60%, verde ≥ 60%) + 4 valori dettagliati (riserva, pioggia, ET, bilancio giorno)
- [x] Consigli contestuali: "Irrigazione consigliata" / "Monitorare" / "Ben idratato"

## Coerenza con il design

- [x] **RF11**: bilancio idrico calcolato quotidianamente per ciascun appezzamento ✓
- [x] **UML D2 BilancioIdricoGiornaliero**: tutti gli attributi previsti presenti + metodo calcolaBilancio() implementato come service
- [x] **Umidità suolo calcolata** (non recuperata da API esterna): coerente con la scelta architetturale dichiarata in US25

## Casi limite

- [x] Campo senza coltura → errore loggato, non blocca cron
- [x] Campo senza fase fenologica → errore loggato
- [x] Campo nuovo senza dati meteo storici → bilancio salta fino a 24h di dati
- [x] Esecuzione cron su giorno già calcolato → upsert (idempotenza)

## Procedura demo

1. Aspettare prima esecuzione cron alle 00:30 (o avere campo con coltura+fase+24h dati meteo)
2. Aprire scheda campo → card bilancio con barra colorata e 4 valori
3. Verifica matematica: pioggia=10mm, ET=3mm, riserva ieri=80mm → bilancio=+7mm, riserva oggi=87mm, umidità=58%

## Note

US31 è la prima User Story di "intelligenza agronomica" del DSS: prende dati grezzi (meteo + coltura + fase) e produce un'informazione derivata utile. Prepara la base per US33 (calcolo indice fitosanitario) e US43 (classificazione automatica intervento).

La scelta di Hargreaves-Samani invece di Penman-Monteith è giustificata da: richiede solo Tmin/Tmax (disponibili da MeteoTrentino), accuratezza ~92-95% rispetto a Penman-Monteith su base settimanale, formula chiusa più robusta.