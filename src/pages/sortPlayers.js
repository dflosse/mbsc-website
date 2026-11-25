import { ageGroupFor } from '../supabase'

// Every player list: youngest age group first, then by team, then surname, then first name.
const num = (s) => parseInt(String(s || '').replace(/\D/g, ''), 10)
function key(p) {
  const t = p.teams || null
  const age = num(t?.age_group) || num(t?.name) || num(ageGroupFor(p.dob, p.season)) || 99
  return [age, t?.sort_order ?? 999, (t?.name || 'zzz').toLowerCase(), (p.last_name || '').toLowerCase(), (p.first_name || '').toLowerCase()]
}
export function sortPlayers(rows) {
  return (rows || []).slice().sort((a, b) => {
    const A = key(a), B = key(b)
    for (let i = 0; i < A.length; i++) { if (A[i] < B[i]) return -1; if (A[i] > B[i]) return 1 }
    return 0
  })
}
export const TEAM_SEL = 'teams(name, age_group, sort_order)'
