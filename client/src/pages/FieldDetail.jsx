import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Maximize2, TrendingUp, Sprout, Compass, Cloud, AlertTriangle, ClipboardList, Pencil, Trash2, Plus, X, RefreshCw, Thermometer, Droplets, CloudRain } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'

// US22: varietà disponibili per ogni tipologia (deve restare allineato a server/constants/colture.js)
const VARIETA_PER_TIPOLOGIA = {
  Vite: ['Chardonnay', 'Pinot Nero', 'Müller-Thurgau', 'Teroldego', 'Marzemino'],
}

// US23: fasi fenologiche per tipologia (allineato a server/constants/colture.js)
const FASI_PER_TIPOLOGIA = {
  Vite: ['gemma_dormiente', 'germogliamento', 'fioritura', 'allegagione', 'invaiatura', 'maturazione', 'caduta_foglie'],
}

// Etichette user-friendly per le fasi (sostituiscono gli underscore)
const ETICHETTE_FASI = {
  gemma_dormiente: 'Gemma dormiente',
  germogliamento: 'Germogliamento',
  fioritura: 'Fioritura',
  allegagione: 'Allegagione',
  invaiatura: 'Invaiatura',
  maturazione: 'Maturazione',
  caduta_foglie: 'Caduta foglie',
}

export default function FieldDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [field, setField] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [colture, setColture] = useState([])
  const [loadingColture, setLoadingColture] = useState(true)
  const [showAddColtura, setShowAddColtura] = useState(false)
  const [newTipologia, setNewTipologia] = useState('Vite')
  const [newVarieta, setNewVarieta] = useState('')
  const [newFase, setNewFase] = useState('')
  const [savingColtura, setSavingColtura] = useState(false)
  const [colturaError, setColturaError] = useState('')
  const [showUpdateFase, setShowUpdateFase] = useState(false)
  const [updatedFase, setUpdatedFase] = useState('')
  const [updatingFase, setUpdatingFase] = useState(false)
  const [updateFaseError, setUpdateFaseError] = useState('')
  const [meteo, setMeteo] = useState(null)
  const [loadingMeteo, setLoadingMeteo] = useState(true)
  const [refreshingMeteo, setRefreshingMeteo] = useState(false)
  const [meteoError, setMeteoError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    fetch(`http://localhost:3001/api/v1/fields/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login')
          return null
        }
        if (res.status === 403) {
          setError('Non sei autorizzato a vedere questo appezzamento.')
          return null
        }
        if (res.status === 404) {
          setError('Appezzamento non trovato.')
          return null
        }
        if (res.status === 400) {
          setError('ID appezzamento non valido.')
          return null
        }
        return res.json()
      })
      .then((data) => {
        if (data?.field) setField(data.field)
      })
      .catch(() => setError('Impossibile contattare il server. Riprova più tardi.'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch(`http://localhost:3001/api/v1/fields/${id}/colture`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.colture) setColture(data.colture)
      })
      .finally(() => setLoadingColture(false))
  }, [id])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch(`http://localhost:3001/api/v1/fields/${id}/meteo/latest`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.dato) setMeteo(data.dato)
      })
      .finally(() => setLoadingMeteo(false))
  }, [id])

  const handleAddColtura = async () => {
    setSavingColtura(true)
    setColturaError('')
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`http://localhost:3001/api/v1/fields/${id}/colture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          tipologia: newTipologia,
          varieta: newVarieta || null,
          fase: newFase || null,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setColture((prev) => [data.coltura, ...prev])
        setShowAddColtura(false)
        setNewVarieta('') // reset per il prossimo uso
        setNewFase('')
      } else {
        setColturaError(data.error || 'Errore durante il salvataggio')
      }
    } catch {
      setColturaError('Impossibile contattare il server')
    } finally {
      setSavingColtura(false)
    }
  }

  const handleUpdateFase = async () => {
    if (!updatedFase) {
      setUpdateFaseError('Seleziona una fase fenologica')
      return
    }
    setUpdatingFase(true)
    setUpdateFaseError('')
    const token = localStorage.getItem('token')
    const colturaId = colture[0]._id
    try {
      const res = await fetch(`http://localhost:3001/api/v1/fields/${id}/colture/${colturaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fase: updatedFase }),
      })
      const data = await res.json()
      if (res.ok) {
        // Sostituisce la coltura corrente con quella aggiornata
        setColture((prev) => [data.coltura, ...prev.slice(1)])
        setShowUpdateFase(false)
        setUpdatedFase('')
      } else {
        setUpdateFaseError(data.error || 'Errore durante l\'aggiornamento')
      }
    } catch {
      setUpdateFaseError('Impossibile contattare il server')
    } finally {
      setUpdatingFase(false)
    }
  }

  const handleRefreshMeteo = async () => {
    setRefreshingMeteo(true)
    setMeteoError('')
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`http://localhost:3001/api/v1/fields/${id}/meteo/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (res.ok) {
        // Ricarica l'ultima rilevazione
        const r2 = await fetch(`http://localhost:3001/api/v1/fields/${id}/meteo/latest`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const d2 = await r2.json()
        if (d2?.dato) setMeteo(d2.dato)
      } else {
        setMeteoError(data.error || 'Errore durante l\'aggiornamento')
      }
    } catch {
      setMeteoError('Impossibile contattare il server')
    } finally {
      setRefreshingMeteo(false)
    }
  }

  const handleDelete = async () => {
    const token = localStorage.getItem('token')
    setDeleting(true)
    try {
      const res = await fetch(`http://localhost:3001/api/v1/fields/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        navigate('/fields')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Errore durante l\'eliminazione')
        setConfirmOpen(false)
      }
    } catch {
      setError('Impossibile contattare il server')
      setConfirmOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-agri-beige flex items-center justify-center pt-16">
        <p className="text-gray-500">Caricamento appezzamento...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-agri-beige px-4 py-24">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
          <Link to="/fields" className="text-agri-green font-semibold hover:underline text-sm inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Torna alla lista
          </Link>
        </div>
      </div>
    )
  }

  if (!field) return null

  return (
    <div className="min-h-screen bg-agri-beige px-4 py-24">
      <div className="max-w-4xl mx-auto">
        <Link to="/fields" className="text-agri-green text-sm font-semibold hover:underline mb-4 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Tutti i campi
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <h1 className="font-poppins font-bold text-3xl break-words">{field.nome}</h1>
          <div className="flex gap-2">
            <Link
              to={`/fields/${field._id}/edit`}
              className="px-4 py-2 rounded-lg bg-agri-green text-white text-sm font-semibold hover:opacity-90 transition inline-flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" /> Modifica
            </Link>
            <button
              onClick={() => setConfirmOpen(true)}
              className="px-4 py-2 rounded-lg border-2 border-red-500 text-red-600 text-sm font-semibold hover:bg-red-50 transition inline-flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Elimina
            </button>
          </div>
        </div>

        {/* Dati anagrafici */}
        <section className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="font-poppins font-semibold text-lg mb-4 text-agri-green">Dati anagrafici</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-agri-green flex-shrink-0" />
              <span>{field.latitudine.toFixed(4)}, {field.longitudine.toFixed(4)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Maximize2 className="w-4 h-4 text-agri-green flex-shrink-0" />
              <span>{field.superficie.toLocaleString('it-IT')} m²</span>
            </div>
            {field.pendenza !== undefined && (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-agri-green flex-shrink-0" />
                <span>Pendenza {field.pendenza}%</span>
              </div>
            )}
            {field.esposizione && (
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-agri-green flex-shrink-0" />
                <span>Esposizione {field.esposizione}</span>
              </div>
            )}
            {field.coltura && (
              <div className="flex items-center gap-2">
                <Sprout className="w-4 h-4 text-agri-green flex-shrink-0" />
                <span>{field.coltura}</span>
              </div>
            )}
          </div>
        </section>

        {/* Dati meteo (US25) */}
        <section className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-poppins font-semibold text-lg flex items-center gap-2 text-agri-green">
              <Cloud className="w-5 h-5" /> Dati meteo
            </h2>
            <button
              onClick={handleRefreshMeteo}
              disabled={refreshingMeteo}
              className="px-3 py-1.5 rounded-lg border-2 border-agri-green text-agri-green text-xs font-semibold hover:bg-green-50 transition inline-flex items-center gap-1 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${refreshingMeteo ? 'animate-spin' : ''}`} />
              {refreshingMeteo ? 'Aggiornamento...' : 'Aggiorna'}
            </button>
          </div>

          {meteoError && <p className="text-red-600 text-sm mb-2">{meteoError}</p>}

          {loadingMeteo && <p className="text-sm text-gray-500">Caricamento dati meteo...</p>}

          {!loadingMeteo && !meteo && !meteoError && (
            <p className="text-sm text-gray-500">
              Nessun dato meteo disponibile. Clicca "Aggiorna" per recuperare le ultime rilevazioni.
            </p>
          )}

          {!loadingMeteo && meteo && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-orange-50 rounded-lg flex items-center gap-3">
                  <Thermometer className="w-6 h-6 text-orange-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Temperatura</p>
                    <p className="text-lg font-semibold">
                      {meteo.temperaturaC !== null ? `${meteo.temperaturaC.toFixed(1)} °C` : '—'}
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg flex items-center gap-3">
                  <Droplets className="w-6 h-6 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Umidità relativa</p>
                    <p className="text-lg font-semibold">
                      {meteo.umiditaPerc !== null ? `${meteo.umiditaPerc} %` : '—'}
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-cyan-50 rounded-lg flex items-center gap-3">
                  <CloudRain className="w-6 h-6 text-cyan-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Precipitazioni</p>
                    <p className="text-lg font-semibold">
                      {meteo.precipitazioniMm !== null ? `${meteo.precipitazioniMm.toFixed(1)} mm` : '—'}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Fonte: stazione <span className="font-medium">{meteo.stazioneNome || meteo.stazioneCode}</span> · 
                Rilevazione: {new Date(meteo.timestamp).toLocaleString('it-IT')}
              </p>
            </div>
          )}
        </section>

        {/* Placeholder: Indici di rischio */}
        <section className="bg-white rounded-2xl shadow-sm p-6 mb-4 opacity-60">
          <h2 className="font-poppins font-semibold text-lg mb-2 flex items-center gap-2 text-agri-green">
            <AlertTriangle className="w-5 h-5" /> Indici di rischio
          </h2>
          <p className="text-sm text-gray-500">Disponibili dopo US34-US37 (calcolo indici fitosanitario e climatico).</p>
        </section>

        {/* Coltura corrente (US21, US22, US23) */}
        <section className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-poppins font-semibold text-lg flex items-center gap-2 text-agri-green">
              <Sprout className="w-5 h-5" /> Coltura
            </h2>
            {!showAddColtura && (
              <button
                onClick={() => setShowAddColtura(true)}
                className="px-3 py-1.5 rounded-lg bg-agri-green text-white text-xs font-semibold hover:opacity-90 transition inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> {colture.length === 0 ? 'Aggiungi coltura' : 'Cambia coltura'}
              </button>
            )}
          </div>

          {loadingColture && <p className="text-sm text-gray-500">Caricamento...</p>}

          {!loadingColture && colture.length === 0 && !showAddColtura && (
            <p className="text-sm text-gray-500">Nessuna coltura associata a questo appezzamento.</p>
          )}

          {!loadingColture && colture.length > 0 && (
            <div className="space-y-2">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-semibold text-agri-green">Coltura corrente</p>
                <p className="text-base font-poppins">
                  {colture[0].tipologia}
                  {colture[0].varieta && <span className="text-gray-600 text-sm"> — {colture[0].varieta}</span>}
                </p>
                {colture[0].fase && (
                  <p className="text-sm text-gray-700 mt-1">
                    <span className="font-medium">Fase fenologica:</span> {ETICHETTE_FASI[colture[0].fase] || colture[0].fase}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
                  <p className="text-xs text-gray-500">
                    Aggiornata il {new Date(colture[0].dataAggiornamento).toLocaleDateString('it-IT')}
                  </p>
                  {!showUpdateFase && !showAddColtura && (
                    <button
                      onClick={() => {
                        setShowUpdateFase(true)
                        setUpdatedFase(colture[0].fase || '')
                        setUpdateFaseError('')
                      }}
                      className="text-xs text-agri-green font-semibold hover:underline"
                    >
                      Aggiorna fase fenologica
                    </button>
                  )}
                </div>

                {showUpdateFase && (
                  <div className="mt-3 p-3 bg-white rounded-lg border border-agri-green space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Nuova fase fenologica</label>
                    <select
                      value={updatedFase}
                      onChange={(e) => setUpdatedFase(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-agri-green"
                      disabled={updatingFase}
                    >
                      <option value="">— Seleziona fase —</option>
                      {(FASI_PER_TIPOLOGIA[colture[0].tipologia] || []).map((f) => (
                        <option key={f} value={f}>{ETICHETTE_FASI[f] || f}</option>
                      ))}
                    </select>

                    {updateFaseError && <p className="text-red-600 text-sm">{updateFaseError}</p>}

                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => { setShowUpdateFase(false); setUpdateFaseError('') }}
                        disabled={updatingFase}
                        className="px-3 py-1.5 rounded-lg border-2 border-gray-300 text-gray-600 text-sm font-semibold hover:bg-gray-100 transition"
                      >
                        Annulla
                      </button>
                      <button
                        onClick={handleUpdateFase}
                        disabled={updatingFase}
                        className="px-3 py-1.5 rounded-lg bg-agri-green text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                      >
                        {updatingFase ? 'Aggiornamento...' : 'Conferma'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {colture.length > 1 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-600 hover:text-agri-green">
                    Storico colture ({colture.length - 1})
                  </summary>
                  <ul className="mt-2 space-y-1 pl-4">
                    {colture.slice(1).map((c) => (
                      <li key={c._id} className="text-xs text-gray-600">
                        {c.tipologia}
                        {c.varieta && ` (${c.varieta})`}
                        {c.fase && ` · ${ETICHETTE_FASI[c.fase] || c.fase}`}
                        {' — '}
                        {new Date(c.dataAggiornamento).toLocaleDateString('it-IT')}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}

          {showAddColtura && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
              <label className="block text-sm font-medium text-gray-700">Tipologia coltura</label>
              <select
                value={newTipologia}
                onChange={(e) => setNewTipologia(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-agri-green"
                disabled={savingColtura}
              >
                <option value="Vite">Vite</option>
              </select>
              <p className="text-xs text-gray-500">Altre tipologie (Melo, Piccoli Frutti) saranno disponibili negli sprint futuri.</p>

              <label className="block text-sm font-medium text-gray-700 mt-3">Varietà (opzionale)</label>
              <select
                value={newVarieta}
                onChange={(e) => setNewVarieta(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-agri-green"
                disabled={savingColtura}
              >
                <option value="">— Nessuna varietà specifica —</option>
                {(VARIETA_PER_TIPOLOGIA[newTipologia] || []).map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500">Le varietà disponibili dipendono dalla tipologia scelta.</p>

              <label className="block text-sm font-medium text-gray-700 mt-3">Fase fenologica (opzionale)</label>
              <select
                value={newFase}
                onChange={(e) => setNewFase(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-agri-green"
                disabled={savingColtura}
              >
                <option value="">— Fase non specificata —</option>
                {(FASI_PER_TIPOLOGIA[newTipologia] || []).map((f) => (
                  <option key={f} value={f}>{ETICHETTE_FASI[f] || f}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500">La fase fenologica viene usata per il calcolo degli indici di rischio (in arrivo nelle prossime US).</p>

              {colturaError && <p className="text-red-600 text-sm">{colturaError}</p>}

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowAddColtura(false); setColturaError('') }}
                  disabled={savingColtura}
                  className="px-3 py-1.5 rounded-lg border-2 border-gray-300 text-gray-600 text-sm font-semibold hover:bg-gray-100 transition inline-flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Annulla
                </button>
                <button
                  onClick={handleAddColtura}
                  disabled={savingColtura}
                  className="px-3 py-1.5 rounded-lg bg-agri-green text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  {savingColtura ? 'Salvataggio...' : 'Conferma'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Placeholder: Storico interventi */}
        <section className="bg-white rounded-2xl shadow-sm p-6 opacity-60">
          <h2 className="font-poppins font-semibold text-lg mb-2 flex items-center gap-2 text-agri-green">
            <ClipboardList className="w-5 h-5" /> Storico interventi
          </h2>
          <p className="text-sm text-gray-500">Disponibili dopo US42-US47 (registro interventi).</p>
        </section>

        <ConfirmDialog
          open={confirmOpen}
          title="Eliminare questo appezzamento?"
          message={`Stai per eliminare "${field.nome}" in modo definitivo.\n\nVerranno persi anche tutti i dati associati (storico colture, indici, interventi futuri). Questa azione non può essere annullata.`}
          confirmLabel={deleting ? 'Eliminazione...' : 'Sì, elimina'}
          cancelLabel="Annulla"
          destructive
          onConfirm={handleDelete}
          onCancel={() => !deleting && setConfirmOpen(false)}
        />
      </div>
    </div>
  )
}