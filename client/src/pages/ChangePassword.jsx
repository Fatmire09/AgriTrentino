
import { useState } from 'react'
import { API_URL } from '../config'
import { Link, useNavigate } from 'react-router-dom'
import { Leaf } from 'lucide-react'

export default function ChangePassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [serverError, setServerError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const validateField = (name, value, allValues = form) => {
    if (name === 'currentPassword' && !value) return 'Password corrente obbligatoria'
    if (name === 'newPassword') {
      if (!value) return 'Nuova password obbligatoria'
      if (value.length < 8) return 'Minimo 8 caratteri'
      if (value.length > 32) return 'Massimo 32 caratteri'
      if (value === allValues.currentPassword) return 'La nuova password deve essere diversa'
    }
    if (name === 'confirmPassword') {
      if (!value) return 'Conferma password obbligatoria'
      if (value !== allValues.newPassword) return 'Le password non coincidono'
    }
    return ''
  }

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value }
    setForm(updated)
    setErrors({ ...errors, [e.target.name]: '' })
    setServerError('')
    setSuccessMsg('')
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
    Object.keys(form).forEach((name) => {
      const err = validateField(name, form[name])
      if (err) newErrors[name] = err
    })
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) { navigate('/login'); return }

      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401 && data.error === 'Password corrente non corretta') {
          setErrors((prev) => ({ ...prev, currentPassword: data.error }))
          setTouched((prev) => ({ ...prev, currentPassword: true }))
        } else if (res.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login')
        } else {
          setServerError(data.error || 'Errore durante il cambio password')
        }
        return
      }
      setSuccessMsg('Password aggiornata con successo. Torno al profilo...')
      setTimeout(() => navigate('/profile'), 1500)
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
    <div className="min-h-screen bg-agri-beige px-4 py-24">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-agri-green flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-poppins text-xl font-bold text-agri-green">AgriTrentino</span>
        </div>

        <h1 className="font-poppins font-bold text-2xl mb-2">Cambia password</h1>
        <p className="text-gray-500 text-sm mb-6">
          Per sicurezza, inserisci prima la password corrente.{' '}
          <Link to="/profile" className="text-agri-green font-semibold hover:underline">Annulla</Link>
        </p>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
            {serverError}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Password corrente *</label>
            <input type="password" name="currentPassword" value={form.currentPassword}
              onChange={handleChange} onBlur={handleBlur}
              className={getFieldClass('currentPassword')} />
            {errors.currentPassword && <p className="text-red-500 text-xs mt-1">{errors.currentPassword}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Nuova password *</label>
            <input type="password" name="newPassword" value={form.newPassword}
              onChange={handleChange} onBlur={handleBlur}
              placeholder="8-32 caratteri" className={getFieldClass('newPassword')} />
            {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Conferma nuova password *</label>
            <input type="password" name="confirmPassword" value={form.confirmPassword}
              onChange={handleChange} onBlur={handleBlur}
              className={getFieldClass('confirmPassword')} />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-agri-green text-white font-semibold py-3 rounded-lg hover:bg-green-800 transition-colors mt-2 disabled:opacity-50">
            {loading ? 'Aggiornamento...' : 'Cambia password'}
          </button>
        </form>
      </div>
    </div>
  )
}
