# Test Report — US22 Selezione varietà coltura

## Schema dati

- [x] Campo `varieta` in modello `Coltura.js` con validatore custom che usa `VARIETA_PER_TIPOLOGIA` per validare in base al campo `tipologia` dello stesso documento
- [x] La validazione accetta `null`, `undefined` e stringa vuota (varietà opzionale)
- [x] La validazione rifiuta valori non presenti in `VARIETA_PER_TIPOLOGIA[tipologia]`
- [x] Lista varietà per Vite: Chardonnay, Pinot Nero, Müller-Thurgau, Teroldego, Marzemino (5 varietà classiche del Trentino)
- [x] Costanti centralizzate in `server/constants/colture.js` e replicate nel frontend (`FieldDetail.jsx`) per coerenza con backend

## Lato server (`POST /api/v1/fields/:fieldId/colture`)

- [x] Richiesta `{ "tipologia": "Vite", "varieta": "Chardonnay" }` → 201, coltura creata con `varieta: "Chardonnay"`
- [x] Richiesta `{ "tipologia": "Vite" }` (senza varieta) → 201, coltura creata con `varieta: null` (varietà opzionale)
- [x] Richiesta `{ "tipologia": "Vite", "varieta": null }` → 201, equivalente al precedente
- [x] Richiesta `{ "tipologia": "Vite", "varieta": "" }` → 201, stringa vuota trattata come "non specificata"
- [x] Richiesta `{ "tipologia": "Vite", "varieta": "Sangiovese" }` → 400 con messaggio dettagliato: `"Validazione fallita: varieta 'Sangiovese' non valida per tipologia 'Vite'. Varietà ammesse: Chardonnay, Pinot Nero, Müller-Thurgau, Teroldego, Marzemino"`
- [x] Richiesta `{ "varieta": "Chardonnay" }` (senza tipologia) → 400 "La tipologia della coltura è obbligatoria" (errore di tipologia prevale)
- [x] Tutti gli altri controlli di US21 (auth, ownership, 404) continuano a funzionare

## Lato server (`GET /api/v1/fields/:fieldId/colture`)

- [x] La risposta include il campo `varieta` (string oppure null) per ogni coltura
- [x] Le colture esistenti (create in US21 senza varietà) hanno `varieta: null` e vengono restituite correttamente (no regressione)

## Lato client (`FieldDetail.jsx`)

- [x] Click su "Aggiungi coltura" → si apre il riquadro con **due dropdown**: Tipologia e Varietà (opzionale)
- [x] Il dropdown Varietà mostra come prima opzione "— Nessuna varietà specifica —" (value=""), poi le 5 varietà di Vite
- [x] Selezionando una varietà e cliccando Conferma → POST inviato con `varieta` valorizzata
- [x] Lasciando "Nessuna varietà specifica" e cliccando Conferma → POST inviato con `varieta: null` (il backend la accetta)
- [x] La card "Coltura corrente" mostra il formato `"Vite — Chardonnay"` se varietà presente, solo `"Vite"` se assente
- [x] Lo storico colture mostra il formato `"Vite (Chardonnay) — DD/MM/AAAA"` per le colture con varietà
- [x] Dopo aver aggiunto una coltura, lo stato `newVarieta` viene resettato a stringa vuota (per la prossima volta)
- [x] Le opzioni varietà nel dropdown dipendono dalla tipologia: cambia tipologia → cambia lista varietà (utile quando in US futuri ci saranno Melo e Piccoli Frutti)
- [x] Il messaggio di aiuto sotto il dropdown chiarisce che la varietà dipende dalla tipologia

## Sicurezza e validazione

- [x] La lista delle varietà valide è hardcoded nel backend (`VARIETA_PER_TIPOLOGIA`), non manipolabile dall'utente
- [x] Anche se il frontend permettesse di inviare una varietà invalida, il backend la rifiuta con 400
- [x] Il messaggio di errore enumera le varietà ammesse (UX migliore per debug e per chi usa l'API direttamente)

## Casi limite

- [x] Aggiunta di una coltura senza specificare la varietà, poi modifica con varietà → entrambe valide, entrambe salvate
- [x] Refresh della pagina mantiene la coltura corrente con la sua varietà visualizzata
- [x] Tentativo di POST con una stringa molto lunga come varietà (es. 1000 caratteri) → 400 perché non è nella lista ammessa
- [x] Tentativo di POST con varietà in maiuscolo (es. "CHARDONNAY") → 400 (case-sensitive, deve corrispondere esattamente)

## Coerenza con il design (D1, D2)

- [x] RF07 "Anagrafica colture": *"L'utente deve poter associare a ciascun appezzamento le informazioni relative alle colture praticate: tipologia (es. Melo, Vite, Piccoli Frutti), **varietà specifica** e fase fenologica attuale"* → varietà ora implementata
- [x] UML D2: campo `varieta: String` nella classe `Coltura` → corrisponde all'implementazione (con validazione enum vincolata alla tipologia)
- [x] Mantiene compatibilità con dati esistenti (colture create in US21 senza varietà restano leggibili)

## Note

US22 estende US21 senza romperla: tutte le colture create nello sprint precedente (con `varieta: null`) restano valide e visibili. Il dropdown varietà è progettato per essere estensibile: quando in sprint futuri verranno introdotte le tipologie "Melo" e "Piccoli Frutti", basterà aggiungere le rispettive varietà in `VARIETA_PER_TIPOLOGIA` (sia in backend che in frontend) per renderle disponibili.

La validazione lato backend è la fonte unica di verità: il frontend potrebbe in linea teorica essere bypassato, ma una varietà invalida verrebbe comunque rifiutata dal server con un messaggio dettagliato che elenca le varietà ammesse.