import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, fmtDate, REG_SEASON } from '../supabase'
import { useAuth } from '../auth'
import useSettings, { useKeyDates } from '../useSettings'
import Contours from '../components/Contours'

// Family-first home page. Everything here comes from data the committee already edits:
// fees/training/contact → Fees & settings; dates → Preseason key dates; galas → Galas; news → Messages.
export default function Home() {
  const { user } = useAuth()
  const s = useSettings()
  const dates = useKeyDates()
  const [galas, setGalas] = useState([])
  const [news, setNews] = useState([])
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    supabase.from('galas').select('*').gte('gala_date', today).order('gala_date').limit(5).then(({ data }) => setGalas(data || []))
    supabase.from('posts').select('*').eq('audience', 'public').order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(3).then(({ data }) => setNews(data || []))
  }, [])
  const today = new Date().toISOString().slice(0, 10)
  const shown = (dates || []).filter((d) => d.public !== false && (!d.on_date || d.on_date >= today))
  const fee = !s.fees || /^tba/i.test(s.fees) ? null : s.fees.split(/[.(]/)[0].trim()
  const mapUrl = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Les Peart Oval, Mount Beauty VIC')

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
        <section className="welcome">
          <div>
            <p className="welcome-lead">Junior football for girls and boys aged 4 to 13. One training a week in term 2 and gala days around the Alpine Valleys, run by local families.</p>
            <div className="welcome-ctas">
              {user
                ? <Link className="cta" to="/family">Go to My family <Arrow /></Link>
                : <Link className="cta" to="/login?mode=signup">Register your child for {REG_SEASON} <Arrow /></Link>}
              {!user && <Link className="cta alt" to="/login">Already registered? Sign in</Link>}
            </div>
          </div>
          <Link to="/about#fees" className="fee-card">
            <span className="small">{REG_SEASON} season</span>
            <b>{fee || 'Fee to be confirmed'}</b>
            <span>Paid through Football Victoria's PlayFootball. Club uniforms are lent for the season. <u>Fees and what's included</u></span>
          </Link>
        </section>

        {shown.length > 0 && (
          <section className="home-dates" aria-labelledby="kd">
            <h2 id="kd">Key dates</h2>
            <ol>
              {shown.map((d) => (
                <li key={d.id}>
                  <span className="when">{d.on_date ? fmtDate(d.on_date, { weekday: 'short', day: 'numeric', month: 'short' }) : 'TBA'}</span>
                  <span className="what">{d.label}</span>
                  {d.notes && <span className="note">{d.notes}</span>}
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className="new-here" aria-labelledby="nh">
          <h2 id="nh">New to the club? Three steps</h2>
          <ol className="three">
            <li><b>Register with the club</b><span>Create an account on this site and add your child. It takes about five minutes.</span>{!user && <Link to="/login?mode=signup">Start now</Link>}</li>
            <li><b>Register on PlayFootball</b><span>Football Victoria's system, where you pay the fee and your child is insured.</span><Link to="/football-victoria">How it works</Link></li>
            <li><b>Come to training</b><span>{s.training}, {s.training_term}. Your coach will be in touch about your team.</span><a href={mapUrl} target="_blank" rel="noreferrer">Map to the ground</a></li>
          </ol>
        </section>

        <div className="home-cols">
          <section>
            <h2>Where and when</h2>
            <div className="card where">
              <p><b>Training:</b> {s.training}, {s.training_term}</p>
              <p><b>Where:</b> {s.ground} · <a href={mapUrl} target="_blank" rel="noreferrer">Open map</a></p>
              <p><b>Games:</b> Alpine Valleys gala days with Bright, Myrtleford and Yackandandah. Short games, no ladders. <Link to="/galas">How gala days work</Link></p>
            </div>

            <h2>Gala days</h2>
            {galas.length === 0 ? (
              <div className="card"><p style={{ margin: 0 }}>The {REG_SEASON} dates go up here once the Alpine Valleys clubs confirm the fixture.</p></div>
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
          </section>

          <section>
            <div className="card help-out">
              <h2>Coach or help out</h2>
              <p>Every team needs a parent coach and an assistant, and gala days need helpers. No experience needed – Football Victoria runs free coaching courses.</p>
              <Link className="btn" to="/volunteer">Put your hand up</Link>
            </div>

            <div className="card">
              <h2>Contact the club</h2>
              <p><a href={`mailto:${s.club_email}`}>{s.club_email}</a></p>
              {s.facebook_url && <p><a href={s.facebook_url} target="_blank" rel="noreferrer">Club Facebook page</a></p>}
              <p className="muted small">Questions about registration, teams or volunteering – we're all volunteers, so allow a day or two.</p>
            </div>

            {news.length > 0 && <>
              <h2>Club news</h2>
              {news.map((p) => (
                <article key={p.id} className="story">
                  <p className="muted small" style={{ margin: '0 0 4px' }}>{fmtDate(p.created_at.slice(0, 10))}{p.pinned ? ', pinned' : ''}</p>
                  <h3>{p.title}</h3>
                  <p className="pre">{p.body}</p>
                </article>
              ))}
            </>}
          </section>
        </div>
      </div>
    </>
  )
}

function Arrow() {
  return <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><path d="M5 11h12M12 5l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.6" /></svg>
}
