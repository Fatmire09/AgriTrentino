import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Obiettivi from './components/Obiettivi'
import ComeFunziona from './components/ComeFunziona'
import CTAFinale from './components/CTAFinale'
import Footer from './components/Footer'

// US60 (D1 RNF01): code splitting per route — ogni pagina è scaricata solo quando navigata,
// riducendo il bundle iniziale e accelerando il primo render della landing.
const Register = lazy(() => import('./pages/Register'))
const Login = lazy(() => import('./pages/Login'))
const Profile = lazy(() => import('./pages/Profile'))
const EditProfile = lazy(() => import('./pages/EditProfile'))
const ChangePassword = lazy(() => import('./pages/ChangePassword'))
const AddField = lazy(() => import('./pages/AddField'))
const FieldsList = lazy(() => import('./pages/FieldsList'))
const FieldDetail = lazy(() => import('./pages/FieldDetail'))
const EditField = lazy(() => import('./pages/EditField'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Simulatore = lazy(() => import('./pages/Simulatore'))

function Fallback() {
  return (
    <div className="min-h-screen bg-agri-beige flex items-center justify-center">
      <p className="text-gray-500">Caricamento...</p>
    </div>
  )
}

// La landing page informativa (RF01) è riservata agli utenti NON autenticati.
// Un utente già loggato viene reindirizzato alla dashboard.
function Landing() {
  const isLoggedIn = !!localStorage.getItem('token')
  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />
  }
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

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/profile/change-password" element={<ChangePassword />} />
          <Route path="/fields" element={<FieldsList />} />
          <Route path="/fields/:id" element={<FieldDetail />} />
          <Route path="/fields/new" element={<AddField />} />
          <Route path="/fields/:id/edit" element={<EditField />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/simulatore" element={<Simulatore />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}