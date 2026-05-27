import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { BarChart3, ClipboardList, Droplet, Pill, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import Navbar from '../components/Navbar'

export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [anno, setAnno] = useState(null)
  const [trend, setTrend] = useState([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }
    const qs = anno ? `?anno=${anno}` : ''
    fetch(`http://localhost:3001/api/v1/dashboard/sostenibilita${qs}`, {
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
    fetch(`http://localhost:3001/api/v1/dashboard/trend-rischio?anno=${annoEff}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((d) => { if (d?.trend) setTrend(d.trend) })
      .catch(() => {})
  }, [anno, data?.annoSelezionato])

  return (
    <div className="min-h-screen bg-agri-beige">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-24">
        <h1 className="font-poppins font-bold text-3xl mb-6 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-agri-green" /> Dashboard sostenibilità
        </h1>

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
      </div>
    </div>
  )
}