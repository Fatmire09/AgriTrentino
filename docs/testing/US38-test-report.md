# Test Report — US38 Centro notifiche in-app

## Continuità con US37

US37 aveva introdotto:
- Modello `Notifica` (Mongoose)
- Generazione automatica via cron quando un indice di rischio supera la soglia "alto"
- Endpoint `GET /api/v1/notifiche` (lista basica)
- Campanello in Navbar con badge conteggio non lette

US38 completa il flusso utente trasformando il campanello in un **centro notifiche cliccabile** con pannello dropdown che mostra l'elenco delle notifiche ricevute.

## Lato server (`GET /api/v1/notifiche`)

- [x] L'endpoint esistente è stato esteso con il parametro `?limit=N` (default 50, max 100)
- [x] Validazione del parametro: valori fuori range vengono clampati ai limiti (no errore)
- [x] La response include il campo `nonLette` con il conteggio TOTALE delle notifiche non lette dell'utente (non solo quelle restituite nella pagina corrente)
- [x] L'ordinamento è `createdAt: -1` (notifica più recente in cima)
- [x] La response esclude i campi interni `userId` e `__v` (riduce payload e privacy)
- [x] Richiesta senza token → 401 (gestione standard via middleware)
- [x] L'utente vede solo le proprie notifiche (filtro `userId = req.userId` lato server)

## Lato client (`Navbar.jsx` — pannello notifiche)

### Comportamento del campanello
- [x] Il campanello in Navbar è ora cliccabile (era statico in US37)
- [x] Al click su campanello si carica `/notifiche?limit=20` e si apre un pannello dropdown
- [x] Al click su campanello con pannello già aperto, il pannello si chiude (toggle)
- [x] Click fuori dal pannello (overlay invisibile) chiude il pannello
- [x] Il pannello è posizionato `absolute right-0 mt-2` rispetto al campanello

### Contenuto del pannello
- [x] Header con titolo "Notifiche" + conteggio non lette ("3 non lette")
- [x] Lista scrollabile di notifiche con `max-h-96 overflow-y-auto`
- [x] Ogni notifica mostra:
  - Icona triangolo colorato (rosso fitosanitario, arancio climatico)
  - Nome campo + tipo rischio + minaccia
  - Messaggio della notifica
  - Timestamp relativo ("3 min fa" / "2 ore fa" / "1 g fa")
  - Pallino rosso indicatore se non letta
- [x] Le notifiche non lette hanno sfondo giallo chiaro (`bg-yellow-50`)
- [x] Stato vuoto: "Nessuna notifica disponibile" centrato nel pannello

### Helper `tempoFa()`
- [x] < 1 min → "ora"
- [x] < 60 min → "N min fa"
- [x] < 24 ore → "N ore fa"
- [x] ≥ 24 ore → "N g fa"

## Coerenza con il design (D1)

- [x] **RF14 Sistema di allertamento (parte 2)**: *"il centro notifiche dell'app permette di vedere tutte le allerte ricevute"* → soddisfatto con il pannello dropdown
- [x] **RFN03 Usabilità**: codifica colore (rosso/arancio per tipo rischio), tempo relativo facilmente leggibile, pallino visivo per non lette
- [x] Coerente con la classe `Notifica` del D2 (campi tipo, campo, livello, timestamp)

## Sicurezza

- [x] Endpoint protetto da `requireAuth`
- [x] Filtro `userId` impedisce di vedere notifiche di altri utenti
- [x] La response esclude `userId` (no esposizione dell'ID dell'utente nel JSON)

## Casi limite

- [x] Utente senza notifiche → pannello mostra "Nessuna notifica disponibile" + counter `nonLette = 0` (badge nascosto)
- [x] Utente con > 100 notifiche → endpoint clampa a 100, le più vecchie non vengono restituite (verranno gestite via paginazione in sprint futuri se necessario)
- [x] Notifica con `minaccia: null` (caso edge) → il nome viene mostrato senza parentesi tonde
- [x] Notifica con `campoNome: null` (campo eliminato dopo la notifica) → fallback "Campo"
- [x] Refresh del pannello: i dati vengono ricaricati ad ogni apertura del campanello (no cache stantia)

## Procedura di verifica funzionale

1. Avere almeno 1 campo con coltura + fase fenologica + dati meteo recenti
2. Attendere che il cron generi notifiche (oppure simulare condizioni di rischio alto)
3. Verificare che il badge sul campanello mostri il numero corretto
4. Cliccare il campanello → pannello si apre
5. Verificare la presenza delle notifiche con tutti i campi visibili
6. Cliccare fuori dal pannello → si chiude
7. Logout + login con altro utente → verificare che il pannello sia vuoto (isolamento dati)

## Note

US38 chiude il ciclo "user-facing" delle notifiche: l'utente è informato (badge), può consultare in dettaglio (pannello), e identifica facilmente le notifiche non ancora lette (sfondo giallo + pallino rosso).

Il prossimo step è **US39 (Marcatura notifica come letta)**: cliccando una notifica nel pannello, questa diventa "letta" → badge counter si decrementa → background giallo sparisce. Sarà un'estensione minima sia backend (PATCH endpoint) che frontend (click handler).

Il pattern adottato (overlay invisibile per chiudere cliccando fuori) è riusabile e potrebbe essere estratto in futuro come componente generico `Dropdown` per altri menù dell'app.