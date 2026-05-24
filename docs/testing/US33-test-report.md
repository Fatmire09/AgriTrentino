# Test Report — US33 Calcolo indice rischio fitosanitario

## Modello

US33 calcola un indice di rischio per la **peronospora della vite** (Plasmopara viticola) incrociando dati meteo, coltura e fase fenologica, **on-demand** sulla finestra delle ultime 48 ore.

**Condizione oraria favorevole all'infezione**: `UR > 80%` E `15°C ≤ T ≤ 25°C`

**Punteggio**: `(ore favorevoli / ore totali) × 100 × suscettibilità(fase)` → 0-100

**Livelli**: `basso` (< 33) · `medio` (33-65) · `alto` (≥ 66)

Suscettibilità della vite per fase: gemma_dormiente 0.1, germogliamento 0.5, fioritura 1.0, allegagione 1.0, invaiatura 0.7, maturazione 0.4, caduta_foglie 0.1.

## Schema dati

- [x] Nessun nuovo modello: riusa `DatiMeteo` (`temperaturaC`, `umiditaPerc`, `timestamp`) e `Coltura` (`fase`)
- [x] Calcolo on-demand alla lettura, nessuna persistenza (lo storico indici arriva in US40)

## Service `rischioFitosanitarioService.js`

- [x] `contaOreFavorevoli(appezzamentoId, dataInizio, dataFine)` — conta rilevazioni totali valide e quelle favorevoli; ignora rilevazioni con temp/umidità `null`
- [x] `calcolaRischioFitosanitario(coltura)` — ritorna `null` se manca la fase o non ci sono dati meteo nella finestra; altrimenti punteggio, livello e componenti
- [x] `livelloDaPunteggio(punteggio)` — soglie 33 / 66
- [x] Sanity check: 48h tutte favorevoli + fase fioritura (susc 1.0) → punteggio 100 → livello **alto** (coerente con la demo del backlog)

## Endpoint `GET /api/v1/fields/:fieldId/indici/fitosanitario`

- [x] Senza token → 401
- [x] Token + campo proprio con coltura+fase+meteo → 200 con `{fitosanitario: {...}}`
- [x] Token + campo senza coltura → 200 con `{fitosanitario: null, message: "Nessuna coltura..."}`
- [x] Token + coltura senza fase / meteo insufficiente nelle 48h → 200 con `{fitosanitario: null, message: "Indice non calcolabile..."}`
- [x] Campo altrui → 403
- [x] Campo inesistente → 404
- [x] ID malformato → 400

## Frontend

- [x] Sezione "Indici di rischio" nella scheda campo: badge colorato (verde basso / giallo medio / rosso alto) con livello peronospora
- [x] Dettaglio: punteggio /100 + ore favorevoli/totali + soglie del modello + finestra 48h
- [x] Caso senza dati: messaggio grigio informativo
- [x] La visualizzazione semaforica completa e cliccabile è demandata a US34

## Coerenza con il design

- [x] **Criterio di accettazione backlog**: "vite in fioritura, dopo 48h con UR >80% e temperatura 15-25°C → indice peronospora alto" ✓ (verificato: punteggio 100 → alto)
- [x] Indice calcolato **incrociando meteo + coltura + fase** ✓
- [x] Prepara US34 (badge semaforico), US37 (notifiche superamento soglia), US40 (storico indici)

## Casi limite

- [x] Coltura senza fase → `null` (la suscettibilità richiede la fase)
- [x] Nessun dato meteo nelle 48h → `null` (non si inventano valori)
- [x] Rilevazioni con `temperaturaC`/`umiditaPerc` null → escluse dal conteggio
- [x] Fase a bassa suscettibilità (es. gemma_dormiente 0.1): anche con 100% ore favorevoli, punteggio max ~10 → **basso** (corretto: pianta dormiente poco vulnerabile)

## Procedura demo

1. Campo con coltura Vite in fase **fioritura**
2. Inserire/seed 48h di dati meteo con UR >80% e T 15-25°C
3. `GET /api/v1/fields/:id/indici/fitosanitario` → `livello: "alto"`, `punteggio: 100`
4. Scheda campo → sezione "Indici di rischio": badge **rosso "alto"** con punteggio e ore favorevoli

## Note

US33 introduce il primo **indice di rischio** del DSS. Il modello peronospora (umidità + temperatura nella finestra 48h, pesati per la suscettibilità fenologica) è una semplificazione didattica dei modelli di bagnatura fogliare / "regola dei tre dieci". Il calcolo è on-demand per semplicità; la persistenza necessaria a storico (US40) e notifiche (US37) verrà aggiunta nelle US dedicate.