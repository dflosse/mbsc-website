import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AGE_GROUPS = ['All', 'U8', 'U10', 'U12', 'U14', 'U16']

const AGE_COLORS = {
  U8:  'bg-sky-100 text-sky-800 border-sky-200',
  U10: 'bg-purple-100 text-purple-800 border-purple-200',
  U12: 'bg-amber-100 text-amber-800 border-amber-200',
  U14: 'bg-rose-100 text-rose-800 border-rose-200',
  U16: 'bg-teal-100 text-teal-800 border-teal-200',
}

function FixtureRow({ fixture }) {
  const d = new Date(fixture.date)
  const isPast = d < new Date()
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border transition-all ${isPast ? 'border-gray-100 opacity-70' : 'border-green-club/20 hover:shadow-md'}`}>
      <div className="flex flex-wrap items-center gap-3">
        {/* Date */}
        <div className="text-center min-w-[56px]">
          <p className="font-black text-2xl text-green-club leading-none">
            {d.toLocaleDateString('en-AU', { day: 'numeric' })}
          </p>
          <p className="text-xs text-gray-400 uppercase">
            {d.toLocaleDateString('en-AU', { month: 'short' })}
          </p>
          <p className="text-xs text-gray-400">
            {d.toLocaleDateString('en-AU', { weekday: 'short' })}
          </p>
        </div>

        {/* Match info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-800">{fixture.home_team}</span>
            <span className="text-gray-400 text-sm font-medium">vs</span>
            <span className="font-bold text-gray-800">{fixture.away_team}</span>
          </div>
          <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
            <span>📍 {fixture.venue}</span>
            <span>⏰ {fixture.time ?? 'TBC'}</span>
            <span>Round {fixture.round}</span>
          </div>
        </div>

        {/* Age group badge */}
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${AGE_COLORS[fixture.age_group] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
          {fixture.age_group}
        </span>

        {/* Home/Away indicator */}
        {fixture.is_home !== null && (
          <span className={`text-xs font-semibold px-2 py-1 rounded ${fixture.is_home ? 'bg-green-club/10 text-green-club' : 'bg-gray-100 text-gray-500'}`}>
            {fixture.is_home ? 'HOME' : 'AWAY'}
          </span>
        )}
      </div>
    </div>
  )
}

export default function Fixtures() {
  const [fixtures, setFixtures] = useState([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('fixtures')
      .select('*')
      .order('date', { ascending: true })
      .then(({ data }) => {
        setFixtures(data ?? [])
        setLoading(false)
      })
  }, [])

  const visible = filter === 'All'
    ? fixtures
    : fixtures.filter(f => f.age_group === filter)

  const today = new Date()
  const upcoming = visible.filter(f => new Date(f.date) >= today)
  const past     = visible.filter(f => new Date(f.date) <  today)

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-800 mb-1">Fixtures &amp; Draw</h1>
        <p className="text-gray-500">2025 Alpine Valleys Junior Season</p>
      </div>

      {/* Age group filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {AGE_GROUPS.map(ag => (
          <button
            key={ag}
            onClick={() => setFilter(ag)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all
              ${filter === ag
                ? 'bg-green-club text-white shadow'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-green-club hover:text-green-club'
              }`}
          >
            {ag}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(n => <div key={n} className="animate-pulse bg-gray-100 h-20 rounded-xl" />)}
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-club inline-block" />
                Upcoming
              </h2>
              <div className="space-y-3">
                {upcoming.map(f => <FixtureRow key={f.id} fixture={f} />)}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                Past
              </h2>
              <div className="space-y-3">
                {past.map(f => <FixtureRow key={f.id} fixture={f} />)}
              </div>
            </section>
          )}

          {visible.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-5xl mb-4">📅</p>
              <p className="font-semibold">No fixtures found for {filter}</p>
              <p className="text-sm">Check back soon or select a different age group.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
