import { Leaf, Mail, Phone, MapPin } from 'lucide-react'

const contactInfo = [
  { icon: <Mail className="w-4 h-4" />, text: 'info@agritrentino.it' },
  { icon: <Phone className="w-4 h-4" />, text: '+39 0461 123 456' },
  { icon: <MapPin className="w-4 h-4" />, text: 'Trento, Trentino-Alto Adige' },
]

export default function Footer() {
  return (
    <footer className="pt-16 pb-8 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          {/* Brand column — centrata */}
          <div className="max-w-md mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-agri-green">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-poppins font-bold text-xl text-white">
                AgriTrentino
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-[1.7] max-w-[300px] mx-auto mb-6">
              AgriTrentino protegge le tue colture, taglia gli sprechi e riduce l'impatto ambientale con la precisione che solo i tuoi dati possono darti.
            </p>

            {/* Contact info */}
            <div className="flex flex-col gap-2">
              {contactInfo.map((item, i) => (
                <div key={i} className="flex items-center justify-center gap-2">
                  <span style={{ color: '#4CAF50' }}>{item.icon}</span>
                  <span className="text-[13px] text-gray-400">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-[13px] text-gray-500">
            © 2026 AgriTrentino. Tutti i diritti riservati.
          </p>
          <div className="flex items-center">
            <Leaf className="w-3.5 h-3.5" style={{ color: '#4CAF50' }} />
          </div>
        </div>
      </div>
    </footer>
  )
}
