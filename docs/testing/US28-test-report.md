# Test Report — US28 Cache meteo offline

## Architettura della cache

US28 sfrutta MongoDB come **cache persistente** dei dati meteo: ogni rilevazione fetchata da MeteoTrentino viene salvata nella collezione `DatiMeteo` e resta disponibile anche quando l'API esterna è irraggiungibile.

Per distinguere tra "dato fresco" e "dato cached da troppo tempo", il modello `Field` è stato esteso con 3 nuovi campi:
- `ultimoTentativoSync` (Date): quando è stato fatto l'ultimo tentativo (riuscito o fallito)
- `ultimoSuccessoSync` (Date): quando è stato fatto l'ultimo tentativo riuscito
- `ultimoTentativoRiuscito` (Boolean): esito dell'ultimo tentativo

## Lato server (`meteoService.aggiornaMeteoCampo()`)

- [x] All'inizio della funzione viene marcato `ultimoTentativoSync = new Date()` e `ultimoTentativoRiuscito = false` (failsafe)
- [x] Se il fetch da MeteoTrentino va a buon fine: `ultimoSuccessoSync` viene aggiornato e `ultimoTentativoRiuscito` impostato a `true`
- [x] Se il fetch fallisce (timeout, 5xx, errore di rete): `ultimoTentativoRiuscito` resta `false`, `ultimoSuccessoSync` resta invariato (mantiene l'ultimo successo precedente)
- [x] Il campo viene salvato (`field.save()`) sia in caso di successo che di errore, così il tracking è sempre consistente
- [x] L'errore originale viene rilanciato per gestione nel chiamante (route `/refresh` → 503)

## Lato server (`GET /api/v1/fields/:fieldId/meteo/latest`)

- [x] La response include sempre il campo `cacheInfo` con: `ultimoTentativoSync`, `ultimoSuccessoSync`, `ultimoTentativoRiuscito`, `etaDatoMinuti`
- [x] `etaDatoMinuti` è calcolato dinamicamente: `(now - dato.timestamp) / 60000`
- [x] Se il campo non ha mai sincronizzato (campo appena creato e auto-trigger non ancora completato): tutti i campi di `cacheInfo` sono `null`
- [x] La response funziona anche se MeteoTrentino è offline al momento della chiamata: legge solo da MongoDB locale, non chiama esterni
- [x] Tutti gli altri controlli (auth, ownership, 404) continuano a funzionare

## Lato client (`FieldDetail.jsx`)

- [x] Lo stato `cacheInfo` viene caricato all'apertura della scheda insieme a `meteo` e `sintesiOggi` (parallel fetch via `Promise.all`)
- [x] Lo stato viene aggiornato anche dopo un refresh manuale
- [x] Il box giallo di avviso appare SOLO quando:
  - `cacheInfo.ultimoTentativoRiuscito === false` (ultimo tentativo fallito)
  - E `cacheInfo.etaDatoMinuti > 120` (i dati visualizzati sono di più di 2 ore fa)
  - E `meteo !== null` (c'è qualcosa da mostrare)
- [x] Il box giallo NON appare quando i dati sono recenti, anche se l'ultimo tentativo è fallito (la cache è "fresca enough")
- [x] Il box giallo NON appare quando il dato è vecchio ma l'ultimo tentativo è riuscito (situazione anomala, ma il sistema ha sincronizzato di recente)
- [x] Il messaggio del box è chiaro: "Servizio meteo non raggiungibile" + "Stai vedendo l'ultima rilevazione salvata in cache, del DD/MM/YYYY HH:MM" + "Ultimo tentativo di sincronizzazione: X minuti/ore fa"
- [x] Stile del box: icona triangolo giallo, sfondo giallo chiaro (`bg-yellow-50`), bordo giallo, testo `text-yellow-900` per leggibilità

## Procedura di test funzionale per simulare l'offline

1. Aprire la scheda di un appezzamento con dati meteo di **almeno 3 ore fa** (es. campo creato la mattina e testato nel pomeriggio)
2. **Spegnere il wifi/cavo di rete del PC** (il backend resta raggiungibile via localhost, ma le chiamate da backend a MeteoTrentino falliranno)
3. Sulla scheda del campo cliccare **"Aggiorna meteo"** → l'endpoint `/refresh` restituirà 503, il backend marcherà `ultimoTentativoRiuscito: false`
4. Ricaricare la pagina (F5)
5. **Verifica**: il box giallo "Servizio meteo non raggiungibile" appare sopra le 3 card meteo, indicando timestamp del dato cached e tempo trascorso dall'ultimo tentativo
6. **Verifica**: le 3 card meteo continuano a mostrare i dati cached (non sono vuote)
7. Riattaccare la rete, cliccare di nuovo "Aggiorna meteo" → il box giallo scompare al successivo caricamento

## Coerenza con il design (D1, D2)

- [x] **UML D2 classe `ClientAPIMeteo`**: i metodi `salvaInCache`, `isCacheValida`, `recuperaDaCache` sono implementati implicitamente in `meteoService.aggiornaMeteoCampo` (salvataggio in `DatiMeteo`) e `GET /meteo/latest` (lettura da DatiMeteo + `cacheInfo`)
- [x] **RFN10 Affidabilità**: *"Il sistema deve gestire in modo robusto i malfunzionamenti dei servizi esterni (es. indisponibilità delle API meteorologiche), presentando all'utente messaggi di errore informativi e mantenendo le funzionalità operative non dipendenti dai dati esterni."* → soddisfatto con cache + avviso giallo
- [x] **D1 backlog originale**: *"Simulare un'interruzione dell'API; verificare che l'app mostri gli ultimi dati con un avviso 'dati al [orario ultima sincronizzazione]'."* → implementato

## Sicurezza

- [x] L'endpoint `/meteo/latest` continua a essere protetto da `requireAuth` e controllo `ownerId`
- [x] `cacheInfo` non espone informazioni sensibili: solo timestamp e booleano, non rivelano dati di altri utenti

## Casi limite

- [x] Campo appena creato (`ultimoTentativoSync: null`) → `cacheInfo.ultimoTentativoRiuscito: null` → il box giallo NON appare (lo stato è "non determinato")
- [x] MeteoTrentino offline da una settimana → il box appare normalmente perché `etaDatoMinuti >> 120`
- [x] MeteoTrentino torna online → al primo refresh `ultimoTentativoRiuscito` diventa `true`, il box scompare alla successiva ricarica
- [x] Refresh ravvicinati durante uno stato offline → ogni tentativo aggiorna `ultimoTentativoSync` ma non `ultimoSuccessoSync`

## Anomalia storica del branch

> **Nota di tracciabilità**: il commit del Task 2 (backend tracking) `bbfad4e feat(US28): traccia tentativi sync meteo sul Field e aggiungi cacheInfo a /latest` è stato pushato accidentalmente sul branch `feature/US27-aggiornamento-periodico-meteo` e mergiato attraverso PR #87 invece che dal branch `feature/US28-cache-meteo-offline`. Il contenuto del codice è corretto e completo, ma lo storico Git mostra questa piccola incongruenza tra titolo PR e branch name. Le PR successive di US28 (Task 1 Apiary #88, Task 3 Frontend #89, Task 4 Test Report) sono state correttamente etichettate sul branch dedicato.

## Note

US28 trasforma MongoDB da semplice storage a vera **cache trasparente** dell'API esterna, requisito fondamentale per la resilienza del sistema (RFN10). Il pattern adottato — tracking del tentativo + tracking del successo separatamente — è una convenzione utilizzata anche in librerie professionali (es. Axios retry pattern, Tanstack Query staleTime/cacheTime). Permette di distinguere tra 3 stati:
1. **Dato fresco** (sync riuscita recente): nessun avviso
2. **Dato cached vecchio ma sync OK** (es. cron è giusto in pausa): nessun avviso (rare)
3. **Dato cached vecchio + sync fallita** (offline reale): avviso giallo

L'utente non vede mai un'app "rotta": al massimo vede un avviso giallo che spiega cosa sta succedendo.