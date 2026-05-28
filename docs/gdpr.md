# Conformità GDPR (RFN09 / US63)

## Obiettivo
Trattare i dati personali e aziendali nel rispetto del Regolamento UE 2016/679 (GDPR).

## Misure implementate

### Cifratura
- **A riposo**: password cifrate con bcrypt (hash, cost 12) — mai in chiaro
- **In transito**: app servita su HTTPS (TLS gestiti da Render)

### Minimizzazione e controllo accessi
- Ogni utente accede solo ai propri dati (RFN08 — vedi controllo-accessi.md)
- Autenticazione JWT su tutte le rotte riservate

### Diritto all'oblio
- `DELETE /api/v1/fields/:id` elimina l'appezzamento **e** tutti i dati collegati
  (colture, interventi, indici, meteo, bilancio, notifiche)
- `DELETE /api/v1/auth/me` elimina l'account **e** tutti i suoi appezzamenti a cascata
- Implementazione: `server/services/cancellazioneService.js`

## Verifica
Coperto da `server/tests/gdpr.test.js`: cancellazione di campo e account rimuove i dati associati.

## Riferimenti
- RFN09 (D1): conformità privacy GDPR 2016/679
- D2: `Utente.rimuoviAppezzamento` elimina anche i dati associati
