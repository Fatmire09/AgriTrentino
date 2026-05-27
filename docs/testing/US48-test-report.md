# Test Report — US48 Indicatore percentuale interventi giustificati

> Nota numerazione: nel backlog questa funzionalità corrisponde alla #49 (Imp. 500); nel progetto è tracciata come US48. La "Selezione annata storica" (backlog #48) sarà la nostra US49.

## Obiettivo

Mostrare nella dashboard la percentuale di interventi **giustificati** sul totale, per valutare l'efficienza delle decisioni agronomiche.

## Backend — `GET /api/v1/dashboard/sostenibilita` (`routes/dashboard.js`)

- [x] Aggrega tutti gli interventi dei campi dell'utente
- [x] Classifica ogni intervento (riusa `classificaIntervento`, US43) → `giustificati` / `superflui` / `nonValutabili`
- [x] `percentualeGiustificati = giustificati / (giustificati + superflui) × 100` (i "Non valutabile" sono esclusi dal denominatore)
- [x] `percentualeGiustificati = null` se nessun intervento è classificabile
- [x] Senza token → 401

## Fix robustezza classificazione (fallback on-demand)

- [x] `classificaIntervento`: se per la data dell'intervento non esiste uno snapshot storico (es. interventi di oggi, non coperti dal seed US40) → fallback
  - trattamento → indice **fitosanitario on-demand** (corrente)
  - irrigazione → **ultimo bilancio idrico** disponibile per il campo
- [x] Risolve il caso in cui gli interventi recenti risultavano tutti "Non valutabile" e la dashboard restava vuota

## Frontend — pagina Dashboard

- [x] Grafico a **ciambella** (recharts): verde = giustificati, rosso = superflui, **% al centro**
- [x] Legenda con i conteggi (giustificati / superflui / non valutabili)
- [x] Se `percentualeGiustificati` è `null` → messaggio esplicativo
- [x] Rimossa la nota grigia obsoleta "Filtri e modifica disponibili in US44–US46" dal registro

## Coerenza con il design

- [x] **Criterio di accettazione backlog**: la dashboard mostra un grafico con la % di interventi giustificati ✓
- [x] Riusa la classificazione di US43 ed estende l'endpoint dashboard di US47

## Casi limite

- [x] Nessun intervento → `percentualeGiustificati: null`, stato vuoto
- [x] Solo interventi non classificabili (campo senza coltura/fase/meteo per il fallback) → `null` + messaggio
- [x] Tutti giustificati → 100% · tutti superflui → 0%

## Procedura demo

1. Registra alcuni trattamenti (alcuni in giorni a rischio basso → Superfluo, altri medio/alto → Giustificato)
2. Apri la **Dashboard** → la ciambella mostra la % di giustificati + i conteggi

## Note

US48 popola la dashboard col primo indicatore reale. Il fallback on-demand rende la classificazione affidabile anche per interventi su date senza snapshot storico. Prossimi indicatori: risparmio idrico, risparmio chimico, trend del rischio.