# Test Report — US2 Form di Registrazione Account

## Routing e navigazione
- [x] Bottone "Registrati" della landing page punta a `/register`
- [x] Bottone "Crea il tuo account" punta a `/register`
- [x] Rotta `/register` configurata con react-router-dom
- [x] Link "Accedi" nel form punta a `/login`

## Campi del form
- [x] Campi Nome, Email, Password obbligatori; Nome azienda facoltativo
- [x] Submit con Nome vuoto → errore "Nome obbligatorio"
- [x] Submit con Email vuota → errore "Email obbligatoria"
- [x] Submit con Password vuota → errore "Password obbligatoria"
- [x] Submit bloccato finché sono presenti errori di validazione
- [x] Bottone in stato "Creazione account..." e disabilitato durante l'invio

## Lato server (POST /api/v1/auth/register)
- [x] Campi obbligatori mancanti → 400 "Email, password e nome sono obbligatori"
- [x] Payload valido → 201 Created con body `{ message, user }`
- [x] La password non è mai presente nella response
- [x] `nomeAzienda` omesso → registrazione valida (campo facoltativo)

## Persistenza e sicurezza
- [x] Account salvato in MongoDB tramite modello Mongoose `User`
- [x] Password cifrata con bcrypt (hash a 12 round, mai in chiaro nel DB)
- [x] Campo `email` normalizzato (lowercase + trim) prima del salvataggio
- [x] Flag `autenticato` impostato a `true` di default

## Flusso completo
- [x] Registrazione valida → redirect a `/?registered=true`
- [x] Errore di rete → banner "Impossibile contattare il server. Riprova più tardi."
- [x] Errore server generico (500) → banner "Errore durante la registrazione"