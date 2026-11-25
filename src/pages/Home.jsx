import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, fmtDate, REG_SEASON } from '../supabase'
import { useAuth } from '../auth'
import useSettings from '../useSettings'
import { FeesCard } from './About'
import Contours from '../components/Contours'

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
      <section className="trailhead">
        <Contours />
        <div className="inner">
          <span className="marker"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 0 L12 12 H0 Z" fill="currentColor" /></svg>Est. 2003</span>
          <h1>Mount Beauty Football Club</h1>
        </div>
      </section>

      <div className="wrap">
        <div className="intro">
          <p>Junior football for girls and boys aged 4 to 13. One training a week and gala days around the Alpine Valleys, run by local families.</p>
          <div>
            {user ? <Link className="cta" to="/family">Go to my family <Arrow /></Link> : <Link className="cta" to="/login">Register for {REG_SEASON} <Arrow /></Link>}
            <Link className="cta alt" to="/about">About the club <Arrow /></Link>
          </div>
        </div>

        <div className="home-cols">
          <section>
            <h2>Gala days</h2>
            {galas.length === 0 ? (
              <div className="card"><p style={{ margin: 0 }}>The {REG_SEASON} dates go up here once the Alpine Valleys clubs confirm the fixture. <Link to="/galas">How gala days work</Link></p></div>
            ) : (
              <div className="signboard">
                {galas.map((g) => (
                  <div key={g.id} className="gala">
                    <div><h3>{g.host_club}</h3><div className="sub">{g.venue}{g.start_time ? `, ${g.start_time}` : ''}</div></div>
                    <div className="when">{fmtDate(g.gala_date, { day: 'numeric', month: 'short' })}</div>
                  </div>
                ))}
              </div>
            )}

            <h2>The season at a glance</h2>
            <div className="glance">
              <Link to="/about"><Icon d="M14 3a11 11 0 1 0 0 22 11 11 0 0 0 0-22zM14 8v6l4 3" /><div><b>Wednesdays, 4 to 5pm</b><span>Training, School Term 2</span></div></Link>
              <Link to="/teams"><Icon d="M3 23 L11 9 L16 17 L19 12 L25 23 Z" /><div><b>Ages 4 to 13</b><span>Squads by age, girls and boys</span></div></Link>
              <Link to="/about#fees"><Icon d="M4 7h20v14H4zM4 12h20" /><div><b>{!s.fees || /^tba/i.test(s.fees) ? 'Fee to be confirmed' : s.fees.split(/[.(]/)[0].trim()}</b><span>Paid through Football Victoria's PlayFootball</span></div></Link>
            </div>
          </section>

          <section>
            <h2>Club news</h2>
            {news.length === 0 && <p className="muted">Nothing posted yet.</p>}
            {news.map((p) => (
              <article key={p.id} className="story">
                <p className="muted small" style={{ margin: '0 0 4px' }}>{fmtDate(p.created_at.slice(0, 10))}{p.pinned ? ', pinned' : ''}</p>
                <h3>{p.title}</h3>
                <p className="pre">{p.body}</p>
              </article>
            ))}
            <article className="story">
              <h3>New to the club?</h3>
              <p>Start with <Link to="/about">About the club</Link> for how a season works, age groups, fees and who's on the committee. Registering takes two steps, one with us and one with Football Victoria. <Link to="/football-victoria">Here's how.</Link></p>
            </article>
            <FeesCard s={s} compact />
          </section>
        </div>
      </div>
    </>
  )
}

function Arrow() {
  return <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M5 11h12M12 5l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.6" /></svg>
}

function Icon({ d }) {
  return <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><path d={d} fill="none" stroke="#1e3b2f" strokeWidth="2.2" strokeLinejoin="round" /></svg>
}
