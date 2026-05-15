# Test Report — US13 Aggiunta nuovo appezzamento

## Schema Mongoose `Field`
- [x] Campi richiesti: `nome`, `latitudine`, `longitudine`, `superficie`, `ownerId`
- [x] Campi opzionali: `pendenza`, `coltura`, `esposizione`
- [x] Validazioni: latitudine [-90, 90], longitudine [-180, 180], superficie > 0, pendenza [0, 100]
- [x] `ownerId` con ref a `User`, indicizzato
- [x] Timestamps `createdAt`/`updatedAt` automatici

## Lato server (`POST /api/v1/fields`)
- [x] Senza token → 401 `{ "error": "Token mancante" }`
- [x] Con token valido + body completo → 201 con `field` salvato
- [x] `ownerId` impostato automaticamente dal `req.userId` del JWT (non dal body)
- [x] Body senza `nome` → 400 "Nome, latitudine, longitudine e superficie sono obbligatori"
- [x] Body senza `latitudine` → 400
- [x] Body senza `longitudine` → 400
- [x] Body senza `superficie` → 400
- [x] `latitudine` fuori range (es. 99) → 400 con messaggio Mongoose
- [x] `longitudine` fuori range (es. 200) → 400
- [x] `superficie` ≤ 0 → 400
- [x] `pendenza` fuori [0, 100] → 400
- [x] Documento salvato in collezione `fields` di MongoDB con tutti i campi corretti

## Lato client (`AddField.jsx`)
- [x] Visita `/fields/new` senza essere loggati → redirect a `/login`
- [x] Validazione onBlur per ogni campo numerico (lat, lon, sup, pendenza)
- [x] Nome vuoto → errore inline "Nome appezzamento obbligatorio"
- [x] Latitudine fuori range → errore inline "Deve essere compresa tra -90 e 90"
- [x] Longitudine fuori range → errore inline "Deve essere compresa tra -180 e 180"
- [x] Superficie negativa o zero → errore inline "Deve essere un numero positivo"
- [x] Pendenza fuori [0, 100] → errore inline
- [x] Campi opzionali (pendenza, coltura, esposizione) → ok lasciati vuoti
- [x] Submit valido → POST chiamato con token in header, redirect a `/profile`
- [x] Submit con token scaduto → 401, redirect a `/login`
- [x] Bottone "Annulla" / link → torna a `/profile`

## Verifica DB
- [x] Documento creato visibile in Atlas (Browse Collections → `agritrentino` → `fields`)
- [x] `ownerId` corrisponde all'`_id` dell'utente loggato
- [x] Campi opzionali non inseriti sono `undefined` nel documento

## Casi limite
- [x] Coordinate ai bordi (-90, 90, -180, 180) → accettate
- [x] Superficie molto grande (es. 1000000) → accettata
- [x] Pendenza 0 → accettata (valore valido)
- [x] Pendenza 100 → accettata
- [x] Caratteri speciali in `nome` (accenti, apostrofi) → salvati correttamente
- [x] Server irraggiungibile durante POST → banner "Impossibile contattare il server"