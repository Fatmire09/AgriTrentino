# Test Report — US23 Inserimento fase fenologica iniziale

## Schema dati

- [x] Campo `fase` in modello `Coltura.js` con validatore custom basato su `FASI_PER_TIPOLOGIA`
- [x] La validazione accetta `null`, `undefined` e stringa vuota (fase opzionale)
- [x] La validazione rifiuta valori non presenti in `FASI_PER_TIPOLOGIA[tipologia]`
- [x] Fasi fenologiche per Vite (7 fasi): gemma_dormiente, germogliamento, fioritura, allegagione, invaiatura, maturazione, caduta_foglie
- [x] Costanti centralizzate in `server/constants/colture.js` (`FASI_FENOLOGICHE_VITE`) e replicate nel frontend (`FieldDetail.jsx`)

## Lato server (`POST /api/v1/fields/:fieldId/colture`)

- [x] Richiesta `{ "tipologia": "Vite", "varieta": "Chardonnay", "fase": "fioritura" }` → 201, coltura creata con `fase: "fioritura"`
- [x] Richiesta `{ "tipologia": "Vite", "varieta": "Pinot Nero" }` (senza fase) → 201, coltura creata con `fase: null` (campo opzionale)
- [x] Richiesta `{ "tipologia": "Vite", "fase": "allegagione" }` (con fase senza varietà) → 201, coltura creata con fase ma `varieta: null`
- [x] Richiesta `{ "tipologia": "Vite", "fase": "" }` → 201, stringa vuota trattata come "non specificata"
- [x] Richiesta `{ "tipologia": "Vite", "fase": "spaccata" }` → 400 con messaggio dettagliato: `"Validazione fallita: fase 'spaccata' non valida per tipologia 'Vite'. Fasi ammesse: gemma_dormiente, germogliamento, fioritura, allegagione, invaiatura, maturazione, caduta_foglie"`
- [x] Richiesta con tutti i 3 campi (tipologia + varietà + fase) tutti validi → 201, tutti e 3 popolati correttamente
- [x] Tutti i controlli di US21 e US22 (auth, ownership, 404, validazione tipologia, validazione varietà) continuano a funzionare

## Lato server (`GET /api/v1/fields/:fieldId/colture`)

- [x] La risposta include il campo `fase` (string oppure null) per ogni coltura
- [x] Le colture esistenti (create in US21/US22 senza fase) hanno `fase: null` e vengono restituite correttamente (no regressione)

## Lato client (`FieldDetail.jsx`)

- [x] Click su "Aggiungi coltura" / "Cambia coltura" → si apre il riquadro con **tre dropdown**: Tipologia, Varietà e Fase fenologica
- [x] Il dropdown Fase mostra come prima opzione "— Fase non specificata —" (value=""), poi le 7 fasi della Vite con etichette user-friendly
- [x] Le etichette nel dropdown sono in italiano leggibile (es. "Gemma dormiente" invece di "gemma_dormiente")
- [x] Selezionando una fase e cliccando Conferma → POST inviato con `fase` valorizzata
- [x] Lasciando "Fase non specificata" e cliccando Conferma → POST inviato con `fase: null`
- [x] La card "Coltura corrente" mostra una nuova riga "Fase fenologica: [etichetta]" solo se la fase è presente
- [x] L'etichetta visualizzata è quella user-friendly (es. "Fioritura"), non il valore enum interno (es. "fioritura")
- [x] Lo storico colture mostra il formato `"Vite (Chardonnay) · Fioritura — DD/MM/AAAA"` per le colture con fase
- [x] Dopo aver aggiunto una coltura, lo stato `newFase` viene resettato a stringa vuota
- [x] Le opzioni fase nel dropdown dipendono dalla tipologia: cambia tipologia → cambia lista fasi (estensibile per future tipologie)
- [x] Il messaggio di aiuto sotto il dropdown chiarisce che la fase serve per il calcolo degli indici di rischio (in arrivo nelle US successive)

## Sicurezza e validazione

- [x] La lista delle fasi valide è hardcoded nel backend (`FASI_PER_TIPOLOGIA`), non manipolabile dall'utente
- [x] Anche se il frontend permettesse di inviare una fase invalida, il backend la rifiuta con 400
- [x] Il messaggio di errore enumera le fasi ammesse (UX migliore per debug)
- [x] Backend e frontend condividono la stessa fonte di verità delle fasi (costanti speculari)

## Casi limite

- [x] Aggiunta di una coltura solo con tipologia, poi cambio coltura con anche fase → entrambe salvate, la più recente con fase
- [x] Cambio coltura mantenendo la stessa fase → consentito, viene creato un nuovo documento storico
- [x] Refresh della pagina mantiene la coltura corrente con la sua fase fenologica visualizzata
- [x] Tentativo di POST con fase in maiuscolo (es. "FIORITURA") → 400 (case-sensitive, deve corrispondere esattamente)

## Coerenza con il design (D1, D2)

- [x] RF07 "Anagrafica colture": *"L'utente deve poter associare a ciascun appezzamento le informazioni relative alle colture praticate: tipologia, varietà specifica e **fase fenologica attuale**"* → fase ora implementata
- [x] UML D2: campo `fase: FaseFenologica` nella classe `Coltura` → corrisponde all'implementazione (con enum vincolato alla tipologia)
- [x] Mantiene compatibilità con dati esistenti (colture create in US21/US22 senza fase restano leggibili)

## Note

US23 completa il ciclo iniziato in US21 (tipologia) e US22 (varietà), portando la classe `Coltura` al pieno design previsto dal diagramma UML D2: ora una coltura ha tipologia (enum), varietà (string validato per tipologia), fase fenologica (enum per tipologia) e dataAggiornamento (Date).

La nota nel backlog "*verificare che gli indici di rischio si ricalcolino*" non è applicabile in questo Sprint #2 perché gli indici di rischio fitosanitario e climatico verranno implementati a partire da US33 (calcolo automatico fase fenologica) e US34 (calcolo indice fitosanitario). Quando arriveranno, il loro calcolo userà il valore `fase` impostato in US23 come parametro di input.

Il sistema è ora pronto a ricevere implementazioni delle US successive (US24 aggiornamento manuale fase, US25 recupero dati meteo, e così via) senza ulteriori modifiche al modello `Coltura`.