import { createClient } from '@supabase/supabase-js'
import { mockSupabase } from './demo/mock'

export const DEMO = import.meta.env.VITE_DEMO === '1'

// Publishable key: safe to ship in the browser. Access is enforced by row-level security in the database.
const url = import.meta.env.VITE_SUPABASE_URL || 'https://zfqlwktlknkivaecbepf.supabase.co'
const key = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_itSng6nlWLqezSy-fwBY9g_B7A-KrCn'

// "Keep me signed in": the sign-in lives in localStorage (stays after the browser closes).
// Unticked, it lives in sessionStorage and ends when the browser is closed.
export const REMEMBER_KEY = 'mbfc-remember'
const remembered = () => { try { return localStorage.getItem(REMEMBER_KEY) !== 'no' } catch { return true } }
const store = () => { try { return remembered() ? localStorage : sessionStorage } catch { return null } }
const authStorage = {
  getItem: (k) => { try { return sessionStorage.getItem(k) ?? localStorage.getItem(k) } catch { return null } },
  setItem: (k, v) => { try { const s = store(); s.setItem(k, v); (s === localStorage ? sessionStorage : localStorage).removeItem(k) } catch { /* private mode */ } },
  removeItem: (k) => { try { localStorage.removeItem(k); sessionStorage.removeItem(k) } catch { /* private mode */ } },
}
export const supabase = DEMO ? mockSupabase : createClient(url, key, { auth: { storage: authStorage, persistSession: true, autoRefreshToken: true } })

// Season settings – change these when the next season opens.
export const REG_SEASON = 2027 // the season families register for and teams are built for
export const ROSTER_SEASON = 2027 // the season shown on Teams / Coaches / Messages
export const PREV_SEASON = REG_SEASON - 1

export const fmtDate = (d, opts = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) =>
  d ? new Date(d + (String(d).length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-AU', opts) : ''

export const ageGroupFor = (dob, season) => {
  if (!dob) return ''
  const age = season - new Date(dob).getFullYear()
  return 'U' + age
}
