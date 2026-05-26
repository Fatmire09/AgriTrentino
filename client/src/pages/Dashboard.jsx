import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { BarChart3, ClipboardList } from 'lucide-react'
import Navbar from '../components/Navbar'

export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    fetch('http://localhost:3001/api/v1/dashboard/sostenibilita', {
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
      .then((d) => { if (d) setData(d) })
      .finally(() => setLoading(false))
  }, [navigate])

  return (
    <div className="min-h-screen bg-agri-beige">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-24">
        <h1 className="font-poppins font-bold text-3xl mb-6 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-agri-green" /> Dashboard sostenibilità
        </h1>

        {loading && <p className="text-gray-500">Caricamento...</p>}

        {!loading && data && !data.haInterventi && (
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
            <ClipboardList className="w-12 h-12 text-agri-green mx-auto mb-4" />
            <h2 className="font-poppins font-semibold text-xl mb-2">Nessun dato ancora</h2>
            <p className="text-gray-600 mb-6 max-w-lg mx-auto">
              Non hai ancora registrato interventi. Registra trattamenti e irrigazioni sui tuoi campi
              per vedere qui gli indicatori di sostenibilità (interventi giustificati, risparmio idrico e chimico).
            </p>
            <Link
              to="/fields"
              className="inline-block px-5 py-2.5 rounded-lg bg-agri-green text-white text-sm font-semibold hover:opacity-90 transition"
            >
              Vai ai tuoi campi
            </Link>
          </div>
        )}

        {!loading && data && data.haInterventi && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <p className="text-gray-700">
              Hai <span className="font-semibold">{data.interventiTotali}</span> interventi registrati.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Gli indicatori di sostenibilità (% interventi giustificati, risparmio idrico/chimico, trend) saranno disponibili nelle prossime US.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}