# Test Report — US6 Notifica nome azienda già registrato

## Lato server
- [x] Registrazione con `nomeAzienda` nuovo → 201 Created
- [x] Registrazione con `nomeAzienda` già presente → 409 Conflict con body `{ "error": "Nome azienda già in uso", "field": "nomeAzienda" }`
- [x] Registrazione con `email` duplicata → 409 con `field: "email"` (regressione US5)
- [x] Indice univoco sparse su `nomeAzienda` rispettato (utenti senza azienda non collidono)

## Lato client (Register.jsx)
- [x] Risposta 409 con `field: "nomeAzienda"` → messaggio sotto il campo Nome azienda, bordo rosso
- [x] Risposta 409 con `field: "email"` → messaggio sotto il campo email (regressione US5)
- [x] Banner generico in alto NON compare per il caso 409
- [x] Modificando il valore del campo, l'errore scompare

## Casi limite
- [x] `nomeAzienda` vuoto/non inserito → registrazione valida (campo facoltativo)
- [x] Due utenti senza `nomeAzienda` → non collidono (sparse index)
- [x] `nomeAzienda` con spazi prima/dopo → trim applicato, duplicato rilevato
