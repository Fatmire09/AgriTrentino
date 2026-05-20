import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Maximize2, TrendingUp, Sprout, Compass, Cloud, AlertTriangle, ClipboardList } from 'lucide-react'

export default function FieldDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [field, setField] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

        <h1 className="font-poppins font-bold text-3xl mb-6 break-words">{field.nome}</h1>

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

        {/* Placeholder: Meteo */}
        <section className="bg-white rounded-2xl shadow-sm p-6 mb-4 opacity-60">
          <h2 className="font-poppins font-semibold text-lg mb-2 flex items-center gap-2 text-agri-green">
            <Cloud className="w-5 h-5" /> Dati meteo
          </h2>
          <p className="text-sm text-gray-500">Disponibili dopo l'implementazione del modulo meteo (US26-US31).</p>
        </section>

        {/* Placeholder: Indici di rischio */}
        <section className="bg-white rounded-2xl shadow-sm p-6 mb-4 opacity-60">
          <h2 className="font-poppins font-semibold text-lg mb-2 flex items-center gap-2 text-agri-green">
            <AlertTriangle className="w-5 h-5" /> Indici di rischio
          </h2>
          <p className="text-sm text-gray-500">Disponibili dopo US34-US37 (calcolo indici fitosanitario e climatico).</p>
        </section>

        {/* Placeholder: Storico interventi */}
        <section className="bg-white rounded-2xl shadow-sm p-6 opacity-60">
          <h2 className="font-poppins font-semibold text-lg mb-2 flex items-center gap-2 text-agri-green">
            <ClipboardList className="w-5 h-5" /> Storico interventi
          </h2>
          <p className="text-sm text-gray-500">Disponibili dopo US42-US47 (registro interventi).</p>
        </section>
      </div>
    </div>
  )
}