import { useEffect, useMemo, useState } from 'react'
import { getCompanies, mergeCompanies, updateCompany } from '../lib/supabase'
import { CompanyAvatar } from './Dashboard'
import StatusBadge from '../components/StatusBadge'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'

// ── Status ranking (higher = better / more advanced) ─────────────────────────
const STATUS_RANK = { replied: 5, sent: 4, not_interested: 3, draft_created: 2, not_contacted: 1 }

function rankStatus(s) { return STATUS_RANK[s] || 0 }

/**
 * Given two companies, decide which to keep.
 * Priority: 1) higher status  2) more email_logs  3) more contacts
 */
function pickPrimary(a, b) {
  const rankA = rankStatus(a.status)
  const rankB = rankStatus(b.status)
  if (rankA !== rankB) return rankA >= rankB ? [a, b] : [b, a]
  const logsA = a.email_logs?.length ?? 0
  const logsB = b.email_logs?.length ?? 0
  if (logsA !== logsB) return logsA >= logsB ? [a, b] : [b, a]
  return (a.contacts?.length ?? 0) >= (b.contacts?.length ?? 0) ? [a, b] : [b, a]
}

// ── Contacts that would actually be moved (new email addresses only) ──────────
function newContactsFrom(dup, keep) {
  const existingEmails = new Set((keep.contacts || []).map(c => c.email.toLowerCase()))
  return (dup.contacts || []).filter(c => !existingEmails.has(c.email.toLowerCase()))
}
function dupeContactsFrom(dup, keep) {
  const existingEmails = new Set((keep.contacts || []).map(c => c.email.toLowerCase()))
  return (dup.contacts || []).filter(c => existingEmails.has(c.email.toLowerCase()))
}

// ── Single merge group card ───────────────────────────────────────────────────
function DupeGroup({ group, onMerged }) {
  const toast   = useToast()
  const confirm = useConfirm()

  // The group may have 2+ entries — process as pairs: first vs rest
  // For simplicity, always merge in pairs (keep best, merge second-best, repeat)
  const [keep, dup] = pickPrimary(group[0], group[1])

  const movedContacts  = newContactsFrom(dup, keep)
  const skippedContacts = dupeContactsFrom(dup, keep)
  const movedLogs      = dup.email_logs?.length ?? 0
  const [loading, setLoading] = useState(false)

  // Allow swapping who's kept
  const [swapped, setSwapped] = useState(false)
  const primary = swapped ? dup  : keep
  const secondary = swapped ? keep : dup
  const actualMoved   = newContactsFrom(secondary, primary)
  const actualSkipped = dupeContactsFrom(secondary, primary)
  const actualLogs    = secondary.email_logs?.length ?? 0

  async function doMerge() {
    const ok = await confirm({
      title: `Merge "${secondary.name}" into "${primary.name}"?`,
      message: `This will move ${actualMoved.length} contact${actualMoved.length !== 1 ? 's' : ''} and ${actualLogs} email log${actualLogs !== 1 ? 's' : ''} to "${primary.name}", then permanently delete the duplicate entry. This cannot be undone.`,
      confirmLabel: 'Merge & Delete Duplicate',
    })
    if (!ok) return

    setLoading(true)
    try {
      // If secondary has a better last_contacted_at, bump primary
      const primaryDate   = primary.last_contacted_at ? new Date(primary.last_contacted_at) : null
      const secondaryDate = secondary.last_contacted_at ? new Date(secondary.last_contacted_at) : null
      if (secondaryDate && (!primaryDate || secondaryDate > primaryDate)) {
        await updateCompany(primary.id, { last_contacted_at: secondary.last_contacted_at })
      }

      await mergeCompanies(primary.id, secondary.id, primary.contacts || [])
      toast(`Merged "${secondary.name}" → "${primary.name}"`)
      onMerged()
    } catch (e) {
      toast('Merge failed: ' + e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card overflow-hidden">
      {/* Group header */}
      <div className="px-5 py-3.5 border-b border-black/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <CompanyAvatar name={primary.name} />
          <div>
            <span className="font-semibold text-baxa-ink">{primary.name}</span>
            <span className="text-black/30 text-xs ml-2">{group.length} duplicate entries</span>
          </div>
        </div>
        <button
          className="btn-orange text-sm"
          onClick={doMerge}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              Merging…
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
              </svg>
              Merge
            </span>
          )}
        </button>
      </div>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-2 divide-x divide-black/[0.05]">

        {/* KEEP side */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[9px] font-bold tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded uppercase">Keep</span>
            {swapped && (
              <button onClick={() => setSwapped(false)} className="text-[10px] text-black/30 hover:text-black/55 underline underline-offset-2">
                swap
              </button>
            )}
          </div>
          <CompanyRow company={primary} />
        </div>

        {/* MERGE (delete) side */}
        <div className="p-5 bg-black/[0.015]">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[9px] font-bold tracking-widest text-red-500 bg-red-50 border border-red-100 px-2 py-0.5 rounded uppercase">Delete</span>
            {!swapped && (
              <button onClick={() => setSwapped(true)} className="text-[10px] text-black/30 hover:text-black/55 underline underline-offset-2">
                swap
              </button>
            )}
          </div>
          <CompanyRow company={secondary} />
        </div>
      </div>

      {/* Merge plan summary */}
      <div className="px-5 py-3 bg-baxa-cream/40 border-t border-black/[0.05] flex flex-wrap gap-x-6 gap-y-1 text-xs text-black/45">
        <span>
          <strong className="text-baxa-ink">{actualMoved.length}</strong> contact{actualMoved.length !== 1 ? 's' : ''} will be moved
        </span>
        {actualSkipped.length > 0 && (
          <span>
            <strong className="text-baxa-ink">{actualSkipped.length}</strong> duplicate email{actualSkipped.length !== 1 ? 's' : ''} will be discarded
          </span>
        )}
        <span>
          <strong className="text-baxa-ink">{actualLogs}</strong> email log{actualLogs !== 1 ? 's' : ''} will be moved
        </span>
        <span className="text-black/25">
          Result: 1 entry · {(primary.contacts?.length ?? 0) + actualMoved.length} contact{(primary.contacts?.length ?? 0) + actualMoved.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  )
}

function CompanyRow({ company }) {
  const contacts = company.contacts || []
  const logs     = company.email_logs || []
  const bounced  = contacts.filter(c => c.bounced).length

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <StatusBadge status={company.status} />
      </div>
      <div className="text-xs text-black/45 space-y-1">
        <div className="flex items-center gap-1.5">
          <svg className="text-black/20 shrink-0" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span>
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
            {bounced > 0 && <span className="text-red-400"> · {bounced} bounced</span>}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="text-black/20 shrink-0" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
          </svg>
          <span>{logs.length} email log{logs.length !== 1 ? 's' : ''}</span>
        </div>
        {company.last_contacted_at && (
          <div className="flex items-center gap-1.5">
            <svg className="text-black/20 shrink-0" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Last contacted {new Date(company.last_contacted_at).toLocaleDateString()}</span>
          </div>
        )}
      </div>
      {/* Contact emails preview */}
      {contacts.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {contacts.slice(0, 4).map(c => (
            <span key={c.id} className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${c.bounced ? 'text-red-400 bg-red-50 border-red-100' : 'text-black/40 bg-black/[0.03] border-black/[0.06]'}`}>
              {c.email}
            </span>
          ))}
          {contacts.length > 4 && (
            <span className="text-[10px] text-black/25 px-1.5 py-0.5">+{contacts.length - 4} more</span>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DedupeCompanies() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading]     = useState(true)
  const toast = useToast()

  function load() {
    setLoading(true)
    getCompanies()
      .then(setCompanies)
      .catch(e => toast('Failed to load companies: ' + e.message, 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  // Group by normalized name
  const dupeGroups = useMemo(() => {
    const map = new Map()
    for (const c of companies) {
      const key = c.name.toLowerCase().trim()
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(c)
    }
    return [...map.values()].filter(g => g.length > 1)
  }, [companies])

  return (
    <div className="max-w-4xl mx-auto px-8 pt-10 pb-10">

      {/* Header */}
      <div className="mb-8">
        <div className="text-[10px] font-semibold tracking-widest text-black/30 uppercase mb-2">Data Quality</div>
        <h1 className="font-serif italic text-4xl text-baxa-ink leading-tight">Merge Duplicates</h1>
        <p className="text-sm text-black/35 mt-1">
          Safely merge companies with the same name — contacts and email history are moved, nothing is lost.
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-48 text-black/35 text-sm gap-2">
          <span className="w-4 h-4 rounded-full border-2 border-baxa-orange border-t-transparent animate-spin" />
          Scanning for duplicates…
        </div>
      )}

      {/* No duplicates */}
      {!loading && dupeGroups.length === 0 && (
        <div className="card p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
            <svg className="text-emerald-500" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div className="font-semibold text-baxa-ink mb-1">No duplicates found</div>
          <p className="text-sm text-black/35">All {companies.length} companies have unique names.</p>
        </div>
      )}

      {/* Duplicate groups */}
      {!loading && dupeGroups.length > 0 && (
        <>
          {/* Banner */}
          <div className="mb-5 flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
            <svg className="text-amber-500 shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p className="text-sm text-amber-800 flex-1">
              Found <strong>{dupeGroups.length} duplicate group{dupeGroups.length !== 1 ? 's' : ''}</strong>.
              The tool auto-picks which entry to keep based on status and history — you can swap if needed.
            </p>
          </div>

          <div className="space-y-5">
            {dupeGroups.map(group => (
              <DupeGroup
                key={group.map(c => c.id).join('-')}
                group={group}
                onMerged={load}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
