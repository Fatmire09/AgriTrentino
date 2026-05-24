# Test Report — US35 Calcolo indice rischio climatico

## Modello

US35 calcola un indice di rischio climatico per le **minacce alpine**, **on-demand** sulle ultime 48 ore. Valuta tre minacce e restituisce quella con il livello più alto.

- **Gelate**: da `Tmin`, pesata per la **sensibilità al gelo della fase** e per l'**esposizione** del campo (nord → rischio maggiore)
- **Stress termico**: da `Tmax`
- **Eccesso di umidità**: % di rilevazioni con `UR > 90%`

**Livelli**: `basso` (< 33) · `medio` (33-65) · `alto` (≥ 66)

Sensibilità al gelo per fase (vite): gemma_dormiente 0.3, germogliamento 1.2, fioritura 1.2, allegagione 1.0, invaiatura 0.8, maturazione 0.8, caduta_foglie 0.3.

Soglie base: gelate `Tmin ≤ -2 → 90`, `≤ 0 → 70`, `≤ 3 → 40`, altrimenti 5 · esposizione "nord" `×1.15`. Stress termico `Tmax ≥ 38 → 90`, `≥ 35 → 70`, `≥ 32 → 40`. Eccesso umidità `%ore UR>90 ≥ 70 → 70`, `≥ 40 → 40`, altrimenti 10.

## Schema dati

- [x] Nessun nuovo modello: riusa `DatiMeteo` (`temperaturaC`, `umiditaPerc`), `Coltura` (`fase`, per la sensibilità al gelo) e `Field` (`esposizione`)
- [x] Calcolo on-demand, nessuna persistenza (storico in US40)

## Service `rischioClimaticoService.js`

- [x] `aggregaFinestra` — Tmin, Tmax e conteggio ore con UR > 90% nella finestra
- [x] `punteggioGelate(tMin, fase, esposizione)`, `punteggioStressTermico(tMax)`, `punteggioEccessoUmidita(oreUmide, totali)`
- [x] `calcolaRischioClimatico(field, coltura)` — minaccia dominante + dettaglio di tutte e tre; `null` se nessun dato meteo nella finestra
- [x] Sanity check: Tmin -3 + germogliamento (1.2) + esposizione Nord (×1.15) → 90×1.2×1.15 = 124 → cap 100 → **alto** (coerente con la demo)

## Endpoint `GET /api/v1/fields/:fieldId/indici/climatico`

- [x] Senza token → 401
- [x] Token + campo proprio con dati meteo → 200 con `{climatico: {livello, minaccia, punteggio, dettaglio, ...}}`
- [x] Token + campo senza meteo nelle 48h → 200 con `{climatico: null, message: "..."}`
- [x] Campo altrui → 403
- [x] Campo inesistente → 404
- [x] ID malformato → 400
- [x] Funziona anche senza coltura/fase (sensibilità al gelo neutra = 1.0)

## Frontend

- [x] Sezione "Indici di rischio": riga "Rischio climatico" con la **minaccia dominante** + badge `SemaforoRischio` (componente riusato da US34)
- [x] Click sul badge → dettaglio delle 3 minacce (livello + Tmin/Tmax/% ore umide) + esposizione, fase, finestra
- [x] Messaggio "non disponibile" mostrato solo se mancano **sia** fitosanitario sia climatico

## Coerenza con il design

- [x] **Criterio di accettazione backlog**: "T -3°C, campo esposto a nord, fase germogliamento → indice climatico alto per gelate tardive" ✓
- [x] Minacce alpine coperte: gelate, stress termico, eccesso di umidità ✓
- [x] Riusa il componente semaforico di US34 ✓
- [x] Prepara US37 (notifiche al superamento soglia)

## Casi limite

- [x] Nessun dato meteo nelle 48h → `null`
- [x] Campo senza `esposizione` → fattore neutro (×1.0)
- [x] Campo senza coltura/fase → calcolo comunque possibile (gelo con sensibilità neutra)
- [x] Tutte le minacce basse → `minaccia: "nessuna"`, livello basso
- [x] Rilevazioni con `temperaturaC`/`umiditaPerc` null → escluse dal rispettivo conteggio

## Procedura demo

1. Campo esposto a **Nord**, vite in **germogliamento**
2. Inserire/seed dati meteo con `Tmin -3°C` nelle ultime 48h
3. `GET /api/v1/fields/:id/indici/climatico` → `livello: "alto"`, `minaccia: "gelate"`, `dettaglio.gelate.tMinC: -3`
4. Scheda campo → "Rischio climatico · Gelate" con badge **rosso "Alto"**; click → dettaglio minacce

## Note

US35 completa la coppia di indici di rischio del DSS (fitosanitario US33-34 + climatico US35). Il modello a soglie è una semplificazione didattica calibrata sulle minacce della viticoltura alpina trentina (gelate tardive in primavera, stress termico estivo, ristagni umidi). Calcolo on-demand; la persistenza per notifiche (US37) e storico (US40) arriverà nelle US dedicate. Riusa il componente `SemaforoRischio` di US34.