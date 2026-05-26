# Test Report — US43 Classificazione automatica intervento

## Obiettivo

Classificare automaticamente ogni intervento (**Giustificato** / **Superfluo** / **Non valutabile**) in base all'indice di rischio della sua data, come feedback sulla qualità delle decisioni agronomiche.

## Logica — `services/classificazioneInterventoService.js`

- [x] **trattamento** → indice **fitosanitario** del giorno (da `IndiceRischio` storico): `basso` → Superfluo · `medio`/`alto` → Giustificato
- [x] **irrigazione** → **bilancio idrico** del giorno (`umiditaSuoloPerc`): ≥ 60% → Superfluo · < 60% → Giustificato
- [x] nessun dato per quella data → **Non valutabile**
- [x] Match per giorno (range `[mezzanotte, mezzanotte+1)`)

## Backend — `routes/interventi.js`

- [x] `GET /interventi` arricchisce ogni intervento con `classificazione` + `livello`
- [x] `POST /interventi` restituisce `classificazione` + `livello` dell'intervento appena creato (feedback immediato)
- [x] Nessuna modifica al modello: calcolo a runtime → classifica anche gli interventi pre-esistenti

## Frontend — registro in `FieldDetail.jsx`

- [x] Badge per intervento: Giustificato (verde) / Superfluo (rosso) / Non valutabile (grigio)
- [x] Livello a fianco (es. "Superfluo · basso", "Giustificato · alto", "suolo 72%")

## Coerenza con il design

- [x] **Criterio di accettazione backlog**: intervento in un giorno a rischio "verde" → classificato "Superfluo" con il livello a fianco ✓
- [x] Feedback sulla qualità delle decisioni: gli interventi "al buio" vengono segnalati come superflui

## Casi limite (⚠️ importante)

- [x] **Interventi datati OGGI → "Non valutabile"**: lo storico indici (seed US40) copre da 365 giorni fa a **ieri** (oggi escluso). Per vedere la classificazione, l'intervento deve avere una **data coperta dallo storico** (entro l'ultimo anno).
- [x] Pattern stagionale (utile per la demo): data **invernale** → fitosanitario basso → trattamento **Superfluo**; data **primaverile/estiva** → fitosanitario alto → **Giustificato**
- [x] Irrigazioni: classificate sul bilancio idrico, che ha storico limitato (nessun seed) → spesso **Non valutabile** (atteso)
- [x] Tipologia sconosciuta / dati mancanti → Non valutabile (nessun crash)

## Procedura demo

1. Registra un **trattamento** con **data invernale** (es. 15/01/2026) → badge **rosso "Superfluo · basso"**
2. Registra un **trattamento** con **data primaverile** (es. 10/06/2026) → badge **verde "Giustificato · alto/medio"**
3. Nel registro: badge + livello compaiono a fianco di ogni intervento

## Note

US43 chiude il cerchio "decisioni agronomiche": incrocia gli interventi registrati (US41/US42) con gli indici di rischio storici (US40) per dare un feedback. Limite noto: classificabili solo gli interventi su date coperte dallo storico; un cron giornaliero di snapshot (futuro) coprirebbe anche "oggi". Prepara la dashboard sostenibilità (% interventi giustificati).