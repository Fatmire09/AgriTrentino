# Test Report — US57 Grafico comparativo reale vs simulato

## Obiettivo

Mettere a confronto, sulla pagina simulatore, lo scenario reale e quello simulato (parametri meteo + indici di rischio) tramite un grafico, così da quantificare visivamente la differenza fra le due situazioni. Terza User Story del modulo simulatore meteo (US55-59), sopra US55 (modifica parametri) e US56 (ricalcolo in tempo reale).

## Backend — `POST /api/v1/fields/:fieldId/simulatore/confronto` + helper `aggregaMeteoCampo`

- [x] Endpoint `POST /simulatore/confronto` in `routes/simulatore.js` con `requireAuth` + helper `trovaCampoAutorizzato` (campo altrui = 403, inesistente = 404, ID malformato = 400)
- [x] Una sola risposta consolidata: `{ campoNome, fase, scenarioReale:{meteo, indici}, scenarioSimulato:{meteo, indici}, delta:{fitosanitario, climatico} }`
- [x] `scenarioReale.indici` calcolato con i service reali di US33 (fitosanitario) e US35 (climatico)
- [x] `scenarioSimulato.indici` calcolato con `simulatoreService.calcolaIndiciSimulati` (US56)
- [x] `scenarioSimulato.meteo` = echo dei parametri ricevuti nel body, normalizzati a numero
- [x] `delta.fitosanitario` e `delta.climatico` = simulato.valore − reale.valore (positivo = scenario simulato più grave)
- [x] **Hotfix fix(US57): cascade lookback meteo** in `aggregaMeteoCampo(fieldId)` — prova 24h, poi 7 giorni, poi 30 giorni; restituisce la prima finestra non vuota. Risolve il problema dei campi senza sync recente (Meteo reale n/d). Usato sia da `/stato-iniziale` che da `/confronto`

## Frontend — `Simulatore.jsx`

- [x] **Refactor**: la chiamata debounced a `/ricalcola` (US56) è stata sostituita da `/confronto` come single source of truth (lo state `confronto` alimenta sia i semafori che il grafico)
- [x] **Box "Meteo a confronto"**: tabella 4 righe (T min, T max, UR media, Precipitazioni) con colonne Reale / Simulato / Δ (Δ colorato rosso > 0, blu < 0)
- [x] **Box "Indici a confronto"**: `BarChart` recharts con 2 categorie (Fitosanitario, Climatico) e 2 barre per categoria (Reale verde, Simulato arancio); Y axis 0-100; sotto il grafico, riga riassuntiva con `Δ fito` e `Δ clima`
- [x] **`animationDuration={800}` su entrambe le `<Bar>`** → transizioni più visibili al cambio parametri (in tempo reale, RF16)
- [x] **Bottone "Avvia simulazione"** sotto i Parametri simulati → forza il calcolo immediato bypassando il debounce 500ms (UC-06 passo 5)
- [x] Le sezioni "Indici reali" e "Indici simulati" (semafori, US56) continuano a funzionare, ora alimentate da `confronto.scenarioReale/Simulato.indici`

## Coerenza con D1 e D2

- [x] **D1 RF16 "Modulo simulazione"** ("modificare manualmente i parametri ambientali di input e visualizzare in tempo reale l'effetto sugli indici"): realizzato dal **debounce 500ms** + auto-refresh del `BarChart` con `animationDuration={800}`.
- [x] **D1 UC-06 passo 1** ("Sistema presenta i dati meteo correnti come base di partenza"): realizzato da `/stato-iniziale` + precompilazione del form coi valori reali (US55), rinforzato dal lookback cascata che evita "n/d".
- [x] **D1 UC-06 passo 5** ("L'utente avvia l'elaborazione del modello simulato"): realizzato dal nuovo **bottone "Avvia simulazione"**. Il debounce automatico rimane in parallelo come anteprima live (per soddisfare anche RF16).
- [x] **D1 UC-06 passo 6** ("Il sistema ricalcola gli indici applicando i parametri modificati"): realizzato da `simulatoreService` (US56) chiamato da `/confronto`.
- [x] **D1 UC-06 passo 7** ("Il sistema genera un grafico comparativo che mostra la differenza di rischio tra scenario reale e simulato"): realizzato dal `BarChart` "Indici a confronto" + tabella "Meteo a confronto" + Δ in tempo reale.
- [x] **D2 §2.5.1 `Simulazione.generaGraficoComparativo(indiciReali, indiciSimulati)`**: realizzato dal `BarChart` che riceve entrambi gli array dal `confronto` state.
- [x] **D2 §2.5.1 `Simulazione.confrontaConReale`**: realizzato dalla colonna Δ della tabella meteo e dal Δ testuale sotto il grafico.
- [x] **D2 modulo "Gestione Simulazione"** come componente separato che richiede "Calcolo Indici di Rischio" e "Dati Meteo": riflesso in `routes/simulatore.js` che riusa `rischioFitosanitarioService`/`rischioClimaticoService` (US33/US35) e `simulatoreService` (US56) e aggrega `DatiMeteo` (US25).

**Semplificazione consapevole rispetto a UC-06**: il deliverable D1 menziona "evoluzione del rischio su un orizzonte di 7 giorni". L'implementazione attuale calcola un **valore istantaneo** dell'indice per la combinazione di parametri inserita (un punto, non una serie temporale 7gg). Una proiezione forecast a 7 giorni richiederebbe un nuovo modello + un `LineChart` temporale: rimandata a US futura, da valutare dopo US59. Le funzionalità rimanenti del modulo simulazione (avviso valori atipici → US58 mappata su `D2 §2.5.2 ParametriSimulazione.isValid()`; reset ai valori reali → US59 mappata su `D2 §2.5.1 Simulazione.reset()`) restano in roadmap.

## Casi limite

- [x] Campo senza meteo nelle ultime 24h → `aggregaMeteoCampo` ricade su 7g, poi 30g (niente più "n/d" se almeno un dato esiste in 30 giorni)
- [x] Campo senza alcun dato meteo (mai sincronizzato) → `meteoReale` con tutti `null`, Δ "n/d", barre Reale nel chart a 0, le barre Simulato si vedono comunque
- [x] Campo senza `Coltura` → indice fitosanitario reale `null`; il simulato è calcolato senza modulazione di fase (US56)
- [x] Click multipli rapidi su "Avvia simulazione" → il bottone è disabilitato durante il ricalcolo (`disabled={ricalcolando}` + label "Calcolo in corso...")
- [x] Cambio rapido di parametri entro 500 ms → il debounce annulla i timer precedenti (cleanup nell'useEffect)
- [x] Cambio campo nel dropdown → state `confronto` resettato, tutte le sezioni si ricaricano sul nuovo campo
- [x] Token mancante/scaduto → fetch silenziosa fallisce, nessun crash UI
- [x] Numeri molto fuori scala (es. UR = 150) → backend non crasha, valori clampati a [0, 100] (sarà US58 a segnalarli come "atipici", coerentemente con D2 `ParametriSimulazione.isValid()`)

## Procedura demo

1. Login → click su "Simulatore" in Navbar → seleziona un campo
2. Verifica che "Stato reale" mostri valori reali (non più n/d, grazie al lookback cascata)
3. Modifica `tMin` a **-3** → entro ~500 ms tabella "Meteo a confronto" e BarChart si aggiornano; barra arancio Climatico schizza in alto (gelate), Δ clima > 0
4. Click su **"Avvia simulazione"** → il calcolo parte immediatamente (no attesa debounce), il bottone diventa "Calcolo in corso..."
5. Cambia `urMedia` a **95** e `tMax` a **35** → entrambi gli indici simulati si muovono visibilmente (animazione 800 ms ben evidente)
6. Cambia campo → tabella + grafico si resettano e poi ricaricano

## Note

US57 chiude il loop "modifica → ricalcolo → confronto visivo" del simulatore. Le due hotfix (lookback cascata BE + bottone Avvia / animazione FE) sono entrate sulla stessa branch `feature/US57-grafico-confronto` per chiudere coerentemente il modello UC-06. Nessuna nuova dipendenza. Prossima US: **US58** — avviso valori atipici nel simulatore (segnalazione di temperature/UR/precipitazioni fisicamente implausibili), mappata su `D2 §2.5.2 ParametriSimulazione.isValid()`.