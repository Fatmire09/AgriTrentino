# Test Report — US7 Login con email e password

## Lato server (`POST /api/v1/auth/login`)
- [x] Credenziali corrette → 200 OK con body `{ message, token, user }`
- [x] Token JWT generato con `userId` ed `email` nel payload, scadenza 7 giorni
- [x] Password non viene mai restituita nella risposta
- [x] Email non esistente → 401 con `{ error: "Credenziali non valide" }`
- [x] Password errata → 401 con stesso messaggio generico (non rivela quale campo è sbagliato)
- [x] Body senza email o password → 400 con `{ error: "Email e password sono obbligatorie" }`
- [x] Email con maiuscole o spazi → normalizzata (lowercase + trim) prima della ricerca in DB

## Lato client (`Login.jsx`)
- [x] Form mostra validazione onBlur (bordo rosso se invalido, verde se valido)
- [x] Email vuota o formato invalido → errore sotto il campo
- [x] Password vuota → errore sotto il campo
- [x] Submit con credenziali corrette → redirect a `/`, token e user salvati in `localStorage`
- [x] Submit con credenziali errate → banner rosso "Credenziali non valide"
- [x] Server irraggiungibile → banner "Impossibile contattare il server"
- [x] Link "Registrati" porta a `/register`

## Gestione sessione
- [x] Dopo login, `localStorage.token` contiene il JWT
- [x] Dopo login, `localStorage.user` contiene oggetto utente serializzato
- [x] Chiudendo e riaprendo il browser, i valori in localStorage persistono
- [x] Pulendo manualmente `localStorage`, lo stato loggato viene perso (atteso)

## Casi limite
- [x] Login con stessa email ma case diverso (`Mario@Example.com` vs `mario@example.com`) → funziona (lowercase nel modello)
- [x] Tentativi multipli ravvicinati con password errata → ogni risposta è 401 (no lockout implementato in questo sprint)
