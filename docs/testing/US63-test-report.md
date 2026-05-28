# Test Report — US63 Conformità GDPR (RFN09)

## Obiettivo
Verificare le misure GDPR: cifratura e diritto all'oblio (cancellazione a cascata).

## Misure verificate
- [x] Password cifrate con bcrypt (a riposo)
- [x] HTTPS in transito (TLS Render, vedi US64)
- [x] Cancellazione a cascata in cancellazioneService.js

## Test automatici (server/tests/gdpr.test.js) — 3 test, verdi
- [x] DELETE /fields/:id elimina il campo e i suoi interventi
- [x] DELETE /auth/me elimina account + campi + dati associati
- [x] DELETE /auth/me senza token → 401

## Coerenza con il design
- [x] RFN09 (conformità privacy GDPR) → soddisfatto
- [x] Diritto all'oblio: nessun dato personale orfano dopo la cancellazione
- [x] Documentazione in docs/gdpr.md