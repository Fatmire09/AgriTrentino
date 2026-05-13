# Test Report — US5 Notifica email già registrata

## Lato server
- [x] Email nuova → 201 Created, account salvato in MongoDB
- [x] Email già presente in DB → 409 Conflict con body `{ "error": "Email già registrata" }`
- [x] Indice univoco su `email` rispettato a livello Mongoose

## Lato client (Register.jsx)
- [x] Risposta 201 → redirect a `/?registered=true`
- [x] Risposta 409 → messaggio "Email già registrata" sotto il campo email (stesso pattern degli errori di validazione onBlur)
- [x] Bordo del campo email diventa rosso quando il server segnala duplicato
- [x] Banner generico in alto NON compare per il caso 409 (solo per altri errori server)
- [x] Modificando il valore del campo email, l'errore scompare

## Casi limite
- [x] Email duplicata con maiuscole/minuscole diverse (`Mario@Example.com` vs `mario@example.com`) → trattata come duplicata (lowercase nel modello)
- [x] Spazi prima/dopo l'email → trim applicato, duplicato rilevato correttamente
