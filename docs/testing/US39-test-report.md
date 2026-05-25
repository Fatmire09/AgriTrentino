# Test Report — US39 Marcatura notifica come letta

## Continuità con US37 e US38

US37 ha introdotto il modello Notifica con campo `letta: false` di default. US38 ha mostrato le notifiche nel pannello dropdown evidenziando quelle non lette. US39 completa il ciclo permettendo all'utente di marcare le notifiche come lette cliccandoci sopra.

## Lato server (`PATCH /api/v1/notifiche/:id`)

- [x] Richiesta senza token → 401 `{ "error": "Token mancante" }`
- [x] Richiesta con id MongoDB inesistente → 404 `{ "error": "Notifica non trovata" }`
- [x] Richiesta con id malformato (es. "abc") → 400 `{ "error": "ID non valido" }`
- [x] Richiesta con id di notifica di altro utente → 403 `{ "error": "Non autorizzato" }`
- [x] Richiesta valida con id proprio → 200 con notifica aggiornata `letta: true`
- [x] Operazione idempotente: marcare come letta una notifica già letta restituisce comunque 200
- [x] `updatedAt` viene aggiornato automaticamente da Mongoose timestamps
- [x] Response esclude `userId` e `__v` (privacy)

## Lato client (`Navbar.jsx`)

- [x] Click su notifica con `letta: false` → invoca `PATCH /notifiche/:id`
- [x] Click su notifica con `letta: true` → nessuna chiamata (no-op)
- [x] Solo le notifiche non lette hanno `cursor: pointer` (visual hint che sono cliccabili)
- [x] Aggiornamento ottimistico stato locale dopo successo PATCH:
  - Sfondo giallo sparisce sulla notifica cliccata
  - Pallino rosso sparisce
  - Counter `nonLette` decrementato di 1
- [x] Badge sul campanello si aggiorna in tempo reale senza ricaricare il pannello
- [x] Se il PATCH fallisce, lo stato locale resta invariato (degradazione silenziosa)

## Persistenza

- [x] Dopo aver marcato una notifica come letta, ricaricando la pagina la notifica resta letta
- [x] Le notifiche lette restano nella lista (non vengono eliminate, solo "consumate")

## Coerenza con il design (D1)

- [x] **RF14 Sistema di allertamento (parte 3)**: l'utente può segnare una notifica come letta per concentrarsi solo sulle nuove segnalazioni
- [x] **RFN03 Usabilità**: feedback immediato visivo (colore + counter) al click

## Sicurezza

- [x] Endpoint protetto da `requireAuth` + controllo `userId` lato server
- [x] Utente A non può marcare come lette le notifiche di utente B (403 garantito server-side)
- [x] Frontend non può "barare" perché il server è la fonte di verità

## Casi limite

- [x] Doppio click rapido sulla stessa notifica non letta → due PATCH inviate, entrambe restituiscono 200, counter decrementa solo una volta (clamping `Math.max(0, prev - 1)`)
- [x] Click su notifica appena marcata letta in un'altra tab → 200 idempotente, counter resta corretto
- [x] Network slow → la notifica appare ancora gialla finché il PATCH non completa, poi aggiornamento

## Note

US39 chiude il ciclo "vita di una notifica":
1. **US33-US36**: gli indici raggiungono livello "alto"
2. **US37**: il sistema genera automaticamente la notifica
3. **US37/US38**: la notifica appare nel campanello + pannello
4. **US39**: l'utente la legge → marcata come letta → focus solo sulle nuove

Implementazione semplice ma completa. Funzionalità future possibili (non in scope di Sprint #2):
- Marca tutte come lette (bulk operation)
- Eliminazione manuale notifiche
- Filtraggio per tipo rischio