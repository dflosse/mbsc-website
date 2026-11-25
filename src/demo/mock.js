// In-memory stand-in for supabase-js, used only by the demo build.
import * as seed from './data'

const db = Object.fromEntries(Object.entries(seed).map(([k, v]) => [k, structuredClone(v)]))
const uid = () => Math.random().toString(36).slice(2, 10)

export const DEMO_ROLES = {
  visitor: { label: 'Visitor (not signed in)', user: null },
  parent: { label: 'Parent – Sam Parker', user: 'u-parent' },
  coach: { label: 'Coach – U9 Red (sample)', user: 'u-coach' },
  committee: { label: 'Committee – Secretary', user: 'u-committee' },
  admin: { label: 'Admin – Dan', user: 'u-admin' },
}
let current = 'visitor'
const listeners = new Set()
const session = () => (DEMO_ROLES[current].user ? { user: { id: DEMO_ROLES[current].user, email: db.profiles.find((p) => p.id === DEMO_ROLES[current].user)?.email } } : null)
export const getDemoRole = () => current
export function setDemoRole(r) { current = r; const s = session(); listeners.forEach((fn) => fn(r === 'visitor' ? 'SIGNED_OUT' : 'SIGNED_IN', s)) }

// --- permission emulation (mirrors the database's row-level security) ---
const me = () => DEMO_ROLES[current].user
const role = () => db.profiles.find((p) => p.id === me())?.role
const staff = () => ['committee', 'admin'].includes(role())
const myKids = () => db.player_guardians.filter((g) => g.profile_id === me()).map((g) => g.player_id)
const myTeams = () => db.team_coaches.filter((t) => t.profile_id === me()).map((t) => t.team_id)
const kidTeams = () => db.players.filter((p) => myKids().includes(p.id)).map((p) => p.team_id)
const canSee = (a, t) => ({ public: true, members: !!me(), team: staff() || myTeams().includes(t) || kidTeams().includes(t), coaches: staff() || myTeams().length > 0 || role() === 'coach', committee: staff() }[a])
const visible = {
  players: (r) => staff() || myKids().includes(r.id) || myTeams().includes(r.team_id),
  player_guardians: (r) => staff() || r.profile_id === me(),
  gala_entries: (r) => staff() || myKids().includes(r.player_id) || myTeams().includes(db.players.find((p) => p.id === r.player_id)?.team_id),
  posts: (r) => canSee(r.audience, r.team_id),
  replies: (r) => { const p = db.posts.find((x) => x.id === r.post_id); return p && canSee(p.audience, p.team_id) },
  documents: (r) => canSee(r.audience, null),
  tasks: () => staff(), kit: () => staff(),
  profiles: (r) => staff() || r.id === me(),
  team_coaches: () => !!me(),
}
const writable = {
  players: (r) => staff() || myKids().includes(r.id),
  gala_entries: (r) => staff() || myKids().includes(r.player_id),
  posts: (r) => staff() || r.author_id === me() || (r.audience === 'members' && me()) || (r.audience === 'team' && (myTeams().includes(r.team_id) || kidTeams().includes(r.team_id))) || (r.audience === 'coaches' && (myTeams().length || role() === 'coach')),
  replies: () => !!me(),
  profiles: (r) => r.id === me() || role() === 'admin',
}
const canRead = (t, r) => (visible[t] ? visible[t](r) : true)
const canWrite = (t, r) => (writable[t] ? writable[t](r) : staff())

function embed(t, r, sel) {
  const out = { ...r }
  if (sel.includes('teams(') && 'team_id' in r) out.teams = db.teams.find((x) => x.id === r.team_id) || null
  if (sel.includes('profiles(') && r.profile_id) out.profiles = db.profiles.find((x) => x.id === r.profile_id) || null
  if (sel.includes('players(') && r.player_id) { const p = db.players.find((x) => x.id === r.player_id); out.players = p ? { ...p, teams: db.teams.find((x) => x.id === p.team_id) || null } : null }
  return out
}

class Query {
  constructor(t) { this.t = t; this.filters = []; this.orders = []; this.op = 'select'; this.sel = '*' }
  select(s = '*', o = {}) { if (this.op === 'select') { this.sel = s; this.countOnly = o.head } return this }
  eq(k, v) { this.filters.push((r) => r[k] === v); return this }
  neq(k, v) { this.filters.push((r) => r[k] !== v); return this }
  gte(k, v) { this.filters.push((r) => r[k] >= v); return this }
  in(k, a) { this.filters.push((r) => a.includes(r[k])); return this }
  order(k, o = {}) { this.orders.push([k, o.ascending !== false]); return this }
  limit(n) { this.lim = n; return this }
  maybeSingle() { this.single = true; return this }
  insert(row) { this.op = 'insert'; this.payload = row; return this }
  update(row) { this.op = 'update'; this.payload = row; return this }
  upsert(row) { this.op = 'upsert'; this.payload = row; return this }
  delete() { this.op = 'delete'; return this }
  then(res, rej) { return Promise.resolve().then(() => this.run()).then(res, rej) }
  rows() { return (db[this.t] || []).filter((r) => canRead(this.t, r) && this.filters.every((f) => f(r))) }
  run() {
    const t = this.t
    const denied = { data: null, error: { message: 'new row violates row-level security policy (demo)' } }
    if (this.op === 'insert') {
      const row = { id: uid(), created_at: new Date().toISOString(), ...this.payload }
      if (t === 'posts' || t === 'replies') { row.author_id = me(); row.author_name = db.profiles.find((p) => p.id === me())?.full_name }
      if (!canWrite(t, row)) return denied
      db[t].push(row); return { data: [row], error: null }
    }
    if (this.op === 'upsert') {
      const row = this.payload
      if (!canWrite(t, row)) return denied
      const i = db[t].findIndex((r) => r.gala_id === row.gala_id && r.player_id === row.player_id)
      if (i >= 0) db[t][i] = { ...db[t][i], ...row }; else db[t].push(row)
      return { data: [row], error: null }
    }
    if (this.op === 'update') {
      const rs = this.rows().filter((r) => canWrite(t, r))
      if (t === 'players' && !staff() && ['team_id', 'status', 'fees_paid', 'fv_registered'].some((k) => k in this.payload)) return { data: null, error: { message: 'Only committee can change team, status or payment fields' } }
      if (t === 'profiles' && 'role' in this.payload && role() !== 'admin') return { data: null, error: { message: 'Only admins can change roles' } }
      rs.forEach((r) => Object.assign(r, this.payload)); return { data: rs, error: null }
    }
    if (this.op === 'delete') {
      const rs = this.rows().filter((r) => canWrite(t, r))
      db[t] = db[t].filter((r) => !rs.includes(r)); return { data: rs, error: null }
    }
    let rs = this.rows()
    if (this.countOnly) return { count: rs.length, data: null, error: null }
    for (const [k, asc] of [...this.orders].reverse()) rs = [...rs].sort((a, b) => ((a[k] ?? '') > (b[k] ?? '') ? 1 : (a[k] ?? '') < (b[k] ?? '') ? -1 : 0) * (asc ? 1 : -1))
    if (this.lim) rs = rs.slice(0, this.lim)
    rs = rs.map((r) => embed(t, r, this.sel))
    if (this.single) return { data: rs[0] || null, error: null }
    return { data: rs, error: null }
  }
}

export const mockSupabase = {
  from: (t) => new Query(t),
  rpc: async (fn, a) => {
    if (fn !== 'register_player' || !me()) return { error: { message: 'Not signed in' } }
    const id = uid()
    db.players.push({ id, season: a.p_season, first_name: a.p_first, last_name: a.p_last, dob: a.p_dob, gender: a.p_gender, medical_notes: a.p_medical, emergency_contact: a.p_emergency, photo_consent: a.p_photo, status: 'pending', fv_registered: false, fees_paid: false, team_id: null, created_at: new Date().toISOString() })
    db.player_guardians.push({ player_id: id, profile_id: me() })
    return { data: id, error: null }
  },
  auth: {
    getSession: async () => ({ data: { session: session() } }),
    onAuthStateChange: (fn) => { listeners.add(fn); return { data: { subscription: { unsubscribe: () => listeners.delete(fn) } } } },
    signOut: async () => setDemoRole('visitor'),
    signInWithOtp: async () => { setTimeout(() => setDemoRole('parent'), 1500); return { error: null } },
    signInWithPassword: async () => { setDemoRole('parent'); return { error: null } },
    signUp: async () => { setTimeout(() => setDemoRole('parent'), 1500); return { error: null } },
  },
}
