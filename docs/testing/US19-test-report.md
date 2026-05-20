# Test Report — US19 Modifica appezzamento esistente

## Lato server (`PATCH /api/v1/fields/:id`)

- [x] Richiesta senza header `Authorization` → 401 `{ "error": "Token mancante" }`
- [x] Richiesta con token valido + id di un proprio campo + body valido → 200 con `{ message, field: {...} }` aggiornato
- [x] Aggiornamento parziale: solo i campi presenti nel body vengono modificati, gli altri restano invariati
- [x] Richiesta con token valido + id di campo di altro utente → 403 `{ "error": "Non autorizzato" }`
- [x] Richiesta con token valido + id MongoDB inesistente → 404 `{ "error": "Appezzamento non trovato" }`
- [x] Richiesta con id malformato (es. "notvalid") → 400 `{ "error": "ID non valido" }`
- [x] Richiesta con body vuoto `{}` → 400 `{ "error": "Nessun campo da aggiornare" }`
- [x] Richiesta con `pendenza: 150` → 400 `{ "error": "Validazione fallita: Pendenza deve essere compresa tra 0 e 100" }`
- [x] Richiesta con `latitudine: 99` → 400 (Validazione Mongoose range -90/+90)
- [x] Richiesta con `longitudine: 200` → 400 (Validazione Mongoose range -180/+180)
- [x] Richiesta con `superficie: 0` → 400 (Validazione Mongoose superficie > 0)
- [x] Richiesta con `nome: ""` (stringa vuota) → 400 `{ "error": "Il nome non può essere vuoto" }`
- [x] Il campo `ownerId` non è modificabile dal body (anche se inviato viene ignorato)
- [x] Il campo `updatedAt` viene aggiornato automaticamente dal save Mongoose

## Lato client (`EditField.jsx` su `/fields/:id/edit`)

- [x] Click sul bottone "Modifica" nella scheda dettaglio → naviga a `/fields/:id/edit`
- [x] Form precompilato con i dati correnti del campo (nome, latitudine, longitudine, superficie, pendenza, coltura, esposizione)
- [x] Validazione client per nome vuoto → errore inline "Il nome è obbligatorio"
- [x] Validazione client per latitudine fuori range → errore inline "Latitudine tra -90 e 90"
- [x] Validazione client per longitudine fuori range → errore inline "Longitudine tra -180 e 180"
- [x] Validazione client per superficie ≤ 0 → errore inline "Superficie deve essere positiva"
- [x] Validazione client per pendenza fuori range → errore inline "Pendenza tra 0 e 100"
- [x] Submit con dati validi → chiamata PATCH, redirect a `/fields/:id` con dati aggiornati visibili
- [x] Submit con errore server (es. validazione fallita) → banner rosso con messaggio del server
- [x] Bottone "Annulla" → torna alla scheda dettaglio senza salvare
- [x] Bottone "Salva modifiche" disabilitato durante il submit (testo "Salvataggio...")
- [x] Modifica di un campo dopo errore → l'errore inline scompare
- [x] Visita di `/fields/:id/edit` senza token → redirect a `/login`
- [x] Visita di `/fields/:id/edit` di campo di altro utente → banner rosso "Non sei autorizzato a modificare questo appezzamento"
- [x] Visita con id inesistente → banner "Appezzamento non trovato"

## Sicurezza

- [x] Modifica di un campo altrui via PATCH diretto → 403, nessun dato modificato
- [x] `ownerId` non sovrascrivibile dal body: anche inviando `{ "ownerId": "..." }` il backend non lo applica
- [x] Token scaduto durante la modifica → 401, redirect a /login con localStorage pulito

## Casi limite

- [x] Aggiornamento di un solo campo (es. solo `pendenza`) → solo quel campo viene modificato nel DB
- [x] Aggiornamento contemporaneo di tutti i campi opzionali → tutti applicati correttamente
- [x] Sostituzione di un campo opzionale con stringa vuota (es. `coltura: ""`) → il campo viene svuotato nel DB
- [x] Refresh della pagina edit ricarica i dati correnti dal server (no stale data)

## Note

L'endpoint usa il pattern `findById + Object.assign + save()` invece di `findByIdAndUpdate` per garantire che vengano applicate le validazioni Mongoose (`runValidators` non sempre copre tutti i casi con findByIdAndUpdate). Questo assicura che pendenza, latitudine, longitudine e superficie vengano sempre validate sui range definiti nello schema Field.