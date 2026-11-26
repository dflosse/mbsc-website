// On phones, tables marked "auto-label" become stacked cards. This copies each column
// heading onto its cells (data-label) so every value shows with its label.
export function startStackLabels() {
  const apply = () => {
    for (const t of document.querySelectorAll('table.auto-label')) {
      const heads = [...t.querySelectorAll('thead th')].map((th) => th.textContent.trim())
      for (const tr of t.querySelectorAll('tbody tr')) {
        const cells = [...tr.children]
        if (cells.length === 1 && cells[0].colSpan > 1) continue
        cells.forEach((td, i) => {
          if (i === 0) { td.classList.add('lead-cell'); return }
          if (!td.hasAttribute('data-label') && heads[i]) td.setAttribute('data-label', heads[i])
        })
      }
    }
  }
  let queued = false
  const obs = new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; apply() }) } })
  obs.observe(document.body, { childList: true, subtree: true })
  apply()
}
