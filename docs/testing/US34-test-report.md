# Test Report — US34 Visualizzazione indice fitosanitario semaforico

## Obiettivo

Mostrare il livello di rischio fitosanitario (peronospora, calcolato in US33) tramite una **scala cromatica semaforica**, cliccabile per consultare i valori del modello biologico. Lato backend si aggiunge una **raccomandazione operativa** per livello.

## Backend — `rischioFitosanitarioService.js`

- [x] `raccomandazioneDaLivello(livello)` → testo operativo per `alto` / `medio` / `basso`
- [x] `calcolaRischioFitosanitario` include il campo `raccomandazione` nella response (flussa nell'endpoint esistente, nessun nuovo endpoint)
- [x] Coerenza: alto → "trattamento preventivo entro 24-48h"; medio → "monitora / prepara intervento"; basso → "nessun intervento necessario"

## Componente `SemaforoRischio.jsx`

- [x] Riutilizzabile: prop `livello` (basso/medio/alto) + `onClick`
- [x] 3 pallini semaforici: quello del livello corrente acceso nel suo colore (verde/giallo/rosso), gli altri grigi
- [x] Etichetta colorata coerente al livello
- [x] È un `<button>`: cliccabile e attivabile da tastiera (accessibile)
- [x] Predisposto al riuso per l'indice climatico (US36)

## Frontend — `FieldDetail.jsx`

- [x] Sezione "Indici di rischio": badge semaforo al posto della pill statica di US33
- [x] Raccomandazione mostrata sotto il badge, con colore di sfondo coerente al livello
- [x] Click sul badge → apre/chiude il pannello "Dettaglio modello biologico"
- [x] Dettaglio: patologia, punteggio/100, fase + suscettibilità, ore favorevoli/analizzate, condizione (UR/temp), finestra 48h, data calcolo
- [x] Caso senza indice: messaggio grigio invariato (nessun badge)

## Coerenza con il design

- [x] **Criterio di accettazione backlog**: "il badge fitosanitario mostra il colore corretto e cliccandolo si vedono i valori del modello biologico" ✓
- [x] Scala cromatica semaforica (verde/giallo/rosso) ✓
- [x] "Capire al volo se intervenire": colpo d'occhio col semaforo + raccomandazione operativa ✓
- [x] Prepara US36 (stesso componente per il climatico) e US37 (notifiche al superamento soglia)

## Casi limite / UI

- [x] Livello sconosciuto/null → badge grigio "—" (fallback nel componente)
- [x] Campo senza coltura/fase/meteo → sezione "non disponibile", nessun badge
- [x] Click ripetuti → toggle apri/chiudi del pannello dettaglio
- [x] Badge raggiungibile da tastiera (elemento `button`)

## Procedura demo

1. Campo con vite in **fioritura** + 48h di meteo favorevole (UR >80%, 15-25°C)
2. Aprire la scheda campo → sezione "Indici di rischio"
3. Badge semaforo con pallino **rosso** acceso + etichetta "Alto" + box raccomandazione rosso
4. **Click sul badge** → si apre "Dettaglio modello biologico" coi valori (punteggio 100, 48/48 ore favorevoli, ecc.)

## Note

US34 completa la presentazione dell'indice fitosanitario di US33: il calcolo era già pronto, qui si aggiungono la visualizzazione semaforica (componente riutilizzabile `SemaforoRischio`) e la raccomandazione operativa. Lo stesso componente sarà riusato per l'indice climatico in US36.