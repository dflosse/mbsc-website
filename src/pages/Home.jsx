import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, fmtDate, REG_SEASON } from '../supabase'
import { useAuth } from '../auth'
import useSettings from '../useSettings'
import { FeesCard } from './About'
import crest from '../assets/crest.png'

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
        <div className="wrap herogrid">
          <div>
            <p className="eyebrow">Junior soccer · Kiewa Valley · since 2003</p>
            <h1>Mount Beauty Football Club</h1>
            <p className="lead">Fun, friendly MiniRoos soccer for kids aged 4–13. Training at Les Peart Oval, games in the Alpine Valleys gala series.</p>
            <div className="row">
              {user ? <Link className="btn" to="/family">Go to my family</Link> : <Link className="btn" to="/login">Register for {REG_SEASON}</Link>}
              <Link className="btn ghost" to="/about">About the club</Link>
            </div>
          </div>
          <img src={crest} alt="Mount Beauty Football Club crest" className="herocrest" />
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <div className="facts">
            <Link to="/about"><b>Who</b><span>Boys and girls aged 4–13</span></Link>
            <Link to="/about"><b>Training</b><span>Wednesdays 4–5pm, Les Peart Oval</span></Link>
            <Link to="/galas"><b>Games</b><span>Alpine Valleys gala days – {REG_SEASON} dates TBA</span></Link>
            <Link to="/about#fees"><b>Fees</b><span>{s.fees ? s.fees.split('.')[0] : 'TBA'}</span></Link>
          </div>
        </div>
      </section>

      <div className="wrap grid2">
        <section>
          <h2>Club news</h2>
          {news.length === 0 && <p className="muted">No news yet.</p>}
          {news.map((p) => (
            <article key={p.id} className="card">
              {p.pinned && <span className="tag">Pinned</span>}
              <h3>{p.title}</h3>
              <p className="pre">{p.body}</p>
              <p className="muted small">{fmtDate(p.created_at.slice(0, 10))}</p>
            </article>
          ))}
          <div className="card soft">
            <h3>New to the club?</h3>
            <p>Read <Link to="/about">About the club</Link> for how a season works, age groups, fees and who's on the committee. Registration happens here and through Football Victoria – <Link to="/football-victoria">here's how</Link>.</p>
          </div>
        </section>
        <section>
          <h2>Gala days</h2>
          {galas.length === 0 ? (
            <div className="card"><p><b>{REG_SEASON} dates TBA.</b> They'll appear here once the Alpine Valleys clubs confirm the fixture.</p><Link to="/galas">About gala days →</Link></div>
          ) : galas.map((g) => (
            <div key={g.id} className="card gala">
              <div className="date"><b>{fmtDate(g.gala_date, { day: 'numeric' })}</b><span>{fmtDate(g.gala_date, { month: 'short' })}</span></div>
              <div><h3>{g.host_club}</h3><p className="muted">{g.venue}{g.start_time ? ` · ${g.start_time}` : ''}</p></div>
            </div>
          ))}
          <FeesCard s={s} compact />
        </section>
      </div>
    </>
  )
}
