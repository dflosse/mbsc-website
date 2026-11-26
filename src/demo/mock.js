// In-memory stand-in for supabase-js, used only by the demo build.
import * as seed from './data'

const db = Object.fromEntries(Object.entries(seed).map(([k, v]) => [k, structuredClone(v)]))
const uid = () => Math.random().toString(36).slice(2, 10)

export const DEMO_ROLES = {
  visitor: { label: 'Visitor (not signed in)', user: null },
  parent: { label: 'Parent – Sam Parker', user: 'u-parent' },
  coach: { label: 'Coach – U9 Red (sample)', user: 'u-coach' },
  committee: { label: 'Committee – Secretary', user: 'u-committee' },
  treasurer: { label: 'Treasurer (sample)', user: 'u-treas' },
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
const exec = () => !!db.profiles.find((p) => p.id === me())?.is_executive
const myKids = () => db.player_guardians.filter((g) => g.profile_id === me()).map((g) => g.player_id)
const myTeams = () => db.team_coaches.filter((t) => t.profile_id === me()).map((t) => t.team_id)
const kidTeams = () => db.players.filter((p) => myKids().includes(p.id)).map((p) => p.team_id)
const canSee = (a, t) => ({ public: true, members: !!me(), team: staff() || myTeams().includes(t) || kidTeams().includes(t), coaches: staff() || myTeams().length > 0 || role() === 'coach', committee: staff() }[a])
const visible = {
  players: (r) => exec() || myKids().includes(r.id) || myTeams().includes(r.team_id),
  player_guardians: (r) => exec() || r.profile_id === me() || myTeams().includes(db.players.find((p) => p.id === r.player_id)?.team_id),
  gala_entries: (r) => exec() || myKids().includes(r.player_id) || myTeams().includes(db.players.find((p) => p.id === r.player_id)?.team_id),
  posts: (r) => canSee(r.audience, r.team_id),
  replies: (r) => { const p = db.posts.find((x) => x.id === r.post_id); return p && canSee(p.audience, p.team_id) },
  documents: (r) => canSee(r.audience, null),
  tasks: () => staff(),
  profiles: (r) => exec() || role() === 'admin' || r.id === me() || db.player_guardians.some((g) => g.profile_id === r.id && myTeams().includes(db.players.find((p) => p.id === g.player_id)?.team_id)),
  team_coaches: () => !!me(),
  wwcc: (r) => r.profile_id === me() || exec(),
  volunteer_roles: (r) => r.profile_id === me() || exec(),
  guardian_invites: (r) => exec() || r.invited_by === me() || myKids().includes(r.player_id),
  player_private: () => exec(), audit_log: () => exec(),
  gala_jobs: () => !!me(), gala_job_signups: () => !!me(),
  kit: (r) => staff() || (r.player_id && myKids().includes(r.player_id)),
  funding: () => staff() || exec(), funding_sources: () => staff() || exec(), payments: () => exec(), gala_result_details: () => !!me(), season_awards: () => !!me(),
}
const writable = {
  players: (r) => exec() || myKids().includes(r.id),
  gala_entries: (r) => exec() || myKids().includes(r.player_id),
  posts: (r) => staff() || r.author_id === me() || (r.audience === 'members' && me()) || (r.audience === 'team' && (myTeams().includes(r.team_id) || kidTeams().includes(r.team_id))) || (r.audience === 'coaches' && (myTeams().length || role() === 'coach')),
  replies: () => !!me(),
  profiles: (r) => r.id === me() || role() === 'admin',
  wwcc: (r) => r.profile_id === me() || exec(),
  volunteer_roles: (r) => r.profile_id === me() || exec(),
  guardian_invites: (r) => exec() || myKids().includes(r.player_id),
  player_private: () => exec(),
  gala_jobs: () => staff(),
  gala_job_signups: (r) => r.profile_id === me() && ['volunteer', 'coach', 'committee', 'admin'].includes(role()),
  kit: () => staff(),
  funding: () => exec(), funding_sources: () => exec(),
}
const canRead = (t, r) => (visible[t] ? visible[t](r) : true)
const canWrite = (t, r) => (writable[t] ? writable[t](r) : staff())

function embed(t, r, sel) {
  const out = { ...r }
  if (sel.includes('teams(') && 'team_id' in r) out.teams = db.teams.find((x) => x.id === r.team_id) || null
  if (sel.includes('profiles(') && r.profile_id) out.profiles = db.profiles.find((x) => x.id === r.profile_id) || null
  if (sel.includes('player_guardians(') && t === 'players') out.player_guardians = db.player_guardians.filter((g) => g.player_id === r.id)
  if (sel.includes('players(') && r.player_id && t !== 'players') { const p = db.players.find((x) => x.id === r.player_id); out.players = p ? { ...p, teams: db.teams.find((x) => x.id === p.team_id) || null } : null }
  return out
}

class Query {
  constructor(t) { this.t = t; this.filters = []; this.orders = []; this.op = 'select'; this.sel = '*' }
  select(s = '*', o = {}) { if (this.op === 'select') { this.sel = s; this.countOnly = o.head } return this }
  eq(k, v) { this.filters.push((r) => r[k] === v); return this }
  neq(k, v) { this.filters.push((r) => r[k] !== v); return this }
  gte(k, v) { this.filters.push((r) => r[k] >= v); return this }
  lt(k, v) { this.filters.push((r) => r[k] < v); return this }
  lte(k, v) { this.filters.push((r) => r[k] <= v); return this }
  gt(k, v) { this.filters.push((r) => r[k] > v); return this }
  in(k, a) { this.filters.push((r) => a.includes(r[k])); return this }
  is(k, v) { this.filters.push((r) => (r[k] ?? null) === v); return this }
  ilike(k, v) { this.filters.push((r) => String(r[k] || '').toLowerCase() === String(v).toLowerCase()); return this }
  order(k, o = {}) { this.orders.push([k, o.ascending !== false]); return this }
  or(expr) { const parts = expr.split(',').map((x) => x.split('.')); this.filters.push((r) => parts.some(([k, , v]) => String(r[k]) === v)); return this }
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
      if (t === 'guardian_invites') row.approved = exec()
      if (t === 'gala_job_signups') { row.display_name = db.profiles.find((p) => p.id === me())?.full_name; const j = db.gala_jobs.find((x) => x.id === row.job_id); if (db.gala_job_signups.filter((x) => x.job_id === row.job_id).length >= j.slots) return { data: null, error: { message: 'That job is full' } } }
      if (Array.isArray(this.payload)) { const rows = this.payload.map((x) => ({ id: uid(), ...x })); db[t].push(...rows); return { data: rows, error: null } }
      if (!canWrite(t, row)) return denied
      db[t].push(row); return { data: [row], error: null }
    }
    if (this.op === 'upsert') {
      const row = this.payload
      if (!canWrite(t, row)) return denied
      const i = t === 'player_private' ? db[t].findIndex((r) => r.player_id === row.player_id) : db[t].findIndex((r) => r.gala_id === row.gala_id && r.player_id === row.player_id)
      if (i >= 0) db[t][i] = { ...db[t][i], ...row }; else db[t].push(row)
      return { data: [row], error: null }
    }
    if (this.op === 'update') {
      const rs = this.rows().filter((r) => canWrite(t, r))
      if (t === 'players' && 'release_check' in this.payload && !exec()) return denied
      if (t === 'players' && 'status' in this.payload && !exec()) return { data: null, error: { message: 'Only the executive committee can approve or withdraw a registration' } }
      if (t === 'players' && !staff() && ['team_id', 'fees_paid', 'fv_registered'].some((k) => k in this.payload)) return { data: null, error: { message: 'Only committee can change team or payment fields' } }
      if (t === 'wwcc' && !exec() && ['status_checked_at', 'wwc_connected_at'].some((k) => k in this.payload)) return { data: null, error: { message: 'Only the executive committee can verify a WWCC' } }
      if (t === 'wwcc' && !exec()) this.payload = { ...this.payload, status_checked_at: null, wwc_connected_at: null }
      if (t === 'profiles' && ('role' in this.payload || 'is_executive' in this.payload) && role() !== 'admin') return { data: null, error: { message: 'Only admins can change roles' } }
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
    if (fn === 'decide_volunteer') {
      if (!exec()) return { error: { message: 'Only the executive committee can sign off volunteers' } }
      const r = db.volunteer_roles.find((x) => x.id === a.p_id)
      const w = db.wwcc.find((x) => x.profile_id === r.profile_id)
      if (a.p_approve) {
        if (!w) return { error: { message: 'No WWCC on file' } }
        if (!w.status_checked_at) return { error: { message: 'WWCC status has not been checked yet' } }
        if (!w.wwc_connected_at) return { error: { message: 'Not yet connected to the club in WWC Connect' } }
      }
      const team = a.p_team || r.team_id
      Object.assign(r, { status: a.p_approve ? 'approved' : 'declined', decision_note: a.p_note, team_id: team })
      if (a.p_approve) {
        const p = db.profiles.find((x) => x.id === r.profile_id)
        if (r.kind === 'executive') p.role = 'admin'
        else if (!['admin', 'committee'].includes(p.role)) p.role = r.kind === 'committee' ? 'committee' : r.kind === 'coach' ? 'coach' : 'volunteer'
        if (r.kind === 'executive') p.is_executive = true
        if (r.kind === 'coach' && team) db.team_coaches.push({ team_id: team, profile_id: r.profile_id })
        if (a.p_committee_role) { const cr = db.committee_roles.find((x) => x.id === a.p_committee_role); if (cr) cr.person = cr.person ? cr.person + ', ' + p.full_name : p.full_name }
      }
      return { error: null }
    }
    if (fn === 'claim_invites') return { data: 0, error: null }
    if (fn === 'account_status') return { data: (a.p_ids || []).map((id) => ({ id, invited_at: '2026-11-26T03:30:00Z', confirmed_at: id === 'u-p2' ? '2026-11-26T04:00:00Z' : null, last_sign_in_at: null, has_mfa: id === 'u-p2' })), error: null }
    if (fn === 'gala_scorers') {
      if (!me()) return { data: [], error: null }
      const games = new Set(db.gala_games.filter((g) => g.gala_id === a.p_gala).map((g) => g.id))
      return { data: db.gala_goals.filter((x) => games.has(x.game_id)).map((x) => { const p = db.players.find((y) => y.id === x.player_id) || {}; return { game_id: x.game_id, scorer: p.first_name + ' ' + (p.last_name || '').slice(0, 1) + '.', goals: x.goals } }).sort((a, b) => b.goals - a.goals), error: null }
    }
    if (fn === 'exec_add_family') {
      if (!exec()) return { error: { message: 'Only the executive committee can add families' } }
      const id = uid()
      db.players.push({ id, season: a.p_season, first_name: a.p_first, last_name: a.p_last, dob: a.p_dob, gender: a.p_gender, medical_notes: a.p_medical, emergency_contact: a.p_emergency, photo_consent: a.p_photo, team_id: a.p_team, status: 'approved', fv_registered: false, fees_paid: false, committee_notes: 'Added by executive', created_at: new Date().toISOString() })
      for (const g of a.p_guardians || []) db.guardian_invites.push({ id: uid(), player_id: id, email: g.email, name: g.name, phone: g.phone, relationship: g.relationship, invited_by: me(), approved: true, created_at: new Date().toISOString() })
      return { data: id, error: null }
    }
    if (fn !== 'register_player' || !me()) return { error: { message: 'Not signed in' } }
    const id = uid()
    db.players.push({ id, season: a.p_season, first_name: a.p_first, last_name: a.p_last, dob: a.p_dob, gender: a.p_gender, medical_notes: a.p_medical, emergency_contact: a.p_emergency, photo_consent: a.p_photo, needs_uniform: !!a.p_needs_uniform, uniform_size: a.p_uniform_size, needs_boots: !!a.p_needs_boots, boot_size: a.p_boot_size, boots_status: a.p_needs_boots ? 'requested' : 'none', bond_paid: false, bond_refunded: false, status: 'pending', fv_registered: false, fees_paid: false, team_id: null, created_at: new Date().toISOString() })
    db.player_guardians.push({ player_id: id, profile_id: me() })
    return { data: id, error: null }
  },
  functions: { invoke: async () => ({ data: { error: 'This is the demo – real payments open Stripe checkout (Apple Pay, Google Pay or card).' }, error: null }) },
  storage: { from: () => ({
    remove: async () => ({ error: null }),
    upload: async (path) => ({ data: { path }, error: null }),
    createSignedUrl: async (path) => ({ data: { signedUrl: path.startsWith('data:') ? path : seedCard() }, error: null }),
  }) },
  auth: {
    updateUser: async () => ({ error: null }),
    mfa: {
      getAuthenticatorAssuranceLevel: async () => ({ data: me() ? { currentLevel: 'aal2', nextLevel: 'aal2' } : { currentLevel: 'aal1', nextLevel: 'aal1' } }),
      listFactors: async () => ({ data: { totp: me() ? [{ id: 'f1', status: 'verified', friendly_name: 'Authenticator (demo)' }] : [], all: [] } }),
      enroll: async () => ({ data: { id: 'f2', totp: { qr_code: '', secret: 'DEMO-ONLY', uri: 'otpauth://totp/Mount%20Beauty%20FC:demo?secret=DEMO&issuer=Mount%20Beauty%20FC' } } }),
      challengeAndVerify: async () => ({ error: null }), unenroll: async () => ({ error: null }),
    },
    getSession: async () => ({ data: { session: session() } }),
    onAuthStateChange: (fn) => { listeners.add(fn); return { data: { subscription: { unsubscribe: () => listeners.delete(fn) } } } },
    signOut: async () => setDemoRole('visitor'),
    resetPasswordForEmail: async () => ({ error: null }),
    signInWithOtp: async () => { setTimeout(() => setDemoRole('parent'), 1500); return { error: null } },
    signInWithPassword: async () => { setDemoRole('parent'); return { error: null } },
    signUp: async () => { setTimeout(() => setDemoRole('parent'), 1500); return { error: null } },
  },
}

const seedCard = () => db.wwcc[0].file_path
