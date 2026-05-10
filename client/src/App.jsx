import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Obiettivi from './components/Obiettivi'
import ComeFunziona from './components/ComeFunziona'
import CTAFinale from './components/CTAFinale'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-screen w-full">
      <Navbar />
      <main>
        <Hero />
        <Obiettivi />
        <ComeFunziona />
        <CTAFinale />
      </main>
      <Footer />
    </div>
  )
}
