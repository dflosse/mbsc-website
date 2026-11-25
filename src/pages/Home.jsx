import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, fmtDate, REG_SEASON } from '../supabase'
import { useAuth } from '../auth'
import useSettings from '../useSettings'
import { FeesCard } from './About'
import Valley from '../components/Valley'

export default function Home() {
  const { user } = useAuth()
  const s = useSettings()
  const [galas, setGalas] = useState([])
  const [news, setNews] = useState([])
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    supabase.from('galas').select('*').gte('gala_date', today).order('gala_date').limit(3).then(({ data }) => setGalas(data || []))
    supabase.from('posts').select('*').eq('audience', 'public').order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(4).then(({ data }) => setNews(data || []))
  }, [])
  return (
    <>
      <section className="hero">
        <Valley />
        <div className="wrap herotext">
          <h1>Junior football in the Kiewa Valley</h1>
          <p className="lead">MiniRoos for girls and boys aged 4–13. Training at Les Peart Oval, games across the Alpine Valleys gala series. Run by parents since 2003.</p>
          <div className="row">
            {user ? <Link className="btn" to="/family">Go to my family</Link> : <Link className="btn" to="/login">Register for {REG_SEASON}</Link>}
            <Link className="btn ghost" to="/about">About the club</Link>
          </div>
        </div>
      </section>

      <section className="facts-band">
        <div className="wrap facts">
          <Link to="/about"><b>Who plays</b><span>Girls and boys aged 4–13, all abilities</span></Link>
          <Link to="/about"><b>Training</b><span>Wednesdays 4–5pm at Les Peart Oval</span></Link>
          <Link to="/galas"><b>Games</b><span>Alpine Valleys gala days, {REG_SEASON} dates to come</span></Link>
          <Link to="/about#fees"><b>Fees</b><span>{s.fees ? s.fees.split('.')[0] : 'To be confirmed'}</span></Link>
        </div>
      </section>

      <div className="wrap split">
        <section>
          <h2>Club news</h2>
          {news.length === 0 && <p className="muted">Nothing posted yet.</p>}
          {news.map((p) => (
            <article key={p.id} className="story">
              <p className="muted small">{fmtDate(p.created_at.slice(0, 10))}{p.pinned ? ' – pinned' : ''}</p>
              <h3>{p.title}</h3>
              <p className="pre">{p.body}</p>
            </article>
          ))}
          <article className="story">
            <h3>New to the club?</h3>
            <p>Start with <Link to="/about">About the club</Link> for how a season works, age groups, fees and who's on the committee. Registering takes two steps, one with us and one with Football Victoria. <Link to="/football-victoria">Here's how.</Link></p>
          </article>
        </section>
        <aside>
          <h2>Gala days</h2>
          {galas.length === 0 ? (
            <p>The {REG_SEASON} dates will appear here once the Alpine Valleys clubs confirm the fixture. <Link to="/galas">How gala days work</Link></p>
          ) : galas.map((g) => (
            <div key={g.id} className="gala">
              <div className="date"><b>{fmtDate(g.gala_date, { day: 'numeric' })}</b><span>{fmtDate(g.gala_date, { month: 'short' })}</span></div>
              <div><h3>{g.host_club}</h3><p className="muted">{g.venue}{g.start_time ? `, ${g.start_time}` : ''}</p></div>
            </div>
          ))}
          <FeesCard s={s} compact />
        </aside>
      </div>
    </>
  )
}
