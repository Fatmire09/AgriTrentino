# Controllo accessi multi-utente (RFN08 / US62)

## Obiettivo
Garantire che ogni utente acceda esclusivamente ai propri dati.

## Meccanismi implementati

### 1. Autenticazione (JWT)
Tutte le rotte riservate sono protette dal middleware `requireAuth` (`server/middleware/auth.js`):
- Richiede header `Authorization: Bearer <token>`
- Verifica la firma del token con `JWT_SECRET`
- Senza token o token non valido → **401**
- Rotte pubbliche: landing page, `POST /auth/register`, `POST /auth/login`

### 2. Isolamento dei dati (ownerId)
- Ogni `Field` ha un campo `ownerId` che riferisce l'utente proprietario
- `GET /api/v1/fields` restituisce **solo** i campi dell'utente autenticato
- Le rotte sul singolo campo e sulle risorse annidate (colture, meteo, indici, interventi…)
  verificano `field.ownerId === req.userId`: se non sei il proprietario → **403**

## Verifica
Coperto dai test automatici in `server/tests/access-control.test.js` (7 test):
l'utente B non può leggere/modificare/eliminare i dati di A, mentre A accede regolarmente.

## Riferimenti
- RFN08 (D1): controllo accessi
- D2: ogni accesso ai dati passa per "Gestione Database" con verifica di proprietà