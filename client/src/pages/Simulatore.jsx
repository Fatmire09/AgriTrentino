import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FlaskConical, Thermometer, Droplet, CloudRain } from 'lucide-react'
import Navbar from '../components/Navbar'

export default function Simulatore() {
  const navigate = useNavigate()
  const [campi, setCampi] = useState([])
  const [campoId, setCampoId] = useState('')
  const [loadingCampi, setLoadingCampi] = useState(true)
  const [loadingStato, setLoadingStato] = useState(false)
  const [stato, setStato] = useState(null)
  const [params, setParams] = useState({ tMin: '', tMax: '', urMedia: '', precipitazioni: '' })
  const [error, setError] = useState('')

  // Carica i campi dell'utente
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    fetch('http://localhost:3001/api/v1/fields', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login')
          return null
        }
        return res.ok ? res.json() : null
      })
      .then((d) => {
        if (d?.fields) {
          setCampi(d.fields)
          if (d.fields.length > 0) setCampoId(d.fields[0]._id)
        }
      })
      .finally(() => setLoadingCampi(false))
  }, [navigate])

  // Stato iniziale del campo selezionato
  useEffect(() => {
    if (!campoId) {
      setStato(null)
      return
    }
    const token = localStorage.getItem('token')
    setLoadingStato(true)
    setError('')
    fetch(`http://localhost:3001/api/v1/fields/${campoId}/simulatore/stato-iniziale`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 403) { setError('Non sei autorizzato a usare il simulatore per questo appezzamento.'); return null }
        if (res.status === 404) { setError('Appezzamento non trovato.'); return null }
        return res.ok ? res.json() : null
      })
      .then((data) => {
        if (!data) return
        setStato(data)
        setParams({
          tMin: data.meteoReale?.tMin ?? '',
          tMax: data.meteoReale?.tMax ?? '',
          urMedia: data.meteoReale?.urMedia ?? '',
          precipitazioni: data.meteoReale?.precipitazioni ?? '',
        })
      })
      .catch(() => setError('Impossibile contattare il server.'))
      .finally(() => setLoadingStato(false))
  }, [campoId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setParams((p) => ({ ...p, [name]: value }))
  }

  return (
    <div className="min-h-screen bg-agri-beige">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-24">
        <h1 className="font-poppins font-bold text-3xl mb-6 flex items-center gap-2">
          <FlaskConical className="w-7 h-7 text-agri-green" /> Simulatore meteo
        </h1>

        {loadingCampi && <p className="text-gray-500">Caricamento...</p>}

        {!loadingCampi && campi.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <FlaskConical className="w-12 h-12 text-agri-green mx-auto mb-4" />
            <h2 className="font-poppins font-semibold text-xl mb-2">Nessun campo disponibile</h2>
            <p className="text-gray-600 mb-6 max-w-lg mx-auto">
              Aggiungi un appezzamento per costruire scenari ipotetici e valutare interventi futuri.
            </p>
            <Link to="/fields" className="inline-block px-5 py-2.5 rounded-lg bg-agri-green text-white text-sm font-semibold hover:opacity-90 transition">
              Vai ai tuoi campi
            </Link>
          </div>
        )}

        {!loadingCampi && campi.length > 0 && (
          <>
            <div className="mb-4 flex items-center gap-2">
              <label className="text-sm text-gray-600">Campo:</label>
              <select
                value={campoId}
                onChange={(e) => setCampoId(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                {campi.map((f) => (
                  <option key={f._id} value={f._id}>{f.nome}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">{error}</div>
            )}

            {loadingStato && <p className="text-gray-500">Caricamento stato del campo...</p>}

            {!loadingStato && stato && (
              <>
                {stato.fase && (
                  <p className="text-gray-600 mb-4">Fase fenologica: <span className="font-semibold">{stato.fase}</span></p>
                )}

                <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
                  <h2 className="font-poppins font-semibold text-lg mb-4 text-agri-green">Stato reale del campo (ultime 24h)</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">T min</p>
                      <p className="font-bold text-lg">{stato.meteoReale?.tMin ?? 'n/d'} °C</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">T max</p>
                      <p className="font-bold text-lg">{stato.meteoReale?.tMax ?? 'n/d'} °C</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">UR media</p>
                      <p className="font-bold text-lg">{stato.meteoReale?.urMedia ?? 'n/d'} %</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Precipitazioni</p>
                      <p className="font-bold text-lg">{stato.meteoReale?.precipitazioni ?? 'n/d'} mm</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
                  <h2 className="font-poppins font-semibold text-lg mb-2 text-agri-green">Parametri simulati</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Modifica i valori per costruire uno scenario ipotetico. Il ricalcolo degli indici in tempo reale sarà disponibile in US56.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm text-gray-700 flex items-center gap-1">
                        <Thermometer className="w-4 h-4 text-blue-500" /> Temperatura min (°C)
                      </span>
                      <input type="number" step="0.1" name="tMin" value={params.tMin} onChange={handleChange}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </label>
                    <label className="block">
                      <span className="text-sm text-gray-700 flex items-center gap-1">
                        <Thermometer className="w-4 h-4 text-red-500" /> Temperatura max (°C)
                      </span>
                      <input type="number" step="0.1" name="tMax" value={params.tMax} onChange={handleChange}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </label>
                    <label className="block">
                      <span className="text-sm text-gray-700 flex items-center gap-1">
                        <Droplet className="w-4 h-4 text-blue-500" /> Umidità relativa media (%)
                      </span>
                      <input type="number" step="1" min="0" max="100" name="urMedia" value={params.urMedia} onChange={handleChange}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </label>
                    <label className="block">
                      <span className="text-sm text-gray-700 flex items-center gap-1">
                        <CloudRain className="w-4 h-4 text-blue-500" /> Precipitazioni (mm)
                      </span>
                      <input type="number" step="0.1" min="0" name="precipitazioni" value={params.precipitazioni} onChange={handleChange}
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </label>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}