import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { DEMO } from './supabase'

// The site is a single page, so an open tab never fetches updates by itself.
// Every few minutes (and when the tab comes back into view) check whether a newer build is live;
// if so, reload on the person's next page change so nothing they're typing is lost.
const current = () => [...document.scripts].map((s) => s.getAttribute('src')).find((s) => s && s.includes('/assets/'))
export default function useFreshVersion() {
  const stale = useRef(false)
  const loc = useLocation()
  useEffect(() => {
    if (DEMO) return
    const mine = current()
    if (!mine) return
    let last = 0
    const check = async () => {
      if (Date.now() - last < 120000) return
      last = Date.now()
      try {
        const html = await (await fetch('/index.html', { cache: 'no-store' })).text()
        const m = html.match(/src="(\/assets\/[^"]+\.js)"/)
        if (m && m[1] !== mine) stale.current = true
      } catch { /* offline – try later */ }
    }
    check()
    const t = setInterval(check, 300000)
    const vis = () => document.visibilityState === 'visible' && check()
    document.addEventListener('visibilitychange', vis)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis) }
  }, [])
  useEffect(() => { if (stale.current) window.location.reload() }, [loc.pathname])
}
