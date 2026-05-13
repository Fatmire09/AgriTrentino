import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Leaf } from 'lucide-react'

function PasswordStrength({ password }) {
  const getStrength = () => {
    if (password.length === 0) return null
    if (password.length < 8) return { label: 'Troppo corta', color: 'bg-red-400', width: 'w-1/4' }
    if (password.length > 32) return { label: 'Troppo lunga', color: 'bg-red-400', width: 'w-full' }
    const hasUpper = /[A-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecial = /[^A-Za-z0-9]/.test(password)
    const score = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length
    if (score === 0) return { label: 'Debole', color: 'bg-red-400', width: 'w-1/3' }
    if (score === 1) return { label: 'Media', color: 'bg-yellow-400', width: 'w-2/3' }
    return { label: 'Forte', color: 'bg-agri-green', width: 'w-full' }
  }

  const strength = getStrength()
  if (!strength) return null

  return (
    <div className="mt-1">
      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
      </div>
      <p className={`text-xs mt-1 ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</p>
    </div>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nome: '', email: '', password: '', nomeAzienda: '' })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const validateField = (name, value) => {
    if (name === 'email') {
      if (!value.trim()) return 'Email obbligatoria'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Formato email non valido'
    }
    if (name === 'password') {
      if (!value) return 'Password obbligatoria'
      if (value.length < 8) return 'Minimo 8 caratteri'
      if (value.length > 32) return 'Massimo 32 caratteri'
    }
    return ''
  }

  const validate = () => {
    const newErrors = {}
    if (!form.nome.trim()) newErrors.nome = 'Nome obbligatorio'
    if (!form.email.trim()) newErrors.email = 'Email obbligatoria'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Formato email non valido'
    if (!form.password) newErrors.password = 'Password obbligatoria'
    else if (form.password.length < 8) newErrors.password = 'Minimo 8 caratteri'
    else if (form.password.length > 32) newErrors.password = 'Massimo 32 caratteri'
    return newErrors
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
      if (!res.ok) {
        if (res.status === 409) {
          setErrors((prev) => ({ ...prev, email: 'Email già registrata' }))
          setTouched((prev) => ({ ...prev, email: true }))
        } else {
          setServerError(data.error || 'Errore durante la registrazione')
        }
        return
      }
      navigate('/?registered=true')
    } catch {
      setServerError('Impossibile contattare il server. Riprova più tardi.')
    } finally {
      setLoading(false)
    }
  }
  const getFieldClass = (name) => {
    const base = 'w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 '
    if (!touched[name]) return base + 'focus:ring-agri-green'
    if (errors[name]) return base + 'border-red-400 focus:ring-red-400'
    return base + 'border-green-400 focus:ring-agri-green'
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
            <input type="text" name="nome" value={form.nome}
              onChange={handleChange} onBlur={handleBlur}
              placeholder="Mario Rossi" className={getFieldClass('nome')} />
            {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Email *</label>
            <input type="email" name="email" value={form.email}
              onChange={handleChange} onBlur={handleBlur}
              placeholder="mario@example.com" className={getFieldClass('email')} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Password *</label>
            <input type="password" name="password" value={form.password}
              onChange={handleChange} onBlur={handleBlur}
              placeholder="8-32 caratteri" className={getFieldClass('password')} />
            <PasswordStrength password={form.password} />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Nome azienda <span className="text-gray-400">(facoltativo)</span>
            </label>
            <input type="text" name="nomeAzienda" value={form.nomeAzienda}
              onChange={handleChange}
              placeholder="Azienda Agricola Rossi" className={getFieldClass('nomeAzienda')} />
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

