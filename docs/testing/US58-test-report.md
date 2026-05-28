# Test Report — US58 Avviso valori atipici nel simulatore

## Obiettivo

Avvisare l'agricoltore quando inserisce nel simulatore valori meteorologici fisicamente implausibili (temperature/UR/precipitazioni fuori da range realistici, o vincoli logici violati), così da non basare decisioni su scenari irrealistici. Quarta User Story del modulo simulatore meteo (US55-59).

## Backend — `validaParametriSimulazione` + `warnings` in `/confronto` e `/ricalcola`

- [x] Nuova funzione `validaParametriSimulazione({tMin, tMax, urMedia, precipitazioni})` in `server/services/simulatoreService.js` → ritorna `{valid:bool, warnings:[{campo, valore, messaggio}]}`
- [x] Costante `RANGE_PLAUSIBILE` esplicita i range per ogni parametro:
  - `tMin`: -25 … 30 °C
  - `tMax`: -10 … 45 °C
  - `urMedia`: 0 … 100 %
  - `precipitazioni`: 0 … 200 mm
- [x] Vincolo logico aggiuntivo: `tMin ≤ tMax` (se l'utente inverte, warning su `tMin`)
- [x] Parametri `null`/stringa vuota/`NaN` ignorati (no warning su input non compilati)
- [x] Endpoint `POST /api/v1/fields/:fieldId/simulatore/confronto` arricchito con `warnings` nella response (sempre presente, array vuoto se tutto plausibile)
- [x] Endpoint `POST /api/v1/fields/:fieldId/simulatore/ricalcola` arricchito con `warnings` nella response (consistenza per chi usa ancora il vecchio endpoint)
- [x] Lo scenario viene **calcolato comunque**: i warnings sono informativi, non bloccanti — il modello clampa i valori (US56) e ritorna gli indici

## Frontend — banner + bordi rossi in `Simulatore.jsx`

- [x] Import di `AlertTriangle` (lucide-react) per l'icona del banner
- [x] Helper `warningsByCampo` (Set di nomi-campo con warning attivo) + `inputCls(campo)` che applica `border-red-500 bg-red-50` quando il campo è in warning, altrimenti `border-gray-300`
- [x] **Banner giallo** dentro la card "Parametri simulati" (sotto la descrizione): icona `AlertTriangle` + titolo "Valori atipici rilevati" + bullet list dei messaggi dal backend + nota "Lo scenario viene calcolato comunque — usa i risultati con cautela"
- [x] **Bordo rosso + sfondo rosa** sugli input incriminati: tutti e 4 gli `<input>` usano `className={inputCls(...)}`
- [x] **Bottone "Avvia simulazione" resta abilitato** (scelta UX consapevole, coerente con uno strumento di simulazione: gli scenari estremi sono spesso interessanti per il what-if)
- [x] Banner e bordi si aggiornano automaticamente al variare dei parametri (alimentati da `confronto.warnings` con debounce 500ms ereditato da US57)

## Coerenza con D1 e D2

- [x] **D2 §2.5.2 `ParametriSimulazione.isValid()`** ("Verifica che i valori dei parametri inseriti dall'utente (temperatura, umidità, precipitazioni) siano fisicamente plausibili e rientrino nei range tecnici accettati dal sistema. Restituisce true se tutti i parametri sono validi, false altrimenti, segnalando i valori atipici."): realizzato da `validaParametriSimulazione` — ritorna `{valid, warnings}` direttamente derivato dalla firma del modello (`true`/`false` + i valori atipici segnalati)
- [x] **D1 UC-06 estensione "Inserimento valori fuori scala al passo 3"** (descritto nel flusso esteso di UC-06): realizzato dal banner che segnala i valori atipici al passo di inserimento, senza interrompere il flusso (l'utente può procedere se vuole)
- [x] La validazione **doppia** (BE + FE che legge la response BE) rispecchia il principio D2 secondo cui la validazione fa parte del **modello** (`ParametriSimulazione`), non della sola vista

## Casi limite

- [x] **Tutti i parametri plausibili** → `warnings: []`, niente banner, niente bordi rossi
- [x] **tMin fuori scala** (es. `-50`) → warning su `tMin`, bordo rosso solo su quell'input
- [x] **tMin > tMax** (es. `tMin=20`, `tMax=10`) → warning su `tMin` con messaggio dedicato al vincolo logico; bordo rosso sul solo `tMin`
- [x] **UR > 100** (es. `150`) → warning su `urMedia`; backend clampa comunque
- [x] **Precipitazioni > 200** (es. `500`) → warning su `precipitazioni`; lo scenario fitosanitario riceve comunque il boost pioggia (US56)
- [x] **Più warning contemporanei** → tutti elencati nel banner, tutti i relativi input con bordo rosso
- [x] **Input vuoto / stringa non numerica** → ignorato dalla validazione (no warning fuorviante)
- [x] **Cambio campo nel dropdown** → `confronto` resettato, banner sparisce e si ricalcola sul nuovo campo
- [x] Bottone "Avvia simulazione" resta **abilitato** anche in presenza di warning (decisione consapevole utente)

## Procedura demo

1. Login → click su "Simulatore" in Navbar → seleziona un campo
2. Caso plausibile: imposta `tMin=10, tMax=22, urMedia=65, precipitazioni=0` → nessun banner, input grigi
3. Modifica `tMin` a **-50** → entro ~500 ms:
   - banner giallo "Valori atipici rilevati" con bullet "Temperatura minima -50 °C fuori dal range plausibile (-25 … 30 °C)"
   - input `tMin` con bordo rosso e sfondo rosa
   - barre Simulato del BarChart continuano a aggiornarsi
4. Cambia `tMax` a **8** (con `tMin=10` ancora attivo) → secondo warning "Temperatura minima maggiore della massima"; entrambi gli input restano rossi
5. Riporta `tMin` e `tMax` a valori plausibili → il banner sparisce, i bordi tornano grigi
6. Click "Avvia simulazione" anche con warning attivo → il calcolo parte ugualmente

## Note

US58 chiude il modello di validazione del simulatore (D2 §2.5.2). Nessuna nuova dipendenza. Prossima US: **US59** — reset del simulatore ai valori reali correnti (mappata su **D2 §2.5.1 `Simulazione.reset()`**), per permettere all'agricoltore di scartare uno scenario costruito a mano e tornare alla baseline reale senza ricaricare la pagina.