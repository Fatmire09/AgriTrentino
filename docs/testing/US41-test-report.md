# Test Report — US41 Registrazione trattamento fitosanitario

## Architettura

US41 introduce il **modulo Interventi** del sistema. Implementa la classe astratta `InterventoAgronomico` del D2 con la prima sottoclasse `TrattamentoFitosanitario`. La sottoclasse `Irrigazione` arriverà in US42.

Pattern adottato: **discriminator via campo `tipologia`** (`'trattamento'` o `'irrigazione'`) all'interno di una singola collezione MongoDB. Validazione condizionale tramite hook `pre('validate')` di Mongoose.

## Modello `Intervento.js`

- [x] Campi comuni: `appezzamentoId`, `dataOra`, `tipologia` (enum), `note`
- [x] Campi specifici trattamento: `principioAttivo`, `quantita`, `unitaMisura`
- [x] Campi specifici irrigazione (riservati a US42): `volumeAcqua`
- [x] Hook `pre('validate')`: se tipologia=trattamento → `principioAttivo` non vuoto e `quantita >= 0`; se irrigazione → `volumeAcqua > 0`
- [x] Indice composito `{appezzamentoId, dataOra: -1}` per query "ultimi interventi"
- [x] Coerente con UML D2 classe `InterventoAgronomico` (registra, valutaEfficacia, getDettagli)

## Lato server (`POST /api/v1/fields/:fieldId/interventi`)

- [x] Richiesta senza token → 401
- [x] Trattamento valido → 201 con `{message, intervento: {...}}`
- [x] Trattamento senza `principioAttivo` → 400 "Validazione fallita: principioAttivo non può essere vuoto"
- [x] Trattamento con `principioAttivo` solo spazi (es. `"   "`) → 400 (trim implicito nel check)
- [x] Trattamento con `quantita` negativa → 400 (Mongoose min: 0)
- [x] Trattamento con dati validi ma senza `dataOra` → default `Date.now()` (l'utente può omettere il campo)
- [x] Richiesta su campo altrui → 403
- [x] Richiesta su fieldId inesistente → 404

## Lato client (`FieldDetail.jsx`)

- [x] La sezione "Storico interventi" (precedentemente placeholder grigio) è ora una sezione attiva
- [x] Bottone "Nuovo intervento" in alto a destra della sezione
- [x] Click sul bottone → apre form inline con campi: Tipologia (per ora solo Trattamento), Data/ora, Principio attivo*, Quantità*, Unità di misura, Note
- [x] Il campo `dataOra` ha valore default = adesso (`new Date().toISOString().slice(0, 16)`)
- [x] Unità di misura selezionabile da dropdown: kg/ha, L/ha, g/ha
- [x] Validazione asterischi su campi obbligatori
- [x] Submit form → POST → su successo: form si chiude, mostra messaggio verde "Intervento registrato con successo"
- [x] Su errore server (es. principio vuoto) → messaggio rosso visibile nel form
- [x] Annulla → chiude il form senza salvare
- [x] Submit ripetuto durante salvataggio impedito (bottone disabilitato)

## Coerenza con il design (D1, D2)

- [x] **RF17 Registro degli interventi (parte trattamenti)**: *"L'utente deve poter registrare ogni intervento agronomico effettuato (trattamento fitosanitario, irrigazione), specificando: data e ora, appezzamento interessato, tipologia e prodotto utilizzato, con un campo note facoltativo."* → soddisfatto per la parte trattamento
- [x] **UML D2 InterventoAgronomico**: modello creato con tutti i campi previsti
- [x] **UML D2 TrattamentoFitosanitario**: `principioAttivo` come campo specifico
- [x] **OCL D2**: `TrattamentoFitosanitario.principioAttivo <> ''` → enforced via hook pre-validate

## Sicurezza

- [x] Endpoint protetto da `requireAuth` + verifica `ownerId` del campo padre
- [x] Solo il proprietario del campo può registrare interventi sullo stesso

## Casi limite

- [x] Note vuote: accettate (campo opzionale)
- [x] dataOra futura (es. domani): accettata (l'utente potrebbe pianificare un intervento futuro)
- [x] Quantità = 0: accettata (es. trattamento dimostrativo, biologico simbolico)
- [x] Salvataggio di trattamenti multipli in rapida successione: ogni intervento ha un `_id` distinto

## Note

US41 chiude il primo step del cluster Interventi. Le US successive estenderanno il sistema:
- **US42**: aggiunge tipologia "Irrigazione" al form
- **US43**: classificazione automatica intervento basata su indice rischio (Giustificato/Anticipato/Superfluo)
- **US44**: lista con filtri degli interventi nel registro
- **US45**: modifica intervento registrato
- **US46**: eliminazione intervento

Il modello `Intervento` è stato progettato fin dall'inizio per supportare tutte queste estensioni (discriminator + validazione condizionale + campi opzionali per irrigazione).