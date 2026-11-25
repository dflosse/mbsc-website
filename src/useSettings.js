import { useEffect, useState } from 'react'
import { supabase } from './supabase'

// Club settings (fees, payment, key dates) editable by the committee.
export default function useSettings() {
  const [s, setS] = useState({})
  useEffect(() => {
    supabase.from('settings').select('*').then(({ data }) => setS(Object.fromEntries((data || []).map((r) => [r.key, r.value]))))
  }, [])
  return s
}
