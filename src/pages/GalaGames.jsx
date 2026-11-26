import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth'

export const outcomeOf = (g) => g.our_score == null || g.their_score == null ? null : g.our_score > g.their_score ? 'win' : g.our_score < g.their_score ? 'loss' : 'draw'
const PILL = { win: ['good', 'Win'], draw: ['wait', 'Draw'], loss: ['bad', 'Loss'] }
export const byKickoff = (a, b) => (a.sort - b.sort) || String(a.kickoff || '').localeCompare(String(b.kickoff || ''), undefined, { numeric: true })

// Public: times, pitches, opponents, scores. Registered members also see who scored.
export default function GalaGames({ gala, compact }) {
  const { user } = useAuth()
  const [games, setGames] = useState(null)
  const [scorers, setScorers] = useState({})
  const load = useCallback(async () => {
    const { data } = await supabase.from('gala_games').select('*, teams(name, sort_order)').eq('gala_id', gala.id)
    setGames(data || [])
    if (user && data?.length) {
      const { data: s } = await supabase.rpc('gala_scorers', { p_gala: gala.id })
      const m = {}; for (const r of s || []) (m[r.game_id] = m[r.game_id] || []).push(r)
      setScorers(m)
    }
  }, [gala.id, user])
  useEffect(() => { load() }, [load])
  if (!games?.length) return null
  const teams = [...new Map(games.map((g) => [g.team_id, g.teams])).entries()].sort((a, b) => (a[1]?.sort_order ?? 99) - (b[1]?.sort_order ?? 99))
  return (
    <div className={'gamelist' + (compact ? ' compact' : '')}>
      {teams.map(([tid, t]) => (
        <div key={tid} className="resgroup">
          <h3>{t?.name}</h3>
          {games.filter((g) => g.team_id === tid).sort(byKickoff).map((g) => {
            const o = outcomeOf(g)
            const sc = scorers[g.id]
            return (
              <div key={g.id} className={'result ' + (o || '')}>
                <div className="game-line">
                  <span className="when">{g.kickoff || 'TBA'}{g.pitch ? <span className="muted small"> · {g.pitch}</span> : null}</span>
                  <span className="vs">{g.opponent ? `v\u00a0${g.opponent}` : 'Opponent TBA'}</span>
                  <b className="score">{o ? `${g.our_score}–${g.their_score}` : ''}</b>
                  {o && <span className={'pill ' + PILL[o][0]}>{PILL[o][1]}</span>}
                </div>
                {sc?.length > 0 && <div className="small">Goals: {sc.map((s) => s.scorer + (s.goals > 1 ? ` (${s.goals})` : '')).join(', ')}</div>}
              </div>
            )
          })}
        </div>
      ))}
      {!user && games.some((g) => outcomeOf(g)) && <p className="small muted">Sign in to see goal scorers.</p>}
    </div>
  )
}

// Coach view: add games for a team at a gala, enter scores and scorers.
export function GameEditor({ gala, team, squad }) {
  const [games, setGames] = useState([])
  const [goals, setGoals] = useState([])
  const [err, setErr] = useState('')
  const [adding, setAdding] = useState({ kickoff: '', pitch: '', opponent: '' })
  const load = useCallback(async () => {
    const { data } = await supabase.from('gala_games').select('*').eq('gala_id', gala.id).eq('team_id', team.id)
    setGames((data || []).sort(byKickoff))
    const ids = (data || []).map((g) => g.id)
    const { data: gl } = ids.length ? await supabase.from('gala_goals').select('*').in('game_id', ids) : { data: [] }
    setGoals(gl || [])
  }, [gala.id, team.id])
  useEffect(() => { load() }, [load])
  const fail = (e) => { if (e) { setErr(e.message); return true } setErr(''); return false }

  async function add(e) {
    e.preventDefault()
    if (fail((await supabase.from('gala_games').insert({ gala_id: gala.id, team_id: team.id, ...adding, sort: games.length })).error)) return
    setAdding({ kickoff: '', pitch: '', opponent: '' }); load()
  }
  async function patch(g, f) { if (!fail((await supabase.from('gala_games').update(f).eq('id', g.id)).error)) load() }
  async function remove(g) { if (!window.confirm(`Delete the ${g.kickoff || ''} game${g.opponent ? ' v ' + g.opponent : ''} and its goal scorers?`)) return; if (!fail((await supabase.from('gala_games').delete().eq('id', g.id)).error)) load() }
  async function addGoal(g, player_id, n) {
    if (!player_id) return
    const ex = goals.find((x) => x.game_id === g.id && x.player_id === player_id)
    const r = ex ? await supabase.from('gala_goals').update({ goals: ex.goals + n }).eq('id', ex.id) : await supabase.from('gala_goals').insert({ game_id: g.id, player_id, goals: n })
    if (!fail(r.error)) load()
  }
  async function dropGoal(x) { if (!fail((x.goals > 1 ? await supabase.from('gala_goals').update({ goals: x.goals - 1 }).eq('id', x.id) : await supabase.from('gala_goals').delete().eq('id', x.id)).error)) load() }
  const name = (pid) => { const p = squad.find((s) => s.id === pid); return p ? `${p.first_name} ${p.last_name}` : 'Player' }

  return (
    <div className="editor">
      {err && <p className="err small">{err}</p>}
      {games.length === 0 && <p className="muted small">No games added yet. Add each game from the draw below.</p>}
      {games.map((g) => {
        const gg = goals.filter((x) => x.game_id === g.id)
        const total = gg.reduce((t, x) => t + x.goals, 0)
        return (
          <div key={g.id} className="card game-edit">
            <div className="ge-top">
              <Field label="Time" v={g.kickoff} w={90} onSave={(v) => patch(g, { kickoff: v })} />
              <Field label="Pitch" v={g.pitch} w={90} onSave={(v) => patch(g, { pitch: v })} />
              <Field label="Opponent" v={g.opponent} w={170} onSave={(v) => patch(g, { opponent: v })} />
              <div className="ge-score">
                <Field label="Us" v={g.our_score} w={56} num onSave={(v) => patch(g, { our_score: v === '' ? null : Number(v) })} />
                <span className="dash">–</span>
                <Field label="Them" v={g.their_score} w={56} num onSave={(v) => patch(g, { their_score: v === '' ? null : Number(v) })} />
              </div>
              <button className="link danger ge-del" onClick={() => remove(g)} title="Delete game">Delete</button>
            </div>
            <div className="ge-goals">
              <span className="small"><b>Goal scorers</b>{g.our_score != null && total !== g.our_score ? <span className="muted"> · {total} of {g.our_score} recorded</span> : null}</span>
              <div className="chips">{gg.map((x) => <span key={x.id} className="chip">{name(x.player_id)}{x.goals > 1 ? ` ×${x.goals}` : ''}<button aria-label="Remove one goal" onClick={() => dropGoal(x)}>−</button><button aria-label="Add a goal" onClick={() => addGoal(g, x.player_id, 1)}>+</button></span>)}</div>
              <select value="" onChange={(e) => addGoal(g, e.target.value, 1)} aria-label="Add a goal scorer"><option value="">+ Add a scorer…</option>{squad.map((p) => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}</select>
            </div>
          </div>
        )
      })}
      <form className="card add-game" onSubmit={add}>
        <b className="small">Add a game</b>
        <div className="ge-top">
          <label>Time<input value={adding.kickoff} onChange={(e) => setAdding({ ...adding, kickoff: e.target.value })} placeholder="9:20am" required style={{ width: 90 }} /></label>
          <label>Pitch<input value={adding.pitch} onChange={(e) => setAdding({ ...adding, pitch: e.target.value })} placeholder="Pitch 3" style={{ width: 90 }} /></label>
          <label>Opponent<input value={adding.opponent} onChange={(e) => setAdding({ ...adding, opponent: e.target.value })} placeholder="Bright Red" style={{ width: 170 }} /></label>
          <button className="btn small">Add game</button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, v, w, num, onSave }) {
  const [x, setX] = useState(v ?? '')
  useEffect(() => setX(v ?? ''), [v])
  return <label>{label}<input value={x} inputMode={num ? 'numeric' : undefined} style={{ width: w }} onChange={(e) => setX(num ? e.target.value.replace(/\D/g, '').slice(0, 2) : e.target.value)} onBlur={() => String(x) !== String(v ?? '') && onSave(x)} onKeyDown={(e) => e.key === 'Enter' && e.target.blur()} /></label>
}
