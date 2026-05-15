import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Leaf } from 'lucide-react'

export default function AddField() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nome: '',
    latitudine: '',
    longitudine: '',
    superficie: '',
    pendenza: '',
    coltura: '',
    esposizione: '',
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const validateField = (name, value) => {
    if (name === 'nome' && !value.trim()) return 'Nome appezzamento obbligatorio'
    if (name === 'latitudine') {
      if (value === '') return 'Latitudine obbligatoria'
      const n = Number(value)
      if (isNaN(n)) return 'Deve essere un numero'
      if (n < -90 || n > 90) return 'Deve essere compresa tra -90 e 90'
    }
    if (name === 'longitudine') {
      if (value === '') return 'Longitudine obbligatoria'
      const n = Number(value)
      if (isNaN(n)) return 'Deve essere un numero'
      if (n < -180 || n > 180) return 'Deve essere compresa tra -180 e 180'
    }
    if (name === 'superficie') {
      if (value === '') return 'Superficie obbligatoria'
      const n = Number(value)
      if (isNaN(n) || n <= 0) return 'Deve essere un numero positivo'
    }
    if (name === 'pendenza' && value !== '') {
      const n = Number(value)
      if (isNaN(n) || n < 0 || n > 100) return 'Deve essere compresa tra 0 e 100'
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
    ;['nome', 'latitudine', 'longitudine', 'superficie', 'pendenza'].forEach((name) => {
      const err = validateField(name, form[name])
      if (err) newErrors[name] = err
    })
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) { navigate('/login'); return }

      const body = {
        nome: form.nome,
        latitudine: Number(form.latitudine),
        longitudine: Number(form.longitudine),
        superficie: Number(form.superficie),
      }
      if (form.pendenza !== '') body.pendenza = Number(form.pendenza)
      if (form.coltura) body.coltura = form.coltura
      if (form.esposizione) body.esposizione = form.esposizione

      const res = await fetch('http://localhost:3001/api/v1/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          navigate('/login')
        } else {
          setServerError(data.error || 'Errore durante la creazione')
        }
        return
      }
      navigate('/profile')
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
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-md p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-agri-green flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-poppins text-xl font-bold text-agri-green">AgriTrentino</span>
        </div>

        <h1 className="font-poppins font-bold text-2xl mb-2">Aggiungi appezzamento</h1>
        <p className="text-gray-500 text-sm mb-6">
          Inserisci i dati del nuovo appezzamento.{' '}
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
              placeholder="Vigneto Cembra" className={getFieldClass('nome')} />
            {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Latitudine *</label>
              <input type="number" step="any" name="latitudine" value={form.latitudine}
                onChange={handleChange} onBlur={handleBlur}
                placeholder="46.183" className={getFieldClass('latitudine')} />
              {errors.latitudine && <p className="text-red-500 text-xs mt-1">{errors.latitudine}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Longitudine *</label>
              <input type="number" step="any" name="longitudine" value={form.longitudine}
                onChange={handleChange} onBlur={handleBlur}
                placeholder="11.213" className={getFieldClass('longitudine')} />
              {errors.longitudine && <p className="text-red-500 text-xs mt-1">{errors.longitudine}</p>}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Superficie (m²) *</label>
            <input type="number" step="any" name="superficie" value={form.superficie}
              onChange={handleChange} onBlur={handleBlur}
              placeholder="5200" className={getFieldClass('superficie')} />
            {errors.superficie && <p className="text-red-500 text-xs mt-1">{errors.superficie}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Pendenza (%) <span className="text-gray-400">(facoltativo)</span>
            </label>
            <input type="number" step="any" name="pendenza" value={form.pendenza}
              onChange={handleChange} onBlur={handleBlur}
              placeholder="0-100" className={getFieldClass('pendenza')} />
            {errors.pendenza && <p className="text-red-500 text-xs mt-1">{errors.pendenza}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Coltura <span className="text-gray-400">(facoltativo)</span>
              </label>
              <input type="text" name="coltura" value={form.coltura}
                onChange={handleChange} placeholder="vite, melo, ..." className={getFieldClass('coltura')} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Esposizione <span className="text-gray-400">(facoltativo)</span>
              </label>
              <input type="text" name="esposizione" value={form.esposizione}
                onChange={handleChange} placeholder="Sud-Est" className={getFieldClass('esposizione')} />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-agri-green text-white font-semibold py-3 rounded-lg hover:bg-green-800 transition-colors mt-2 disabled:opacity-50">
            {loading ? 'Creazione...' : 'Aggiungi appezzamento'}
          </button>
        </form>
      </div>
    </div>
  )
}