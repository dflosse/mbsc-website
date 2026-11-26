import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth'

// Two-factor sign-in (authenticator app). Required for executive, committee, coach and volunteer access.
// Make sure we have a live session before calling the two-factor endpoints
// (straight after an email-confirmation link the session can still be settling).
async function ensureSession() {
  let { data } = await supabase.auth.getSession()
  if (!data.session) ({ data } = await supabase.auth.refreshSession())
  return !!data?.session
}

const device = () => {
  const ua = navigator.userAgent || ''
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'iphone'
  if (/Android/.test(ua)) return 'android'
  if (/Macintosh|Mac OS X/.test(ua)) return 'mac'
  return 'pc'
}
const DEVICE_NAME = { iphone: 'iPhone', android: 'Android', mac: 'Mac', pc: 'Computer' }
const HOW = {
  iphone: { title: 'On iPhone', steps: ['Tap "Add to this iPhone" below. Your iPhone opens Passwords (built in – nothing to install) and asks where to save the code. Save it to your Mount Beauty FC login, or as a new entry.', 'Come back here and type the 6-digit code it shows. When you sign in later on this iPhone, Safari offers the code above the keyboard – just tap it.', 'Prefer an app? Google Authenticator or Microsoft Authenticator (free) work too – the same button opens them.'] },
  android: { title: 'On Android', steps: ['Install Google Authenticator from the Play Store (free) if you don’t have it – or use Microsoft Authenticator.', 'Tap "Add to this phone" below – the app opens and adds Mount Beauty FC. (If nothing happens, open the app, tap +, choose "Enter a setup key" and paste the key.)', 'Come back here and type the 6-digit code it shows.'] },
  mac: { title: 'On a Mac', steps: ['Easiest: open the camera or authenticator app on your phone and scan the QR code below.', 'Or use the Mac’s Passwords app: open your Mount Beauty FC entry → Edit → Set Up Verification Code → Enter Setup Key, and paste the key below. Safari will then fill the code in for you.', 'Type the 6-digit code to finish.'] },
  pc: { title: 'On a Windows PC', steps: ['Get your phone. iPhone: open the Camera and point it at the QR code below – it offers to add the code to Passwords. Android: open Google Authenticator, tap +, then "Scan a QR code".', 'Type the 6-digit code your phone shows into the box below.', 'From then on, each time you sign in on a new computer you’ll just check your phone for the code.'] },
}

export default function Security() {
  const { refresh, elevated, mfaEnrolled, needsMfa } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [factors, setFactors] = useState(null)
  const [enroll, setEnroll] = useState(null)
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState(null)
  const [dev, setDev] = useState(device())
  const [copied, setCopied] = useState(false)

  async function load() {
    const { data } = await supabase.auth.mfa.listFactors()
    setFactors((data?.totp || []).filter((f) => f.status === 'verified'))
  }
  useEffect(() => { load() }, [])

  async function start() {
    setMsg(null)
    if (!(await ensureSession())) return setMsg({ ok: false, text: 'Your sign-in has lapsed. Please sign out, sign back in with your email and password, then try again.' })
    // clear any half-finished setup first
    const { data: all } = await supabase.auth.mfa.listFactors()
    for (const f of (all?.all || []).filter((x) => x.status !== 'verified')) await supabase.auth.mfa.unenroll({ factorId: f.id })
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'Mount Beauty FC', friendlyName: DEVICE_NAME[device()] + ' ' + new Date().toISOString().slice(0, 10) })
    if (error) return setMsg({ ok: false, text: error.message })
    setEnroll(data)
  }
  async function verify(factorId) {
    setMsg(null)
    if (!(await ensureSession())) return setMsg({ ok: false, text: 'Your sign-in has lapsed. Please sign out, sign back in with your email and password, then try again.' })
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.replace(/\s/g, '') })
    if (error) return setMsg({ ok: false, text: 'That code didn\'t work – check the time on your phone and try the newest code.' })
    setCode(''); setEnroll(null); await load(); await refresh()
    setMsg({ ok: true, text: 'Two-factor sign-in is on. Your access is unlocked.' })
    if (loc.state?.from) setTimeout(() => nav(loc.state.from), 600)
  }
  async function remove(f) {
    if (factors.length === 1 && elevated && !window.confirm('Removing your only authenticator will switch off your coach/committee/volunteer access until you set it up again. Continue?')) return
    const { error } = await supabase.auth.mfa.unenroll({ factorId: f.id })
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'Removed.' }); load(); refresh()
  }

  const verified = factors?.[0]
  const [busy, setBusy] = useState(false)
  async function submitCode(factorId) { if (busy) return; setBusy(true); await verify(factorId); setBusy(false) }
  function onCode(v, factorId) { setCode(v); if (factorId && /^\d{6}$/.test(v.replace(/\s/g, ''))) submitCode(factorId) }
  return (
    <div className="wrap narrow">
      <h1>Two-factor sign-in</h1>
      <p className="lead">Anyone who can see children's details – executive, committee, coaches and volunteers – signs in with a password <b>and</b> a 6-digit code from their phone. It takes about two minutes to set up.</p>
      <div className="card callout">
        <b>How it works</b>
        <ul className="small" style={{ margin: '6px 0 0', paddingLeft: 18 }}>
          <li>Your phone makes a new 6-digit code every 30 seconds. It works offline – no texts, no mobile reception needed.</li>
          <li>You enter a code once per device. Tick "Keep me signed in" when you sign in and you won't be asked again on that phone or computer unless you sign out.</li>
          <li>iPhones and Macs have this built in (Passwords). On Android or a Windows PC, use the free Google Authenticator or Microsoft Authenticator app on your phone.</li>
          <li>New phone? Add it here before you wipe the old one. Lost your phone? Ask the President or Secretary to reset it for you.</li>
        </ul>
      </div>
      {msg && <p className={'card ' + (msg.ok ? 'ok' : 'err')}>{msg.text}</p>}

      {needsMfa && mfaEnrolled && verified && (
        <div className="card form">
          <h3>Enter your code</h3>
          <p>Open Passwords (iPhone/Mac) or your authenticator app and type the current code for <b>Mount Beauty FC</b>.</p>
          <label>6-digit code<input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => onCode(e.target.value, verified.id)} maxLength={7} autoFocus /></label>
          <button className="btn" disabled={busy} onClick={() => submitCode(verified.id)}>{busy ? 'Checking…' : 'Continue'}</button>
          <p className="small muted">It carries on by itself once all 6 digits are in. You won't be asked again on this device unless you sign out.</p>
        </div>
      )}

      {factors && factors.length === 0 && !enroll && (
        <div className="card">
          <h3>Set it up</h3>
          <p>Choose what you're using right now:</p>
          <div className="tabs" style={{ margin: '0 0 10px' }}>{Object.entries(DEVICE_NAME).map(([k, l]) => <button key={k} className={dev === k ? 'on' : ''} onClick={() => setDev(k)}>{k === 'pc' ? 'Windows PC' : l}</button>)}</div>
          <ol className="steps">{HOW[dev].steps.map((t, i) => <li key={i}>{t}</li>)}</ol>
          <button className="btn" onClick={start}>Start set-up</button>
          {!elevated && <p className="small muted">Optional for parents, but recommended.</p>}
        </div>
      )}

      {enroll && (
        <div className="card form">
          <h3>{HOW[dev].title}</h3>
          {['iphone', 'android'].includes(dev) && <a className="btn" href={enroll.totp.uri}>Add to this {dev === 'iphone' ? 'iPhone' : 'phone'}</a>}
          {['iphone', 'android'].includes(dev) && <p className="small muted" style={{ margin: 0 }}>Setting up on a different device? Scan this QR code with it instead:</p>}
          <img src={enroll.totp.qr_code} alt="QR code to add Mount Beauty FC to your authenticator" className="qr" />
          <div className="row">
            <span className="small muted">Setup key:</span><code className="setupkey">{enroll.totp.secret}</code>
            <button type="button" className="btn small ghost" onClick={async () => { try { await navigator.clipboard.writeText(enroll.totp.secret); setCopied(true) } catch { setCopied(false) } }}>{copied ? 'Copied' : 'Copy key'}</button>
          </div>
          <label>Now type the 6-digit code it shows<input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={7} placeholder="123456" /></label>
          <div className="row"><button className="btn" onClick={() => verify(enroll.id)}>Turn on</button><button type="button" className="btn ghost" onClick={() => setEnroll(null)}>Cancel</button></div>
        </div>
      )}

      {verified && !needsMfa && (
        <div className="card">
          <p><span className="pill good">On</span> Two-factor sign-in is active on this account.</p>
          {factors.map((f) => <p key={f.id} className="small">{f.friendly_name || 'Authenticator'} <button className="link danger" onClick={() => remove(f)}>remove</button></p>)}
          {!enroll && <button className="btn small ghost" onClick={start}>Add another device (e.g. a new phone)</button>}
          <p className="small muted">New phone? Add it first, then remove the old one. Lost your phone? Ask the President or Secretary to reset it.</p>
        </div>
      )}
    </div>
  )
}
