import { useEffect, useState } from 'react'
import { supabase, REG_SEASON } from './supabase'

// Club settings (fees, training, contact) – edited once in Committee → Fees & settings,
// shown everywhere on the site. Cached so the header, footer and page share one fetch.
const DEFAULTS = { club_email: 'mtbeautysoccerclub@gmail.com', training: 'Wednesdays, 4 to 5pm', training_term: 'School Term 2 (April–June)', ground: 'Les Peart Oval, Pool Road, Mount Beauty VIC 3699' }
let cache = null
let pending = null
const subs = new Set()
export function refreshSettings() {
  pending = supabase.from('settings').select('*').then(({ data }) => {
    cache = { ...DEFAULTS, ...Object.fromEntries((data || []).filter((r) => r.value !== null && r.value !== '').map((r) => [r.key, r.value])) }
    subs.forEach((f) => f(cache)); return cache
  })
  return pending
}
export default function useSettings() {
  const [s, setS] = useState(cache || DEFAULTS)
  useEffect(() => {
    subs.add(setS)
    if (cache) setS(cache); else (pending || refreshSettings())
    return () => subs.delete(setS)
  }, [])
  return s
}

// Key dates for the season (edited on Committee → Preseason). Signed-out visitors only see public ones.
export function useKeyDates() {
  const [dates, setDates] = useState(null)
  useEffect(() => {
    supabase.from('key_dates').select('id, label, on_date, notes, sort, public').eq('season', REG_SEASON).order('sort').then(({ data }) => setDates(data || []))
  }, [])
  return dates
}
export const findDate = (dates, re) => (dates || []).find((d) => re.test(d.label))
