// US61: configurazione centralizzata dell'URL delle API.
// In sviluppo usa il backend locale; in produzione/Docker il valore arriva
// dalla variabile d'ambiente Vite VITE_API_URL (vedi docker-compose.yml e .env).
export const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'
