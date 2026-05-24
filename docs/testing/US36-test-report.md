# Test Report — US36 Visualizzazione indice climatico semaforico

## Obiettivo

Mostrare il livello di rischio climatico con scala cromatica semaforica e un **tooltip che descrive la minaccia rilevata**.

## Backend — `rischioClimaticoService.js`

- [x] `descrizioneMinaccia(minaccia)` → testo per `gelate` / `stress_termico` / `eccesso_umidita` / `nessuna`
- [x] `calcolaRischioClimatico` include il campo `descrizione` nella response
- [x] L'endpoint `GET /indici/climatico` restituisce `descrizione` (flussa via spread, nessun nuovo endpoint)

## Frontend — `SemaforoRischio.jsx` + `FieldDetail.jsx`

- [x] `SemaforoRischio` accetta una prop opzionale `tooltip`
- [x] **Tooltip CSS** (riquadro scuro su hover, `group-hover`): sempre visibile e immediato, senza il ritardo/scarsa visibilità dell'attributo `title` nativo
- [x] `FieldDetail` passa `climatico.descrizione` come `tooltip` al badge climatico
- [x] Il badge fitosanitario resta invariato (nessuna prop `tooltip` → nessun riquadro)

## Coerenza con il design

- [x] **Criterio di accettazione backlog**: "il badge climatico mostra il colore corretto con tooltip che descrive il tipo di minaccia rilevata" ✓
- [x] Scala cromatica semaforica (già introdotta in US35) ✓
- [x] Riusa il componente `SemaforoRischio` di US34 ✓

## Casi limite

- [x] `minaccia: "nessuna"` → descrizione "Nessuna minaccia climatica rilevante al momento."
- [x] `climatico` null (nessun dato meteo) → sezione "non disponibile", nessun badge/tooltip
- [x] Tooltip mostrato solo se la prop `tooltip` è valorizzata (badge fitosanitario non impattato)

## Procedura demo

1. Campo con dati meteo che attivano una minaccia (es. gelate: Tmin -3°C, esposizione Nord, fase germogliamento)
2. Scheda campo → sezione "Indici di rischio": badge climatico colorato con la minaccia dominante
3. **Hover sul badge** → compare il tooltip con la descrizione (es. "Gelate: rischio di danni da freddo a germogli e fiori…")

## Note

US36 è una US piccola: il badge semaforico e il dettaglio cliccabile erano già stati realizzati in US35. US36 aggiunge la **descrizione testuale della minaccia** (backend) e il **tooltip** (frontend). Implementato con un tooltip CSS al posto dell'attributo `title` nativo, per garantire visibilità immediata all'hover.