import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, strongSession } from './supabase'

const AuthCtx = createContext(null)
const ELEVATED = ['volunteer', 'coach', 'committee', 'admin']

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [coachTeams, setCoachTeams] = useState([])
  const [aal, setAal] = useState({ current: 'aal1', next: 'aal1' })
  const [loading, setLoading] = useState(true)
  const [hasPasskey, setHasPasskey] = useState(false)
  const [recovering, setRecovering] = useState(false)

  const loadProfile = useCallback(async (s) => {
    if (!s?.user) { setProfile(null); setCoachTeams([]); return }
    try { await supabase.rpc('claim_invites') } catch { /* ignore */ }
    const { data } = await supabase.from('profiles').select('*').eq('id', s.user.id).maybeSingle()
    setProfile(data)
    const { data: tc } = await supabase.from('team_coaches').select('team_id').eq('profile_id', s.user.id)
    setCoachTeams((tc || []).map((r) => r.team_id))
    const { data: lv } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (lv) setAal({ current: lv.currentLevel, next: lv.nextLevel })
    try { const { data: pk } = await supabase.auth.passkey.list(); setHasPasskey((pk || []).length > 0) } catch { setHasPasskey(false) }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      await loadProfile(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((e, s) => {
      if (e === 'PASSWORD_RECOVERY') setRecovering(true)
      setSession(s)
      setTimeout(() => loadProfile(s), 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  const role = profile?.role
  const elevated = ELEVATED.includes(role) || !!profile?.is_executive || coachTeams.length > 0
  const mfaOk = aal.current === 'aal2' || (!!session && strongSession(session))
  const value = {
    session,
    user: session?.user || null,
    profile,
    loading,
    refresh: () => loadProfile(session),
    // elevated access only counts once two-factor is complete (the database enforces the same rule)
    needsMfa: elevated && !mfaOk,
    mfaEnrolled: aal.next === 'aal2' || hasPasskey,
    elevated,
    isStaff: mfaOk && (role === 'committee' || role === 'admin'),
    isAdmin: mfaOk && role === 'admin',
    isExec: mfaOk && !!profile?.is_executive,
    isVolunteer: mfaOk && ELEVATED.includes(role),
    isCoach: mfaOk && (role === 'coach' || coachTeams.length > 0),
    coachTeams,
    aalCurrent: mfaOk ? 'aal2' : aal.current,
    hasPasskey,
    mfaOk,
    recovering,
    endRecovery: () => setRecovering(false),
    signOut: () => supabase.auth.signOut(),
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
