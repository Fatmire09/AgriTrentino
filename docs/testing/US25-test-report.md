# Test Report — US25 Recupero dati meteo iniziali

## Integrazione API esterna (MeteoTrentino)

- [x] Endpoint lista stazioni `http://dati.meteotrentino.it/service.asmx/listaStazioniGeoJson` restituisce GeoJSON con ~497 stazioni della Provincia Autonoma di Trento
- [x] Endpoint dati stazione `http://dati.meteotrentino.it/service.asmx/ultimiDatiStazione?codice=Txxxx` restituisce XML con temperatura, umidità relativa, precipitazioni
- [x] Il parser `fast-xml-parser` decodifica correttamente la struttura XML (`datiOggi` > `temperature`, `umidita_relativa`, `precipitazioni`)
- [x] Le rilevazioni vengono raggruppate per timestamp e salvate come singoli record `DatiMeteo`
- [x] Timeout di 15 secondi sulle chiamate verso MeteoTrentino: se il servizio è lento, l'errore viene catturato

## Cache stazioni (server-side)

- [x] La lista di 497 stazioni viene scaricata e salvata in MongoDB collection `Stazione` al primo utilizzo
- [x] Cache valida per 7 giorni: dopo viene ricaricata automaticamente
- [x] Ogni record `Stazione` contiene: code, nome, quotaMt, latitudine, longitudine, attiva, inizioMonitoraggio, fineMonitoraggio, ultimoFetchOk, cachedAt
- [x] Le stazioni dismesse (con `fineMonitoraggio` valorizzata) vengono marcate come `attiva: false` e ignorate nei calcoli

## Algoritmo "stazione più vicina" (Haversine)

- [x] La formula di Haversine restituisce la distanza in km tra due punti geografici
- [x] Test di sanity: distanza Trento (46.07, 11.12) → Bolzano (46.50, 11.35) ≈ 50 km (atteso ~52 km, ok)
- [x] La funzione `trovaStazioneVicina(lat, lng)` itera su tutte le stazioni attive e restituisce quella a distanza minima
- [x] Per un appezzamento a Cembra (46.18, 11.21) → stazione assegnata è una delle stazioni meteo di valle di Cembra a < 5 km

## Auto-trigger sulla creazione di un appezzamento

- [x] Quando viene creato un nuovo Field tramite `POST /api/v1/fields`, parte in background `meteoService.aggiornaMeteoCampo(field)`
- [x] Il trigger NON blocca la risposta HTTP al client (uso di `.then/.catch` senza `await`)
- [x] L'utente vede subito la conferma di creazione campo, mentre i dati meteo vengono recuperati in 5-10 secondi
- [x] Se il fetch fallisce (es. MeteoTrentino offline), il campo viene comunque creato con `stazioneAssegnataCode: null` e l'errore viene loggato
- [x] Verifica nei log del server: `[meteo auto-trigger] campo XYZ: N dati salvati da T0405`

## Lato server (`POST /api/v1/fields/:fieldId/meteo/refresh`)

- [x] Richiesta senza header `Authorization` → 401 `{ "error": "Token mancante" }`
- [x] Richiesta con token + fieldId del proprio campo → 200 con `{ message, stazione: {code, nome, distanzaKm}, datiSalvati, datoCorrente }`
- [x] Richiesta su campo di altro utente → 403 `{ "error": "Non autorizzato" }`
- [x] Richiesta su fieldId inesistente → 404 `{ "error": "Appezzamento non trovato" }`
- [x] Se MeteoTrentino non raggiungibile (timeout) → 503 `{ "error": "Servizio meteo non disponibile, riprova più tardi" }`
- [x] Refresh successivi non duplicano i dati (indice unico su `{ appezzamentoId, timestamp }`)
- [x] La stazione assegnata al campo viene calcolata una volta sola e poi riutilizzata

## Lato server (`GET /api/v1/fields/:fieldId/meteo/latest`)

- [x] Richiesta senza token → 401
- [x] Richiesta su campo proprio con dati → 200 con `{ dato: {...} }`
- [x] Richiesta su campo proprio senza dati (appena creato, auto-trigger non ancora completato) → 200 con `{ dato: null, message: "Nessun dato meteo disponibile" }`
- [x] Richiesta su campo altrui → 403
- [x] Restituisce il record con `timestamp` più recente (ordinamento `sort({ timestamp: -1 })`)

## Lato server (`GET /api/v1/fields/:fieldId/meteo/storico`)

- [x] Richiesta su campo proprio → 200 con `{ dati: [...] }` ordinati dalla rilevazione più recente
- [x] Filtra solo le rilevazioni delle ultime 48 ore
- [x] Campo senza rilevazioni → 200 con `{ dati: [] }`

## Lato client (`FieldDetail.jsx`)

- [x] Apertura della scheda di un campo → al posto del placeholder grigio compaiono 3 card colorate
- [x] Temperatura mostrata in °C con 1 decimale (es. "16.5 °C")
- [x] Umidità relativa mostrata in % (es. "64 %")
- [x] Precipitazioni mostrate in mm con 1 decimale (es. "0.2 mm")
- [x] Sotto le card: "Fonte: stazione XXX · Rilevazione: DD/MM/AAAA HH:MM" in formato italiano
- [x] Click su "Aggiorna" → icona refresh ruota (animazione `animate-spin`), dopo 5-10s i dati si aggiornano
- [x] Durante refresh il bottone è disabilitato (no doppi click)
- [x] Campo senza dati meteo → messaggio "Nessun dato meteo disponibile. Clicca 'Aggiorna' per recuperare le ultime rilevazioni."
- [x] Errore di rete o servizio → messaggio rosso sopra le card
- [x] Valori `null` (es. stazione che non misura umidità) → trattino "—" al posto del valore

## Coerenza con il design (D1, D2)

- [x] **RF08 Integrazione API meteo**: l'app si integra con un servizio meteorologico esterno (MeteoTrentino, fonte ufficiale Provincia Autonoma di Trento) per recuperare dati per le coordinate degli appezzamenti
- [x] **RF09 Visualizzazione dati meteo**: la scheda del campo mostra temperatura, umidità relativa e precipitazioni con unità di misura chiare e timestamp
- [x] **RFN10 Affidabilità**: in caso di indisponibilità del servizio MeteoTrentino il sistema restituisce errore informativo (503) e non blocca le altre funzionalità
- [x] **UML D2 classe ClientAPIMeteo**: l'implementazione concreta `meteoService.js` corrisponde alla classe con i metodi `richiediDati`, `verificaDisponibilita` (implicito nel timeout), `salvaInCache`, `isCacheValida`, `recuperaDaCache`
- [x] **UML D2 classe DatiMeteo**: campi `timestamp`, `temperaturaC`, `umiditaPerc`, `precipitazioniMm` come da diagramma, estesi con `appezzamentoId` e `stazioneCode` per la relazione 1:N

## Sicurezza

- [x] Tutti gli endpoint meteo sono protetti da `requireAuth`
- [x] Verifica `ownerId` su ogni richiesta per impedire accesso ai dati meteo di campi altrui
- [x] Nessun dato sensibile esposto: solo dati pubblici di stazioni meteo ufficiali

## Casi limite

- [x] Campo creato in una zona dove la stazione più vicina è dismessa → viene selezionata la successiva attiva
- [x] Campo con coordinate fuori dal Trentino (es. Milano) → trova comunque la stazione "più vicina" ma con distanza alta (>50 km). Comportamento accettabile per Sprint #2 (futura US potrebbe avvisare)
- [x] Refresh ripetuti in pochi secondi → i dati vengono comunque salvati (upsert), no duplicati grazie all'indice univoco
- [x] Stazioni che non misurano tutti i 3 parametri (es. solo temperatura) → `umiditaPerc: null` e `precipitazioniMm: null` salvati come tali, frontend mostra "—"

## Note

US25 introduce il primo punto di integrazione con un servizio esterno (MeteoTrentino). La scelta della fonte è giustificata da: (a) carattere ufficiale del dato (Provincia Autonoma di Trento), (b) open data senza API key richiesta, (c) copertura capillare del territorio trentino con 497 stazioni. La fonte è stata indicata dal docente in seguito a comunicazione del 21/05/2026.

L'umidità del suolo (richiesta dagli indici di rischio e dal bilancio idrico) NON viene recuperata da API esterne: come da design UML D2, sarà calcolata in US31 ("Calcolo bilancio idrico giornaliero") tramite modello di Hargreaves-Samani per l'evapotraspirazione e bilancio tank semplificato. La distinzione tra "umidità atmosferica" (in `DatiMeteo`) e "umidità del suolo" (in `BilancioIdricoGiornaliero`) è coerente al 100% con il D2.