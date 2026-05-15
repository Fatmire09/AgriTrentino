
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Leaf, MapPin, Maximize2, TrendingUp, Sprout } from 'lucide-react'

export default function FieldsList() {
  const navigate = useNavigate()
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
        return res.json()
      })
      .then((data) => {
        if (data?.fields) setFields(data.fields)
        else if (data?.error) setError(data.error)
      })
      .catch(() => setError('Impossibile contattare il server. Riprova più tardi.'))
      .finally(() => setLoading(false))
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-agri-beige flex items-center justify-center pt-16">
        <p className="text-gray-500">Caricamento appezzamenti...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-agri-beige px-4 py-24">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-agri-green flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-poppins text-xl font-bold text-agri-green">AgriTrentino</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-poppins font-bold text-2xl">I miei campi</h1>
            <p className="text-gray-500 text-sm mt-1">
              {fields.length === 0 ? 'Nessun appezzamento registrato.' : `${fields.length} appezzament${fields.length === 1 ? 'o' : 'i'}`}
            </p>
          </div>
          <Link to="/fields/new" className="px-4 py-2 rounded-lg bg-agri-green text-white text-sm font-semibold hover:opacity-90 transition">
            + Aggiungi appezzamento
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {fields.length === 0 && !error && (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <Sprout className="w-12 h-12 text-agri-green mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Non hai ancora registrato nessun appezzamento.</p>
            <Link to="/fields/new" className="inline-block px-4 py-2 rounded-lg bg-agri-green text-white text-sm font-semibold hover:opacity-90 transition">
              Aggiungi il tuo primo campo
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map((field) => (
            <Link
              key={field._id}
              to={`/fields/${field._id}`}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition p-6 flex flex-col gap-3"
              style={{ borderTop: '4px solid #2D6A2D' }}
            >
              <h3 className="font-poppins font-semibold text-lg break-words">{field.nome}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-agri-green flex-shrink-0" />
                <span>{field.latitudine.toFixed(4)}, {field.longitudine.toFixed(4)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Maximize2 className="w-4 h-4 text-agri-green flex-shrink-0" />
                <span>{field.superficie.toLocaleString('it-IT')} m²</span>
              </div>
              {field.pendenza !== undefined && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <TrendingUp className="w-4 h-4 text-agri-green flex-shrink-0" />
                  <span>Pendenza {field.pendenza}%</span>
                </div>
              )}
              {field.coltura && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Sprout className="w-4 h-4 text-agri-green flex-shrink-0" />
                  <span>{field.coltura}</span>
                </div>
              )}
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <Link to="/" className="text-agri-green font-semibold hover:underline text-sm">
            ← Torna alla home
          </Link>
        </div>
      </div>
    </div>
  )
}
