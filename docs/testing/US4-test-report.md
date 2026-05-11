# Test Report — US4 Validazione Password

## Vincoli lunghezza (OCL constraints)
- [x] 7 caratteri → errore "Minimo 8 caratteri"
- [x] 8 caratteri → valido
- [x] 32 caratteri → valido
- [x] 33 caratteri → errore "Massimo 32 caratteri"

## Indicatore robustezza
- [x] Password vuota → nessun indicatore
- [x] Meno di 8 caratteri → "Troppo corta" (rosso)
- [x] 8+ caratteri solo minuscole → "Debole" (rosso)
- [x] 8+ caratteri con maiuscola o numero → "Media" (giallo)
- [x] 8+ caratteri con maiuscola + numero + simbolo → "Forte" (verde)

## Lato server
- [x] Password < 8 char → 400 Bad Request
- [x] Password > 32 char → 400 Bad Request
- [x] Password valida → 201 Created

