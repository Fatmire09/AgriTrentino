# Test Report — US53 Monitoraggio consumi

## Obiettivo

Mostrare i consumi totali di acqua (L) e principio attivo (kg) per un appezzamento su un periodo scelto, per monitorare il budget di risorse stagionale.

## Backend — `GET /api/v1/fields/:fieldId/consumi?giorni=N` (`routes/consumi.js`)

- [x] auth + ownerId → campo altrui = 403, inesistente = 404
- [x] `giorni` (default 60): somma `volumeAcqua` (irrigazioni) + `quantita` (trattamenti) nel periodo
- [x] Ritorna `{ campoNome, periodoGiorni, acquaTotaleLitri, principioAttivoTotaleKg, numeroInterventi }`
- [x] ID malformato → 400

## Frontend — sezione nella Dashboard

- [x] Sezione **"Monitoraggio consumi"** **dentro la Dashboard** (non una pagina separata)
- [x] Selettore **campo** + selettore **periodo** (30/60/90/365 giorni)
- [x] Due totali (acqua L / principio attivo kg) che si aggiornano al cambio di campo o periodo

## Coerenza con il design

- [x] **Criterio di accettazione backlog**: selezionare campo + "ultimi 60 giorni" → i due totali (litri e kg) per il periodo ✓
- [x] Collocata nella **sezione principale** (Dashboard), come richiesto

## Casi limite

- [x] Nessun intervento nel periodo → totali 0
- [x] Campo altrui → 403, inesistente → 404
- [x] `giorni` non valido → default 60

## Procedura demo

1. Dashboard → sezione "Monitoraggio consumi"
2. Seleziona un campo + "Ultimi 60 giorni" → i due totali
3. Cambia campo o periodo → i totali si aggiornano

## Note

US53 aggiunge il monitoraggio consumi per campo + periodo, come sezione della dashboard. Ultima US del progetto: export report sostenibilità (US54).