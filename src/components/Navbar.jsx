import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'

const links = [
  { to: '/',        label: 'Home' },
  { to: '/fixtures', label: 'Fixtures' },
  { to: '/results',  label: 'Results' },
  { to: '/teams',    label: 'Teams' },
  { to: '/pitch',    label: 'Ground Map' },
  { to: '/photos',   label: 'Photos' },
  { to: '/board',    label: 'Message Board' },
  { to: '/coach',    label: 'Coach Portal' },
]

const activeClass = 'text-gold underline underline-offset-4'
const base = 'text-sm font-medium text-white hover:text-gold transition-colors'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="bg-green-club shadow-md">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center font-black text-green-club text-sm leading-none">
            MBSC
          </div>
          <div className="hidden sm:block">
            <p className="text-white font-bold text-base leading-none">Mt Beauty SC</p>
            <p className="text-gold text-xs">Junior Soccer</p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-6">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `${base} ${isActive ? activeClass : ''}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden text-white p-2"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <div className="space-y-1.5">
            <span className={`block h-0.5 w-6 bg-white transition-all ${open ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block h-0.5 w-6 bg-white transition-all ${open ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-6 bg-white transition-all ${open ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="lg:hidden bg-green-mid border-t border-green-light px-4 pb-4">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => `block py-2 ${base} ${isActive ? activeClass : ''}`}
              onClick={() => setOpen(false)}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  )
}
