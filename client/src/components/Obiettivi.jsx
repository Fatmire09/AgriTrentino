import Problemi from './Problemi'
import Soluzioni from './Soluzioni'

export default function Obiettivi() {
  return (
    <section id="chi-siamo" className="relative py-20 lg:py-28">
      {/* Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1774865847272-b6f322fe6303?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.06,
        }}
      />
      <div
        className="absolute inset-0 bg-agri-beige z-[1]"
        style={{ opacity: 0.95 }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Problemi />
        <Soluzioni />
      </div>
    </section>
  )
}
