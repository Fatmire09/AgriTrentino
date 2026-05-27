# Test Report — US49 Selezione annata storica nella dashboard

> Nota numerazione: nel backlog questa funzionalità è la #48; nel progetto è tracciata come US49 (per lo scarto introdotto con il "% interventi giustificati" = nostra US48).

## Obiettivo

Selezionare un'annata agricola passata nella dashboard sostenibilità per consultare gli indicatori di quella stagione e confrontarli con la corrente.

## Backend — `GET /api/v1/dashboard/sostenibilita` (`routes/dashboard.js`)

- [x] `annateDisponibili` = anni (solari) con almeno un intervento, in ordine decrescente
- [x] `?anno=YYYY` → filtra gli interventi per quell'annata
- [x] `annoSelezionato` = `?anno` se valido, altrimenti la più recente disponibile (o l'anno corrente)
- [x] Breakdown classificazione + `percentualeGiustificati` calcolati sugli interventi dell'annata selezionata
- [x] `haInterventi` resta su tutti gli interventi (stato vuoto US47)
- [x] Senza token → 401

## Frontend — pagina Dashboard

- [x] Dropdown **"Annata"** popolato da `annateDisponibili`
- [x] Valore = annata scelta o `annoSelezionato` di default
- [x] Cambiando annata, gli indicatori (ciambella + conteggi) si **ricaricano** per quella stagione
- [x] Dropdown mostrato solo se ci sono annate disponibili

## Coerenza con il design

- [x] **Criterio di accettazione backlog**: selezionando un'annata diversa, tutti gli indicatori si aggiornano sui dati di quella stagione ✓
- [x] Consente il confronto tra stagioni cambiando il menu

## Casi limite

- [x] `?anno` non valido o non tra le disponibili → default alla più recente
- [x] Una sola annata con dati → un solo anno nel menu
- [x] Annata selezionata senza interventi classificabili → `percentualeGiustificati: null` + messaggio

## Procedura demo

1. Account con interventi in più annate (es. 2025 e 2026)
2. Apri la **Dashboard** → menu "Annata"
3. Seleziona **2025** → ciambella e conteggi mostrano i dati del 2025
4. Torna a **2026** → indicatori aggiornati

## Note

US49 (backlog #48) aggiunge il confronto storico tra stagioni alla dashboard, estendendo l'endpoint di US47/US48 col filtro per annata. I prossimi indicatori (risparmio idrico/chimico, trend) rispetteranno lo stesso filtro.