import { ShieldCheck, Sliders, ClipboardList } from 'lucide-react'

const soluzioni = [
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: 'Indici di rischio personalizzati',
    description:
      "Incrociando i dati meteorologici in tempo reale con il profilo della realtà agricola (tipo di coltura, pendenza, esposizione, fase fenologica), il sistema genera indici visivi intuitivi — una scala cromatica semaforica — che comunicano istantaneamente il livello di rischio fitosanitario e climatico.",
  },
  {
    icon: <Sliders className="w-6 h-6" />,
    title: 'Modulo di simulazione',
    description:
      "Una funzione che consente all'utente di modificare parametri meteorologici per permettere la visualizzazione di scenari ipotetici e pianificare i carichi di lavoro e gli interventi in anticipo.",
  },
  {
    icon: <ClipboardList className="w-6 h-6" />,
    title: 'Monitoraggio della sostenibilità',
    description:
      "Un registro digitale degli interventi effettuati, che il sistema confronta automaticamente con il livello di rischio calcolato nel momento dell'azione. Questo genera un feedback sull'efficienza decisionale, evidenziando interventi giustificati, tardivi o superflui.",
  },
]

function Card({ item, index }) {
  return (
    <div
      className="p-6 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col gap-4"
      style={{ borderTop: '4px solid #2D6A2D' }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: '#F0FBF4', color: '#2D6A2D' }}
      >
        {item.icon}
      </div>
      <div
        className="font-poppins text-xs font-bold tracking-[0.08em] uppercase"
        style={{ color: '#2D6A2D' }}
      >
        Modulo {String(index + 1).padStart(2, '0')}
      </div>
      <h3 className="font-poppins font-semibold text-[17px] leading-tight">
        {item.title}
      </h3>
      <p className="text-sm text-gray-500 leading-[1.7]">{item.description}</p>
    </div>
  )
}

export default function Soluzioni() {
  return (
    <div id="soluzioni">
      <div className="text-center mb-12">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
          style={{ backgroundColor: 'rgba(45,106,45,0.1)' }}
        >
          <span className="text-agri-green text-sm font-semibold">
            Le Nostre Soluzioni
          </span>
        </div>
        <h2 className="font-poppins font-bold text-[clamp(26px,4vw,34px)] leading-tight mb-4">
          Un DSS che trasforma i dati in{' '}
          <span className="text-agri-green">decisioni operative</span>
        </h2>
        <p className="text-[17px] text-gray-500 max-w-[660px] mx-auto leading-relaxed">
          AgriTrentino è una Web Application di Supporto Decisionale che funge
          da consulente digitale integrato. Sposta la gestione agricola da una
          logica <strong className="text-gray-900">reattiva</strong> a una
          logica <strong className="text-agri-green">proattiva</strong>, basata
          sull'anticipazione e sulla prevenzione.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {soluzioni.map((s, i) => (
          <Card key={i} item={s} index={i} />
        ))}
      </div>
    </div>
  )
}
