# Test Report — US44 Lista interventi con filtri

## Obiettivo

Filtrare il registro interventi per **tipologia** e **periodo**, per consultare velocemente sottoinsiemi rilevanti dello storico.

## Backend — `GET /interventi` (`routes/interventi.js`)

- [x] `?tipologia` (`trattamento`|`irrigazione`) → filtra per tipologia (valori non validi ignorati)
- [x] `?giorni=N` → solo interventi con `dataOra` negli ultimi N giorni
- [x] Filtri **combinabili** (AND)
- [x] Senza parametri → tutti gli interventi (comportamento US42 invariato)
- [x] La classificazione US43 continua a essere calcolata sui risultati filtrati

## Frontend — registro in `FieldDetail.jsx`

- [x] Menu a tendina **tipologia** (Tutte / Trattamenti / Irrigazioni)
- [x] Menu a tendina **periodo** (Tutto / 7 / 30 / 90 / 365 giorni)
- [x] Al cambio di un filtro la lista si ricarica automaticamente (dipendenze della `useCallback`)
- [x] "Azzera filtri" ripristina la vista completa

## Coerenza con il design

- [x] **Criterio di accettazione backlog**: filtro "ultimi 30 giorni" + "irrigazione" → lista con **solo** gli interventi che soddisfano entrambi ✓
- [x] Filtro per appezzamento implicito (endpoint già scoped sul campo)

## Casi limite

- [x] `?tipologia` non valido → ignorato (ritorna tutte le tipologie)
- [x] `?giorni` non numerico o ≤ 0 → ignorato (nessun filtro sul periodo)
- [x] Nessun intervento che soddisfa i filtri → lista vuota (nessun errore)
- [x] Filtri combinati → in AND

## Procedura demo

1. Apri il registro di un campo con vari interventi
2. Seleziona **"Irrigazioni"** + **"Ultimi 30 giorni"** → la lista mostra solo le irrigazioni degli ultimi 30 giorni
3. **"Azzera filtri"** → torna l'elenco completo
4. (API) `GET /interventi?giorni=30&tipologia=irrigazione` → solo i record corrispondenti

## Note

US44 aggiunge la consultazione mirata dello storico interventi. Prepara US45 (modifica intervento) e US46 (eliminazione), e la dashboard sostenibilità (US47+).