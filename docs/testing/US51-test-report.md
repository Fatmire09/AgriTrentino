# Test Report — US51 Stima risparmio chimico

## Obiettivo

Mostrare nella dashboard i kg di principio attivo risparmiati rispetto a una gestione "a calendario", per quantificare la riduzione dell'impatto chimico.

## Modello baseline

- Regime "a calendario": **8 trattamenti/stagione × 2 kg = 16 kg** per campo trattato
- `risparmioChimicoKg = max(0, baseline − kg effettivamente usati)` (costanti documentate, assunzione di progetto)

## Backend — `GET /api/v1/dashboard/sostenibilita` (`routes/dashboard.js`)

- [x] `kgTrattati` = somma delle `quantita` dei trattamenti dell'annata selezionata (arrotondato a 1 decimale)
- [x] `campiTrattati` = numero di campi distinti con almeno un trattamento
- [x] `baselineChimicaKg = campiTrattati × 16`
- [x] `risparmioChimicoKg = max(0, baseline − kgTrattati)`; `null` se nessun trattamento
- [x] Rispetta il filtro annata (US49)

## Frontend — pagina Dashboard

- [x] Card **"Risparmio chimico"** (kg, in evidenza) sotto la card idrica, con baseline e usato spiegati
- [x] Si aggiorna al cambio di annata
- [x] Senza trattamenti → messaggio "Nessun trattamento registrato in questa annata"

## Coerenza con il design

- [x] **Criterio di accettazione backlog**: valore stimato in kg di principio attivo risparmiati nella stagione, con baseline di riferimento spiegata ✓

## Casi limite

- [x] Nessun trattamento nell'annata → `risparmioChimicoKg: null`
- [x] Usato più della baseline → risparmio **0** (clamp a 0)
- [x] Cambio annata → calcolo sull'annata selezionata

## Procedura demo

1. Account con trattamenti registrati
2. Dashboard → card "Risparmio chimico": es. baseline 16 kg, usato 4 kg → **12 kg risparmiati**
3. Cambia annata → il valore si aggiorna

## Note

US51 completa la coppia di indicatori di risparmio (idrico US50 + chimico US51) della dashboard. Le costanti della baseline (8 trattamenti, 2 kg) sono assunzioni documentate. Prossimo: trend stagionale del rischio medio (US52).