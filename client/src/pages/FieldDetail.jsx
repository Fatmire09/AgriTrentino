import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Maximize2, TrendingUp, Sprout, Compass, Cloud, AlertTriangle, ClipboardList, Pencil, Trash2, Plus, X, RefreshCw, Thermometer, Droplets, CloudRain, Clock, Droplet } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'
import SemaforoRischio from '../components/SemaforoRischio'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

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

// US35: etichette user-friendly per le minacce climatiche
const ETICHETTE_MINACCIA = {
  gelate: 'Gelate',
  stress_termico: 'Stress termico',
  eccesso_umidita: 'Eccesso di umidità',
  nessuna: 'Nessuna minaccia',
}

// US26: trasforma un timestamp in stringa relativa ("3 min fa", "2 ore fa", ecc.)
function formatTempoTrascorso(timestamp) {
  const minuti = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000)
  if (minuti < 1) return 'meno di un minuto fa'
  if (minuti === 1) return '1 minuto fa'
  if (minuti < 60) return `${minuti} minuti fa`
  const ore = Math.floor(minuti / 60)
  if (ore === 1) return '1 ora fa'
  if (ore < 24) return `${ore} ore fa`
  const giorni = Math.floor(ore / 24)
  if (giorni === 1) return '1 giorno fa'
  return `${giorni} giorni fa`
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
  const [sintesiOggi, setSintesiOggi] = useState(null)
  const [scheduler, setScheduler] = useState(null)
  const [cacheInfo, setCacheInfo] = useState(null)
  const [statoMeteo, setStatoMeteo] = useState(null)
  const [storicoMeteo, setStoricoMeteo] = useState([])
  const [bilancio, setBilancio] = useState(null)
  const [storicoIndici, setStoricoIndici] = useState([])
  const [loadingBilancio, setLoadingBilancio] = useState(true)
  const [fenologia, setFenologia] = useState(null)
  const [fitosanitario, setFitosanitario] = useState(null)
  const [showFitoDetail, setShowFitoDetail] = useState(false)
  const [climatico, setClimatico] = useState(null)
  const [showClimaDetail, setShowClimaDetail] = useState(false)

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
    // Carica in parallelo ultima rilevazione + sintesi giornaliera (US26)
    Promise.all([
      fetch(`http://localhost:3001/api/v1/fields/${id}/meteo/latest`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.ok ? res.json() : null),
      fetch(`http://localhost:3001/api/v1/fields/${id}/meteo/oggi`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.ok ? res.json() : null),
    ])
      .then(([latestData, oggiData]) => {
        if (latestData?.dato) setMeteo(latestData.dato)
        if (latestData?.cacheInfo) setCacheInfo(latestData.cacheInfo)
        if (latestData?.statoMeteo) setStatoMeteo(latestData.statoMeteo)
        if (oggiData?.sintesi) setSintesiOggi(oggiData.sintesi)
      })
      .finally(() => setLoadingMeteo(false))
  }, [id])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch(`http://localhost:3001/api/v1/fields/${id}/meteo/storico?periodoOre=48`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.dati) {
          // Inverto l'ordine: dal più vecchio al più recente (per il grafico)
          // E preparo un formato compatibile con Recharts
          const datiGrafico = [...data.dati].reverse().map((d) => ({
            ora: new Date(d.timestamp).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
            temperatura: d.temperaturaC,
            umidita: d.umiditaPerc,
            pioggia: d.precipitazioniMm,
          }))
          setStoricoMeteo(datiGrafico)
        }
      })
  }, [id])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch(`http://localhost:3001/api/v1/fields/${id}/bilancio-idrico?giorni=7`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.corrente) setBilancio(data.corrente)
      })
      .finally(() => setLoadingBilancio(false))
  }, [id])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch(`http://localhost:3001/api/v1/fields/${id}/indici/storico?giorni=365`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.storico) {
          // Trasforma per Recharts: unisci fito + clima per stessa data
          const perData = {}
          for (const r of data.storico) {
            const giorno = new Date(r.data).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' })
            if (!perData[giorno]) perData[giorno] = { data: giorno }
            if (r.tipoRischio === 'fitosanitario') perData[giorno].fitosanitario = r.valore
            if (r.tipoRischio === 'climatico') perData[giorno].climatico = r.valore
          }
          setStoricoIndici(Object.values(perData))
        }
      })
  }, [id])

  // US32: stato fenologico calcolato (GDD accumulati + soglia prossima)
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch(`http://localhost:3001/api/v1/fields/${id}/fenologia`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.fenologia) setFenologia(data.fenologia)
      })
  }, [id])

  // US33: indice di rischio fitosanitario (peronospora) calcolato on-demand
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch(`http://localhost:3001/api/v1/fields/${id}/indici/fitosanitario`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.fitosanitario) setFitosanitario(data.fitosanitario)
      })
  }, [id])

  // US35: indice di rischio climatico (gelate / stress termico / eccesso umidità)
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch(`http://localhost:3001/api/v1/fields/${id}/indici/climatico`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.climatico) setClimatico(data.climatico)
      })
  }, [id])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch('http://localhost:3001/api/v1/meteo/scheduler/status', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.scheduler) setScheduler(data.scheduler)
      })
  }, [])

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
        setNewVarieta('')
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
        const r2 = await fetch(`http://localhost:3001/api/v1/fields/${id}/meteo/latest`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const d2 = await r2.json()
        if (d2?.dato) setMeteo(d2.dato)
        if (d2?.cacheInfo) setCacheInfo(d2.cacheInfo)
        if (d2?.statoMeteo) setStatoMeteo(d2.statoMeteo)
        // Ricarica anche la sintesi giornaliera (US26)
        const r3 = await fetch(`http://localhost:3001/api/v1/fields/${id}/meteo/oggi`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const d3 = await r3.json()
        if (d3?.sintesi) setSintesiOggi(d3.sintesi)
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

        {/* Dati meteo (US25 + US26) */}
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

          {cacheInfo && cacheInfo.ultimoTentativoRiuscito === false && cacheInfo.etaDatoMinuti > 120 && meteo && (
            <div className="mb-3 flex items-start gap-2 px-3 py-2 bg-yellow-50 border border-yellow-300 rounded-lg text-sm">
              <AlertTriangle className="w-4 h-4 text-yellow-700 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-yellow-900">
                <p className="font-semibold">Servizio meteo non raggiungibile</p>
                <p className="text-xs mt-0.5">
                  Stai vedendo l'ultima rilevazione salvata in cache, del {new Date(meteo.timestamp).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.
                  {cacheInfo.ultimoTentativoSync && (
                    <> Ultimo tentativo di sincronizzazione: {formatTempoTrascorso(cacheInfo.ultimoTentativoSync)}.</>
                  )}
                </p>
              </div>
            </div>
          )}

          {!loadingMeteo && !meteo && !meteoError && statoMeteo === 'offline_senza_cache' && (
            <div className="flex items-start gap-2 px-3 py-3 bg-red-50 border border-red-300 rounded-lg text-sm">
              <AlertTriangle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-red-900">
                <p className="font-semibold">Servizio meteo non disponibile e nessun dato pregresso</p>
                <p className="text-xs mt-1">
                  Il servizio MeteoTrentino non è raggiungibile e non sono presenti dati meteo in cache per questo appezzamento. Gli indici di rischio non possono essere calcolati. Riprova più tardi cliccando "Aggiorna".
                </p>
              </div>
            </div>
          )}

          {!loadingMeteo && !meteo && !meteoError && statoMeteo === 'mai_sincronizzato' && (
            <p className="text-sm text-gray-500">
              Sincronizzazione meteo in corso... I dati saranno disponibili a breve. Se non vedi nulla dopo qualche minuto, clicca "Aggiorna".
            </p>
          )}

          {!loadingMeteo && !meteo && !meteoError && !statoMeteo && (
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
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <p className="text-gray-500">
                  Fonte: stazione <span className="font-medium">{meteo.stazioneNome || meteo.stazioneCode}</span>
                </p>
                <p className={`font-medium ${
                  (Date.now() - new Date(meteo.timestamp).getTime()) / 60000 > 60
                    ? 'text-red-600'
                    : 'text-gray-500'
                }`}>
                  Aggiornato {formatTempoTrascorso(meteo.timestamp)}
                </p>
              </div>

              {scheduler?.attivo && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs">
                  <Clock className="w-4 h-4 text-agri-green flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-agri-green font-semibold">Aggiornamento automatico attivo</p>
                    <p className="text-gray-600">
                      {scheduler.descrizione}
                      {scheduler.ultimaEsecuzione && (
                        <> · ultimo: {formatTempoTrascorso(scheduler.ultimaEsecuzione)}</>
                      )}
                      {scheduler.prossimaEsecuzione && (
                        <> · prossimo: {new Date(scheduler.prossimaEsecuzione).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {sintesiOggi && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-agri-green mb-2">Oggi al tuo campo</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Temp. min</p>
                      <p className="font-medium">{sintesiOggi.temperaturaMinC !== null ? `${sintesiOggi.temperaturaMinC} °C` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Temp. max</p>
                      <p className="font-medium">{sintesiOggi.temperaturaMaxC !== null ? `${sintesiOggi.temperaturaMaxC} °C` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Umidità media</p>
                      <p className="font-medium">{sintesiOggi.umiditaMediaPerc !== null ? `${sintesiOggi.umiditaMediaPerc} %` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Pioggia totale</p>
                      <p className="font-medium">{sintesiOggi.precipitazioniTotaliMm !== null ? `${sintesiOggi.precipitazioniTotaliMm} mm` : '—'}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Basato su {sintesiOggi.numeroRilevazioni} rilevazioni dalle 00:00</p>
                </div>
              )}

              {storicoMeteo.length > 1 && (
                <div className="mt-4 space-y-4">
                  <p className="text-sm font-semibold text-agri-green">Andamento ultime 48 ore</p>

                  {/* Grafico temperatura */}
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Temperatura (°C)</p>
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={storicoMeteo} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="ora" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10 }} unit="°C" />
                        <Tooltip />
                        <Line type="monotone" dataKey="temperatura" stroke="#ea580c" strokeWidth={2} dot={false} name="Temperatura" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Grafico umidità */}
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Umidità relativa (%)</p>
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={storicoMeteo} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="ora" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
                        <Tooltip />
                        <Line type="monotone" dataKey="umidita" stroke="#2563eb" strokeWidth={2} dot={false} name="Umidità" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Grafico precipitazioni (barre) */}
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Precipitazioni (mm)</p>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={storicoMeteo} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="ora" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10 }} unit="mm" />
                        <Tooltip />
                        <Bar dataKey="pioggia" fill="#06b6d4" name="Pioggia" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Bilancio idrico (US31) */}
        <section className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="font-poppins font-semibold text-lg mb-4 flex items-center gap-2 text-agri-green">
            <Droplet className="w-5 h-5" /> Bilancio idrico del suolo
          </h2>

          {loadingBilancio && <p className="text-sm text-gray-500">Caricamento...</p>}

          {!loadingBilancio && !bilancio && (
            <p className="text-sm text-gray-500">
              Bilancio idrico non ancora disponibile. Richiede una coltura con fase fenologica impostata
              e almeno 24 ore di dati meteo. Sarà calcolato automaticamente alle 00:30.
            </p>
          )}

          {!loadingBilancio && bilancio && (
            <div className="space-y-3">
              {/* Barra umidità suolo */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">Umidità del suolo stimata</span>
                  <span className="text-lg font-bold" style={{
                    color: bilancio.umiditaSuoloPerc < 30 ? '#dc2626' : bilancio.umiditaSuoloPerc < 60 ? '#ca8a04' : '#16a34a'
                  }}>
                    {bilancio.umiditaSuoloPerc}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${bilancio.umiditaSuoloPerc}%`,
                      backgroundColor: bilancio.umiditaSuoloPerc < 30 ? '#dc2626' : bilancio.umiditaSuoloPerc < 60 ? '#ca8a04' : '#16a34a',
                    }}
                  />
                </div>
              </div>

              {/* Indicatore consigli */}
              <div className={`p-3 rounded-lg text-sm ${
                bilancio.umiditaSuoloPerc < 30
                  ? 'bg-red-50 text-red-900'
                  : bilancio.umiditaSuoloPerc < 60
                  ? 'bg-yellow-50 text-yellow-900'
                  : 'bg-green-50 text-green-900'
              }`}>
                {bilancio.umiditaSuoloPerc < 30 && (
                  <>⚠️ Suolo asciutto: irrigazione consigliata.</>
                )}
                {bilancio.umiditaSuoloPerc >= 30 && bilancio.umiditaSuoloPerc < 60 && (
                  <>Suolo moderatamente umido: monitorare nei prossimi giorni.</>
                )}
                {bilancio.umiditaSuoloPerc >= 60 && (
                  <>✅ Suolo ben idratato: nessuna irrigazione necessaria.</>
                )}
              </div>

              {/* Dettagli numerici */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm pt-2 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-500">Riserva idrica</p>
                  <p className="font-medium">{bilancio.riservaIdricaMm.toFixed(0)} mm</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Pioggia giorno</p>
                  <p className="font-medium">{bilancio.precipitazioniMm.toFixed(1)} mm</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Evapotraspirazione</p>
                  <p className="font-medium">{bilancio.evapotraspirazioneMm.toFixed(1)} mm</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Bilancio giorno</p>
                  <p className={`font-medium ${bilancio.bilancio < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {bilancio.bilancio > 0 ? '+' : ''}{bilancio.bilancio.toFixed(1)} mm
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-400 pt-1">
                Calcolato il {new Date(bilancio.data).toLocaleDateString('it-IT')} con modello Hargreaves-Samani · Capacità di campo: 150 mm
              </p>
            </div>
          )}
        </section>

        {/* Indici di rischio — fitosanitario US33 (climatico in US35, semaforo completo in US34) */}
        <section className="bg-white rounded-2xl shadow-sm p-6 mb-4">
          <h2 className="font-poppins font-semibold text-lg mb-4 flex items-center gap-2 text-agri-green">
            <AlertTriangle className="w-5 h-5" /> Indici di rischio
          </h2>

          {!fitosanitario && !climatico && (
            <p className="text-sm text-gray-500">
              Indici di rischio non disponibili. Richiedono dati meteo recenti e, per il fitosanitario, una coltura con fase fenologica impostata.
            </p>
          )}

          {fitosanitario && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700">Rischio peronospora</span>
                <SemaforoRischio
                  livello={fitosanitario.livello}
                  tooltip="Peronospora: rischio di infezione fungina stimato da umidità e temperatura delle ultime 48h, pesato per la fase fenologica."
                  onClick={() => setShowFitoDetail((v) => !v)}
                />
              </div>

              {fitosanitario.raccomandazione && (
                <div
                  className="p-3 rounded-lg text-sm"
                  style={{
                    backgroundColor:
                      fitosanitario.livello === 'alto' ? '#fef2f2'
                        : fitosanitario.livello === 'medio' ? '#fefce8'
                        : '#f0fdf4',
                    color:
                      fitosanitario.livello === 'alto' ? '#7f1d1d'
                        : fitosanitario.livello === 'medio' ? '#713f12'
                        : '#14532d',
                  }}
                >
                  {fitosanitario.raccomandazione}
                </div>
              )}

              {showFitoDetail && (
                <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-700 space-y-2">
                  <p className="text-sm font-semibold text-agri-green">Dettaglio modello biologico</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div>
                      <p className="text-gray-500">Patologia</p>
                      <p className="font-medium capitalize">{fitosanitario.patologia}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Punteggio</p>
                      <p className="font-medium">{fitosanitario.punteggio}/100</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Fase</p>
                      <p className="font-medium">{fitosanitario.faseCorrente} (susc. {fitosanitario.suscettibilitaFase})</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Ore favorevoli</p>
                      <p className="font-medium">{fitosanitario.oreFavorevoli}/{fitosanitario.oreAnalizzate}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Condizione</p>
                      <p className="font-medium">UR &gt; {fitosanitario.soglie.urPerc}% · {fitosanitario.soglie.tempMinC}–{fitosanitario.soglie.tempMaxC} °C</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Finestra</p>
                      <p className="font-medium">{fitosanitario.finestraOre}h</p>
                    </div>
                  </div>
                  {fitosanitario.ultimoCalcolo && (
                    <p className="text-gray-400">Calcolato il {new Date(fitosanitario.ultimoCalcolo).toLocaleString('it-IT')}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {climatico && (
            <div className="space-y-3 pt-4 mt-4 border-t border-gray-100">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700">
                  Rischio climatico
                  {climatico.minaccia !== 'nessuna' && (
                    <span className="text-gray-500"> · {ETICHETTE_MINACCIA[climatico.minaccia] || climatico.minaccia}</span>
                  )}
                </span>
                <SemaforoRischio
                  livello={climatico.livello}
                  tooltip={climatico.descrizione}
                  onClick={() => setShowClimaDetail((v) => !v)}
                />
              </div>

              {showClimaDetail && (
                <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-700 space-y-2">
                  <p className="text-sm font-semibold text-agri-green">Dettaglio minacce climatiche</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <p className="text-gray-500">Gelate</p>
                      <p className="font-medium capitalize">
                        {climatico.dettaglio.gelate.livello} · Tmin {climatico.dettaglio.gelate.tMinC ?? '—'} °C
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Stress termico</p>
                      <p className="font-medium capitalize">
                        {climatico.dettaglio.stressTermico.livello} · Tmax {climatico.dettaglio.stressTermico.tMaxC ?? '—'} °C
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Eccesso umidità</p>
                      <p className="font-medium capitalize">
                        {climatico.dettaglio.eccessoUmidita.livello} · {climatico.dettaglio.eccessoUmidita.percOreUmide}% ore UR&gt;90%
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-400">
                    Esposizione {climatico.esposizione || 'n/d'} · fase {climatico.faseCorrente || 'n/d'} · finestra {climatico.finestraOre}h
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Coltura corrente (US21, US22, US23, US24) */}
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
                {fenologia && colture[0].fase && (
                  <div className="mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Sprout className="w-3.5 h-3.5 text-agri-green flex-shrink-0" />
                      <span
                        className="text-agri-green font-semibold cursor-help"
                        title={`GDD accumulati nella fase: ${fenologia.gddAccumulati} / ${fenologia.sogliaGddProssima} (Tbase ${fenologia.tBaseC}°C)\nProssima fase: ${ETICHETTE_FASI[fenologia.fasePossibileSuccessiva] || fenologia.fasePossibileSuccessiva}\nUltimo calcolo: ${new Date(fenologia.ultimoCalcolo).toLocaleString('it-IT')}`}
                      >
                        Fase aggiornata automaticamente il {new Date(colture[0].dataAggiornamento).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-agri-green rounded-full transition-all"
                        style={{ width: `${fenologia.percentualeProgresso}%` }}
                      />
                    </div>
                    <p className="text-gray-600 mt-1">
                      {fenologia.gddAccumulati} / {fenologia.sogliaGddProssima} GDD verso{' '}
                      <span className="font-medium">{ETICHETTE_FASI[fenologia.fasePossibileSuccessiva] || fenologia.fasePossibileSuccessiva}</span>{' '}
                      ({fenologia.percentualeProgresso}%)
                    </p>
                  </div>
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

        {/* Storico indici 12 mesi (US40) */}
        {storicoIndici.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm p-6 mb-4">
            <h2 className="font-poppins font-semibold text-lg mb-4 flex items-center gap-2 text-agri-green">
              <TrendingUp className="w-5 h-5" /> Storico indici di rischio (12 mesi)
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={storicoIndici} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="data" tick={{ fontSize: 9 }} interval={29} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="fitosanitario" stroke="#dc2626" strokeWidth={1.5} dot={false} name="Fitosanitario" />
                <Line type="monotone" dataKey="climatico" stroke="#2563eb" strokeWidth={1.5} dot={false} name="Climatico" />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2">
              Andamento giornaliero dei punteggi di rischio (0-100) nelle ultime 52 settimane.
              Soglie: <span className="text-green-600">basso &lt; 33</span> · <span className="text-yellow-600">medio 33-65</span> · <span className="text-red-600">alto ≥ 66</span>
            </p>
          </section>
        )}

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
