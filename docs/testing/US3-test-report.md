# Test Report — US3 Validazione Email in Tempo Reale

## Validazione onBlur (in tempo reale)
- [x] Email valida → bordo verde al blur
- [x] Email senza @ → errore "Formato email non valido" al blur
- [x] Email senza dominio → errore "Formato email non valido" al blur
- [x] Email con spazi → errore "Formato email non valido" al blur
- [x] Campo email vuoto al blur → errore "Email obbligatoria"

## Feedback visivo
- [x] Campo non toccato → bordo neutro
- [x] Campo con errore → bordo rosso
- [x] Campo valido → bordo verde

## Casi limite formato email
- [x] "mario" → non valido
- [x] "mario@" → non valido
- [x] "mario@example" → non valido
- [x] "mario@example.com" → valido
- [x] "@example.com" → non valido
- [x] "mario@@example.com" → non valido
