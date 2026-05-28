import { useState, useEffect } from 'react'
import { API_URL } from '../config'
import { Link, useNavigate } from 'react-router-dom'
import { Leaf } from 'lucide-react'

export default function EditProfile() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nome: '', email: '', nomeAzienda: '' })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    fetch(`${API_URL}/auth/me`, {
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
        if (data?.user) {
          setForm({
            nome: data.user.nome || '',
            email: data.user.email || '',
            nomeAzienda: data.user.nomeAzienda || '',
          })
        }
      })
      .catch(() => setServerError('Impossibile contattare il server'))
      .finally(() => setLoading(false))
  }, [navigate])

  const validateField = (name, value) => {
    if (name === 'nome' && !value.trim()) return 'Nome obbligatorio'
    if (name === 'email') {
      if (!value.trim()) return 'Email obbligatoria'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Formato email non valido'
    }
    return ''
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
    setServerError('')
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    const error = validateField(name, value)
    if (error) setErrors((prev) => ({ ...prev, [name]: error }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!form.nome.trim()) newErrors.nome = 'Nome obbligatorio'
    if (!form.email.trim()) newErrors.email = 'Email obbligatoria'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Formato email non valido'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/auth/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          nomeAzienda: form.nomeAzienda || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409) {
          const field = data.field || 'email'
          setErrors((prev) => ({ ...prev, [field]: data.error }))
          setTouched((prev) => ({ ...prev, [field]: true }))
        } else if (res.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login')
        } else {
          setServerError(data.error || 'Errore durante il salvataggio')
        }
        return
      }
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/profile')
    } catch {
      setServerError('Impossibile contattare il server. Riprova più tardi.')
    } finally {
      setSaving(false)
    }
  }

  const getFieldClass = (name) => {
    const base = 'w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 '
    if (!touched[name]) return base + 'focus:ring-agri-green'
    if (errors[name]) return base + 'border-red-400 focus:ring-red-400'
    return base + 'border-green-400 focus:ring-agri-green'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-agri-beige flex items-center justify-center px-4 pt-16">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-agri-beige px-4 py-24">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-agri-green flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-poppins text-xl font-bold text-agri-green">AgriTrentino</span>
        </div>

        <h1 className="font-poppins font-bold text-2xl mb-2">Modifica i tuoi dati</h1>
        <p className="text-gray-500 text-sm mb-6">
          Aggiorna le informazioni del tuo profilo.{' '}
          <Link to="/profile" className="text-agri-green font-semibold hover:underline">Annulla</Link>
        </p>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Nome *</label>
            <input type="text" name="nome" value={form.nome}
              onChange={handleChange} onBlur={handleBlur}
              className={getFieldClass('nome')} />
            {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Email *</label>
            <input type="email" name="email" value={form.email}
              onChange={handleChange} onBlur={handleBlur}
              className={getFieldClass('email')} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Nome azienda <span className="text-gray-400">(facoltativo)</span>
            </label>
            <input type="text" name="nomeAzienda" value={form.nomeAzienda}
              onChange={handleChange} onBlur={handleBlur}
              className={getFieldClass('nomeAzienda')} />
            {errors.nomeAzienda && <p className="text-red-500 text-xs mt-1">{errors.nomeAzienda}</p>}
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-agri-green text-white font-semibold py-3 rounded-lg hover:bg-green-800 transition-colors mt-2 disabled:opacity-50">
            {saving ? 'Salvataggio...' : 'Salva modifiche'}
          </button>
        </form>
      </div>
    </div>
  )
}