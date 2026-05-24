// US34: badge semaforico riutilizzabile per i livelli di rischio (basso/medio/alto)
// US36: tooltip CSS opzionale che descrive la minaccia
const LIVELLI = ['basso', 'medio', 'alto']
const COLORI = { basso: '#16a34a', medio: '#ca8a04', alto: '#dc2626' }
const ETICHETTE = { basso: 'Basso', medio: 'Medio', alto: 'Alto' }

export default function SemaforoRischio({ livello, onClick, tooltip }) {
  const colore = COLORI[livello] || '#9ca3af'
  return (
    <div className="relative inline-block group">
      <button
        type="button"
        onClick={onClick}
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
      {tooltip && (
        <span className="pointer-events-none absolute z-10 hidden group-hover:block bottom-full right-0 mb-2 w-64 px-3 py-2 rounded-lg bg-gray-900 text-white text-xs leading-snug shadow-lg">
          {tooltip}
        </span>
      )}
    </div>
  )
}