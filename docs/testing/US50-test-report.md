# Test Report — US50 Stima risparmio idrico

## Obiettivo

Mostrare nella dashboard i litri d'acqua risparmiati rispetto a una gestione "a calendario", per quantificare l'impatto sul consumo idrico.

## Modello baseline

- Regime "a calendario": **200 L/settimana × 26 settimane = 5200 L** per campo irrigato per stagione
- `risparmioIdricoLitri = max(0, baseline − litri effettivamente irrigati)` (costanti documentate, assunzione di progetto)

## Backend — `GET /api/v1/dashboard/sostenibilita` (`routes/dashboard.js`)

- [x] `litriIrrigati` = somma dei `volumeAcqua` delle irrigazioni dell'annata selezionata
- [x] `campiIrrigati` = numero di campi distinti con almeno un'irrigazione
- [x] `baselineIdricaLitri = campiIrrigati × 5200`
- [x] `risparmioIdricoLitri = max(0, baseline − litriIrrigati)`; `null` se nessuna irrigazione
- [x] Rispetta il filtro annata (US49)

## Frontend — pagina Dashboard

- [x] Card **"Risparmio idrico"** con i litri risparmiati (in evidenza) + baseline e irrigato spiegati
- [x] Si aggiorna al cambio di annata
- [x] Senza irrigazioni → messaggio "Nessuna irrigazione registrata in questa annata"

## Coerenza con il design

- [x] **Criterio di accettazione backlog**: valore stimato in litri risparmiati nella stagione, con baseline di riferimento spiegata ✓

## Casi limite

- [x] Nessuna irrigazione nell'annata → `risparmioIdricoLitri: null`
- [x] Irrigato più della baseline (over-irrigazione) → risparmio **0** (clamp a 0)
- [x] Cambio annata → calcolo sull'annata selezionata

## Procedura demo

1. Account con irrigazioni registrate
2. Dashboard → card "Risparmio idrico": es. baseline 5200 L, irrigato 800 L → **4400 L risparmiati**
3. Cambia annata → il valore si aggiorna

## Note

US50 quantifica l'impatto idrico positivo del DSS (irrigare solo quando serve, vs calendario fisso). Le costanti (200 L/settimana, 26 settimane) sono assunzioni documentate. Prossimo indicatore: risparmio chimico (US51), analogo sui trattamenti.