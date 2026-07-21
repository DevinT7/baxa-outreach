import { useEffect, useState, useMemo } from 'react'
import { getCompanies, setContactBounced } from '../lib/supabase'
import { useToast } from '../context/ToastContext'

// ── Hunter.io Email Verifier API ──────────────────────────────────────────────
// Endpoint: GET https://api.hunter.io/v2/email-verifier?email={email}&api_key={key}
// Results: "deliverable" | "undeliverable" | "risky" | "unknown"
// Free tier: 25 verifications/month. Upgrade for more.
// No CORS issues — Hunter.io allows direct browser calls (same as the extension).

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
  return {
    result: d.result || 'unknown', // deliverable | undeliverable | risky | unknown
    score: d.score ?? null,
    accept_all: d.accept_all || false,
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── Verdict display helpers ───────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────────────────────

export default function EmailVerifier() {
  const toast = useToast()

  // API key
  const [apiKey, setApiKey]       = useState(() => localStorage.getItem(HUNTER_KEY_STORAGE) || '')
  const [keyInput, setKeyInput]   = useState(() => localStorage.getItem(HUNTER_KEY_STORAGE) || '')
  const [showKey, setShowKey]     = useState(false)

  // Data
  const [companies, setCompanies] = useState([])
  const [loading, setLoading]     = useState(true)
  const [selectedId, setSelectedId] = useState('')

  // Verification state: { [contactId]: { status: 'pending'|'running'|'done'|'error', result?, score?, accept_all?, error? } }
  const [verifications, setVerifications] = useState({})
  const [running, setRunning]     = useState(false)

  useEffect(() => {
    getCompanies()
      .then(data => {
        setCompanies(data)
        if (data.length > 0) setSelectedId(data[0].id)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function saveKey() {
    const trimmed = keyInput.trim()
    setApiKey(trimmed)
    localStorage.setItem(HUNTER_KEY_STORAGE, trimmed)
    toast(trimmed ? 'Hunter.io API key saved' : 'API key cleared')
  }

  // Selected company and its contacts
  const company = useMemo(() => companies.find(c => c.id === selectedId), [companies, selectedId])
  const contacts = useMemo(() => company?.contacts || [], [company])

  // Contacts eligible for verification: not already bounced
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
    const toCheck = activeContacts.filter(c => {
      const v = verifications[c.id]
      return !v || v.status === 'error' // skip already-verified and running
    })
    if (toCheck.length === 0) { toast('All contacts already verified'); return }

    setRunning(true)
    for (const contact of toCheck) {
      setContactVerification(contact.id, { status: 'running' })
      try {
        const result = await verifyEmail(contact.email, apiKey)
        setContactVerification(contact.id, { status: 'done', ...result })
      } catch (e) {
        setContactVerification(contact.id, { status: 'error', error: e.message })
        // If it's a key/rate error, abort the whole run
        if (e.message.includes('API key') || e.message.includes('rate limit')) {
          toast(e.message, 'error')
          break
        }
      }
      await sleep(400) // stay within Hunter.io rate limits
    }
    setRunning(false)

    // Auto-suggest marking undeliverable ones as bounced
    const badCount = toCheck.filter(c => verifications[c.id]?.result === 'undeliverable').length
    // (Give state a moment to settle before reading)
    setTimeout(() => {
      const nowBad = activeContacts.filter(c => verifications[c.id]?.result === 'undeliverable').length
      if (nowBad > 0) toast(`${nowBad} undeliverable email${nowBad !== 1 ? 's' : ''} found — mark them as bounced to exclude from future sends`)
    }, 200)
  }

  async function markBounced(contact) {
    try {
      await setContactBounced(contact.id, true)
      // Update local state
      setCompanies(prev => prev.map(co => co.id !== selectedId ? co : {
        ...co,
        contacts: co.contacts.map(ct => ct.id === contact.id ? { ...ct, bounced: true } : ct)
      }))
      toast(`${contact.email} marked as bounced`)
    } catch (e) {
      toast('Failed to mark bounced: ' + e.message, 'error')
    }
  }

  async function unmarkBounced(contact) {
    try {
      await setContactBounced(contact.id, false)
      setCompanies(prev => prev.map(co => co.id !== selectedId ? co : {
        ...co,
        contacts: co.contacts.map(ct => ct.id === contact.id ? { ...ct, bounced: false } : ct)
      }))
      toast(`${contact.email} restored`)
    } catch (e) {
      toast('Failed: ' + e.message, 'error')
    }
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

        {/* Verify All button */}
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
        <div className="flex items-center gap-3">
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
              <button
                className="btn-secondary px-3"
                onClick={() => setShowKey(s => !s)}
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
              <button className="btn-orange" onClick={saveKey}>Save</button>
            </div>
          </div>
          <div className="text-right text-xs text-black/30 leading-relaxed shrink-0 hidden sm:block">
            Free tier: 25 verifications/month.<br />
            Get a key at{' '}
            <a href="https://hunter.io/api" target="_blank" rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-black/50">
              hunter.io/api
            </a>
          </div>
        </div>
        {!apiKey && (
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Add your Hunter.io API key above to start verifying. It's stored locally and never sent to our servers.
          </p>
        )}
      </div>

      {/* Company selector */}
      <div className="mb-5">
        <label className="label">Select Company</label>
        {loading ? (
          <div className="input flex items-center text-black/35 text-sm">Loading companies…</div>
        ) : (
          <select
            className="input"
            value={selectedId}
            onChange={e => { setSelectedId(e.target.value); setVerifications({}) }}
          >
            {companies.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.contacts.length} contact{c.contacts.length !== 1 ? 's' : ''}
                {c.contacts.some(ct => ct.bounced) ? ` (${c.contacts.filter(ct => ct.bounced).length} bounced)` : ''}
              </option>
            ))}
            {companies.length === 0 && <option disabled>No companies yet</option>}
          </select>
        )}
      </div>

      {/* Stats row */}
      {company && contacts.length > 0 && doneCount > 0 && (
        <div className="flex gap-3 mb-5">
          {[
            { label: 'Deliverable', count: activeContacts.filter(c => verifications[c.id]?.result === 'deliverable').length, color: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
            { label: 'Undeliverable', count: activeContacts.filter(c => verifications[c.id]?.result === 'undeliverable').length, color: 'text-red-600 bg-red-50 border-red-100' },
            { label: 'Risky', count: activeContacts.filter(c => verifications[c.id]?.result === 'risky').length, color: 'text-amber-700 bg-amber-50 border-amber-100' },
            { label: 'Unknown', count: activeContacts.filter(c => verifications[c.id]?.result === 'unknown').length, color: 'text-black/40 bg-black/[0.03] border-black/10' },
          ].filter(s => s.count > 0).map(s => (
            <div key={s.label} className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${s.color}`}>
              {s.count} {s.label}
            </div>
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
                  <th className="w-[160px]">Status</th>
                  <th className="w-[160px] text-right pr-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map(contact => {
                  const v = verifications[contact.id]
                  const isRunning = v?.status === 'running'
                  const isDone    = v?.status === 'done'
                  const isError   = v?.status === 'error'

                  return (
                    <tr key={contact.id} className={`table-row ${contact.bounced ? 'opacity-50' : ''}`}>
                      {/* Contact name */}
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-baxa-ink">
                            {contact.name || <span className="text-black/30 italic">No name</span>}
                          </span>
                          {contact.bounced && (
                            <span className="text-[10px] font-bold tracking-wide text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md uppercase">
                              Bounced
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Email */}
                      <td className="table-cell font-mono text-xs text-black/55">{contact.email}</td>

                      {/* Verification status */}
                      <td className="table-cell">
                        {isRunning && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-black/40">
                            <span className="w-3 h-3 rounded-full border-2 border-baxa-orange border-t-transparent animate-spin" />
                            Verifying…
                          </span>
                        )}
                        {isDone && (
                          <VerdictBadge result={v.result} score={v.score} accept_all={v.accept_all} />
                        )}
                        {isError && (
                          <span className="text-xs text-red-500" title={v.error}>Error</span>
                        )}
                        {!v && !contact.bounced && (
                          <span className="text-xs text-black/20">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="table-cell text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Verify individual */}
                          {!contact.bounced && !isRunning && !isDone && (
                            <button
                              className="btn-secondary text-xs py-1 px-2.5"
                              onClick={() => verifySingle(contact)}
                              disabled={!apiKey || running}
                            >
                              Verify
                            </button>
                          )}
                          {/* Re-verify */}
                          {!contact.bounced && isDone && (
                            <button
                              className="text-xs text-black/25 hover:text-black/50 transition-colors"
                              onClick={() => verifySingle(contact)}
                              disabled={running}
                              title="Re-verify"
                            >
                              ↻
                            </button>
                          )}
                          {/* Mark bounced */}
                          {!contact.bounced && isDone && (v.result === 'undeliverable' || v.result === 'risky') && (
                            <button
                              className="btn-secondary text-xs py-1 px-2.5 text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => markBounced(contact)}
                            >
                              Mark Bounced
                            </button>
                          )}
                          {/* Restore bounced */}
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

      {/* Bulk bounce suggestion banner */}
      {badCount > 0 && !running && (
        <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
          <svg className="text-red-400 shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-sm text-red-700 flex-1">
            <strong>{badCount} undeliverable email{badCount !== 1 ? 's' : ''}</strong> found.
            Mark {badCount > 1 ? 'them' : 'it'} as bounced so {badCount > 1 ? 'they' : 'it'} won't appear in Batch Sender.
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

      <p className="mt-4 text-xs text-black/30">
        Verification uses the{' '}
        <a href="https://hunter.io/api-documentation/v2#email-verifier" target="_blank" rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-black/50">
          Hunter.io Email Verifier API
        </a>
        . Requests are made 400ms apart to stay within rate limits.
        <strong className="text-black/40"> Catch-all domains</strong> (which accept any address) return "Unknown" — this is expected.
      </p>
    </div>
  )
}
