// US34: badge semaforico riutilizzabile per i livelli di rischio (basso/medio/alto)
// Riusabile anche per l'indice climatico (US36)
const LIVELLI = ['basso', 'medio', 'alto']
const COLORI = { basso: '#16a34a', medio: '#ca8a04', alto: '#dc2626' }
const ETICHETTE = { basso: 'Basso', medio: 'Medio', alto: 'Alto' }

export default function SemaforoRischio({ livello, onClick }) {
  const colore = COLORI[livello] || '#9ca3af'
  return (
    <button
      type="button"
      onClick={onClick}
      title="Clicca per i dettagli del modello biologico"
      className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
    >
      <span className="flex items-center gap-1">
        {LIVELLI.map((l) => (
          <span
            key={l}
            className="w-3 h-3 rounded-full transition-all"
            style={{
              backgroundColor: l === livello ? COLORI[l] : '#e5e7eb',
              boxShadow: l === livello ? `0 0 0 2px ${COLORI[l]}40` : 'none',
            }}
          />
        ))}
      </span>
      <span className="text-sm font-semibold" style={{ color: colore }}>
        {ETICHETTE[livello] || '—'}
      </span>
    </button>
  )
}