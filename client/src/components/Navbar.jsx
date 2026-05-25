import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, Leaf, Bell, AlertTriangle } from 'lucide-react'

const navLinks = [
  { label: 'Necessità', href: '#chi-siamo' },
  { label: 'Benefici', href: '#soluzioni' },
  { label: 'Come funziona', href: '#come-funziona' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [nonLette, setNonLette] = useState(0)
  const [panelOpen, setPanelOpen] = useState(false)
  const [notifiche, setNotifiche] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'))
  }, [])

  // US38: funzione per ricaricare notifiche complete
  const caricaNotifiche = () => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch('http://localhost:3001/api/v1/notifiche?limit=20', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.notifiche) setNotifiche(data.notifiche)
        if (typeof data?.nonLette === 'number') setNonLette(data.nonLette)
      })
  }

  // US39: marca una notifica come letta
  const marcaComeLetta = async (notificaId) => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const res = await fetch(`http://localhost:3001/api/v1/notifiche/${notificaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ letta: true }),
      })
      if (res.ok) {
        // Aggiorno stato locale: la notifica diventa letta
        setNotifiche((prev) =>
          prev.map((n) => (n._id === notificaId ? { ...n, letta: true } : n))
        )
        // Decremento counter non lette (se era ancora non letta)
        setNonLette((prev) => Math.max(0, prev - 1))
      }
    } catch {
      // silenzioso, gestione errori semplificata
    }
  }

  // US38: helper per "X minuti fa"
  const tempoFa = (timestamp) => {
    const min = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000)
    if (min < 1) return 'ora'
    if (min < 60) return `${min} min fa`
    const ore = Math.floor(min / 60)
    if (ore < 24) return `${ore} ore fa`
    const gg = Math.floor(ore / 24)
    return `${gg} g fa`
  }

  // US37: conteggio notifiche non lette per il badge del campanello
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) return
    fetch('http://localhost:3001/api/v1/notifiche', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.nonLette === 'number') setNonLette(data.nonLette)
      })
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:3001/api/v1/auth/logout', { method: 'POST' })
    } catch {
      // anche se il server non risponde, eseguiamo comunque il logout client-side
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsLoggedIn(false)
    navigate('/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-agri-green">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-poppins text-xl font-bold text-agri-green">
              AgriTrentino
            </span>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[15px] text-gray-800 hover:opacity-80 transition"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
  <>
    <div className="relative">
      <button
        onClick={() => {
          if (!panelOpen) caricaNotifiche()
          setPanelOpen(!panelOpen)
        }}
        title="Notifiche"
        className="relative p-2 rounded-lg text-agri-green hover:bg-green-50 transition"
      >
        <Bell className="w-5 h-5" />
        {nonLette > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
            {nonLette > 9 ? '9+' : nonLette}
          </span>
        )}
      </button>

      {/* US38: pannello dropdown notifiche */}
      {panelOpen && (
        <>
          {/* overlay invisibile per chiudere cliccando fuori */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setPanelOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 max-h-96 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-sm">Notifiche</h3>
              {nonLette > 0 && (
                <span className="text-xs text-red-600 font-medium">{nonLette} non lett{nonLette === 1 ? 'a' : 'e'}</span>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {notifiche.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  Nessuna notifica disponibile
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {notifiche.map((n) => (
                    <li
                      key={n._id}
                      onClick={() => !n.letta && marcaComeLetta(n._id)}
                      className={`px-4 py-3 text-sm hover:bg-gray-50 ${!n.letta ? 'bg-yellow-50 cursor-pointer' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                            n.tipoRischio === 'fitosanitario' ? 'text-red-600' : 'text-orange-600'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-xs">
                            {n.campoNome || 'Campo'} · {n.tipoRischio === 'fitosanitario' ? 'Fitosanitario' : 'Climatico'}
                            {n.minaccia && ` (${n.minaccia})`}
                          </p>
                          <p className="text-gray-700 text-xs mt-0.5">{n.messaggio}</p>
                          <p className="text-gray-400 text-[11px] mt-1">{tempoFa(n.createdAt)}</p>
                        </div>
                        {!n.letta && (
                          <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
    <Link
      to="/fields"
      className="px-4 py-2 rounded-lg text-agri-green text-sm font-semibold hover:opacity-80 transition text-center"
    >
      I miei campi
    </Link>
    <Link
      to="/profile"
      className="px-4 py-2 rounded-lg border-2 border-agri-green text-agri-green text-sm font-semibold hover:opacity-80 transition text-center"
    >
      Profilo
    </Link>
    <button
      onClick={handleLogout}
      className="px-4 py-2 rounded-lg bg-agri-green text-white text-sm font-semibold hover:opacity-90 transition"
    >
      Logout
    </button>
  </>
) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg border-2 border-agri-green text-agri-green text-sm font-semibold hover:opacity-80 transition text-center"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg bg-agri-green text-white text-sm font-semibold hover:opacity-90 transition text-center"
                >
                  Registrati
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="w-6 h-6 text-gray-800" />
            ) : (
              <Menu className="w-6 h-6 text-gray-800" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-gray-100">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="py-2 px-1 text-[15px] text-gray-800"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex gap-3 mt-2">
                {isLoggedIn ? (
                  <>
                    <Link
                      to="/fields"
                      className="flex-1 py-2 rounded-lg text-agri-green text-sm font-semibold text-center"
                    >
                      I miei campi
                    </Link>
                    <Link
                      to="/profile"
                      className="flex-1 py-2 rounded-lg border-2 border-agri-green text-agri-green text-sm font-semibold text-center"
                    >
                      Profilo
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex-1 py-2 rounded-lg bg-agri-green text-white text-sm font-semibold"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="flex-1 py-2 rounded-lg border-2 border-agri-green text-agri-green text-sm font-semibold text-center"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="flex-1 py-2 rounded-lg bg-agri-green text-white text-sm font-semibold text-center"
                    >
                      Registrati
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
