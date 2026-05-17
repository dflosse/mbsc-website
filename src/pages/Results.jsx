import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AGE_GROUPS = ['All', 'U8', 'U10', 'U12', 'U14', 'U16']

const AGE_COLORS = {
  U8:  'bg-sky-100 text-sky-800',
  U10: 'bg-purple-100 text-purple-800',
  U12: 'bg-amber-100 text-amber-800',
  U14: 'bg-rose-100 text-rose-800',
  U16: 'bg-teal-100 text-teal-800',
}

function ResultCard({ result }) {
  const { fixtures: fixture } = result
  if (!fixture) return null

  const home = result.home_score ?? 0
  const away = result.away_score ?? 0
  const mbscIsHome = fixture.home_team === 'Mt Beauty SC'
  const mbscScore  = mbscIsHome ? home : away
  const oppScore   = mbscIsHome ? away : home
  const outcome    = mbscScore > oppScore ? 'W' : mbscScore === oppScore ? 'D' : 'L'

  const outcomeCfg = {
    W: { bg: 'bg-green-50 border-green-200', badge: 'bg-green-club text-white', label: 'WIN' },
    D: { bg: 'bg-gray-50 border-gray-200',  badge: 'bg-gray-500 text-white',    label: 'DRAW' },
    L: { bg: 'bg-red-50 border-red-200',    badge: 'bg-red-600 text-white',     label: 'LOSS' },
  }[outcome]

  const d = new Date(fixture.date)

  return (
    <article className={`rounded-xl border p-5 ${outcomeCfg.bg}`}>
      <div className="flex items-start gap-4">
        {/* Outcome badge */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${outcomeCfg.badge}`}>
          {outcomeCfg.label}
        </div>

        <div className="flex-1 min-w-0">
          {/* Score line */}
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <span className="font-bold text-gray-800">{fixture.home_team}</span>
            <span className="text-2xl font-black text-green-club">
              {result.home_score ?? '–'} – {result.away_score ?? '–'}
            </span>
            <span className="font-bold text-gray-800">{fixture.away_team}</span>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-3">
            <span>
              {d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span>Rd {fixture.round} · {fixture.venue}</span>
            <span className={`font-semibold px-2 py-0.5 rounded-full ${AGE_COLORS[fixture.age_group] ?? 'bg-gray-100 text-gray-600'}`}>
              {fixture.age_group}
            </span>
          </div>

          {/* Scorers */}
          {result.scorers?.length > 0 && (
            <div className="bg-white/60 rounded-lg px-3 py-2 mb-2">
              <p className="text-xs font-semibold text-gray-500 mb-1">Scorers</p>
              <div className="flex flex-wrap gap-2">
                {result.scorers.map((s, i) => (
                  <span key={i} className="text-sm flex items-center gap-1">
                    <span>⚽</span> {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Special moment */}
          {result.special_moment && (
            <div className="bg-gold/10 border border-gold/30 rounded-lg px-3 py-2">
              <p className="text-xs font-semibold text-gold-dark mb-0.5">⭐ Moment of the Match</p>
              <p className="text-sm text-gray-700">{result.special_moment}</p>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default function Results() {
  const [results, setResults] = useState([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('results')
      .select('*, fixtures(*)')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setResults(data ?? [])
        setLoading(false)
      })
  }, [])

  const visible = filter === 'All'
    ? results
    : results.filter(r => r.fixtures?.age_group === filter)

  const wins  = visible.filter(r => {
    const mbscH = r.fixtures?.home_team === 'Mt Beauty SC'
    const ms = mbscH ? r.home_score : r.away_score
    const os = mbscH ? r.away_score : r.home_score
    return ms > os
  }).length
  const draws = visible.filter(r => r.home_score === r.away_score).length
  const losses = visible.length - wins - draws

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-gray-800 mb-1">Results</h1>
      <p className="text-gray-500 mb-6">Season record and match reports</p>

      {/* Summary bar */}
      {!loading && visible.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[['Wins', wins, 'text-green-club'], ['Draws', draws, 'text-gray-500'], ['Losses', losses, 'text-red-500']].map(([label, val, cls]) => (
            <div key={label} className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
              <p className={`text-3xl font-black ${cls}`}>{val}</p>
              <p className="text-xs text-gray-400 uppercase font-semibold">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
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
        <div className="space-y-4">
          {[1,2,3].map(n => <div key={n} className="animate-pulse bg-gray-100 h-36 rounded-xl" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-4">🏆</p>
          <p className="font-semibold">No results yet</p>
          <p className="text-sm">Results will appear here after each match day.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {visible.map(r => <ResultCard key={r.id} result={r} />)}
        </div>
      )}
    </div>
  )
}
