import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Leaf, User, Mail, Building2, Calendar } from 'lucide-react'

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    fetch('http://localhost:3001/api/v1/auth/me', {
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
        if (data?.user) setUser(data.user)
        else if (data?.error) setError(data.error)
      })
      .catch(() => setError('Impossibile contattare il server. Riprova più tardi.'))
      .finally(() => setLoading(false))
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-agri-beige flex items-center justify-center px-4 pt-16">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-agri-beige flex items-center justify-center px-4 pt-16">
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    )
  }

  if (!user) return null

  const formatDate = (iso) => new Date(iso).toLocaleDateString('it-IT', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div className="min-h-screen bg-agri-beige px-4 py-24">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-md p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-agri-green flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-poppins text-xl font-bold text-agri-green">AgriTrentino</span>
        </div>

        <h1 className="font-poppins font-bold text-2xl mb-2">Il tuo profilo</h1>
        <p className="text-gray-500 text-sm mb-8">Dati personali e aziendali registrati sulla piattaforma.</p>

        <div className="flex flex-col gap-4">
          <Row icon={<User className="w-5 h-5" />} label="Nome" value={user.nome} />
          <Row icon={<Mail className="w-5 h-5" />} label="Email" value={user.email} />
          <Row icon={<Building2 className="w-5 h-5" />} label="Nome azienda" value={user.nomeAzienda || '—'} />
          <Row icon={<Calendar className="w-5 h-5" />} label="Registrato il" value={formatDate(user.createdAt)} />
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
          <Link to="/" className="text-agri-green font-semibold hover:underline text-sm">
            ← Torna alla home
          </Link>
          <Link to="/profile/edit" className="px-4 py-2 rounded-lg bg-agri-green text-white text-sm font-semibold hover:opacity-90 transition">
            Modifica dati
          </Link>
        </div>
      </div>
    </div>
  )
}

function Row({ icon, label, value }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-b-0">
      <div className="w-9 h-9 rounded-lg bg-agri-beige flex items-center justify-center text-agri-green flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{label}</p>
        <p className="text-base text-gray-900 mt-1 break-words">{value}</p>
      </div>
    </div>
  )
}