import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AGE_GROUPS = ['U8', 'U10', 'U12', 'U14', 'U16']

const POSITIONS = ['GK', 'DEF', 'MID', 'FWD']

const POSITION_COLORS = {
  GK:  'bg-yellow-100 text-yellow-800',
  DEF: 'bg-blue-100 text-blue-800',
  MID: 'bg-green-100 text-green-800',
  FWD: 'bg-rose-100 text-rose-800',
}

function CoachCard({ coach }) {
  return (
    <div className="bg-gradient-to-br from-green-club to-green-mid rounded-xl p-5 text-white flex gap-4 items-center">
      <div className="w-16 h-16 rounded-full bg-gold flex items-center justify-center text-green-club font-black text-xl flex-shrink-0">
        {coach.name.split(' ').map(w => w[0]).join('').slice(0,2)}
      </div>
      <div>
        <p className="font-bold text-lg">{coach.name}</p>
        <p className="text-gold text-sm">{coach.role ?? 'Head Coach'} · {coach.age_group}</p>
        {coach.phone && <p className="text-green-light text-sm mt-1">📞 {coach.phone}</p>}
        {coach.email && <p className="text-green-light text-sm">✉️ {coach.email}</p>}
        {coach.bio && <p className="text-white/80 text-sm mt-2">{coach.bio}</p>}
      </div>
    </div>
  )
}

function RosterTable({ players }) {
  if (players.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-6">No players registered yet.</p>
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-gray-400 text-xs uppercase">
            <th className="py-2 pr-4">#</th>
            <th className="py-2 pr-4">Name</th>
            <th className="py-2 pr-4">Position</th>
            <th className="py-2">Parent</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {players
            .slice()
            .sort((a, b) => (a.jersey_number ?? 99) - (b.jersey_number ?? 99))
            .map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="py-2 pr-4 font-black text-green-club">
                  {p.jersey_number ?? '—'}
                </td>
                <td className="py-2 pr-4 font-semibold text-gray-800">{p.player_name}</td>
                <td className="py-2 pr-4">
                  {p.position ? (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${POSITION_COLORS[p.position] ?? 'bg-gray-100 text-gray-600'}`}>
                      {p.position}
                    </span>
                  ) : '—'}
                </td>
                <td className="py-2 text-gray-500">{p.parent_name ?? '—'}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Teams() {
  const [selected, setSelected] = useState('U12')
  const [rosters, setRosters] = useState({})
  const [coaches, setCoaches] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('rosters').select('*').order('player_name'),
      supabase.from('coaches').select('*').order('age_group'),
    ]).then(([{ data: rs }, { data: cs }]) => {
      const rMap = {}
      ;(rs ?? []).forEach(p => {
        if (!rMap[p.age_group]) rMap[p.age_group] = []
        rMap[p.age_group].push(p)
      })
      const cMap = {}
      ;(cs ?? []).forEach(c => {
        if (!cMap[c.age_group]) cMap[c.age_group] = []
        cMap[c.age_group].push(c)
      })
      setRosters(rMap)
      setCoaches(cMap)
      setLoading(false)
    })
  }, [])

  const teamCoaches = coaches[selected] ?? []
  const teamPlayers = rosters[selected] ?? []

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-black text-gray-800 mb-1">Mt Beauty Teams</h1>
      <p className="text-gray-500 mb-8">Rosters and coaching staff for the 2025 season</p>

      {/* Age group tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {AGE_GROUPS.map(ag => (
          <button
            key={ag}
            onClick={() => setSelected(ag)}
            className={`px-5 py-2 rounded-full font-bold transition-all
              ${selected === ag
                ? 'bg-green-club text-white shadow-md'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-green-club hover:text-green-club'
              }`}
          >
            {ag}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="animate-pulse bg-gray-100 h-28 rounded-xl" />
          <div className="animate-pulse bg-gray-100 h-64 rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Coach cards */}
          {teamCoaches.length > 0 ? (
            <div className="space-y-4">
              {teamCoaches.map(c => <CoachCard key={c.id} coach={c} />)}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-400 text-center">
              Coach information coming soon.
            </div>
          )}

          {/* Roster */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">{selected} Roster</h2>
              <span className="text-sm text-gray-400">{teamPlayers.length} players</span>
            </div>
            <RosterTable players={teamPlayers} />
          </div>

          {/* Position legend */}
          <div className="flex flex-wrap gap-2 text-xs">
            {POSITIONS.map(pos => (
              <span key={pos} className={`px-3 py-1 rounded-full font-semibold ${POSITION_COLORS[pos]}`}>
                {pos === 'GK' ? 'Goalkeeper' : pos === 'DEF' ? 'Defender' : pos === 'MID' ? 'Midfielder' : 'Forward'}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
