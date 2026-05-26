# Test Report — US42 Registrazione irrigazione

## Lato server

### POST /api/v1/fields/:fieldId/interventi (irrigazione)
- [ ] Irrigazione valida (`tipologia: "irrigazione"`, `volumeAcqua: 150`) → 201 con intervento restituito
- [ ] Irrigazione con `volumeAcqua: 0` → 400 "Validazione fallita: volumeAcqua deve essere > 0"
- [ ] Irrigazione con `volumeAcqua: -5` → 400 (min: 0 nel modello)
- [ ] Irrigazione senza `volumeAcqua` → 400
- [ ] Richiesta senza token → 401
- [ ] Richiesta su campo altrui → 403
- [ ] fieldId inesistente → 404

### GET /api/v1/fields/:fieldId/interventi
- [ ] Richiesta autenticata → 200 con `{ interventi: [...] }` (ordinati per dataOra desc)
- [ ] Lista vuota → 200 con `{ interventi: [] }`
- [ ] Richiesta senza token → 401
- [ ] Richiesta su campo altrui → 403
- [ ] fieldId inesistente → 404

## Lato client (`FieldDetail.jsx`)

- [ ] Dropdown tipologia mostra "Trattamento fitosanitario" e "Irrigazione"
- [ ] Selezionando "Irrigazione": spariscono principio attivo / quantità / unità; appare "Volume acqua (litri)"
- [ ] Selezionando "Trattamento": tornano principio attivo / quantità / unità; sparisce volume acqua
- [ ] Submit irrigazione valida → 201 → form si chiude + messaggio verde + lista si aggiorna con il nuovo intervento
- [ ] Submit irrigazione con volume vuoto → messaggio errore rosso
- [ ] Lista interventi mostra badge blu per irrigazione, verde per trattamento
- [ ] Lista caricata al mount della pagina
- [ ] Campo vuoto: messaggio "Nessun intervento registrato"

## Coerenza con il design

- [ ] **RF17**: "registrare ogni intervento agronomico (trattamento fitosanitario, irrigazione)" → soddisfatto per entrambe le tipologie
- [ ] **UML D2 Irrigazione**: `volumeAcqua > 0` → enforced via hook pre-validate
- [ ] **OCL D2**: `Irrigazione.volumeAcqua > 0` → confermato