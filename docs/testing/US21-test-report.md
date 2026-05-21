# Test Report — US21 Selezione tipologia coltura

## Schema dati e modello

- [x] Modello Mongoose `Coltura` creato in `server/models/Coltura.js` con campi: `appezzamentoId` (ref Field), `tipologia` (enum), `varieta` (default null), `fase` (default null), `dataAggiornamento` (Date), timestamps
- [x] Costanti centralizzate in `server/constants/colture.js`: `TIPOLOGIE_COLTURA` (Sprint #2 = ['Vite']), `FASI_FENOLOGICHE_VITE` (per US23), `VARIETA_PER_TIPOLOGIA` (per US22)
- [x] Coerente con UML D2: classe `Coltura` separata da `Appezzamento`, aggregata 1..* (un appezzamento può avere più colture nel tempo)
- [x] Indice composito `{ appezzamentoId: 1, createdAt: -1 }` per recuperare velocemente le colture di un appezzamento ordinate dalla più recente

## Lato server (`POST /api/v1/fields/:fieldId/colture`)

- [x] Richiesta senza header `Authorization` → 401 `{ "error": "Token mancante" }`
- [x] Richiesta con token valido + body `{ "tipologia": "Vite" }` → 201 con `{ message, coltura: {...} }`
- [x] La coltura creata ha `appezzamentoId` impostato automaticamente dal `:fieldId` del path
- [x] Richiesta con body vuoto → 400 `{ "error": "La tipologia della coltura è obbligatoria" }`
- [x] Richiesta con `tipologia: "Cocomero"` → 400 `{ "error": "Validazione fallita: tipologia deve essere una tra: Vite" }` (enum check Mongoose)
- [x] Richiesta su id appezzamento di altro utente → 403 `{ "error": "Non autorizzato" }`
- [x] Richiesta su id appezzamento inesistente → 404 `{ "error": "Appezzamento non trovato" }`
- [x] Richiesta con id malformato → 400 `{ "error": "ID non valido" }`

## Lato server (`GET /api/v1/fields/:fieldId/colture`)

- [x] Richiesta senza header `Authorization` → 401 `{ "error": "Token mancante" }`
- [x] Richiesta con token valido → 200 `{ colture: [...] }` con tutte le colture dell'appezzamento
- [x] Colture ordinate per `createdAt` decrescente (la più recente in cima)
- [x] Appezzamento senza colture → 200 `{ "colture": [] }`
- [x] Richiesta su id appezzamento di altro utente → 403 `{ "error": "Non autorizzato" }`
- [x] Richiesta su id appezzamento inesistente → 404 `{ "error": "Appezzamento non trovato" }`

## Lato client (`FieldDetail.jsx` — sezione Coltura)

- [x] Appezzamento senza colture → messaggio "Nessuna coltura associata a questo appezzamento" + bottone "Aggiungi coltura"
- [x] Click su "Aggiungi coltura" → si apre riquadro con dropdown tipologia (unica opzione "Vite") + bottoni Annulla/Conferma
- [x] Click "Annulla" → riquadro si chiude, nessuna modifica
- [x] Click "Conferma" → chiamata POST, la coltura compare nella card verde "Coltura corrente"
- [x] La card "Coltura corrente" mostra tipologia + data di aggiornamento in formato italiano (es. "21/05/2026")
- [x] Click "Cambia coltura" → riapre il riquadro con dropdown
- [x] Dopo aggiunta di una seconda coltura, la prima entra nello "Storico colture (1)" espandibile
- [x] Lo storico colture è collapsato di default (uso del tag `<details>`)
- [x] Durante il salvataggio il bottone "Conferma" mostra "Salvataggio..." ed è disabilitato
- [x] In caso di errore server appare un testo rosso sotto al dropdown
- [x] Nota informativa "Altre tipologie (Melo, Piccoli Frutti) saranno disponibili negli sprint futuri" sotto al dropdown

## Sicurezza

- [x] Tentativo di POST coltura su appezzamento di altro utente → 403, nessun documento creato
- [x] Tentativo di GET colture di altro utente → 403
- [x] `appezzamentoId` impostato server-side (dal path param), non manipolabile dal body

## Casi limite

- [x] Aggiunta di una coltura uguale a quella corrente (es. Vite → Vite) → consentita, viene creato un nuovo documento (storico)
- [x] Aggiunta di più colture in rapida successione → tutte salvate in ordine corretto
- [x] Refresh della pagina mantiene la coltura corrente visualizzata (caricata da GET /colture)

## Coerenza con il design (D1, D2)

- [x] RF07 "Anagrafica colture": utente associa tipologia (in roadmap: varietà US22, fase US23)
- [x] UML D2: classe `Coltura` separata, aggregazione 1..* con `Appezzamento`
- [x] Per ora il vecchio campo `coltura: String` in `Field` (legacy Sprint #1) resta nello schema ma non viene più usato dal frontend

## Note

US21 è una versione semplificata del modello UML: la classe `Coltura` esiste con `tipologia` validata tramite enum Mongoose, mentre `varieta` e `fase` sono presenti nello schema con `default: null` e saranno popolate da US22 (varietà) e US23 (fase fenologica). Le costanti `VARIETA_PER_TIPOLOGIA` e `FASI_FENOLOGICHE_VITE` sono già state predisposte nel file `server/constants/colture.js` per rendere immediata l'implementazione delle prossime US.

Il vecchio campo `coltura: String` introdotto nello Sprint #1 nel modello `Field` resta nello schema per retrocompatibilità con i dati esistenti, ma non viene più letto né scritto dal nuovo flusso. Verrà rimosso in uno sprint di pulizia futuro.