# Test Report — US62 Controllo accessi multi-utente (RFN08)

## Obiettivo
Verificare che un utente acceda esclusivamente ai propri dati e mai a quelli altrui.

## Stack
- Jest + supertest + mongodb-memory-server
- File: `server/tests/access-control.test.js`

## Scenario
Due utenti distinti (A e B). A crea un appezzamento. Si verifica che B non possa
accedervi in alcun modo, mentre A sì.

## Esito (7 test, tutti verdi)
- [x] `GET /fields` per B → lista vuota (non vede il campo di A)
- [x] `GET /fields/:id` di A da parte di B → 403
- [x] `PATCH /fields/:id` di A da parte di B → 403
- [x] `DELETE /fields/:id` di A da parte di B → 403
- [x] `POST /fields/:id/interventi` sul campo di A da parte di B → 403
- [x] `GET /fields/:id/interventi` di A da parte di B → 403
- [x] A (proprietario) accede al proprio campo → 200

## Coerenza con il design
- [x] RFN08 (controllo accessi) → soddisfatto e dimostrato con test
- [x] Meccanismi: `requireAuth` (JWT) + filtro `ownerId` su ogni risorsa
- [x] Documentazione in `docs/controllo-accessi.md`