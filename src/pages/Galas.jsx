import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, fmtDate } from '../supabase'
import { useAuth } from '../auth'

export default function Galas() {
  const { user } = useAuth()
  const [galas, setGalas] = useState([])
  useEffect(() => { supabase.from('galas').select('*').order('gala_date', { ascending: false }).then(({ data }) => setGalas(data || [])) }, [])
  const today = new Date().toISOString().slice(0, 10)
  const upcoming = galas.filter((g) => g.gala_date >= today).reverse()
  const past = galas.filter((g) => g.gala_date < today)
  const bySeason = past.reduce((a, g) => ((a[g.season] = a[g.season] || []).push(g), a), {})
  return (
    <div className="wrap">
      <h1>Gala days</h1>
      <p className="lead">Our teams play in the Alpine Valleys gala series with Myrtleford, Yackandandah and Bright. Each gala is a morning of short games – no ladders, just fun football.</p>
      <h2>Upcoming</h2>
      {upcoming.length === 0 && <div className="card"><p>2027 dates are still being set with the other clubs. Check back soon.</p></div>}
      {upcoming.map((g) => <GalaCard key={g.id} g={g} />)}
      {user ? <p><Link className="btn" to="/family">Tell us who's coming</Link></p> : <p className="muted">Families: <Link to="/login">sign in</Link> to tell us if your child can play each gala.</p>}
      {Object.keys(bySeason).sort().reverse().map((s) => (
        <section key={s}>
          <h2>{s} series</h2>
          <div className="table-wrap"><table>
            <thead><tr><th>Date</th><th>Host</th><th>Venue</th></tr></thead>
            <tbody>{bySeason[s].slice().reverse().map((g) => <tr key={g.id}><td>{fmtDate(g.gala_date)}</td><td>{g.host_club}</td><td>{g.venue}</td></tr>)}</tbody>
          </table></div>
        </section>
      ))}
      <p className="muted small">The 2026 draws, pitch maps and results are on the <a href="https://mbscgalas2026.netlify.app" target="_blank" rel="noreferrer">2026 gala site</a>.</p>
    </div>
  )
}

function GalaCard({ g }) {
  return (
    <div className="card gala">
      <div className="date"><b>{fmtDate(g.gala_date, { day: 'numeric' })}</b><span>{fmtDate(g.gala_date, { month: 'short' })}</span></div>
      <div>
        <h3>{g.host_club}</h3>
        <p>{fmtDate(g.gala_date)}{g.start_time ? ` · ${g.start_time}` : ''}</p>
        <p className="muted">{[g.venue, g.address].filter(Boolean).join(', ')}</p>
        {g.info && <p className="pre">{g.info}</p>}
        {g.draw_url && <a href={g.draw_url} target="_blank" rel="noreferrer">Draw & pitch map →</a>}
        {g.signup_closes && <p className="small">Let us know by {fmtDate(g.signup_closes)}</p>}
      </div>
    </div>
  )
}
