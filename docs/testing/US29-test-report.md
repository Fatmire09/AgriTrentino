# Test Report — US29 Errore meteo senza cache

## Continuità con US28

US28 gestiva il caso *"ho cache vecchia e l'API è offline"* (mostra dati cached con avviso giallo). US29 gestisce il **caso opposto**: *"NON ho nessun dato meteo e l'API è offline"* — situazione tipica per un appezzamento appena creato quando MeteoTrentino è temporaneamente irraggiungibile.

Per distinguere chiaramente le quattro situazioni possibili, è stato introdotto il campo derivato `statoMeteo` nella response di `/meteo/latest`.

## Campo `statoMeteo` (calcolato server-side)

I 4 valori e il loro significato:

| Valore | Condizione | Messaggio mostrato |
|---|---|---|
| `ok` | dato presente + ultima sync riuscita | (nessuno, comportamento normale) |
| `offline_con_cache` | dato presente + ultima sync fallita | Box giallo "Servizio meteo non raggiungibile" (US28) |
| `offline_senza_cache` | NESSUN dato + sync fallita | **Box rosso "Servizio meteo non disponibile e nessun dato pregresso"** (US29) |
| `mai_sincronizzato` | NESSUN dato + sync mai tentata | "Sincronizzazione meteo in corso..." (per campi appena creati) |

## Lato server (`GET /api/v1/fields/:fieldId/meteo/latest`)

- [x] La response include sempre il campo `statoMeteo` (string, uno dei 4 valori sopra)
- [x] Il calcolo di `statoMeteo` è deterministico e si basa solo su due variabili: presenza di `dato` + `field.ultimoTentativoRiuscito`
- [x] Caso `mai_sincronizzato`: campo appena creato, `field.ultimoTentativoRiuscito === null` → `statoMeteo = "mai_sincronizzato"`, `dato = null`
- [x] Caso `ok`: condizioni normali → `statoMeteo = "ok"`, `dato` valorizzato
- [x] Caso `offline_con_cache`: ultima sync fallita ma `DatiMeteo` ha record per il campo → `statoMeteo = "offline_con_cache"`, `dato` valorizzato (gestito già in US28)
- [x] Caso `offline_senza_cache`: ultima sync fallita E nessun record `DatiMeteo` per il campo → `statoMeteo = "offline_senza_cache"`, `dato = null`, `message = "Servizio meteo non disponibile e nessun dato pregresso"`
- [x] La response continua a essere protetta da `requireAuth` e controllo `ownerId`

## Lato client (`FieldDetail.jsx`)

- [x] Lo stato `statoMeteo` viene caricato all'apertura della scheda e aggiornato dopo un refresh
- [x] Caso `ok`: card meteo standard + sintesi giornaliera + indicatore freschezza (US25, US26)
- [x] Caso `offline_con_cache`: card meteo cached + box giallo (US28)
- [x] **Caso `offline_senza_cache`**: nessuna card meteo, **box rosso** con icona AlertTriangle + titolo "Servizio meteo non disponibile e nessun dato pregresso" + descrizione + invito a riprovare
- [x] Caso `mai_sincronizzato`: messaggio grigio "Sincronizzazione meteo in corso..."
- [x] Caso fallback (`statoMeteo` non valorizzato): messaggio generico "Nessun dato meteo disponibile. Clicca Aggiorna..."
- [x] Il bottone "Aggiorna" è sempre disponibile, anche nei casi `offline_senza_cache` e `mai_sincronizzato`, per permettere all'utente di riprovare manualmente

## Sicurezza

- [x] `statoMeteo` è derivato server-side da campi già protetti (`field.ultimoTentativoRiuscito`) — non espone informazioni sensibili
- [x] Nessun nuovo endpoint introdotto: tutto è incapsulato nel `/meteo/latest` esistente

## Procedura di test funzionale

Per simulare il caso `offline_senza_cache`:

1. Aprire `server/services/meteoService.js`
2. All'inizio della funzione `fetchDatiStazione(codice)`, aggiungere temporaneamente: `throw new Error('Simulato: MeteoTrentino offline');`
3. Riavviare il server
4. Creare un nuovo appezzamento dalla UI con coordinate valide
5. Aprire la scheda del nuovo appezzamento
6. **Verifica**: la sezione "Dati meteo" mostra il **box rosso** "Servizio meteo non disponibile e nessun dato pregresso"
7. Rimuovere la riga aggiunta al punto 2
8. Riavviare il server
9. Cliccare "Aggiorna meteo" sul campo → la sincronizzazione va a buon fine

## Coerenza con il design (D1)

- [x] **RF09 Visualizzazione dati meteo**: messaggi differenziati e chiari per ogni stato di disponibilità del dato
- [x] **RFN10 Affidabilità**: messaggi di errore informativi quando i servizi esterni non sono disponibili
- [x] Coerente con US28 (lo stesso `cacheInfo` viene usato per derivare `statoMeteo`)

## Casi limite

- [x] Campo creato con wifi offline: auto-trigger fallisce → `statoMeteo = "offline_senza_cache"` → box rosso ✓
- [x] Recovery: appena MeteoTrentino torna online e l'utente clicca "Aggiorna", la response cambia a `statoMeteo = "ok"` e i messaggi tornano standard

## Note

US28 e US29 insieme formano un **sistema completo di gestione resilienza meteo**:
1. US25 assicura che i dati vengano fetchati (recupero iniziale)
2. US27 li mantiene aggiornati (cron orario)
3. US28 garantisce continuità di servizio se l'API esterna ha problemi temporanei (cache)
4. US29 comunica chiaramente l'utente quando la cache non basta

Una limitazione attuale: il sistema gestisce l'offline del **solo servizio meteo esterno**. Un'eventuale indisponibilità del database MongoDB bloccherebbe l'intera applicazione: questa è una limitazione architetturale del DSS basato su database centralizzato e fuori dallo scope di US28/US29.