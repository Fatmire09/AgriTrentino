import { useState } from 'react'
import { API_URL } from '../config'
import { Link, useNavigate } from 'react-router-dom'
import { Leaf } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const validateField = (name, value) => {
    if (name === 'email') {
      if (!value.trim()) return 'Email obbligatoria'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Formato email non valido'
    }
    if (name === 'password' && !value) return 'Password obbligatoria'
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
    if (!form.email.trim()) newErrors.email = 'Email obbligatoria'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Formato email non valido'
    if (!form.password) newErrors.password = 'Password obbligatoria'
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setServerError(data.error || 'Errore durante il login')
        return
      }
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/')
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

        <h1 className="font-poppins font-bold text-2xl mb-2">Accedi al tuo account</h1>
        <p className="text-gray-500 text-sm mb-6">
          Non hai un account?{' '}
          <Link to="/register" className="text-agri-green font-semibold hover:underline">Registrati</Link>
        </p>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              placeholder="La tua password" className={getFieldClass('password')} />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-agri-green text-white font-semibold py-3 rounded-lg hover:bg-green-800 transition-colors mt-2 disabled:opacity-50">
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  )
}