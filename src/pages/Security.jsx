import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase, DEMO } from '../supabase'
import { useAuth } from '../auth'

// Two-factor sign-in. Required for executive, committee, coach and volunteer access.
// One screen per situation: confirm it's you / turn it on / it's on.

// Straight after an email-confirmation link the session can still be settling.
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
const DEV = device()
const PHONE = DEV === 'iphone' || DEV === 'android'
// Passkeys are bound to the club domain (www and netlify.app redirect here).
const RP_ID = 'mountbeautyfc.org.au'
const canPasskey = () => typeof window !== 'undefined' && !!window.PublicKeyCredential && (location.hostname === RP_ID || DEMO)
const BIO = { iphone: 'Face ID', android: 'fingerprint', mac: 'Touch ID', pc: 'your phone' }[DEV]
const BIO_ICON = { iphone: '🙂', android: '👆', mac: '👆', pc: '📱' }[DEV]
const DEVICE_NAME = { iphone: 'iPhone', android: 'Android phone', mac: 'Mac', pc: 'Computer' }[DEV]
const LAPSED = 'Your sign-in has lapsed. Sign out, sign back in with your email and password, then try again.'
const friendlyErr = (e) => /NotAllowed|abort|cancel/i.test((e?.name || '') + (e?.message || '')) ? 'Cancelled – tap the button to try again.' : (e?.message || 'That didn’t work – try again.')
const APP_HINT = {
  iphone: 'Your iPhone saves it in Passwords – nothing to install.',
  mac: 'Scan the code with your phone, or add it in the Mac’s Passwords app.',
  android: 'Uses Google Authenticator (free from the Play Store).',
  pc: 'Scan the code with your phone’s camera (iPhone) or Google Authenticator (Android).',
}[DEV]

export default function Security() {
  const { refresh, elevated, needsMfa, mfaEnrolled } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [codes, setCodes] = useState(null) // verified 6-digit-code factors
  const [keys, setKeys] = useState([]) // passkeys (Face ID etc.)
  const [enroll, setEnroll] = useState(null) // code set-up in progress
  const [code, setCode] = useState('')
  const [useCode, setUseCode] = useState(false)
  const [offer, setOffer] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const [copied, setCopied] = useState(false)

  async function load() {
    const { data } = await supabase.auth.mfa.listFactors()
    setCodes((data?.all || []).filter((f) => f.status === 'verified' && f.factor_type === 'totp'))
    let pk = []
    try { pk = (await supabase.auth.passkey.list()).data || [] } catch { /* none */ }
    setKeys(pk)
    return pk
  }
  useEffect(() => { load() }, [])

  async function finish(text) {
    await load(); await refresh()
    setMsg({ ok: true, text })
    if (loc.state?.from) setTimeout(() => nav(loc.state.from), 700)
  }
  async function run(fn) {
    if (busy) return
    setMsg(null); setBusy(true)
    try {
      if (!(await ensureSession())) return setMsg({ ok: false, text: LAPSED })
      await fn()
    } finally { setBusy(false) }
  }

  // Confirm with Face ID / fingerprint
  const confirmKey = () => run(async () => {
    const { error } = await supabase.auth.signInWithPasskey()
    if (error) return setMsg({ ok: false, text: friendlyErr(error) })
    await finish("That's you. You're in.")
  })
  // Turn on Face ID / fingerprint
  const addKey = () => run(async () => {
    const { data: pk, error } = await supabase.auth.registerPasskey()
    if (error) return setMsg({ ok: false, text: friendlyErr(error) })
    if (pk?.id) await supabase.auth.passkey.update({ passkeyId: pk.id, friendlyName: `${DEVICE_NAME} – ${new Date().toLocaleDateString('en-AU')}` })
    setOffer(false)
    await finish(`${BIO === 'your phone' ? 'Passkey' : BIO} is on. Next time, just approve it – no code to type.`)
  })
  // Start a 6-digit code set-up
  const startCode = () => run(async () => {
    const { data: all } = await supabase.auth.mfa.listFactors()
    for (const f of (all?.all || []).filter((x) => x.status !== 'verified')) await supabase.auth.mfa.unenroll({ factorId: f.id })
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'Mount Beauty FC', friendlyName: `${DEVICE_NAME} ${new Date().toISOString().slice(0, 10)}` })
    if (error) return setMsg({ ok: false, text: error.message })
    setCode(''); setEnroll(data)
  })
  // Check a 6-digit code (sign-in or finishing set-up)
  const checkCode = (factorId, value) => run(async () => {
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: value.replace(/\s/g, '') })
    if (error) { setCode(''); return setMsg({ ok: false, text: 'That code didn’t work. Wait for the next one and try again.' }) }
    const wasSetup = !!enroll
    setCode(''); setEnroll(null)
    const pk = await load(); await refresh()
    // After a code, offer Face ID so next time is one tap.
    if (canPasskey() && pk.length === 0) return setOffer(true)
    setMsg({ ok: true, text: wasSetup ? 'Two-factor is on. You’re in.' : "That's you. You're in." })
    if (loc.state?.from) setTimeout(() => nav(loc.state.from), 700)
  })
  function onCode(v, factorId) {
    const d = v.replace(/\D/g, '').slice(0, 6)
    setCode(d)
    if (d.length === 6) checkCode(factorId, d)
  }
  async function remove(f, isKey) {
    if (codes.length + keys.length === 1 && elevated && !window.confirm('This is your only way to confirm it’s you. Removing it switches off your coach/committee/volunteer access until you set one up again. Remove it?')) return
    const { error } = isKey ? await supabase.auth.passkey.delete({ passkeyId: f.id }) : await supabase.auth.mfa.unenroll({ factorId: f.id })
    setMsg(error ? { ok: false, text: error.message } : { ok: true, text: 'Removed.' }); load(); refresh()
  }

  if (codes === null) return <div className="wrap narrow"><h1>Two-factor sign-in</h1><p className="muted">Loading…</p></div>

  const code1 = codes[0]
  const anyOn = !!code1 || keys.length > 0
  const bioLabel = BIO === 'your phone' ? 'a passkey' : BIO
  const msgEl = msg && <p className={msg.ok ? 'ok' : 'err'} role="status">{msg.text}</p>
  const codeBox = (factorId, autoFocus) => (
    <input className="code-in" inputMode="numeric" autoComplete="one-time-code" placeholder="••••••" aria-label="6-digit code" value={code} onChange={(e) => onCode(e.target.value, factorId)} autoFocus={autoFocus} disabled={busy} />
  )

  // ---- 1. Offer Face ID straight after a code ----
  if (offer) return (
    <div className="wrap narrow">
      <div className="card tf">
        <div className="tf-icon">{BIO_ICON}</div>
        <h2>You're in. Skip the code next time?</h2>
        <p>Turn on {bioLabel} and next time you just approve it – nothing to type.</p>
        <button className="btn big" disabled={busy} onClick={addKey}>{busy ? 'Waiting for you to approve…' : `Turn on ${bioLabel}`}</button>
        <div className="tf-alt"><button className="link" onClick={() => { setOffer(false); if (loc.state?.from) nav(loc.state.from) }}>Not now</button></div>
        {msgEl}
      </div>
    </div>
  )

  // ---- 2. Confirm it's you ----
  if (needsMfa && mfaEnrolled) {
    const showKey = keys.length > 0 && !useCode
    return (
      <div className="wrap narrow">
        <div className="card tf">
          {showKey ? (
            <>
              <div className="tf-icon">{BIO_ICON}</div>
              <h2>Confirm it's you</h2>
              <p>{DEV === 'pc' ? 'Your browser shows a QR code – scan it with your phone and approve.' : `Approve with ${BIO}.`}</p>
              <button className="btn big" disabled={busy} onClick={confirmKey}>{busy ? 'Waiting for you to approve…' : `Use ${BIO === 'your phone' ? 'my phone' : BIO}`}</button>
              {code1 && <div className="tf-alt"><button className="link" onClick={() => { setUseCode(true); setMsg(null) }}>Use my 6-digit code instead</button></div>}
            </>
          ) : code1 ? (
            <>
              <div className="tf-icon">🔢</div>
              <h2>Enter your 6-digit code</h2>
              <p>Open {DEV === 'iphone' || DEV === 'mac' ? 'Passwords' : 'your authenticator app'} and type the code for <b>Mount Beauty FC</b>.{DEV === 'iphone' ? ' Safari may offer it above the keyboard – just tap it.' : ''}</p>
              {codeBox(code1.id, true)}
              {busy && <p className="small muted">Checking…</p>}
              {keys.length > 0 && <div className="tf-alt"><button className="link" onClick={() => { setUseCode(false); setMsg(null) }}>Use {BIO} instead</button></div>}
            </>
          ) : (
            <p>No sign-in method found. Ask the President or Secretary to reset your two-factor.</p>
          )}
          {msgEl}
          <p className="small muted tf-alt">Lost your phone? Ask the President or Secretary to reset it.</p>
        </div>
      </div>
    )
  }

  // ---- 3. Setting up a 6-digit code ----
  if (enroll) return (
    <div className="wrap narrow">
      <div className="card tf">
        <h2>Add Mount Beauty FC to your phone</h2>
        <p className="small muted">{APP_HINT}</p>
        {PHONE ? (
          <>
            <a className="btn big" href={enroll.totp.uri}>Add to this {DEV === 'iphone' ? 'iPhone' : 'phone'}</a>
            <details><summary className="small">Setting up on a different device?</summary><img src={enroll.totp.qr_code} alt="QR code for your authenticator" className="qr" /><SetupKey secret={enroll.totp.secret} copied={copied} setCopied={setCopied} /></details>
          </>
        ) : (
          <>
            <img src={enroll.totp.qr_code} alt="QR code for your authenticator" className="qr" />
            <details><summary className="small">Can't scan it?</summary><SetupKey secret={enroll.totp.secret} copied={copied} setCopied={setCopied} /></details>
          </>
        )}
        <p style={{ marginTop: 18 }}><b>Then type the 6-digit code it shows:</b></p>
        {codeBox(enroll.id, true)}
        {busy && <p className="small muted">Checking…</p>}
        {msgEl}
        <div className="tf-alt"><button className="link" onClick={() => { setEnroll(null); setMsg(null) }}>Cancel</button></div>
      </div>
    </div>
  )

  // ---- 4. Not set up yet ----
  if (!anyOn) return (
    <div className="wrap narrow">
      <div className="card tf">
        <div className="tf-icon">🔒</div>
        <h2>Turn on two-factor sign-in</h2>
        <p>Anyone who can see children's details needs a second check when they sign in. It takes under a minute{elevated ? '' : ' (optional for parents, but recommended)'}.</p>
        {canPasskey() ? (
          <>
            <button className="btn big" disabled={busy} onClick={addKey}>{busy ? 'Waiting for you to approve…' : `Turn on ${bioLabel}`}</button>
            <p className="small muted">{DEV === 'pc' ? 'Your browser shows a QR code – scan it with your phone and approve.' : 'Nothing to install.'}</p>
            <div className="tf-alt"><button className="link" disabled={busy} onClick={startCode}>Use a 6-digit code app instead</button></div>
          </>
        ) : (
          <button className="btn big" disabled={busy} onClick={startCode}>Set up a 6-digit code</button>
        )}
        {msgEl}
      </div>
    </div>
  )

  // ---- 5. It's on ----
  return (
    <div className="wrap narrow">
      <h1>Two-factor sign-in</h1>
      <div className="card">
        <p><span className="pill good">On</span> You're protected. You'll only be asked on a new device, or after you sign out.</p>
        <ul className="tf-list">
          {keys.map((f) => <li key={f.id}><span>{BIO_ICON} {f.friendly_name || 'Passkey'}</span><button className="link danger small" onClick={() => remove(f, true)}>Remove</button></li>)}
          {codes.map((f) => <li key={f.id}><span>🔢 6-digit code – {f.friendly_name || 'authenticator'}</span><button className="link danger small" onClick={() => remove(f, false)}>Remove</button></li>)}
        </ul>
        <div className="row">
          {canPasskey() && <button className="btn small" disabled={busy} onClick={addKey}>{busy ? 'Waiting…' : `Add ${bioLabel} on this ${DEV === 'pc' ? 'computer' : 'device'}`}</button>}
          {!code1 && <button className="btn small ghost" disabled={busy} onClick={startCode}>Add a backup code</button>}
        </div>
        {msgEl}
        <p className="small muted">New phone? Add it before you wipe the old one. Lost it? Ask the President or Secretary to reset it.</p>
      </div>
    </div>
  )
}

function SetupKey({ secret, copied, setCopied }) {
  return (
    <div className="row" style={{ justifyContent: 'center', marginTop: 8 }}>
      <code className="setupkey">{secret}</code>
      <button type="button" className="btn small ghost" onClick={async () => { try { await navigator.clipboard.writeText(secret); setCopied(true) } catch { setCopied(false) } }}>{copied ? 'Copied' : 'Copy key'}</button>
    </div>
  )
}
