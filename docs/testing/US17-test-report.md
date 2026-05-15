# Test Report — US17 Lista appezzamenti registrati

## Lato server (`GET /api/v1/fields`)
- [x] Senza token → 401 `{ "error": "Token mancante" }`
- [x] Con token valido + utente con appezzamenti → 200 `{ "fields": [...] }`
- [x] Con token valido + utente senza appezzamenti → 200 `{ "fields": [] }`
- [x] Filtro `ownerId = req.userId` rispettato: utente A non vede i campi di utente B
- [x] Ordinamento per `createdAt` decrescente (più recente in cima)
- [x] Risposta include tutti i campi del documento Field (lat, lon, sup, pendenza, coltura, esposizione, ownerId, timestamps)

## Sicurezza filtro userId
- [x] Creati 2 appezzamenti con utente A e 1 con utente B
- [x] GET con token di A → restituisce solo i 2 di A (no quelli di B)
- [x] GET con token di B → restituisce solo il 1 di B (no quelli di A)
- [x] Nessun modo di accedere ai campi altrui tramite query manipulation

## Lato client (`FieldsList.jsx`)
- [x] Visita `/fields` senza essere loggati → redirect a `/login`
- [x] Visita con token valido + appezzamenti → grid di card con nome, coordinate, superficie, pendenza, coltura
- [x] Visita con token valido + zero appezzamenti → stato vuoto con messaggio "Non hai ancora registrato nessun appezzamento" + bottone "Aggiungi il tuo primo campo"
- [x] Click su una card → naviga a `/fields/:id` (404 per ora, sarà US18)
- [x] Contatore corretto: "1 appezzamento" / "N appezzamenti"
- [x] Token scaduto → 401, redirect a `/login`, localStorage pulito
- [x] Server irraggiungibile → banner "Impossibile contattare il server"

## Navbar
- [x] Utente loggato → compare link "I miei campi" in Navbar
- [x] Click "I miei campi" → naviga a `/fields`
- [x] Versione mobile: stesso comportamento condizionale

## Casi limite
- [x] Appezzamento con `pendenza` non valorizzata → non mostrata nella card
- [x] Appezzamento con `coltura` o `esposizione` vuote → non mostrate
- [x] Nome appezzamento lungo → wrap testo, no overflow
- [x] Superficie molto grande → formattata con separatori italiani (es. "1.000.000 m²")
- [x] Cancellazione manuale del token in localStorage → al refresh redirect a `/login`