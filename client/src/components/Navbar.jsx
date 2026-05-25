import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X, Leaf, Bell } from 'lucide-react'

const navLinks = [
  { label: 'Necessità', href: '#chi-siamo' },
  { label: 'Benefici', href: '#soluzioni' },
  { label: 'Come funziona', href: '#come-funziona' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [nonLette, setNonLette] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'))
  }, [])

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
    <button
      type="button"
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
