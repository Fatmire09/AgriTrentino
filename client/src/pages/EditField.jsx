import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'

export default function EditField() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [form, setForm] = useState({
    nome: '',
    latitudine: '',
    longitudine: '',
    superficie: '',
    pendenza: '',
    coltura: '',
    esposizione: '',
  })

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
        if (res.status === 403) { setError('Non sei autorizzato a modificare questo appezzamento.'); return null }
        if (res.status === 404) { setError('Appezzamento non trovato.'); return null }
        return res.json()
      })
      .then((data) => {
        if (data?.field) {
          setForm({
            nome: data.field.nome || '',
            latitudine: data.field.latitudine ?? '',
            longitudine: data.field.longitudine ?? '',
            superficie: data.field.superficie ?? '',
            pendenza: data.field.pendenza ?? '',
            coltura: data.field.coltura || '',
            esposizione: data.field.esposizione || '',
          })
        }
      })
      .catch(() => setError('Impossibile contattare il server.'))
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    setError('')
  }

  const validate = () => {
    const errs = {}
    if (!form.nome.trim()) errs.nome = 'Il nome è obbligatorio'
    if (form.latitudine === '' || isNaN(Number(form.latitudine))) errs.latitudine = 'Latitudine richiesta'
    else if (Number(form.latitudine) < -90 || Number(form.latitudine) > 90) errs.latitudine = 'Latitudine tra -90 e 90'
    if (form.longitudine === '' || isNaN(Number(form.longitudine))) errs.longitudine = 'Longitudine richiesta'
    else if (Number(form.longitudine) < -180 || Number(form.longitudine) > 180) errs.longitudine = 'Longitudine tra -180 e 180'
    if (form.superficie === '' || isNaN(Number(form.superficie))) errs.superficie = 'Superficie richiesta'
    else if (Number(form.superficie) <= 0) errs.superficie = 'Superficie deve essere positiva'
    if (form.pendenza !== '' && (isNaN(Number(form.pendenza)) || Number(form.pendenza) < 0 || Number(form.pendenza) > 100)) {
      errs.pendenza = 'Pendenza tra 0 e 100'
    }
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setSaving(true)
    setError('')
    const token = localStorage.getItem('token')
    const body = {
      nome: form.nome.trim(),
      latitudine: Number(form.latitudine),
      longitudine: Number(form.longitudine),
      superficie: Number(form.superficie),
      coltura: form.coltura.trim(),
      esposizione: form.esposizione.trim(),
    }
    if (form.pendenza !== '') body.pendenza = Number(form.pendenza)

    try {
      const res = await fetch(`http://localhost:3001/api/v1/fields/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        navigate(`/fields/${id}`)
      } else {
        setError(data.error || 'Errore durante il salvataggio')
      }
    } catch {
      setError('Impossibile contattare il server')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-agri-beige flex items-center justify-center pt-16"><p className="text-gray-500">Caricamento...</p></div>

  if (error && Object.keys(form).every((k) => !form[k])) {
    return (
      <div className="min-h-screen bg-agri-beige px-4 py-24">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
          <Link to="/fields" className="text-agri-green font-semibold text-sm inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Torna alla lista</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-agri-beige px-4 py-24">
      <div className="max-w-3xl mx-auto">
        <Link to={`/fields/${id}`} className="text-agri-green text-sm font-semibold hover:underline mb-4 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Indietro
        </Link>

        <h1 className="font-poppins font-bold text-2xl mb-6">Modifica appezzamento</h1>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          {[
            { key: 'nome', label: 'Nome', type: 'text', required: true },
            { key: 'latitudine', label: 'Latitudine', type: 'number', required: true, step: '0.0001' },
            { key: 'longitudine', label: 'Longitudine', type: 'number', required: true, step: '0.0001' },
            { key: 'superficie', label: 'Superficie (m²)', type: 'number', required: true },
            { key: 'pendenza', label: 'Pendenza (%)', type: 'number' },
            { key: 'coltura', label: 'Coltura', type: 'text' },
            { key: 'esposizione', label: 'Esposizione', type: 'text' },
          ].map(({ key, label, type, required, step }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
              <input
                type={type}
                step={step}
                name={key}
                value={form[key]}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-agri-green ${fieldErrors[key] ? 'border-red-400' : 'border-gray-300'}`}
              />
              {fieldErrors[key] && <p className="text-red-500 text-xs mt-1">{fieldErrors[key]}</p>}
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2 rounded-lg bg-agri-green text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 inline-flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Salvataggio...' : 'Salva modifiche'}
            </button>
            <Link to={`/fields/${id}`} className="px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition">
              Annulla
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}