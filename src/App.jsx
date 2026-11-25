import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { Routes, Route, NavLink, Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './auth'
import { DEMO } from './supabase'
import crest from './assets/crest.png'
import crestInk from './assets/crest-ink.png'
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
import Volunteer from './pages/Volunteer'
import Security from './pages/Security'
import Privacy from './pages/Privacy'
import DemoBar from './demo/DemoBar'

export const CLUB = 'Mount Beauty Football Club'

function Guard({ ok, elevated, children }) {
  const { user, loading, needsMfa } = useAuth()
  const loc = useLocation()
  if (loading) return <div className="wrap"><p className="muted">Loading…</p></div>
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />
  if (elevated && needsMfa) return <Navigate to="/security" state={{ from: loc.pathname }} replace />
  if (ok === false) return <div className="wrap"><div className="card"><h2>No access</h2><p>This area is for {loc.pathname.includes('committee') ? 'committee members' : 'coaches'}. Ask the club secretary if you need access.</p></div></div>
  return children
}

function WWCCNudge() {
  const { user } = useAuth()
  const [need, setNeed] = useState(false)
  useEffect(() => {
    if (!user) return setNeed(false)
    ;(async () => {
      const { data: a } = await supabase.from('volunteer_roles').select('id').eq('profile_id', user.id).eq('status', 'pending')
      if (!a?.length) return setNeed(false)
      const { data: w } = await supabase.from('wwcc').select('profile_id').eq('profile_id', user.id).maybeSingle()
      setNeed(!w)
    })()
  }, [user])
  const { needsMfa } = useAuth()
  if (needsMfa) return <div className="nudge"><div className="wrap">Your account has coach, committee or volunteer access – <Link to="/security">turn on two-factor sign-in</Link> (or enter your code) to use it.</div></div>
  if (!need) return null
  return <div className="nudge"><div className="wrap">You've applied to help out – please <Link to="/volunteer">upload your Working With Children Check</Link> so the executive can sign you off.</div></div>
}

export default function App() {
  const { user, profile, coachTeams, isStaff, isCoach, signOut } = useAuth()
  const showCoach = profile?.role === 'coach' || coachTeams.length > 0
  const showCommittee = ['committee', 'admin'].includes(profile?.role) || profile?.is_executive
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <>
      {DEMO && <DemoBar />}
      <header className="top">
        <div className="wrap topbar">
          <Link to="/" className="brand" onClick={close}>
            <img src={crestInk} alt="" className="crest" />
            <span><strong>Mount Beauty</strong><small>Football Club</small></span>
          </Link>
          <button className="burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen(!open)}><svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true">{open ? <path d="M2 1l14 12M16 1L2 13" stroke="currentColor" strokeWidth="2.2" /> : <path d="M0 1h18M0 7h18M0 13h18" stroke="currentColor" strokeWidth="2.2" />}</svg></button>
          <nav className={open ? 'open' : ''} onClick={close}>
            <NavLink to="/about">About us</NavLink>
            <NavLink to="/galas">Gala days</NavLink>
            <NavLink to="/teams">Teams</NavLink>
            <NavLink to="/football-victoria">Football Victoria</NavLink>
            {user && <NavLink to="/family">My family</NavLink>}
            {user && <NavLink to="/board">Messages</NavLink>}
            {user && <NavLink to="/volunteer">Volunteer</NavLink>}
            {user && showCoach && <NavLink to="/coach">Coaches</NavLink>}
            {user && showCommittee && <NavLink to="/committee" className="nav-staff">Committee</NavLink>}
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
      <WWCCNudge />
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
          <Route path="/volunteer" element={<Guard><Volunteer /></Guard>} />
          <Route path="/coach" element={<Guard elevated ok={isCoach || isStaff}><Coach /></Guard>} />
          <Route path="/committee/*" element={<Guard elevated ok={isStaff || !!profile?.is_executive}><Committee /></Guard>} />
          <Route path="/security" element={<Guard><Security /></Guard>} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<div className="wrap"><h1>Page not found</h1><Link to="/">Back home</Link></div>} />
        </Routes>
      </main>
      <footer className="foot">
        <div className="wrap footgrid">
          <div className="row"><img src={crest} alt="" className="crest lg" /><div><p><strong>{CLUB}</strong><br />Junior soccer in the Kiewa Valley since 2003</p><p className="muted">Les Peart Oval, Pool Road, Mount Beauty VIC 3699</p></div></div>
          <div><p><Link to="/about">About the club</Link><br /><Link to="/about#fees">Fees & registration</Link><br /><Link to="/football-victoria">Football Victoria</Link><br /><Link to="/galas">Gala days</Link><br /><Link to="/privacy">Privacy</Link></p></div>
          <div><p>Training Wednesdays 4–5pm<br />mtbeautysoccerclub@gmail.com</p><p className="muted small">An incorporated, volunteer-run member club of Football Victoria.</p></div>
        </div>
      </footer>
    </>
  )
}
