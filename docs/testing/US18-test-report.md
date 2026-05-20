# Test Report — US18 Visualizzazione dettagli appezzamento

## Lato server (`GET /api/v1/fields/:id`)

- [x] Richiesta senza header `Authorization` → 401 `{ "error": "Token mancante" }`
- [x] Richiesta con token valido + id di un proprio campo → 200 con `{ field: { _id, nome, latitudine, longitudine, superficie, pendenza, coltura, esposizione, ownerId, createdAt, updatedAt } }`
- [x] Richiesta con token valido + id appartenente a un altro utente → 403 `{ "error": "Non autorizzato" }`
- [x] Richiesta con token valido + id MongoDB inesistente → 404 `{ "error": "Appezzamento non trovato" }`
- [x] Richiesta con token valido + id malformato (es. "notvalid") → 400 `{ "error": "ID non valido" }`
- [x] Il campo `password` non viene mai restituito (il modello Field non lo contiene)
- [x] Il controllo `ownerId === req.userId` viene fatto sempre prima di restituire il documento (no data leakage cross-user)

## Lato client (`FieldDetail.jsx` su `/fields/:id`)

- [x] Click su una card in `/fields` → naviga a `/fields/:id` (Link wrappato fin dallo Sprint #1)
- [x] Pagina dettaglio mostra: nome dell'appezzamento, coordinate (4 decimali), superficie in m², pendenza (se presente), esposizione (se presente), coltura (se presente)
- [x] Campi opzionali assenti (es. esposizione mancante) NON vengono renderizzati (no riga vuota)
- [x] Sezione "Dati meteo" mostra placeholder *"Disponibili dopo l'implementazione del modulo meteo (US26-US31)"*
- [x] Sezione "Indici di rischio" mostra placeholder *"Disponibili dopo US34-US37"*
- [x] Sezione "Storico interventi" mostra placeholder *"Disponibili dopo US42-US47"*
- [x] Link "← Tutti i campi" in cima riporta alla lista `/fields`
- [x] Visita a `/fields/:id` di un campo di altro utente → banner rosso "Non sei autorizzato a vedere questo appezzamento"
- [x] Visita a `/fields/:id` con id inesistente → banner rosso "Appezzamento non trovato"
- [x] Visita a `/fields/:id` con id malformato → banner rosso "ID appezzamento non valido"
- [x] Visita a `/fields/:id` senza token (utente non loggato) → redirect immediato a `/login`
- [x] Token scaduto durante la visita → localStorage pulito + redirect a `/login`

## Sicurezza

- [x] Nessuna informazione di altri utenti accessibile manipolando l'URL (`/fields/<id_altrui>` → 403)
- [x] Stesso identico messaggio per "non trovato" e per "non autorizzato" non è strettamente richiesto (l'agricoltore sa solo dei propri campi), ma il server restituisce 403 distinto da 404 perché entrambi gli endpoint richiedono comunque token valido (no enumerazione anonima possibile)

## Casi limite

- [x] Click su card di un campo con tutti i campi opzionali presenti (pendenza, esposizione, coltura) → tutte le righe renderizzate
- [x] Click su card di un campo con solo i campi obbligatori (nome, lat, lng, superficie) → solo quelle righe; placeholder Meteo/Indici/Interventi comunque visibili
- [x] Refresh della pagina dettaglio mantiene la visualizzazione corretta (i dati vengono ricaricati dall'API)

## Note

La pagina mostra in questo sprint solo i dati anagrafici già persistiti nello schema `Field`. Le sezioni Meteo, Indici di rischio e Storico interventi sono placeholder che verranno popolate dalle US successive del Product Backlog:
- US26-US31 → modulo meteo
- US34-US37 → indici di rischio fitosanitario e climatico
- US42-US47 → registro interventi