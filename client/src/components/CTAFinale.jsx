import { ArrowRight, Leaf } from 'lucide-react'

export default function CTAFinale() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="relative rounded-3xl overflow-hidden p-12 lg:p-20 text-center"
          style={{
            background:
              'linear-gradient(135deg, #1A4A1A 0%, #2D6A2D 50%, #3D8B3D 100%)',
          }}
        >
          {/* Decorative circles */}
          <div
            className="absolute top-0 right-0 w-72 h-72 rounded-full"
            style={{
              background: 'radial-gradient(circle, #FFFFFF, transparent)',
              transform: 'translate(30%, -30%)',
              opacity: 0.1,
            }}
          />
          <div
            className="absolute bottom-0 left-0 w-56 h-56 rounded-full"
            style={{
              background: 'radial-gradient(circle, #FFFFFF, transparent)',
              transform: 'translate(-30%, 30%)',
              opacity: 0.1,
            }}
          />

          {/* Leaf icon */}
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 mx-auto relative z-10"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            <Leaf className="w-8 h-8 text-white" />
          </div>

          <h2 className="font-poppins font-extrabold text-[clamp(28px,4vw,44px)] leading-[1.15] text-white max-w-[700px] mx-auto mb-5 relative z-10">
            Unisciti ad AgriTrentino oggi
          </h2>

          <p className="text-lg max-w-[560px] mx-auto mb-10 leading-[1.65] relative z-10" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Fai parte della comunità agricola trentina più innovativa.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center relative z-10">
            <button className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-white text-agri-green font-bold text-base hover:opacity-90 transition shadow-xl">
              Registrati Gratuitamente
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="inline-flex items-center gap-2 px-8 py-4 rounded-lg border-2 border-white text-white font-semibold text-base hover:bg-white hover:text-agri-green transition">
              Contattaci
            </button>
          </div>

          {/* Trust badges */}
          <div
            className="flex flex-wrap justify-center gap-6 mt-12 pt-8 relative z-10"
            style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🔒</span>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                Dati protetti GDPR
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base">🌍</span>
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                100% Made in Trentino
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
