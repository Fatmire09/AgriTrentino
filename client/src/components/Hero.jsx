import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const heroImages = [
  'https://images.unsplash.com/photo-1764590385577-18560eab8f7b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'https://images.unsplash.com/photo-1642156496751-9e01ee874632?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'https://images.unsplash.com/photo-1566746128939-55dae21426c8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  'https://images.unsplash.com/photo-1704462347567-6b7be3a56d74?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
]

export default function Hero() {
  const [currentImage, setCurrentImage] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section
      id="hero"
      className="pt-16 min-h-screen flex items-center bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 bg-agri-beige">
              <div className="w-2 h-2 rounded-full bg-agri-green" />
              <span className="text-agri-green text-sm font-semibold">
                Piattaforma Agricola del Trentino
              </span>
            </div>

            <h1 className="font-poppins font-extrabold text-[clamp(36px,5vw,56px)] leading-[1.1] mb-6">
              Meno sprechi, <span className="text-agri-green">più sostenibilità</span>
            </h1>

            <p className="text-lg leading-[1.7] text-gray-500 mb-10 max-w-[520px]">
              AgriTrentino protegge le tue colture, taglia gli sprechi e riduce l'impatto ambientale con la precisione che solo i tuoi dati possono darti.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register" className="px-8 py-4 rounded-lg bg-agri-green text-white font-semibold text-base hover:opacity-90 transition shadow-lg hover:shadow-xl inline-block text-center">
                Crea il tuo account
              </Link>
            </div>
          </div>

          {/* Hero Image Carousel */}
          <div className="relative">
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #4CAF50 0%, #2D6A2D 100%)',
                transform: 'rotate(3deg) scale(1.02)',
                opacity: 0.15,
              }}
            />
            <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[420px]">
              {heroImages.map((src, idx) => (
                <img
                  key={src}
                  src={src}
                  alt={`Paesaggio del Trentino ${idx + 1}`}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[800ms]"
                  style={{ opacity: idx === currentImage ? 1 : 0 }}
                />
              ))}

              {/* Dots indicator */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {heroImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImage(idx)}
                    aria-label={`Vai alla slide ${idx + 1}`}
                    className="w-2.5 h-2.5 rounded-full border-0 cursor-pointer transition-all"
                    style={{
                      backgroundColor:
                        idx === currentImage ? '#2D6A2D' : 'rgba(255,255,255,0.5)',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
