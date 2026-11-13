import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import Button from './Button'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const links = [
    { to: '/', label: 'Home' },
    { to: '/schemes', label: 'Schemes' },
    { to: '/#how-it-works', label: 'How It Works' },
    { to: '/#technology', label: 'Technology' },
    { to: '/#faq', label: 'FAQ' },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--primary)] border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
              <span className="text-[var(--primary)] font-bold text-sm">DI</span>
            </div>
            <span className="text-white font-semibold text-base tracking-tight">
              Digital<span className="text-[var(--accent)]">Beneficiary</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-sm rounded-md transition-colors ${
                    isActive && l.to !== '/#how-it-works' && l.to !== '/#technology' && l.to !== '/#faq'
                      ? 'text-[var(--accent)] font-medium'
                      : 'text-white/75 hover:text-white'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 hover:border-white/50"
              onClick={() => navigate('/dashboard/history')}
            >
              My Applications
            </Button>
            <Button
              size="sm"
              className="bg-[var(--accent)] text-[var(--primary)] hover:bg-[#e09830] border-0"
              onClick={() => navigate('/dashboard')}
            >
              Find Schemes
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-white/80 hover:text-white p-1"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              {open ? (
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#131B3E] border-t border-white/10 px-4 py-4 space-y-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="block px-3 py-2 text-white/80 hover:text-white text-sm rounded-md hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-3 space-y-2">
            <Button
              size="sm"
              variant="ghost"
              className="w-full text-white hover:bg-white/10"
              onClick={() => { navigate('/dashboard/history'); setOpen(false) }}
            >
              My Applications
            </Button>
            <Button
              size="sm"
              className="w-full bg-[var(--accent)] text-[var(--primary)]"
              onClick={() => { navigate('/dashboard'); setOpen(false) }}
            >
              Find Schemes
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
