import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Leaf } from 'lucide-react'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nome: '', email: '', password: '', nomeAzienda: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const newErrors = {}
    if (!form.nome.trim()) newErrors.nome = 'Nome obbligatorio'
    if (!form.email.trim()) newErrors.email = 'Email obbligatoria'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Formato email non valido'
    if (!form.password) newErrors.password = 'Password obbligatoria'
    else if (form.password.length < 8) newErrors.password = 'Minimo 8 caratteri'
    return newErrors
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
    setServerError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    setLoading(true)
    try {
      const res = await fetch('http://localhost:3001/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          nome: form.nome,
          nomeAzienda: form.nomeAzienda || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setServerError(data.error || 'Errore durante la registrazione'); return }
      navigate('/?registered=true')
    } catch {
      setServerError('Impossibile contattare il server. Riprova più tardi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-agri-beige flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-agri-green flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-poppins text-xl font-bold text-agri-green">AgriTrentino</span>
        </div>

        <h1 className="font-poppins font-bold text-2xl mb-2">Crea il tuo account</h1>
        <p className="text-gray-500 text-sm mb-6">
          Hai già un account?{' '}
          <Link to="/login" className="text-agri-green font-semibold hover:underline">Accedi</Link>
        </p>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Nome *</label>
            <input type="text" name="nome" value={form.nome} onChange={handleChange}
              placeholder="Mario Rossi"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-agri-green" />
            {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Email *</label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="mario@example.com"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-agri-green" />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Password *</label>
            <input type="password" name="password" value={form.password} onChange={handleChange}
              placeholder="Minimo 8 caratteri"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-agri-green" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Nome azienda <span className="text-gray-400">(facoltativo)</span>
            </label>
            <input type="text" name="nomeAzienda" value={form.nomeAzienda} onChange={handleChange}
              placeholder="Azienda Agricola Rossi"
              className="w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-agri-green" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-agri-green text-white font-semibold py-3 rounded-lg hover:bg-green-800 transition-colors mt-2 disabled:opacity-50">
            {loading ? 'Creazione account...' : 'Crea account'}
          </button>
        </form>
      </div>
    </div>
  )
}
