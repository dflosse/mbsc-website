import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import WeatherWidget from '../components/WeatherWidget'

const AGE_COLORS = {
  U8:  'bg-sky-100 text-sky-800',
  U10: 'bg-purple-100 text-purple-800',
  U12: 'bg-amber-100 text-amber-800',
  U14: 'bg-rose-100 text-rose-800',
  U16: 'bg-teal-100 text-teal-800',
}

function FixtureCard({ fixture }) {
  const d = new Date(fixture.date)
  const dateStr = d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex gap-4 items-center">
      <div className="text-center min-w-[52px]">
        <p className="text-green-club font-bold text-lg leading-none">
          {d.toLocaleDateString('en-AU', { day: 'numeric' })}
        </p>
        <p className="text-gray-400 text-xs uppercase">
          {d.toLocaleDateString('en-AU', { month: 'short' })}
        </p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 truncate">{fixture.home_team} vs {fixture.away_team}</p>
        <p className="text-sm text-gray-500">{fixture.venue} · Rd {fixture.round} · {fixture.time ?? ''}</p>
      </div>
      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${AGE_COLORS[fixture.age_group] ?? 'bg-gray-100 text-gray-700'}`}>
        {fixture.age_group}
      </span>
    </div>
  )
}

function ResultCard({ result, fixture }) {
  if (!fixture) return null
  const home = result.home_score ?? '–'
  const away = result.away_score ?? '–'
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">{fixture.home_team}</span>
        <span className="text-xl font-black text-green-club">{home} – {away}</span>
        <span className="text-sm font-semibold text-gray-700">{fixture.away_team}</span>
      </div>
      {result.scorers?.length > 0 && (
        <p className="text-xs text-gray-500">⚽ {result.scorers.join(', ')}</p>
      )}
      {result.special_moment && (
        <p className="text-xs text-gold-dark mt-1">⭐ {result.special_moment}</p>
      )}
      <span className={`mt-2 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${AGE_COLORS[fixture.age_group] ?? 'bg-gray-100 text-gray-700'}`}>
        {fixture.age_group}
      </span>
    </div>
  )
}

export default function Home() {
  const [fixtures, setFixtures] = useState([])
  const [results, setResults] = useState([])
  const [fixturesMap, setFixturesMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    Promise.all([
      supabase
        .from('fixtures')
        .select('*')
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(5),
      supabase
        .from('results')
        .select('*, fixtures(*)')
        .order('created_at', { ascending: false })
        .limit(4),
    ]).then(([{ data: fx }, { data: rs }]) => {
      setFixtures(fx ?? [])
      const map = {}
      rs?.forEach(r => { if (r.fixtures) map[r.fixture_id] = r.fixtures })
      setResults(rs ?? [])
      setFixturesMap(map)
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-club via-green-mid to-green-club text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-gold text-green-club text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">
            2025 Season
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 leading-tight">
            Mt Beauty Soccer Club
          </h1>
          <p className="text-green-light text-lg md:text-xl mb-8">
            Junior football in the heart of the Alpine Valleys
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/fixtures" className="bg-gold text-green-club font-bold px-6 py-3 rounded-full hover:bg-gold-dark transition-colors">
              View Fixtures
            </Link>
            <Link to="/teams" className="border-2 border-white text-white font-bold px-6 py-3 rounded-full hover:bg-white hover:text-green-club transition-colors">
              Our Teams
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: weather + upcoming */}
        <div className="lg:col-span-2 space-y-6">
          <WeatherWidget />

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-gray-800">Upcoming Fixtures</h2>
              <Link to="/fixtures" className="text-sm text-green-mid font-semibold hover:underline">
                Full draw →
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(n => <div key={n} className="animate-pulse bg-gray-100 h-16 rounded-xl" />)}
              </div>
            ) : fixtures.length === 0 ? (
              <p className="text-gray-400 text-sm">No upcoming fixtures scheduled.</p>
            ) : (
              <div className="space-y-3">
                {fixtures.map(f => <FixtureCard key={f.id} fixture={f} />)}
              </div>
            )}
          </section>
        </div>

        {/* Right: results + quick links */}
        <div className="space-y-6">
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-gray-800">Latest Results</h2>
              <Link to="/results" className="text-sm text-green-mid font-semibold hover:underline">
                All →
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1,2].map(n => <div key={n} className="animate-pulse bg-gray-100 h-24 rounded-xl" />)}
              </div>
            ) : results.length === 0 ? (
              <p className="text-gray-400 text-sm">No results yet this season.</p>
            ) : (
              <div className="space-y-3">
                {results.map(r => (
                  <ResultCard key={r.id} result={r} fixture={r.fixtures} />
                ))}
              </div>
            )}
          </section>

          <section className="bg-gold/10 border border-gold/30 rounded-xl p-5">
            <h2 className="font-bold text-gray-800 mb-3">Club Info</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>📍 Mt Beauty Recreational Reserve</li>
              <li>🏆 Alpine Valleys Junior League</li>
              <li>👕 Green &amp; Gold</li>
              <li>📅 Season: March – September</li>
            </ul>
          </section>

          <section className="bg-green-club/5 border border-green-club/10 rounded-xl p-5">
            <h2 className="font-bold text-gray-800 mb-3">Quick Links</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {[
                ['/pitch',   '🗺️ Ground Map'],
                ['/photos',  '📸 Photos'],
                ['/board',   '💬 Message Board'],
                ['/coach',   '🔐 Coach Portal'],
              ].map(([to, label]) => (
                <Link key={to} to={to} className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-center font-medium text-gray-700 hover:border-green-club hover:text-green-club transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
