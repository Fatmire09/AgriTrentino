# Test Report — US45 Modifica intervento registrato

## Obiettivo

Correggere un intervento già registrato (es. la quantità) così che il registro resti accurato anche dopo errori di compilazione.

## Backend — `PATCH /api/v1/fields/:fieldId/interventi/:interventoId`

- [x] auth + ownerId → campo altrui = 403
- [x] Intervento inesistente → 404 ("Intervento non trovato")
- [x] Campi modificabili: `dataOra`, `note`, `principioAttivo`, `quantita`, `unitaMisura`, `volumeAcqua` (`tipologia` e `appezzamentoId` restano fissi)
- [x] `intervento.save()` riesegue la validazione condizionale → body non valido = 400
- [x] Response 200 con l'intervento aggiornato + `classificazione`/`livello` ricalcolati
- [x] ID malformato → 400

## Frontend — registro in `FieldDetail.jsx`

- [x] Icona **matita** su ogni intervento → apre il form **precompilato**
- [x] In modifica: tipologia **bloccata**, bottone "**Salva modifiche**"
- [x] Salvataggio → `PATCH`, lista aggiornata; "Annulla" e "Nuovo intervento" ripristinano lo stato (niente valori residui)

## Coerenza con il design

- [x] **Criterio di accettazione backlog**: modificare la quantità → il dato aggiornato si riflette nel registro ✓
- [x] La classificazione (US43) si aggiorna di conseguenza (ricalcolata in lettura sulla data dell'intervento)

## Casi limite

- [x] Trattamento con `principioAttivo` vuoto → 400
- [x] Irrigazione con `volumeAcqua` ≤ 0 → 400
- [x] Intervento di un altro campo/utente → 403
- [x] `tipologia` non modificabile (ignorata dal backend, bloccata nel form)

## Procedura demo

1. Apri il registro, clicca la **matita** su un trattamento
2. Cambia la quantità (es. 2 → 3) → "**Salva modifiche**"
3. La lista mostra il nuovo valore; la classificazione resta coerente con la data dell'intervento

## Note

US45 completa il "CRUD" del registro interventi (manca solo l'eliminazione, US46). Riusa il form di US41/US42 in modalità modifica e il `PATCH` ri-classifica l'intervento tramite la logica di US43.