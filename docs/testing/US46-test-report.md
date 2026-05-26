# Test Report — US46 Eliminazione intervento registrato

## Obiettivo

Eliminare un intervento inserito per errore, con conferma esplicita, così da non falsare le statistiche stagionali.

## Backend — `DELETE /api/v1/fields/:fieldId/interventi/:interventoId`

- [x] auth + ownerId → campo altrui = 403
- [x] `findOneAndDelete` con `appezzamentoId`: elimina solo interventi del proprio campo
- [x] Intervento inesistente / già eliminato → 404 ("Intervento non trovato")
- [x] Successo → 200 `{ "message": "Intervento eliminato con successo" }`
- [x] ID malformato → 400

## Frontend — registro in `FieldDetail.jsx`

- [x] Icona **cestino** (rossa) su ogni intervento → apre il `ConfirmDialog`
- [x] Conferma → `DELETE` + ricarica lista (l'intervento sparisce)
- [x] Annulla → nessuna modifica
- [x] Riusa il componente `ConfirmDialog` (come l'eliminazione appezzamento di US20)

## Coerenza con il design

- [x] **Criterio di accettazione backlog**: eliminare un intervento, confermare il dialogo → scompare dal registro ✓
- [x] Conferma esplicita prima dell'eliminazione (niente eliminazioni accidentali)

## Casi limite

- [x] Doppia eliminazione → 404 (già eliminato)
- [x] Intervento di un altro campo/utente → 404 / 403
- [x] "Annulla" nel dialog → intervento invariato

## Procedura demo

1. Apri il registro, clicca il **cestino** su un intervento
2. Conferma "**Sì, elimina**" → l'intervento sparisce dalla lista
3. Su un altro, clicca il cestino e poi "Annulla" → resta invariato

## Note

US46 completa il CRUD del registro interventi: crea (US41/42), classifica (US43), filtra (US44), modifica (US45), elimina (US46). Prepara la dashboard sostenibilità (US47+), i cui totali stagionali si basano sugli interventi rimasti nel registro.