# Test Report — US8 Errore login con credenziali errate

## Lato server (`POST /api/v1/auth/login`)
- [x] Email inesistente in DB → 401 con `{ error: "Credenziali non valide" }`
- [x] Email esistente + password errata → 401 con stesso identico messaggio
- [x] Body senza email → 400 con `{ error: "Email e password sono obbligatorie" }`
- [x] Body senza password → 400 stesso errore
- [x] Body completamente vuoto → 400
- [x] Il messaggio di errore è volutamente **generico**: non rivela mai se sia l'email o la password ad essere sbagliata (riduce attacchi di enumerazione utenti)

## Lato client (`Login.jsx`)
- [x] Submit con credenziali errate → banner rosso "Credenziali non valide" in alto al form
- [x] Submit con email vuota → errore inline sotto il campo email ("Email obbligatoria")
- [x] Submit con password vuota → errore inline sotto il campo password ("Password obbligatoria")
- [x] Submit con email malformata → errore inline ("Formato email non valido")
- [x] Modificando un campo dopo errore server, il banner scompare
- [x] Dopo errore, il form NON viene resettato (l'utente non deve reinserire l'email)

## Sicurezza
- [x] Stesso tempo di risposta server tra "email non esiste" e "password errata" (no timing attack evidente)
- [x] Nessun JWT viene mai restituito o salvato in caso di 401
- [x] `localStorage` non viene modificato in caso di errore login

## Casi limite
- [x] Tentativi multipli ravvicinati con credenziali errate → ogni risposta è 401 (nessun lockout implementato in questo sprint, rimandato a US futura)
- [x] Caratteri speciali nell'email (apostrofi, caratteri unicode) → trattati correttamente, no SQL injection (NoSQL, ma comunque safe via Mongoose)
- [x] Password molto lunga (>200 char) → 401 normale, no crash server