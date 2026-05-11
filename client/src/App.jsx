import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Obiettivi from './components/Obiettivi'
import ComeFunziona from './components/ComeFunziona'
import CTAFinale from './components/CTAFinale'
import Footer from './components/Footer'
import Register from './pages/Register'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
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
        } />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  )
}
