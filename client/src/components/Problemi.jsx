import { AlertTriangle, BarChart2, Droplets } from 'lucide-react'

const problemi = [
  {
    icon: <AlertTriangle className="w-6 h-6" />,
    title: 'Frammentazione dei microclimi',
    description:
      "In Trentino, altitudine, pendenza ed esposizione al sole creano condizioni climatiche completamente diverse anche tra campi che distano poche centinaia di metri. Una previsione meteo generica è del tutto inutile per prendere decisioni di precisione su un singolo appezzamento.",
  },
  {
    icon: <BarChart2 className="w-6 h-6" />,
    title: 'Interpretazione dei dati',
    description:
      "Gli agricoltori oggi hanno accesso a sensori, bollettini fitosanitari, API meteorologiche, una mole crescente di informazioni. Ma mancano completamente di strumenti capaci di trasformare questi dati grezzi in indicazioni operative concrete.",
  },
  {
    icon: <Droplets className="w-6 h-6" />,
    title: 'Gestione inefficiente delle risorse',
    description:
      "Questa incertezza porta gli agricoltori a intervenire per eccesso di cautela, con irrigazioni e trattamenti fitosanitari effettuati a calendario fisso, indipendentemente dal rischio reale del momento. Le conseguenze sono dirette: aumento dei costi operativi, spreco di acqua e prodotti chimici, e un impatto ambientale del tutto evitabile.",
  },
]

function Card({ item, index }) {
  return (
    <div
      className="p-6 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col gap-4"
      style={{ borderTop: '4px solid #E53E3E' }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: '#FFF5F5', color: '#E53E3E' }}
      >
        {item.icon}
      </div>
      <div
        className="font-poppins text-xs font-bold tracking-[0.08em] uppercase"
        style={{ color: '#E53E3E' }}
      >
        Problema {String(index + 1).padStart(2, '0')}
      </div>
      <h3 className="font-poppins font-semibold text-[17px] leading-tight">
        {item.title}
      </h3>
      <p className="text-sm text-gray-500 leading-[1.7]">{item.description}</p>
    </div>
  )
}

export default function Problemi() {
  return (
    <div>
      <div className="text-center mb-12">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
          style={{ backgroundColor: 'rgba(45,106,45,0.1)' }}
        >
          <span className="text-agri-green text-sm font-semibold">
            I Problemi che Abbiamo Individuato
          </span>
        </div>
        <h2 className="font-poppins font-bold text-[clamp(26px,4vw,34px)] leading-tight mb-4">
          Le sfide dell'agricoltura di{' '}
          <span className="text-agri-green">precisione in Trentino</span>
        </h2>
        <p className="text-[17px] text-gray-500 max-w-[600px] mx-auto leading-relaxed">
          Abbiamo analizzato il contesto operativo degli agricoltori trentini e
          identificato tre criticità strutturali che limitano l'efficienza e la
          sostenibilità.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
        {problemi.map((p, i) => (
          <Card key={i} item={p} index={i} />
        ))}
      </div>
    </div>
  )
}
