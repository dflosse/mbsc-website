import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [coachTeams, setCoachTeams] = useState([])
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (s) => {
    if (!s?.user) { setProfile(null); setCoachTeams([]); return }
    const { data } = await supabase.from('profiles').select('*').eq('id', s.user.id).maybeSingle()
    setProfile(data)
    const { data: tc } = await supabase.from('team_coaches').select('team_id').eq('profile_id', s.user.id)
    setCoachTeams((tc || []).map((r) => r.team_id))
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      await loadProfile(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      setTimeout(() => loadProfile(s), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  const role = profile?.role
  const value = {
    session,
    user: session?.user || null,
    profile,
    loading,
    refresh: () => loadProfile(session),
    isStaff: role === 'committee' || role === 'admin',
    isAdmin: role === 'admin',
    isExec: !!profile?.is_executive,
    isVolunteer: ['volunteer', 'coach', 'committee', 'admin'].includes(role),
    isCoach: role === 'coach' || coachTeams.length > 0,
    coachTeams,
    signOut: () => supabase.auth.signOut(),
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
