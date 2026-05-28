# Test Report — US54 Export report sostenibilità

## Obiettivo

Permettere all'agricoltore autenticato di scaricare un report **PDF** riassuntivo della sostenibilità stagionale del proprio account (% interventi giustificati, risparmio idrico, risparmio chimico, rischio medio annuo) così da poterlo conservare o condividere fuori dalla piattaforma.

## Backend — `GET /api/v1/dashboard/report?anno=YYYY` (`routes/dashboard.js`)

- [x] auth → senza token = 401
- [x] `?anno` (default: anno corrente) filtra `Intervento` e `IndiceRischio` per anno solare
- [x] Calcola **% giustificati** (riusa `classificaIntervento` di US43/48), **risparmio idrico** (US50, baseline 200 L/sett × 26 sett per campo irrigato), **risparmio chimico** (US51, baseline 8 trattamenti × 2 kg per campo trattato), **rischio medio annuo** (media `valore` di `IndiceRischio` nell'anno)
- [x] Recupera dati anagrafici utente (`nome`, `nomeAzienda`, `email`) e li stampa nel PDF
- [x] Response `Content-Type: application/pdf` + `Content-Disposition: attachment; filename="report-sostenibilita-<anno>.pdf"` — PDF generato con `pdfkit`
- [x] Errore interno → 500 JSON

## Frontend — bottone "Scarica report PDF" nella Dashboard

- [x] Bottone verde con icona `Download` (lucide-react) sotto il titolo della Dashboard, visibile quando i dati di sostenibilità sono caricati
- [x] Al click: `fetch` con header `Authorization: Bearer ...` → `res.blob()` → download tramite `URL.createObjectURL` + `<a download>` (un link semplice non basta: serve l'header auth)
- [x] Usa l'annata selezionata (`anno ?? data?.annoSelezionato ?? anno corrente`) → cambiando dropdown annata il PDF scaricato cambia di conseguenza
- [x] In caso di errore HTTP o di rete mostra un `alert` all'utente

## Coerenza con il design

- [x] **Criterio di accettazione backlog**: bottone "Scarica report" nella dashboard → download di un PDF leggibile con i totali della stagione ✓
- [x] Nuova dipendenza `pdfkit` solo lato server (frontend non aggiunge librerie PDF)
- [x] Documentato in `docs/apiary/apiary.apib` nel `# Group Dashboard sostenibilità`

## Casi limite

- [x] Utente senza interventi nell'annata → PDF comunque valido con "Interventi registrati: 0" e indicatori a 0 / `n/d`
- [x] `?anno` non numerico (es. `?anno=abc`) → fallback all'anno corrente
- [x] Token mancante o scaduto → 401, il client mostra messaggio di errore
- [x] Cambio annata multiplo → il `filename` del PDF riflette l'annata effettivamente scaricata

## Procedura demo

1. Login → naviga su **Dashboard**
2. (Opzionale) seleziona un'annata diversa dal dropdown
3. Click su **"Scarica report PDF"** → il browser scarica `report-sostenibilita-<anno>.pdf`
4. Apri il PDF → titolo "AgriTrentino — Report sostenibilità", annata, dati azienda, indicatori della stagione

## Note

US54 introduce l'export PDF della dashboard di sostenibilità (`npm install pdfkit` lato backend, nuova dipendenza per chi pulla `main`). Prossima US: **US55** — modifica manuale dei parametri meteo nel simulatore (primo step del modulo "simulatore meteo", US55-59 dello Sprint Backlog #2).