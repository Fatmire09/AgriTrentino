# Test Report — US26 Visualizzazione dati meteo correnti

## Continuità con US25

US25 aveva già introdotto la visualizzazione dei dati meteo nella scheda del campo (3 card con temperatura, umidità relativa, precipitazioni + timestamp). US26 aggiunge due livelli informativi:

1. **Sintesi giornaliera** ("Oggi al tuo campo"): aggregazione min/max/media delle rilevazioni dalle 00:00 di oggi
2. **Indicatore di freschezza del dato**: stringa relativa "Aggiornato X minuti/ore fa" che diventa rossa se il dato è > 60 minuti

## Lato server (`GET /api/v1/fields/:fieldId/meteo/oggi`)

- [x] Richiesta senza header `Authorization` → 401 `{ "error": "Token mancante" }`
- [x] Richiesta con token + fieldId proprio con rilevazioni di oggi → 200 con `{ sintesi: { data, stazione, numeroRilevazioni, temperaturaMinC, temperaturaMaxC, temperaturaMediaC, umiditaMediaPerc, precipitazioniTotaliMm } }`
- [x] Tutti i valori numerici sono arrotondati a 1 decimale (eccetto umidità media che è arrotondata all'intero %)
- [x] Richiesta su campo proprio senza rilevazioni di oggi → 200 con `{ sintesi: null, message: "Nessuna rilevazione disponibile per oggi" }`
- [x] Richiesta su campo di altro utente → 403 `{ "error": "Non autorizzato" }`
- [x] Richiesta su fieldId inesistente → 404 `{ "error": "Appezzamento non trovato" }`
- [x] L'aggregazione MongoDB usa `$match` per filtrare timestamp >= inizio giornata locale (00:00), poi `$group` con `$min`/`$max`/`$avg`/`$sum`
- [x] I valori `null` (es. stazione senza umidità) vengono ignorati nei calcoli di media (comportamento default di `$avg` di MongoDB)

## Lato client (`FieldDetail.jsx` — sezione meteo)

### Indicatore freschezza
- [x] Sotto le 3 card meteo, a destra, compare la stringa "Aggiornato X minuti/ore/giorni fa"
- [x] La funzione `formatTempoTrascorso(timestamp)` gestisce: < 1 min, 1 min, N min (< 60), 1 ora, N ore (< 24), 1 giorno, N giorni
- [x] Se l'ultima rilevazione è > 60 minuti fa, il testo diventa **rosso** (`text-red-600`) per attirare l'attenzione sul dato vecchio
- [x] Click su "Aggiorna meteo" → il valore "Aggiornato X fa" si reimposta a "meno di un minuto fa"

### Sezione "Oggi al tuo campo"
- [x] Compare sotto le 3 card meteo se esistono rilevazioni di oggi
- [x] Mostra 4 valori in griglia 2x2 (mobile) o 1x4 (desktop): Temp. min, Temp. max, Umidità media, Pioggia totale
- [x] Sotto i 4 valori: "Basato su N rilevazioni dalle 00:00" (testo grigio chiaro)
- [x] Click su "Aggiorna meteo" → la sintesi si ricarica automaticamente (chiamata in cascata a `/meteo/oggi` dopo `/meteo/refresh`)
- [x] Campo senza dati di oggi → la sezione NON appare (condizione `sintesiOggi && ...`)
- [x] Valori `null` (rare ma possibili se stazione difettosa) → mostrati come "—"

### Caricamento parallelo
- [x] All'apertura della scheda, le chiamate a `/meteo/latest` e `/meteo/oggi` partono in parallelo (`Promise.all`) → più veloce di chiamate sequenziali
- [x] Lo stato `loadingMeteo` si chiude solo quando entrambe le promise sono risolte

## Sicurezza

- [x] Endpoint `/meteo/oggi` protetto da `requireAuth` come gli altri endpoint meteo
- [x] Stesso controllo `ownerId` per impedire accesso a sintesi di campi altrui

## Casi limite

- [x] Campo creato oggi alle 23:30 con 1 sola rilevazione → la sintesi mostra min = max = media = quella singola, numeroRilevazioni = 1
- [x] Campo con rilevazioni iniziate ieri sera (>00:00 di oggi) → solo le rilevazioni di oggi vengono aggregate, quelle di ieri sono escluse
- [x] Refresh ripetuti in pochi secondi → il timestamp dell'indicatore si reimposta correttamente

## Coerenza con il design (D1)

- [x] **RF09 Visualizzazione dati meteo**: *"Il sistema deve presentare i dati meteorologici correnti attraverso grafici chiari e leggibili. La visualizzazione deve essere contestualizzata per il singolo appezzamento selezionato."* → la sintesi giornaliera contestualizza meglio i dati grezzi delle 3 card
- [x] **RFN10 Affidabilità**: l'indicatore di freschezza avvisa l'utente quando i dati non sono recenti (caso in cui MeteoTrentino è offline o l'auto-trigger è fallito) → l'utente può cliccare "Aggiorna" per provare a recuperare

## Note

US26 è di fatto un'estensione informativa di US25: non aggiunge nuovi dati persistenti né nuova logica di business, ma migliora la **leggibilità** dell'informazione meteo nella scheda campo. La scelta di calcolare la sintesi server-side (con MongoDB `aggregate()`) invece che client-side è motivata da: (a) singola fonte di verità, (b) minor traffico di rete (1 chiamata invece di 24+ con calcolo locale), (c) future estensioni (es. confronto con stagione precedente) saranno banali server-side.

L'indicatore di freschezza colorato in rosso > 60 minuti è una scelta di UX: in un DSS agricolo, dati meteo più vecchi di 1 ora possono significare che il sistema non ha aggiornato il bilancio idrico recentemente, quindi è importante che l'utente lo noti.