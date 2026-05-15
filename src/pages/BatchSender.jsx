import { useEffect, useState } from 'react'
import { getCompanies, updateCompany, logDraft } from '../lib/supabase'
import { createDraft, requestGmailAccess, isAuthenticated } from '../lib/gmail'
import { renderEmail, getSenderInfo } from '../lib/emailTemplate'
import StatusBadge from '../components/StatusBadge'
import { CompanyAvatar } from './Dashboard'

export default function BatchSender() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(new Set())
  const [filter, setFilter] = useState('not_contacted')
  const [progress, setProgress] = useState(null)
  const [results, setResults] = useState([])
  const [running, setRunning] = useState(false)

  useEffect(() => {
    getCompanies().then(setCompanies).catch(console.error).finally(() => setLoading(false))
  }, [])

  const eligible = companies.filter(c =>
    (filter === 'all' ? true : c.status === filter) && c.contacts.length > 0
  )

  function toggleAll() {
    setSelected(selected.size === eligible.length
      ? new Set()
      : new Set(eligible.map(c => c.id))
    )
  }

  function toggle(id) {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  async function runBatch() {
    if (selected.size === 0) return
    if (!confirm(`Create ${selected.size} Gmail draft${selected.size !== 1 ? 's' : ''}? You'll review and send them from Gmail.`)) return

    setRunning(true)
    setResults([])
    setProgress({ done: 0, total: selected.size, errors: 0 })

    try {
      if (!isAuthenticated()) await requestGmailAccess()
    } catch (e) {
      alert('Gmail sign-in failed: ' + e.message)
      setRunning(false)
      return
    }

    const batch = companies.filter(c => selected.has(c.id))
    const { attachmentName, name: senderName } = getSenderInfo()
    const newResults = []

    for (let i = 0; i < batch.length; i++) {
      const c = batch[i]
      try {
        // One draft per contact, personalized with their name
        for (const contact of c.contacts) {
          const { subject, body } = renderEmail(c.name, contact.name, contact.email)
          const { draftId, draftUrl } = await createDraft({
            toEmails: contact.email,
            subject,
            htmlBody: body,
            attachmentName,
          })
          await logDraft(c.id, { gmailDraftId: draftId, subject, sentBy: senderName })
          await sleep(300)
        }
        await updateCompany(c.id, { status: 'draft_created', last_contacted_at: new Date().toISOString() })
        newResults.push({ id: c.id, name: c.name, ok: true, count: c.contacts.length })
        setProgress(p => ({ ...p, done: i + 1 }))
      } catch (e) {
        newResults.push({ id: c.id, name: c.name, ok: false, error: e.message })
        setProgress(p => ({ ...p, done: i + 1, errors: p.errors + 1 }))
      }
      setResults([...newResults])
    }

    setRunning(false)
    getCompanies().then(setCompanies)
    setSelected(new Set())
  }

  const successCount = results.filter(r => r.ok).length
  const errorCount = results.filter(r => !r.ok).length

  return (
    <div>
      <div className="max-w-5xl mx-auto px-8 pt-10 pb-6">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="text-[10px] font-semibold tracking-widest text-black/30 uppercase mb-2">Gmail Integration</div>
            <h1 className="font-serif italic text-4xl text-baxa-ink leading-tight">Batch Sender</h1>
            <p className="text-sm text-black/35 mt-1">Select companies → generate drafts → send from Gmail.</p>
          </div>
          <div className="mt-1">
            {selected.size > 0 && !running && (
              <button className="btn-orange" onClick={runBatch}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
                Generate {selected.size} Draft{selected.size !== 1 ? 's' : ''}
              </button>
            )}
            {running && (
              <div className="flex items-center gap-2 text-sm text-black/40 font-medium">
                <span className="w-4 h-4 rounded-full border-2 border-baxa-orange border-t-transparent animate-spin" />
                Creating drafts…
              </div>
            )}
          </div>
        </div>

      {/* Progress */}
      {progress && (
        <div className={`mb-5 card p-5 ${running ? '' : errorCount === 0 ? 'bg-emerald-50/40' : 'bg-amber-50/40'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-sm text-baxa-ink">
              {running
                ? `Creating drafts… ${progress.done} of ${progress.total}`
                : `Done — ${successCount} created${errorCount > 0 ? `, ${errorCount} failed` : ''}`}
            </div>
            {!running && (
              <button className="text-xs text-black/35 hover:text-baxa-ink"
                onClick={() => { setProgress(null); setResults([]) }}>
                Clear
              </button>
            )}
          </div>
          <div className="h-2 bg-black/[0.05] rounded-full overflow-hidden">
            <div className="h-full bg-baxa-orange rounded-full transition-all duration-300"
              style={{ width: `${(progress.done / progress.total) * 100}%` }} />
          </div>
          {!running && results.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {results.filter(r => r.ok).map(r => (
                <span key={r.id}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {r.name} · {r.count} draft{r.count !== 1 ? 's' : ''} ✓
                </span>
              ))}
              {results.filter(r => !r.ok).map(r => (
                <span key={r.id} title={r.error}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  {r.name} ✗
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <select className="input max-w-[190px]" value={filter}
          onChange={e => { setFilter(e.target.value); setSelected(new Set()) }}>
          <option value="not_contacted">Not Contacted</option>
          <option value="draft_created">Draft Created</option>
          <option value="sent">Sent</option>
          <option value="all">All (with contacts)</option>
        </select>
        <span className="text-sm text-black/35">{eligible.length} eligible</span>
        <div className="ml-auto">
          <button className="btn-secondary text-xs" onClick={toggleAll}>
            {selected.size === eligible.length && eligible.length > 0 ? 'Deselect All' : `Select All (${eligible.length})`}
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-black/35 text-sm">Loading…</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="table-head">
                <th className="w-12 text-center">
                  <input type="checkbox"
                    checked={selected.size === eligible.length && eligible.length > 0}
                    onChange={toggleAll}
                    className="rounded" />
                </th>
                <th>Company</th>
                <th>Contacts</th>
                <th>Status</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {eligible.map(c => {
                const result = results.find(r => r.id === c.id)
                const isSelected = selected.has(c.id)
                return (
                  <tr key={c.id}
                    className={`table-row ${isSelected ? 'bg-baxa-orange/5' : ''}`}
                    onClick={() => toggle(c.id)}>
                    <td className="table-cell text-center" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggle(c.id)} className="rounded" />
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <CompanyAvatar name={c.name} />
                        <span className="font-semibold text-baxa-ink">{c.name}</span>
                      </div>
                    </td>
                    <td className="table-cell text-black/40">{c.contacts.length}</td>
                    <td className="table-cell">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="table-cell">
                      {result ? (
                        result.ok ? (
                          <a href={result.draftUrl} target="_blank" rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline underline-offset-2">
                            ✓ Draft ready →
                          </a>
                        ) : (
                          <span className="text-xs text-red-500 font-medium" title={result.error}>
                            ✗ Failed
                          </span>
                        )
                      ) : null}
                    </td>
                  </tr>
                )
              })}
              {eligible.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-black/35 text-sm">
                    No companies match this filter, or all are missing contacts.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-black/35">
        After generating, go to{' '}
        <a href="https://mail.google.com/mail/#drafts" target="_blank" rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-black/40">
          Gmail Drafts
        </a>{' '}
        to review and send. Drafts are created 300ms apart to stay within rate limits.
      </p>
      </div>
    </div>
  )
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
