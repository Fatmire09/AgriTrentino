# Test Report — US20 Rimozione appezzamento con conferma

## Lato server (`DELETE /api/v1/fields/:id`)

- [x] Richiesta senza header `Authorization` → 401 `{ "error": "Token mancante" }`
- [x] Richiesta con token valido + id di un proprio campo → 200 `{ "message": "Appezzamento eliminato con successo" }`
- [x] Dopo l'eliminazione, una `GET /fields/:id` sullo stesso id → 404 `{ "error": "Appezzamento non trovato" }`
- [x] Dopo l'eliminazione, una `GET /fields` non include più il campo nella lista
- [x] Richiesta con token valido + id di campo di altro utente → 403 `{ "error": "Non autorizzato" }`
- [x] Richiesta con token valido + id MongoDB inesistente → 404 `{ "error": "Appezzamento non trovato" }`
- [x] Richiesta con id malformato (es. "notvalid") → 400 `{ "error": "ID non valido" }`
- [x] L'eliminazione è definitiva: il documento non è recuperabile via API
- [x] Il controllo `ownerId === req.userId` viene effettuato sempre prima della cancellazione (no cross-user deletion)

## Lato client (`FieldDetail.jsx` + `ConfirmDialog.jsx`)

- [x] Nella scheda dettaglio di un campo è visibile il bottone rosso "Elimina" accanto al bottone "Modifica"
- [x] Click su "Elimina" → si apre la finestra di conferma con icona di avvertimento rossa, titolo "Eliminare questo appezzamento?" e testo che spiega che l'azione è irreversibile e farà perdere lo storico
- [x] Il nome dell'appezzamento appare nel messaggio della finestra di conferma
- [x] Click su "Annulla" → la finestra si chiude senza eliminare nulla
- [x] Click sull'overlay scuro fuori dalla finestra → equivale ad Annulla
- [x] Click su "Sì, elimina" → chiamata DELETE, redirect a `/fields`, il campo non è più presente nella lista
- [x] Durante la chiamata DELETE il bottone "Sì, elimina" mostra "Eliminazione..." ed è disabilitato
- [x] Durante l'eliminazione la finestra di conferma non si può chiudere (no Annulla mentre il DELETE è in corso)
- [x] In caso di errore server (es. 403, 500) la finestra si chiude e nella scheda compare un banner rosso con il messaggio
- [x] Token scaduto al momento del DELETE → 401, redirect a `/login`

## Riusabilità del componente `ConfirmDialog`

- [x] Il componente accetta props: `open`, `title`, `message`, `confirmLabel`, `cancelLabel`, `destructive`, `onConfirm`, `onCancel`
- [x] Il flag `destructive` attiva lo stile rosso (icona + bottone) per azioni distruttive
- [x] Il componente è completamente riusabile per future US (es. eliminazione interventi, reset simulatore)

## Sicurezza

- [x] Eliminazione di campo altrui via DELETE diretto → 403, dato non eliminato
- [x] L'azione di eliminazione richiede DUE conferme: click su "Elimina" + click su "Sì, elimina" nella finestra
- [x] L'overlay scuro impedisce interazione con il resto della pagina mentre la finestra è aperta

## Casi limite

- [x] Eliminazione del campo mentre si è sulla sua pagina dettaglio → redirect a lista, campo assente
- [x] Eliminazione di un campo che ha appena ricevuto una modifica (US19) → eliminazione regolare
- [x] Tentativo di eliminare un campo già eliminato (es. da altro tab) → 404, messaggio di errore

## Note

US20 è il risultato della fusione (decisa in Product Backlog Refinement a inizio Sprint #2) delle originali US20 ("Conferma rimozione appezzamento") e US21 ("Rimozione appezzamento"). Le due User Story erano tecnicamente inseparabili e la fusione produce un incremento più coerente e dimostrabile.

Il componente `ConfirmDialog` è stato sviluppato come riusabile per supportare conferme distruttive in future User Story dello Sprint #2 e oltre.