import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEMO_ROLES, setDemoRole, getDemoRole } from './mock'

const START = { visitor: '/', parent: '/family', coach: '/coach', committee: '/committee/overview', admin: '/committee/people' }

export default function DemoBar() {
  const [r, setR] = useState(getDemoRole())
  const nav = useNavigate()
  const pick = (k) => { setR(k); setDemoRole(k); setTimeout(() => nav(START[k]), 50) }
  return (
    <div className="demobar">
      <div className="wrap row">
        <b>DEMO · 2027 season · sample data</b>
        <span className="muted-light">View as:</span>
        {Object.entries(DEMO_ROLES).map(([k, v]) => <button key={k} className={r === k ? 'on' : ''} onClick={() => pick(k)}>{v.label}</button>)}
      </div>
    </div>
  )
}
