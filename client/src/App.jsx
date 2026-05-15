import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Obiettivi from './components/Obiettivi'
import ComeFunziona from './components/ComeFunziona'
import CTAFinale from './components/CTAFinale'
import Footer from './components/Footer'
import Register from './pages/Register'
import Login from './pages/Login'
import Profile from './pages/Profile'
import EditProfile from './pages/EditProfile'

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
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
      </Routes>
    </BrowserRouter>
  )
}
