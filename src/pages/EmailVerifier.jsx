import { useEffect, useRef, useState, useMemo } from 'react'
import { getCompanies, setContactBounced } from '../lib/supabase'
import { CompanyAvatar } from './Dashboard'
import { useToast } from '../context/ToastContext'

// ── Hunter.io Email Verifier API ──────────────────────────────────────────────

const HUNTER_KEY_STORAGE = 'baxa_hunter_api_key'

async function verifyEmail(email, apiKey) {
  const url = `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${encodeURIComponent(apiKey)}`
  const resp = await fetch(url)
  const json = await resp.json()
  if (!resp.ok) {
    const detail = json.errors?.[0]?.details || `HTTP ${resp.status}`
    if (resp.status === 401 || resp.status === 403) throw new Error('Invalid Hunter.io API key')
    if (resp.status === 429) throw new Error('Hunter.io rate limit reached — try again later')
    throw new Error('Hunter.io: ' + detail)
  }
  const d = json.data || {}
  return { result: d.result || 'unknown', score: d.score ?? null, accept_all: d.accept_all || false }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── Verdict helpers ───────────────────────────────────────────────────────────

const VERDICT = {
  deliverable:   { label: 'Deliverable',   color: 'text-emerald-700 bg-emerald-50 border-emerald-100', dot: 'bg-emerald-400' },
  undeliverable: { label: 'Undeliverable', color: 'text-red-600 bg-red-50 border-red-100',             dot: 'bg-red-400'     },
  risky:         { label: 'Risky',         color: 'text-amber-700 bg-amber-50 border-amber-100',        dot: 'bg-amber-400'   },
  unknown:       { label: 'Unknown',       color: 'text-black/40 bg-black/[0.03] border-black/10',      dot: 'bg-black/20'    },
}

function VerdictBadge({ result, score, accept_all }) {
  const v = VERDICT[result] || VERDICT.unknown
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${v.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${v.dot}`} />
      {v.label}
      {score !== null && score !== undefined && <span className="opacity-60 font-normal">· {score}%</span>}
      {accept_all && <span className="opacity-50 font-normal">(catch-all)</span>}
    </span>
  )
}

// ── Custom Company Picker ─────────────────────────────────────────────────────

function CompanyPicker({ companies, value, onChange }) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const ref                 = useRef(null)
  const inputRef            = useRef(null)

  const selected = companies.find(c => c.id === value)

  const filtered = useMemo(() => {
    if (!search.trim()) return companies
    const q = search.toLowerCase()
    return companies.filter(c => c.name.toLowerCase().includes(q))
  }, [companies, search])

  // Close on outside click
  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus search input when opening
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
    else setSearch('')
  }, [open])

  function select(id) { onChange(id); setOpen(false) }

  const bouncedCount = (c) => c.contacts.filter(ct => ct.bounced).length
  const activeCount  = (c) => c.contacts.filter(ct => !ct.bounced).length

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`
          w-full flex items-center gap-3 px-4 py-3 bg-white border rounded-xl text-left
          transition-all duration-150
          ${open
            ? 'border-baxa-ink/20 ring-2 ring-baxa-ink/[0.06] shadow-sm'
            : 'border-black/[0.08] hover:border-black/15 hover:shadow-sm'
          }
        `}
      >
        {selected ? (
          <>
            <CompanyAvatar name={selected.name} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-baxa-ink truncate">{selected.name}</div>
              <div className="text-xs text-black/35 mt-0.5">
                {activeCount(selected)} active contact{activeCount(selected) !== 1 ? 's' : ''}
                {bouncedCount(selected) > 0 && (
                  <span className="text-red-400"> · {bouncedCount(selected)} bounced</span>
                )}
              </div>
            </div>
          </>
        ) : (
          <span className="text-black/30 text-sm flex-1">Select a company…</span>
        )}
        <svg
          className={`shrink-0 text-black/25 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute z-50 mt-2 w-full bg-white border border-black/[0.08] rounded-xl shadow-xl overflow-hidden"
          style={{ animation: 'pickerFadeIn 0.12s ease' }}
        >
          {/* Search */}
          <div className="p-2 border-b border-black/[0.05]">
            <div className="flex items-center gap-2 px-2.5 py-2 bg-black/[0.03] rounded-lg">
              <svg className="text-black/25 shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-transparent text-sm text-baxa-ink placeholder:text-black/25 outline-none"
                placeholder="Search companies…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-black/25 hover:text-black/50">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Company list */}
          <div className="overflow-y-auto max-h-72">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-black/30">No companies match "{search}"</div>
            ) : (
              filtered.map((c, i) => {
                const isSelected = c.id === value
                const active  = activeCount(c)
                const bounced = bouncedCount(c)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => select(c.id)}
                    className={`
                      w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors
                      ${i > 0 ? 'border-t border-black/[0.04]' : ''}
                      ${isSelected ? 'bg-baxa-orange/[0.05]' : 'hover:bg-black/[0.02]'}
                    `}
                  >
                    <CompanyAvatar name={c.name} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm truncate ${isSelected ? 'font-semibold text-baxa-ink' : 'font-medium text-baxa-ink/80'}`}>
                        {c.name}
                      </div>
                      <div className="text-[11px] text-black/30 mt-0.5">
                        {active} contact{active !== 1 ? 's' : ''}
                        {bounced > 0 && <span className="text-red-400"> · {bounced} bounced</span>}
                      </div>
                    </div>
                    {isSelected && (
                      <svg className="shrink-0 text-baxa-orange" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pickerFadeIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EmailVerifier() {
  const toast = useToast()

  const [apiKey, setApiKey]     = useState(() => localStorage.getItem(HUNTER_KEY_STORAGE) || '')
  const [keyInput, setKeyInput] = useState(() => localStorage.getItem(HUNTER_KEY_STORAGE) || '')
  const [showKey, setShowKey]   = useState(false)

  const [companies, setCompanies]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [selectedId, setSelectedId] = useState('')

  const [verifications, setVerifications] = useState({})
  const [running, setRunning]             = useState(false)

  useEffect(() => {
    getCompanies()
      .then(data => { setCompanies(data); if (data.length > 0) setSelectedId(data[0].id) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function saveKey() {
    const trimmed = keyInput.trim()
    setApiKey(trimmed)
    localStorage.setItem(HUNTER_KEY_STORAGE, trimmed)
    toast(trimmed ? 'Hunter.io API key saved' : 'API key cleared')
  }

  const company        = useMemo(() => companies.find(c => c.id === selectedId), [companies, selectedId])
  const contacts       = useMemo(() => company?.contacts || [], [company])
  const activeContacts = useMemo(() => contacts.filter(c => !c.bounced), [contacts])

  function setContactVerification(id, patch) {
    setVerifications(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }))
  }

  async function verifySingle(contact) {
    if (!apiKey) { toast('Enter your Hunter.io API key first', 'error'); return }
    setContactVerification(contact.id, { status: 'running' })
    try {
      const result = await verifyEmail(contact.email, apiKey)
      setContactVerification(contact.id, { status: 'done', ...result })
    } catch (e) {
      setContactVerification(contact.id, { status: 'error', error: e.message })
      toast(e.message, 'error')
    }
  }

  async function verifyAll() {
    if (!apiKey) { toast('Enter your Hunter.io API key first', 'error'); return }
    const toCheck = activeContacts.filter(c => { const v = verifications[c.id]; return !v || v.status === 'error' })
    if (toCheck.length === 0) { toast('All contacts already verified'); return }

    setRunning(true)
    for (const contact of toCheck) {
      setContactVerification(contact.id, { status: 'running' })
      try {
        const result = await verifyEmail(contact.email, apiKey)
        setContactVerification(contact.id, { status: 'done', ...result })
      } catch (e) {
        setContactVerification(contact.id, { status: 'error', error: e.message })
        if (e.message.includes('API key') || e.message.includes('rate limit')) { toast(e.message, 'error'); break }
      }
      await sleep(400)
    }
    setRunning(false)
    setTimeout(() => {
      const nowBad = activeContacts.filter(c => verifications[c.id]?.result === 'undeliverable').length
      if (nowBad > 0) toast(`${nowBad} undeliverable email${nowBad !== 1 ? 's' : ''} found`)
    }, 200)
  }

  async function markBounced(contact) {
    try {
      await setContactBounced(contact.id, true)
      setCompanies(prev => prev.map(co => co.id !== selectedId ? co : {
        ...co, contacts: co.contacts.map(ct => ct.id === contact.id ? { ...ct, bounced: true } : ct)
      }))
      toast(`${contact.email} marked as bounced`)
    } catch (e) { toast('Failed: ' + e.message, 'error') }
  }

  async function unmarkBounced(contact) {
    try {
      await setContactBounced(contact.id, false)
      setCompanies(prev => prev.map(co => co.id !== selectedId ? co : {
        ...co, contacts: co.contacts.map(ct => ct.id === contact.id ? { ...ct, bounced: false } : ct)
      }))
      toast(`${contact.email} restored`)
    } catch (e) { toast('Failed: ' + e.message, 'error') }
  }

  const pendingCount = activeContacts.filter(c => !verifications[c.id] || verifications[c.id].status === 'error').length
  const doneCount    = activeContacts.filter(c => verifications[c.id]?.status === 'done').length
  const badCount     = activeContacts.filter(c => verifications[c.id]?.result === 'undeliverable').length

  return (
    <div className="max-w-4xl mx-auto px-8 pt-10 pb-10">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-[10px] font-semibold tracking-widest text-black/30 uppercase mb-2">Data Quality</div>
          <h1 className="font-serif italic text-4xl text-baxa-ink leading-tight">Email Verifier</h1>
          <p className="text-sm text-black/35 mt-1">
            Verify contacts via Hunter.io — mark bad emails as bounced so they're skipped in Batch Sender.
          </p>
        </div>
        {!running && pendingCount > 0 && apiKey && (
          <button className="btn-orange mt-1" onClick={verifyAll} disabled={!company}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            Verify {pendingCount} Email{pendingCount !== 1 ? 's' : ''}
          </button>
        )}
        {running && (
          <div className="flex items-center gap-2 text-sm text-black/40 font-medium mt-1">
            <span className="w-4 h-4 rounded-full border-2 border-baxa-orange border-t-transparent animate-spin" />
            Verifying…
          </div>
        )}
      </div>

      {/* API Key card */}
      <div className="card p-5 mb-5">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <label className="label">Hunter.io API Key</label>
            <div className="flex gap-2 mt-1">
              <input
                type={showKey ? 'text' : 'password'}
                className="input flex-1 font-mono text-sm"
                placeholder="Paste your Hunter.io API key…"
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveKey()}
              />
              <button className="btn-secondary px-3" onClick={() => setShowKey(s => !s)} title={showKey ? 'Hide' : 'Show'}>
                {showKey
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
              <button className="btn-orange" onClick={saveKey}>Save</button>
            </div>
            {!apiKey && (
              <p className="mt-2.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Get a free key at{' '}
                <a href="https://hunter.io/api" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-2">hunter.io/api</a>
                {' '}— free tier gives 25 verifications/month. Key is stored locally only.
              </p>
            )}
          </div>
          {apiKey && (
            <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg mt-5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-emerald-700">Key saved</span>
            </div>
          )}
        </div>
      </div>

      {/* Company picker */}
      <div className="mb-6">
        <label className="label mb-2 block">Select Company</label>
        {loading ? (
          <div className="card px-4 py-3 flex items-center gap-2 text-sm text-black/35">
            <span className="w-4 h-4 rounded-full border-2 border-black/10 border-t-transparent animate-spin" />
            Loading companies…
          </div>
        ) : (
          <CompanyPicker
            companies={companies}
            value={selectedId}
            onChange={id => { setSelectedId(id); setVerifications({}) }}
          />
        )}
      </div>

      {/* Stats row */}
      {company && doneCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { label: 'Deliverable',   count: activeContacts.filter(c => verifications[c.id]?.result === 'deliverable').length,   color: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
            { label: 'Undeliverable', count: activeContacts.filter(c => verifications[c.id]?.result === 'undeliverable').length, color: 'text-red-600 bg-red-50 border-red-100' },
            { label: 'Risky',         count: activeContacts.filter(c => verifications[c.id]?.result === 'risky').length,         color: 'text-amber-700 bg-amber-50 border-amber-100' },
            { label: 'Unknown',       count: activeContacts.filter(c => verifications[c.id]?.result === 'unknown').length,       color: 'text-black/40 bg-black/[0.03] border-black/10' },
          ].filter(s => s.count > 0).map(s => (
            <span key={s.label} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${s.color}`}>
              {s.count} {s.label}
            </span>
          ))}
        </div>
      )}

      {/* Contacts table */}
      {company && (
        contacts.length === 0 ? (
          <div className="card flex items-center justify-center h-40 text-sm text-black/35">
            No contacts for {company.name} — add some via CSV Import or the company page.
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="table-head">
                  <th>Contact</th>
                  <th>Email</th>
                  <th className="w-[165px]">Verification</th>
                  <th className="w-[170px] text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map(contact => {
                  const v         = verifications[contact.id]
                  const isRunning = v?.status === 'running'
                  const isDone    = v?.status === 'done'
                  const isError   = v?.status === 'error'

                  return (
                    <tr key={contact.id} className={`table-row ${contact.bounced ? 'opacity-45' : ''}`}>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-baxa-ink text-sm">
                            {contact.name || <span className="text-black/25 italic font-normal text-xs">No name</span>}
                          </span>
                          {contact.bounced && (
                            <span className="text-[9px] font-bold tracking-widest text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded uppercase">
                              Bounced
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="table-cell font-mono text-xs text-black/50">{contact.email}</td>

                      <td className="table-cell">
                        {isRunning && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-black/35">
                            <span className="w-3 h-3 rounded-full border-2 border-baxa-orange border-t-transparent animate-spin" />
                            Verifying…
                          </span>
                        )}
                        {isDone    && <VerdictBadge result={v.result} score={v.score} accept_all={v.accept_all} />}
                        {isError   && <span className="text-xs text-red-400 font-medium" title={v.error}>Error — retry</span>}
                        {!v        && <span className="text-xs text-black/15">—</span>}
                      </td>

                      <td className="table-cell">
                        <div className="flex items-center justify-end gap-2">
                          {!contact.bounced && !isRunning && !isDone && (
                            <button
                              className="btn-secondary text-xs py-1 px-2.5"
                              onClick={() => verifySingle(contact)}
                              disabled={!apiKey || running}
                            >
                              Verify
                            </button>
                          )}
                          {!contact.bounced && isDone && (
                            <button
                              className="text-xs text-black/20 hover:text-black/50 transition-colors"
                              onClick={() => verifySingle(contact)}
                              disabled={running}
                              title="Re-verify"
                            >
                              ↻ Retry
                            </button>
                          )}
                          {!contact.bounced && isDone && (v.result === 'undeliverable' || v.result === 'risky') && (
                            <button
                              className="btn-secondary text-xs py-1 px-2.5 !text-red-600 !border-red-200 hover:!bg-red-50"
                              onClick={() => markBounced(contact)}
                            >
                              Mark Bounced
                            </button>
                          )}
                          {contact.bounced && (
                            <button
                              className="text-xs text-black/30 hover:text-black/55 transition-colors underline underline-offset-2"
                              onClick={() => unmarkBounced(contact)}
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Bulk bounce banner */}
      {badCount > 0 && !running && (
        <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
          <svg className="text-red-400 shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-sm text-red-700 flex-1">
            <strong>{badCount} undeliverable email{badCount !== 1 ? 's' : ''}</strong> found — mark {badCount > 1 ? 'them' : 'it'} as bounced to exclude from future sends.
          </p>
          <button
            className="text-xs font-semibold text-red-600 hover:text-red-800 shrink-0 underline underline-offset-2"
            onClick={async () => {
              const bad = activeContacts.filter(c => verifications[c.id]?.result === 'undeliverable')
              for (const c of bad) await markBounced(c)
            }}
          >
            Mark All Bounced
          </button>
        </div>
      )}

      <p className="mt-4 text-xs text-black/25 leading-relaxed">
        Uses the{' '}
        <a href="https://hunter.io/api-documentation/v2#email-verifier" target="_blank" rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-black/45">
          Hunter.io Email Verifier API
        </a>.
        Requests are spaced 400ms apart. Catch-all domains return "Unknown" — that's expected.
      </p>
    </div>
  )
}
