import { useState, useEffect } from 'react'
import { API_URL } from '../config'
import { useNavigate, Link } from 'react-router-dom'
import { BarChart3, ClipboardList, Droplet, Pill, TrendingUp, Download } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import Navbar from '../components/Navbar'

export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [anno, setAnno] = useState(null)
  const [trend, setTrend] = useState([])

  // US53: monitoraggio consumi (per campo + periodo)
  const [campiConsumi, setCampiConsumi] = useState([])
  const [consumiCampoId, setConsumiCampoId] = useState('')
  const [consumiGiorni, setConsumiGiorni] = useState(60)
  const [consumi, setConsumi] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    const qs = anno ? `?anno=${anno}` : ''
    fetch(`${API_URL}/dashboard/sostenibilita${qs}`, {
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
  }, [navigate, anno])


  // US52: trend rischio medio giornaliero dell'annata selezionata
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    const annoEff = anno ?? data?.annoSelezionato
    if (!annoEff) return
    fetch(`${API_URL}/dashboard/trend-rischio?anno=${annoEff}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => { if (d?.trend) setTrend(d.trend) })
      .catch(() => {})
  }, [anno, data?.annoSelezionato])


  // US53: carica i campi per il selettore consumi
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch(`${API_URL}/fields`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => {
        if (d?.fields) {
          setCampiConsumi(d.fields)
          if (d.fields.length > 0) setConsumiCampoId(d.fields[0]._id)
        }
      })
      .catch(() => {})
  }, [])

  // US53: consumi del campo selezionato nel periodo
  useEffect(() => {
    if (!consumiCampoId) return
    const token = localStorage.getItem('token')
    fetch(`${API_URL}/fields/${consumiCampoId}/consumi?giorni=${consumiGiorni}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => { if (d) setConsumi(d) })
      .catch(() => {})
  }, [consumiCampoId, consumiGiorni])

  // US54: scarica il report PDF dell'annata selezionata
  async function handleDownloadReport() {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    const annoEff = anno ?? data?.annoSelezionato ?? new Date().getFullYear()
    try {
      const res = await fetch(`${API_URL}/dashboard/report?anno=${annoEff}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        alert('Errore durante la generazione del report')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-sostenibilita-${annoEff}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Errore di rete durante il download del report')
    }
  }

  return (
    <div className="min-h-screen bg-agri-beige">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-24">
        <h1 className="font-poppins font-bold text-3xl mb-6 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-agri-green" /> Dashboard sostenibilità
        </h1>

        {data && (
          <div className="mb-4 flex justify-end">
            <button
              onClick={handleDownloadReport}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-agri-green text-white text-sm font-semibold hover:opacity-90 transition"
            >
              <Download className="w-4 h-4" /> Scarica report PDF
            </button>
          </div>
        )}

        {data && data.annateDisponibili && data.annateDisponibili.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <label className="text-sm text-gray-600">Annata:</label>
            <select
              value={anno ?? data.annoSelezionato}
              onChange={(e) => setAnno(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              {data.annateDisponibili.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        )}

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
            <h2 className="font-poppins font-semibold text-lg mb-4 text-agri-green">Interventi giustificati</h2>
            {data.percentualeGiustificati !== null ? (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Giustificati', value: data.giustificati },
                          { name: 'Superflui', value: data.superflui },
                        ]}
                        dataKey="value"
                        innerRadius={60}
                        outerRadius={80}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <Cell fill="#16a34a" />
                        <Cell fill="#dc2626" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-agri-green">{data.percentualeGiustificati}%</span>
                  </div>
                </div>
                <div className="text-sm space-y-2">
                  <p className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-green-600" />
                    Giustificati: <span className="font-semibold">{data.giustificati}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-red-600" />
                    Superflui: <span className="font-semibold">{data.superflui}</span>
                  </p>
                  <p className="text-gray-400">Non valutabili: {data.nonValutabili} (esclusi dal calcolo)</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Nessun intervento ancora classificabile: gli interventi su date senza indice di rischio storico risultano
                "Non valutabile". Registra interventi con date coperte dallo storico per vedere la percentuale.
              </p>
            )}
          </div>
        )}

        {!loading && data && data.haInterventi && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mt-4">
            <h2 className="font-poppins font-semibold text-lg mb-4 text-agri-green flex items-center gap-2">
              <Droplet className="w-5 h-5" /> Risparmio idrico
            </h2>
            {data.risparmioIdricoLitri !== null ? (
              <div>
                <p className="text-3xl font-bold text-blue-600">{data.risparmioIdricoLitri.toLocaleString('it-IT')} L</p>
                <p className="text-sm text-gray-500 mt-1">risparmiati rispetto a una gestione a calendario</p>
                <p className="text-xs text-gray-400 mt-3">
                  Baseline calendario: {data.baselineIdricaLitri.toLocaleString('it-IT')} L · irrigato: {data.litriIrrigati.toLocaleString('it-IT')} L
                  <br />(regime a calendario: 200 L/settimana × 26 settimane per campo irrigato)
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nessuna irrigazione registrata in questa annata.</p>
            )}
          </div>
        )}

        {!loading && data && data.haInterventi && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mt-4">
            <h2 className="font-poppins font-semibold text-lg mb-4 text-agri-green flex items-center gap-2">
              <Pill className="w-5 h-5" /> Risparmio chimico
            </h2>
            {data.risparmioChimicoKg !== null ? (
              <div>
                <p className="text-3xl font-bold text-amber-600">{data.risparmioChimicoKg.toLocaleString('it-IT')} kg</p>
                <p className="text-sm text-gray-500 mt-1">di principio attivo risparmiati rispetto a una gestione a calendario</p>
                <p className="text-xs text-gray-400 mt-3">
                  Baseline calendario: {data.baselineChimicaKg.toLocaleString('it-IT')} kg · usato: {data.kgTrattati.toLocaleString('it-IT')} kg
                  <br />(regime a calendario: 8 trattamenti × 2 kg per campo trattato)
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Nessun trattamento registrato in questa annata.</p>
            )}
          </div>
        )}

        {!loading && trend.length > 1 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mt-4">
            <h2 className="font-poppins font-semibold text-lg mb-4 text-agri-green flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Trend rischio medio
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="data" tick={{ fontSize: 9 }} interval={29} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="rischioMedio" stroke="#ca8a04" strokeWidth={1.5} dot={false} name="Rischio medio" />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 mt-2">Rischio medio giornaliero (0-100) nell'annata selezionata. I picchi indicano i periodi più critici.</p>
          </div>
        )}

        {campiConsumi.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mt-4">
            <h2 className="font-poppins font-semibold text-lg mb-4 text-agri-green flex items-center gap-2">
              <BarChart3 className="w-5 h-5" /> Monitoraggio consumi
            </h2>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <select value={consumiCampoId} onChange={(e) => setConsumiCampoId(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                {campiConsumi.map((f) => (<option key={f._id} value={f._id}>{f.nome}</option>))}
              </select>
              <select value={consumiGiorni} onChange={(e) => setConsumiGiorni(Number(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value={30}>Ultimi 30 giorni</option>
                <option value={60}>Ultimi 60 giorni</option>
                <option value={90}>Ultimi 90 giorni</option>
                <option value={365}>Ultimo anno</option>
              </select>
            </div>
            {consumi && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <Droplet className="w-7 h-7 text-blue-600 flex-shrink-0" />
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{consumi.acquaTotaleLitri.toLocaleString('it-IT')} L</p>
                    <p className="text-xs text-gray-500">acqua · {consumi.periodoGiorni} giorni</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg">
                  <Pill className="w-7 h-7 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="text-2xl font-bold text-amber-600">{consumi.principioAttivoTotaleKg.toLocaleString('it-IT')} kg</p>
                    <p className="text-xs text-gray-500">principio attivo · {consumi.periodoGiorni} giorni</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}