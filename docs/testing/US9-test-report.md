# Test Report — US9 Logout

## Lato server (`POST /api/v1/auth/logout`)
- [x] Richiesta POST → 200 OK con body `{ "message": "Logout effettuato con successo" }`
- [x] Endpoint accessibile anche senza header Authorization (simbolico)
- [x] Documentazione `apiary.apib` riflette il comportamento reale

## Lato client (Navbar)
- [x] Utente NON loggato → Navbar mostra "Login" e "Registrati"
- [x] Utente loggato (token presente in `localStorage`) → Navbar mostra solo "Logout"
- [x] Cambio di stato dopo login: dopo redirect a `/`, la Navbar passa correttamente alla versione "Logout" (al refresh della pagina)
- [x] Click su "Logout" → chiamata al backend, redirect a `/`, Navbar torna a "Login"/"Registrati"
- [x] Versione mobile: stesso comportamento condizionale anche nel menu hamburger

## Gestione sessione
- [x] Dopo click "Logout": `localStorage.token` rimosso
- [x] Dopo click "Logout": `localStorage.user` rimosso
- [x] Dopo logout: tentando di accedere a pagine protette, l'utente NON risulta più autenticato

## Casi limite
- [x] Server irraggiungibile al momento del logout → il client esegue comunque la pulizia di localStorage (la sicurezza non dipende dal server con JWT stateless)
- [x] Click "Logout" senza essere loggato → non accade nulla di problematico (il bottone non è visibile, ma anche chiamando direttamente la funzione, localStorage è già vuoto)
- [x] Logout con localStorage manipolato (token cancellato manualmente) → Navbar mostra "Login"/"Registrati" al refresh