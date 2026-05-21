# Test Report — US24 Aggiornamento manuale fase fenologica

## Lato server (`PATCH /api/v1/fields/:fieldId/colture/:colturaId`)

- [x] Richiesta senza header `Authorization` → 401 `{ "error": "Token mancante" }`
- [x] Richiesta con token valido + body `{ "fase": "allegagione" }` su coltura propria → 200 con `{ message, coltura: {...} }` aggiornata
- [x] Il campo `dataAggiornamento` viene aggiornato automaticamente al timestamp corrente
- [x] Il campo `updatedAt` (Mongoose timestamps) viene aggiornato automaticamente
- [x] Richiesta su coltura di altro utente → 403 `{ "error": "Non autorizzato" }` (verifica via ownerId del Field padre)
- [x] Richiesta con `colturaId` inesistente → 404 `{ "error": "Coltura non trovata" }`
- [x] Richiesta con `colturaId` di una coltura non appartenente al `fieldId` indicato → 404 `{ "error": "Coltura non trovata" }`
- [x] Richiesta con `fieldId` inesistente → 404 `{ "error": "Appezzamento non trovato" }`
- [x] Richiesta con body vuoto `{}` → 400 `{ "error": "La fase fenologica è obbligatoria" }`
- [x] Richiesta con `fase: ""` (stringa vuota) → 400 (stesso messaggio)
- [x] Richiesta con `fase: "spaccata"` → 400 `{ "error": "Validazione fallita: fase 'spaccata' non valida per tipologia 'Vite'. Fasi ammesse: ..." }`
- [x] Richiesta con `colturaId` malformato → 400 `{ "error": "ID non valido" }`
- [x] Le altre proprietà della coltura (tipologia, varieta, appezzamentoId, createdAt) restano invariate

## Lato client (`FieldDetail.jsx` — sezione Coltura corrente)

- [x] Nella card "Coltura corrente" è visibile un link "Aggiorna fase fenologica" in verde sotto la data di aggiornamento
- [x] Il link è visibile solo quando NON è aperto il form di aggiunta coltura e quando NON è già aperto il form di aggiornamento fase
- [x] Click sul link → si apre un piccolo form con dropdown delle fasi della tipologia della coltura
- [x] Il dropdown è precompilato con la fase attualmente impostata (se presente)
- [x] Se la coltura non ha ancora una fase, il dropdown mostra "— Seleziona fase —"
- [x] Cliccando Conferma senza aver selezionato una fase → errore inline "Seleziona una fase fenologica"
- [x] Selezionando una fase valida e cliccando Conferma → chiamata PATCH, la card si aggiorna con la nuova fase e la nuova data
- [x] Durante l'aggiornamento il bottone Conferma mostra "Aggiornamento..." ed è disabilitato
- [x] In caso di errore server appare un testo rosso sotto al dropdown
- [x] Cliccando Annulla → il form si chiude senza modifiche
- [x] L'operazione **non crea una nuova coltura**: lo storico colture non cambia, solo la coltura corrente viene aggiornata

## Differenza tra US23 e US24

- [x] **US23 (POST /colture)**: crea una **nuova** coltura, la precedente entra nello storico → utilizzato per cambiare tipologia/varietà o iniziare nuova stagione
- [x] **US24 (PATCH /colture/:colturaId)**: aggiorna la **stessa** coltura esistente, solo il campo fase + dataAggiornamento → utilizzato per seguire l'avanzamento fenologico della stessa pianta nel tempo
- [x] La distinzione è coerente con il design UML D2 dove la classe `Coltura` ha il metodo `aggiornaFaseManuale(FaseFenologica fase)`

## Sicurezza

- [x] Verifica a doppio livello: prima controllo che il `fieldId` esista e sia dell'utente, poi che la `colturaId` appartenga a quel field
- [x] Manipolare l'URL con un `colturaId` di un'altra coltura (anche del proprio account) ma di un campo diverso → 404 (la coltura non appartiene al field indicato nel path)
- [x] Tentativo di modifica di una coltura altrui anche conoscendo il suo ID esatto → 403 (failsafe sull'ownerId del field)
- [x] La nuova fase passa attraverso lo stesso validatore enum di US23 (no fasi "fittizie" o non previste)

## Casi limite

- [x] Aggiornamento alla stessa fase già impostata (es. fioritura → fioritura) → consentito, viene comunque aggiornato dataAggiornamento
- [x] Aggiornamento di una coltura senza fase iniziale (creata in US21/US22) → consentito, la fase viene impostata per la prima volta
- [x] Refresh dopo aggiornamento → la coltura corrente mostra la nuova fase e la nuova data

## Coerenza con il design (D1, D2)

- [x] **RF07 (parte fase fenologica)**: *"... fase fenologica attuale. Questi dati devono essere aggiornabili nel corso della stagione produttiva."* → soddisfatto
- [x] **UML D2 classe Coltura**: metodo `aggiornaFaseManuale(FaseFenologica fase)` → implementato come PATCH endpoint
- [x] La nota nel backlog "*gli indici di rischio si ricalcolino*" non si applica in questo sprint (gli indici arrivano in US33+). Quando arriveranno, useranno il valore `fase` aggiornato da questo endpoint come parametro di input.

## Note

US24 è strettamente legata a US23: senza US23 (introduzione del campo `fase` con validazione enum) US24 non avrebbe avuto senso. La distinzione architetturale tra **creazione di nuova coltura (POST)** e **aggiornamento della fase corrente (PATCH)** rispecchia la realtà agronomica: un appezzamento mantiene la stessa coltura per tutta la stagione, ma la sua fase fenologica evolve nel tempo. Il sistema modella correttamente questo flusso temporale.

Il bottone "Aggiorna fase fenologica" è posizionato direttamente nella card "Coltura corrente", non in un menu separato, per rendere immediato l'aggiornamento — operazione che l'agricoltore farà tipicamente ogni 1-2 settimane durante la stagione.