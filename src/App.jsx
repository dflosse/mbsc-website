import { useState } from 'react'
import { Routes, Route, NavLink, Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './auth'
import { DEMO } from './supabase'
import crest from './assets/crest.png'
import Home from './pages/Home'
import Galas from './pages/Galas'
import Teams from './pages/Teams'
import About from './pages/About'
import FV from './pages/FV'
import Login from './pages/Login'
import Family from './pages/Family'
import Coach from './pages/Coach'
import Committee from './pages/Committee'
import Board from './pages/Board'
import Account from './pages/Account'
import DemoBar from './demo/DemoBar'

export const CLUB = 'Mt Beauty FC'

function Guard({ ok, children }) {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <div className="wrap"><p className="muted">Loading…</p></div>
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  if (ok === false) return <div className="wrap"><div className="card"><h2>No access</h2><p>This area is for {loc.pathname.includes('committee') ? 'committee members' : 'coaches'}. Ask the club secretary if you need access.</p></div></div>
  return children
}

export default function App() {
  const { user, isStaff, isCoach, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <>
      {DEMO && <DemoBar />}
      <header className="top">
        <div className="wrap topbar">
          <Link to="/" className="brand" onClick={close}>
            <img src={crest} alt="" className="crest" />
            <span><strong>{CLUB}</strong><small>Junior soccer · est. 2003</small></span>
          </Link>
          <button className="burger" aria-label="Menu" onClick={() => setOpen(!open)}>☰</button>
          <nav className={open ? 'open' : ''} onClick={close}>
            <NavLink to="/about">About us</NavLink>
            <NavLink to="/galas">Gala days</NavLink>
            <NavLink to="/teams">Teams</NavLink>
            <NavLink to="/football-victoria">Football Victoria</NavLink>
            {user && <NavLink to="/family">My family</NavLink>}
            {user && <NavLink to="/board">Messages</NavLink>}
            {user && isCoach && <NavLink to="/coach">Coaches</NavLink>}
            {user && isStaff && <NavLink to="/committee">Committee</NavLink>}
            {user ? (
              <>
                <NavLink to="/account">Account</NavLink>
                <button className="link" onClick={signOut}>Sign out</button>
              </>
            ) : (
              <NavLink to="/login" className="btn small">Sign in / Register</NavLink>
            )}
          </nav>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/galas" element={<Galas />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/football-victoria" element={<FV />} />
          <Route path="/login" element={<Login />} />
          <Route path="/family" element={<Guard><Family /></Guard>} />
          <Route path="/board" element={<Guard><Board /></Guard>} />
          <Route path="/account" element={<Guard><Account /></Guard>} />
          <Route path="/coach" element={<Guard ok={isCoach || isStaff}><Coach /></Guard>} />
          <Route path="/committee/*" element={<Guard ok={isStaff}><Committee /></Guard>} />
          <Route path="*" element={<div className="wrap"><h1>Page not found</h1><Link to="/">Back home</Link></div>} />
        </Routes>
      </main>
      <footer className="foot">
        <div className="wrap footgrid">
          <div className="row"><img src={crest} alt="" className="crest lg" /><div><p><strong>{CLUB}</strong><br />Junior soccer in the Kiewa Valley since 2003</p><p className="muted">Les Peart Oval, Pool Road, Mt Beauty VIC 3699</p></div></div>
          <div><p><Link to="/about">About the club</Link><br /><Link to="/about#fees">Fees & registration</Link><br /><Link to="/football-victoria">Football Victoria</Link><br /><Link to="/galas">Gala days</Link></p></div>
          <div><p>Training Wednesdays 4–5pm<br />mtbeautysoccerclub@gmail.com</p><p className="muted small">An incorporated, volunteer-run member club of Football Victoria.</p></div>
        </div>
      </footer>
    </>
  )
}
