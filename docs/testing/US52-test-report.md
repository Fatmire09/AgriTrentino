# Test Report — US52 Trend stagionale del rischio medio

## Obiettivo

Mostrare un grafico del rischio medio giornaliero durante la stagione, per identificare i periodi più critici.

## Backend — `GET /api/v1/dashboard/trend-rischio?anno=YYYY` (`routes/dashboard.js`)

- [x] Aggrega lo storico `IndiceRischio` (US40) dei campi dell'utente per l'annata richiesta
- [x] Media giornaliera dei `valore` (fitosanitario + climatico) → `trend: [{ data, rischioMedio }]`
- [x] Ordinato per data crescente; `?anno` default = anno corrente
- [x] Senza token → 401

## Frontend — pagina Dashboard

- [x] Grafico a linee (recharts) del rischio medio giornaliero (asse Y 0-100, asse X ~mensile)
- [x] **Sincronizzato col dropdown annata** (US49): cambiando annata, il grafico si ricarica
- [x] Mostrato solo se c'è una serie (`trend.length > 1`)

## Coerenza con il design

- [x] **Criterio di accettazione backlog**: il grafico copre l'annata con valori medi giornalieri e i picchi sono visibili ✓

## Casi limite

- [x] Nessuno storico per l'annata → grafico non mostrato
- [x] Cambio annata → trend ricaricato per quella stagione
- [x] Token assente → 401

## Procedura demo

1. Dashboard → grafico **"Trend rischio medio"**
2. Si osservano i picchi (tipicamente primavera-estate per il fitosanitario, inverno per il climatico)
3. Cambia annata dal dropdown → il grafico si aggiorna

## Note

US52 sfrutta lo storico `IndiceRischio` (popolato dal seed di US40) per costruire il trend stagionale del rischio medio. Prossimo: monitoraggio consumi (US53).