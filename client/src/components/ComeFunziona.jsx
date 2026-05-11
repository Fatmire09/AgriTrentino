import { UserPlus, LayoutDashboard, Activity } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: <UserPlus className="w-8 h-8" />,
    title: 'Registrati',
    description: 'Crea il tuo account gratuito in pochi minuti.',
  },
  {
    number: '02',
    icon: <LayoutDashboard className="w-8 h-8" />,
    title: 'Crea il tuo Profilo',
    description: 'Completa il profilo con i dati delle tue colture.',
  },
  {
    number: '03',
    icon: <Activity className="w-8 h-8" />,
    title: 'Inizia a Monitorare',
    description:
      "Tieni sotto controllo gli indici di rischio fitosanitario e climatico dei tuoi appezzamenti, ricevi allerte in tempo reale e intervieni solo quando serve davvero.",
  },
]

export default function ComeFunziona() {
  return (
    <section id="come-funziona" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 bg-agri-beige">
            <span className="text-agri-green text-sm font-semibold">
              Come Funziona
            </span>
          </div>
          <h2 className="font-poppins font-bold text-[clamp(28px,4vw,36px)] leading-tight mb-4">
            Inizia in <span className="text-agri-green">3 semplici passi</span>
          </h2>
          <p className="text-[17px] text-gray-500 max-w-[520px] mx-auto leading-relaxed">
            Unirsi ad AgriTrentino è veloce e gratuito. Inizia oggi a sfruttare la potenza della rete agricola trentina.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line (desktop only) */}
          <div
            className="hidden lg:block absolute h-0.5"
            style={{
              top: '64px',
              left: '16.67%',
              right: '16.67%',
              background:
                'linear-gradient(to right, transparent 5%, #4CAF50 30%, #4CAF50 70%, transparent 95%)',
              zIndex: 0,
            }}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 relative z-10">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                {/* Icon circle */}
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg mb-6 relative text-white"
                  style={{
                    background:
                      'linear-gradient(135deg, #4CAF50 0%, #2D6A2D 100%)',
                  }}
                >
                  {step.icon}
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-white shadow font-poppins font-bold text-[11px] bg-gray-900">
                    {step.number}
                  </div>
                </div>

                <h3 className="font-poppins font-semibold text-xl mb-3">
                  {step.title}
                </h3>
                <p className="text-[15px] text-gray-500 leading-[1.65] max-w-[300px]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
