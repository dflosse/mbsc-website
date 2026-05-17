import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const COACH_PASSWORD = import.meta.env.VITE_COACH_PASSWORD ?? 'mbsc2025'
const SESSION_KEY = 'mbsc_coach_auth'

const AGE_GROUPS = ['U8', 'U10', 'U12', 'U14', 'U16']
const POSITIONS  = ['GK', 'DEF', 'MID', 'FWD']
const TABS = ['Rosters', 'Coaches', 'Fixtures', 'Messages']

// ─── Login ───────────────────────────────────────────────────────────────────
function LoginGate({ onLogin }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)

  const attempt = (e) => {
    e.preventDefault()
    if (pw === COACH_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1')
      onLogin()
    } else {
      setError(true)
      setPw('')
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-full bg-green-club flex items-center justify-center text-white text-2xl mx-auto mb-6">
          🔐
        </div>
        <h1 className="text-2xl font-black text-gray-800 mb-2">Coach Portal</h1>
        <p className="text-gray-500 text-sm mb-6">
          Enter the shared coach password to manage rosters, fixtures and messages.
        </p>
        <form onSubmit={attempt} className="space-y-4">
          <input
            type="password"
            value={pw}
            onChange={e => { setPw(e.target.value); setError(false) }}
            placeholder="Password"
            autoFocus
            className={`w-full border rounded-xl px-4 py-3 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-green-club transition
              ${error ? 'border-red-400 focus:ring-red-400' : 'border-gray-200'}`}
          />
          {error && <p className="text-red-500 text-sm">Incorrect password. Try again.</p>}
          <button
            type="submit"
            className="w-full bg-green-club text-white font-bold py-3 rounded-xl hover:bg-green-mid transition-colors"
          >
            Sign In
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-4">
          Contact the club admin if you need the password.
        </p>
      </div>
    </div>
  )
}

// ─── Roster Manager ──────────────────────────────────────────────────────────
function RosterManager() {
  const [ageGroup, setAgeGroup] = useState('U12')
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ player_name: '', jersey_number: '', position: '', parent_name: '', parent_phone: '' })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)

  const load = () => {
    setLoading(true)
    supabase.from('rosters').select('*').eq('age_group', ageGroup).order('player_name')
      .then(({ data }) => { setPlayers(data ?? []); setLoading(false) })
  }

  useEffect(() => { load() }, [ageGroup])

  const save = async (e) => {
    e.preventDefault()
    if (!form.player_name.trim()) return
    setSaving(true)
    const payload = { ...form, age_group: ageGroup, jersey_number: form.jersey_number ? Number(form.jersey_number) : null }
    if (editId) {
      await supabase.from('rosters').update(payload).eq('id', editId)
    } else {
      await supabase.from('rosters').insert(payload)
    }
    setSaving(false)
    setForm({ player_name: '', jersey_number: '', position: '', parent_name: '', parent_phone: '' })
    setEditId(null)
    load()
  }

  const remove = async (id) => {
    if (!confirm('Remove this player?')) return
    await supabase.from('rosters').delete().eq('id', id)
    load()
  }

  const startEdit = (p) => {
    setEditId(p.id)
    setForm({ player_name: p.player_name, jersey_number: p.jersey_number ?? '', position: p.position ?? '', parent_name: p.parent_name ?? '', parent_phone: p.parent_phone ?? '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {AGE_GROUPS.map(ag => (
          <button key={ag} onClick={() => { setAgeGroup(ag); setEditId(null); setForm({ player_name: '', jersey_number: '', position: '', parent_name: '', parent_phone: '' }) }}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${ageGroup === ag ? 'bg-green-club text-white' : 'bg-gray-100 text-gray-600 hover:bg-green-club/10'}`}>
            {ag}
          </button>
        ))}
      </div>

      {/* Add / Edit form */}
      <form onSubmit={save} className="bg-green-club/5 border border-green-club/10 rounded-xl p-5">
        <h3 className="font-bold text-gray-700 mb-4">{editId ? 'Edit Player' : 'Add Player'} – {ageGroup}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <input placeholder="Full Name *" value={form.player_name} onChange={e => setForm(f => ({...f, player_name: e.target.value}))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-club" required />
          <input placeholder="Jersey #" type="number" min="1" max="99" value={form.jersey_number} onChange={e => setForm(f => ({...f, jersey_number: e.target.value}))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-club" />
          <select value={form.position} onChange={e => setForm(f => ({...f, position: e.target.value}))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-club bg-white">
            <option value="">Position</option>
            {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <input placeholder="Parent/Guardian Name" value={form.parent_name} onChange={e => setForm(f => ({...f, parent_name: e.target.value}))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-club" />
          <input placeholder="Parent Phone" value={form.parent_phone} onChange={e => setForm(f => ({...f, parent_phone: e.target.value}))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-club" />
        </div>
        <div className="flex gap-2 mt-3">
          <button type="submit" disabled={saving} className="bg-green-club text-white font-semibold px-5 py-2 rounded-lg text-sm hover:bg-green-mid disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : editId ? 'Update Player' : 'Add Player'}
          </button>
          {editId && <button type="button" onClick={() => { setEditId(null); setForm({ player_name: '', jersey_number: '', position: '', parent_name: '', parent_phone: '' }) }}
            className="border border-gray-200 text-gray-600 font-semibold px-5 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            Cancel
          </button>}
        </div>
      </form>

      {/* Players table */}
      {loading ? <div className="animate-pulse bg-gray-100 h-40 rounded-xl" /> : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {players.length === 0 ? (
            <p className="text-center py-10 text-gray-400 text-sm">No players in {ageGroup} yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-xs text-gray-500 uppercase">
                  {['#', 'Name', 'Pos', 'Parent', 'Phone', ''].map(h => (
                    <th key={h} className="py-2.5 px-3 text-left font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {players.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="py-2 px-3 font-black text-green-club">{p.jersey_number ?? '—'}</td>
                    <td className="py-2 px-3 font-semibold text-gray-800">{p.player_name}</td>
                    <td className="py-2 px-3">{p.position ?? '—'}</td>
                    <td className="py-2 px-3 text-gray-500">{p.parent_name ?? '—'}</td>
                    <td className="py-2 px-3 text-gray-500">{p.parent_phone ?? '—'}</td>
                    <td className="py-2 px-3">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(p)} className="text-xs text-green-club hover:underline font-semibold">Edit</button>
                        <button onClick={() => remove(p.id)} className="text-xs text-red-500 hover:underline font-semibold">Remove</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Coach Manager ───────────────────────────────────────────────────────────
function CoachManager() {
  const [coaches, setCoaches] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: '', age_group: 'U12', role: 'Head Coach', phone: '', email: '', bio: '' })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)

  const load = () => {
    setLoading(true)
    supabase.from('coaches').select('*').order('age_group')
      .then(({ data }) => { setCoaches(data ?? []); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const save = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    if (editId) {
      await supabase.from('coaches').update(form).eq('id', editId)
    } else {
      await supabase.from('coaches').insert(form)
    }
    setSaving(false)
    setForm({ name: '', age_group: 'U12', role: 'Head Coach', phone: '', email: '', bio: '' })
    setEditId(null)
    load()
  }

  const remove = async (id) => {
    if (!confirm('Remove this coach?')) return
    await supabase.from('coaches').delete().eq('id', id)
    load()
  }

  const startEdit = (c) => {
    setEditId(c.id)
    setForm({ name: c.name, age_group: c.age_group, role: c.role ?? 'Head Coach', phone: c.phone ?? '', email: c.email ?? '', bio: c.bio ?? '' })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="bg-green-club/5 border border-green-club/10 rounded-xl p-5">
        <h3 className="font-bold text-gray-700 mb-4">{editId ? 'Edit Coach' : 'Add Coach'}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <input placeholder="Coach Name *" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-club" required />
          <select value={form.age_group} onChange={e => setForm(f => ({...f, age_group: e.target.value}))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-club bg-white">
            {AGE_GROUPS.map(ag => <option key={ag} value={ag}>{ag}</option>)}
          </select>
          <input placeholder="Role (e.g. Head Coach)" value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-club" />
          <input placeholder="Phone" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-club" />
          <input placeholder="Email" type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-club" />
          <textarea placeholder="Short bio..." value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))} rows={2}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-club resize-none col-span-2 md:col-span-3" />
        </div>
        <div className="flex gap-2 mt-3">
          <button type="submit" disabled={saving} className="bg-green-club text-white font-semibold px-5 py-2 rounded-lg text-sm hover:bg-green-mid disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : editId ? 'Update' : 'Add Coach'}
          </button>
          {editId && <button type="button" onClick={() => { setEditId(null); setForm({ name: '', age_group: 'U12', role: 'Head Coach', phone: '', email: '', bio: '' }) }}
            className="border border-gray-200 text-gray-600 font-semibold px-5 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>}
        </div>
      </form>

      {loading ? <div className="animate-pulse bg-gray-100 h-40 rounded-xl" /> : (
        <div className="space-y-3">
          {coaches.length === 0 ? <p className="text-gray-400 text-sm text-center py-8">No coaches added yet.</p> : coaches.map(c => (
            <div key={c.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4">
              <div>
                <p className="font-bold text-gray-800">{c.name}</p>
                <p className="text-sm text-gray-500">{c.role} · {c.age_group} · {c.phone} · {c.email}</p>
              </div>
              <div className="ml-auto flex gap-2">
                <button onClick={() => startEdit(c)} className="text-xs text-green-club hover:underline font-semibold">Edit</button>
                <button onClick={() => remove(c.id)} className="text-xs text-red-500 hover:underline font-semibold">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Fixture Manager ─────────────────────────────────────────────────────────
function FixtureManager() {
  const [fixtures, setFixtures] = useState([])
  const [loading, setLoading] = useState(true)
  const empty = { round: '', date: '', time: '', home_team: 'Mt Beauty SC', away_team: '', age_group: 'U12', venue: 'Mt Beauty Rec Reserve', is_home: true }
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState(null)
  const [resultForm, setResultForm] = useState({})
  const [savingResult, setSavingResult] = useState(null)

  const load = () => {
    setLoading(true)
    supabase.from('fixtures').select('*, results(*)').order('date', { ascending: true })
      .then(({ data }) => { setFixtures(data ?? []); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const save = async (e) => {
    e.preventDefault()
    if (!form.date || !form.away_team) return
    setSaving(true)
    const payload = { ...form, round: Number(form.round) }
    if (editId) {
      await supabase.from('fixtures').update(payload).eq('id', editId)
    } else {
      await supabase.from('fixtures').insert(payload)
    }
    setSaving(false)
    setForm(empty)
    setEditId(null)
    load()
  }

  const remove = async (id) => {
    if (!confirm('Delete this fixture?')) return
    await supabase.from('fixtures').delete().eq('id', id)
    load()
  }

  const saveResult = async (fixtureId) => {
    const rf = resultForm[fixtureId] ?? {}
    setSavingResult(fixtureId)
    const scorers = rf.scorers ? rf.scorers.split(',').map(s => s.trim()).filter(Boolean) : []
    const existing = fixtures.find(f => f.id === fixtureId)?.results?.[0]
    if (existing) {
      await supabase.from('results').update({ home_score: Number(rf.home_score ?? 0), away_score: Number(rf.away_score ?? 0), scorers, special_moment: rf.special_moment ?? '' }).eq('id', existing.id)
    } else {
      await supabase.from('results').insert({ fixture_id: fixtureId, home_score: Number(rf.home_score ?? 0), away_score: Number(rf.away_score ?? 0), scorers, special_moment: rf.special_moment ?? '' })
    }
    setSavingResult(null)
    load()
  }

  return (
    <div className="space-y-6">
      {/* Add/Edit fixture form */}
      <form onSubmit={save} className="bg-green-club/5 border border-green-club/10 rounded-xl p-5">
        <h3 className="font-bold text-gray-700 mb-4">{editId ? 'Edit Fixture' : 'Add Fixture'}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <input type="number" placeholder="Round" value={form.round} onChange={e => setForm(f => ({...f, round: e.target.value}))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-club" />
          <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-club" required />
          <input type="time" value={form.time} onChange={e => setForm(f => ({...f, time: e.target.value}))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-club" />
          <input placeholder="Home Team" value={form.home_team} onChange={e => setForm(f => ({...f, home_team: e.target.value}))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-club" />
          <input placeholder="Away Team *" value={form.away_team} onChange={e => setForm(f => ({...f, away_team: e.target.value}))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-club" required />
          <select value={form.age_group} onChange={e => setForm(f => ({...f, age_group: e.target.value}))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-club bg-white">
            {AGE_GROUPS.map(ag => <option key={ag} value={ag}>{ag}</option>)}
          </select>
          <input placeholder="Venue" value={form.venue} onChange={e => setForm(f => ({...f, venue: e.target.value}))}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-club col-span-2" />
          <label className="flex items-center gap-2 text-sm text-gray-600 font-medium">
            <input type="checkbox" checked={form.is_home} onChange={e => setForm(f => ({...f, is_home: e.target.checked}))} className="accent-green-700" />
            Home game
          </label>
        </div>
        <div className="flex gap-2 mt-3">
          <button type="submit" disabled={saving} className="bg-green-club text-white font-semibold px-5 py-2 rounded-lg text-sm hover:bg-green-mid disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : editId ? 'Update' : 'Add Fixture'}
          </button>
          {editId && <button type="button" onClick={() => { setEditId(null); setForm(empty) }}
            className="border border-gray-200 text-gray-600 font-semibold px-5 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>}
        </div>
      </form>

      {/* Fixtures list */}
      {loading ? <div className="animate-pulse bg-gray-100 h-40 rounded-xl" /> : (
        <div className="space-y-3">
          {fixtures.length === 0 ? <p className="text-gray-400 text-sm text-center py-8">No fixtures added yet.</p> : fixtures.map(f => {
            const existingResult = f.results?.[0]
            const rf = resultForm[f.id] ?? {
              home_score: existingResult?.home_score ?? '',
              away_score: existingResult?.away_score ?? '',
              scorers: existingResult?.scorers?.join(', ') ?? '',
              special_moment: existingResult?.special_moment ?? '',
            }
            return (
              <div key={f.id} className="bg-white border border-gray-100 rounded-xl p-4">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="font-bold text-gray-800">{f.home_team} vs {f.away_team}</span>
                  <span className="text-gray-400 text-sm">· {f.date} {f.time ?? ''} · Rd {f.round} · {f.age_group}</span>
                  <div className="ml-auto flex gap-2">
                    <button onClick={() => { setEditId(f.id); setForm({ round: f.round, date: f.date, time: f.time ?? '', home_team: f.home_team, away_team: f.away_team, age_group: f.age_group, venue: f.venue, is_home: f.is_home }) }}
                      className="text-xs text-green-club hover:underline font-semibold">Edit</button>
                    <button onClick={() => remove(f.id)} className="text-xs text-red-500 hover:underline font-semibold">Delete</button>
                  </div>
                </div>
                {/* Result entry */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Result {existingResult ? '(recorded)' : '(not yet entered)'}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <input type="number" placeholder="Home score" min="0" value={rf.home_score}
                      onChange={e => setResultForm(r => ({...r, [f.id]: {...rf, home_score: e.target.value}}))}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-club" />
                    <input type="number" placeholder="Away score" min="0" value={rf.away_score}
                      onChange={e => setResultForm(r => ({...r, [f.id]: {...rf, away_score: e.target.value}}))}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-club" />
                    <input placeholder="Scorers (comma separated)" value={rf.scorers}
                      onChange={e => setResultForm(r => ({...r, [f.id]: {...rf, scorers: e.target.value}}))}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-club col-span-2" />
                    <input placeholder="Moment of the match..." value={rf.special_moment}
                      onChange={e => setResultForm(r => ({...r, [f.id]: {...rf, special_moment: e.target.value}}))}
                      className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-club col-span-2 md:col-span-3" />
                    <button onClick={() => saveResult(f.id)} disabled={savingResult === f.id}
                      className="bg-green-club text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-mid disabled:opacity-50 transition-colors">
                      {savingResult === f.id ? '…' : existingResult ? 'Update' : 'Save Result'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Message Moderator ───────────────────────────────────────────────────────
function MessageModerator() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  const load = () => {
    setLoading(true)
    supabase.from('messages').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setMessages(data ?? []); setLoading(false) })
  }

  useEffect(() => { load() }, [])

  const approve = async (id) => {
    await supabase.from('messages').update({ approved: true }).eq('id', id)
    load()
  }

  const remove = async (id) => {
    if (!confirm('Delete this message?')) return
    await supabase.from('messages').delete().eq('id', id)
    load()
  }

  const visible = messages.filter(m => filter === 'pending' ? !m.approved : m.approved)

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[['pending', 'Pending'], ['approved', 'Approved']].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${filter === k ? 'bg-green-club text-white' : 'bg-gray-100 text-gray-600 hover:bg-green-club/10'}`}>
            {l} ({messages.filter(m => k === 'pending' ? !m.approved : m.approved).length})
          </button>
        ))}
      </div>

      {loading ? <div className="animate-pulse bg-gray-100 h-40 rounded-xl" /> : visible.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-10">No {filter} messages.</p>
      ) : (
        <div className="space-y-3">
          {visible.map(m => (
            <div key={m.id} className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800 text-sm">{m.author}</span>
                    <span className="text-gray-400 text-xs">{new Date(m.created_at).toLocaleString('en-AU')}</span>
                  </div>
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{m.content}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {!m.approved && (
                    <button onClick={() => approve(m.id)} className="text-xs bg-green-club text-white font-semibold px-3 py-1 rounded-lg hover:bg-green-mid transition-colors">
                      Approve
                    </button>
                  )}
                  <button onClick={() => remove(m.id)} className="text-xs bg-red-100 text-red-600 font-semibold px-3 py-1 rounded-lg hover:bg-red-200 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Portal ─────────────────────────────────────────────────────────────
export default function CoachPortal() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1')
  const [tab, setTab] = useState('Rosters')

  if (!authed) return <LoginGate onLogin={() => setAuthed(true)} />

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-800 mb-1">Coach Portal</h1>
          <p className="text-gray-500">Manage rosters, fixtures, results and messages</p>
        </div>
        <button
          onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false) }}
          className="text-sm text-gray-400 hover:text-red-500 font-semibold transition-colors"
        >
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-8 w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all
              ${tab === t ? 'bg-white text-green-club shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Rosters'   && <RosterManager />}
      {tab === 'Coaches'   && <CoachManager />}
      {tab === 'Fixtures'  && <FixtureManager />}
      {tab === 'Messages'  && <MessageModerator />}
    </div>
  )
}
