import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getStats, getCompanies } from '../lib/supabase'
import StatusBadge from '../components/StatusBadge'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getStats(), getCompanies()])
      .then(([s, companies]) => {
        setStats(s)
        const sorted = [...companies].sort(
          (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
        )
        setRecent(sorted.slice(0, 8))
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3">
        <div className="w-7 h-7 rounded-full border-2 border-baxa-orange border-t-transparent animate-spin" />
        <span className="text-sm text-black/30">Loading…</span>
      </div>
    </div>
  )

  if (error) return (
    <div className="page">
      <div className="p-5 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm">
        <p className="font-semibold mb-1">⚠ Could not load data</p>
        <p className="font-mono text-xs mb-3">{error}</p>
        <p className="text-red-500">Most likely fix: run <strong>schema.sql</strong> and <strong>seed.sql</strong> in your Supabase SQL Editor, then refresh.</p>
      </div>
    </div>
  )

  if (!stats) return null

  const contacted = stats.sent + stats.replied + stats.draft_created
  const pct = stats.total ? Math.round((contacted / stats.total) * 100) : 0

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-8 pt-10 pb-0">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="text-[10px] font-semibold tracking-widest text-black/30 uppercase mb-2">
              Corporate Outreach · 2026–2027
            </div>
            <h1 className="font-serif italic text-4xl text-baxa-ink leading-tight">Dashboard</h1>
          </div>
          <Link to="/batch"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-baxa-orange text-white text-sm font-semibold
                       hover:bg-[#a84b00] active:scale-[0.98] transition-all shadow-sm mt-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            Batch Send
          </Link>
        </div>

        {/* Metric strip */}
        <div className="grid grid-cols-5 gap-px bg-black/[0.06] rounded-2xl overflow-hidden border border-black/[0.06] mb-6">
          {[
            { key: 'total',         label: 'Total Companies', numColor: 'text-baxa-ink',    bg: 'bg-white',          labelColor: 'text-black/30' },
            { key: 'not_contacted', label: 'Not Contacted',   numColor: 'text-baxa-ink',    bg: 'bg-slate-50',       labelColor: 'text-black/30' },
            { key: 'draft_created', label: 'Drafts Created',  numColor: 'text-sky-600',     bg: 'bg-sky-50',         labelColor: 'text-sky-400' },
            { key: 'sent',          label: 'Emails Sent',     numColor: 'text-baxa-orange', bg: 'bg-amber-50',       labelColor: 'text-amber-400' },
            { key: 'replied',       label: 'Replied',         numColor: 'text-emerald-600', bg: 'bg-emerald-50',     labelColor: 'text-emerald-400' },
          ].map(({ key, label, numColor, bg, labelColor }) => (
            <div key={key} className={`${bg} px-6 py-5`}>
              <div className={`text-[10px] font-semibold tracking-widest uppercase mb-2 ${labelColor}`}>{label}</div>
              <div className={`text-4xl font-bold tracking-tight leading-none tabular-nums ${numColor}`}>
                {stats[key] ?? 0}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-8 pb-10 space-y-5">

        {/* Progress + Quick actions */}
        <div className="grid grid-cols-3 gap-4">

          {/* Progress card */}
          <div className="col-span-2 card p-6">
            <div className="flex items-center justify-between mb-1">
              <div>
                <div className="text-[10px] font-semibold tracking-widest text-black/30 uppercase mb-1">Outreach Progress</div>
                <div className="text-2xl font-bold text-baxa-ink tabular-nums">
                  {pct}<span className="text-base font-medium text-black/30">%</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-baxa-ink">{contacted} <span className="text-black/30 font-normal">of {stats.total}</span></div>
                <div className="text-xs text-black/35 mt-0.5">companies reached</div>
              </div>
            </div>

            {/* Segmented bar */}
            <div className="h-2.5 bg-black/[0.06] rounded-full overflow-hidden flex gap-px mt-5">
              {stats.replied > 0 && (
                <div className="h-full bg-emerald-400 transition-all duration-700"
                  style={{ width: `${(stats.replied / stats.total) * 100}%` }} />
              )}
              {stats.sent > 0 && (
                <div className="h-full bg-baxa-orange transition-all duration-700"
                  style={{ width: `${(stats.sent / stats.total) * 100}%` }} />
              )}
              {stats.draft_created > 0 && (
                <div className="h-full bg-sky-400 transition-all duration-700"
                  style={{ width: `${(stats.draft_created / stats.total) * 100}%` }} />
              )}
            </div>

            <div className="grid grid-cols-4 gap-3 mt-5">
              {[
                { color: 'bg-emerald-400', label: 'Replied',  val: stats.replied,       pct: stats.total ? Math.round((stats.replied / stats.total) * 100) : 0 },
                { color: 'bg-baxa-orange', label: 'Sent',     val: stats.sent,           pct: stats.total ? Math.round((stats.sent / stats.total) * 100) : 0 },
                { color: 'bg-sky-400',     label: 'Drafted',  val: stats.draft_created,  pct: stats.total ? Math.round((stats.draft_created / stats.total) * 100) : 0 },
                { color: 'bg-black/10',    label: 'Pending',  val: stats.not_contacted,  pct: stats.total ? Math.round((stats.not_contacted / stats.total) * 100) : 0 },
              ].map(({ color, label, val, pct: p }) => (
                <div key={label} className="bg-baxa-cream/50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
                    <span className="text-[11px] text-black/40 font-medium">{label}</span>
                  </div>
                  <div className="text-xl font-bold text-baxa-ink tabular-nums">{val}</div>
                  <div className="text-[10px] text-black/30 mt-0.5">{p}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card p-5 flex flex-col">
            <div className="text-[10px] font-semibold tracking-widest text-black/30 uppercase mb-3">Quick Actions</div>
            <div className="space-y-2 flex-1">
              <Link to="/batch"
                className="flex items-center gap-3 p-3.5 rounded-xl border border-baxa-orange/20 bg-baxa-orange/5 hover:bg-baxa-orange/10 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-baxa-orange flex items-center justify-center shrink-0 shadow-sm shadow-baxa-orange/30">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-baxa-ink">Batch Send</div>
                  <div className="text-[11px] text-black/35">{stats.not_contacted} companies pending</div>
                </div>
                <svg className="text-black/20 group-hover:text-baxa-orange transition-colors shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </Link>

              <Link to="/companies"
                className="flex items-center gap-3 p-3.5 rounded-xl border border-black/[0.06] bg-baxa-cream/40 hover:bg-baxa-cream-2 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-baxa-ink/8 flex items-center justify-center shrink-0">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-baxa-ink/50">
                    <path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-baxa-ink">All Companies</div>
                  <div className="text-[11px] text-black/35">{stats.total} in database</div>
                </div>
                <svg className="text-black/20 group-hover:text-baxa-ink/40 transition-colors shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </Link>

              <Link to="/settings"
                className="flex items-center gap-3 p-3.5 rounded-xl border border-black/[0.06] bg-baxa-cream/40 hover:bg-baxa-cream-2 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-baxa-ink/8 flex items-center justify-center shrink-0">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-baxa-ink/50">
                    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-baxa-ink">Settings</div>
                  <div className="text-[11px] text-black/35">Template & sender info</div>
                </div>
                <svg className="text-black/20 group-hover:text-baxa-ink/40 transition-colors shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between">
            <div>
              <div className="text-[10px] font-semibold tracking-widest text-black/30 uppercase mb-0.5">Recent Activity</div>
              <div className="text-sm font-semibold text-baxa-ink">Latest updates</div>
            </div>
            <Link to="/companies"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-baxa-orange hover:text-[#a84b00] transition-colors">
              View all companies
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>
          </div>
          <ul>
            {recent.map((c, i) => (
              <li key={c.id} className={i < recent.length - 1 ? 'border-b border-black/[0.04]' : ''}>
                <Link to={`/companies/${c.id}`}
                  className="group flex items-center gap-4 px-6 py-3.5 hover:bg-baxa-cream/40 transition-colors">
                  <CompanyAvatar name={c.name} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-baxa-ink truncate group-hover:text-baxa-orange transition-colors">
                      {c.name}
                    </div>
                    <div className="text-xs text-black/35 mt-0.5">
                      {c.contacts?.length ?? 0} contact{c.contacts?.length !== 1 ? 's' : ''}
                      {c.notes && <span className="ml-2 text-black/20">· {c.notes.slice(0, 45)}{c.notes.length > 45 ? '…' : ''}</span>}
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                  <svg className="text-black/15 group-hover:text-black/30 transition-colors shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  )
}

export function CompanyAvatar({ name, size = 'sm' }) {
  const colors = [
    ['bg-baxa-orange/10', 'text-baxa-orange'],
    ['bg-violet-100',     'text-violet-600'],
    ['bg-emerald-100',    'text-emerald-700'],
    ['bg-sky-100',        'text-sky-700'],
    ['bg-rose-100',       'text-rose-600'],
    ['bg-amber-100',      'text-amber-700'],
    ['bg-baxa-ink/[0.07]','text-baxa-ink/60'],
  ]
  const idx = name.charCodeAt(0) % colors.length
  const [bg, text] = colors[idx]
  const dim = size === 'lg' ? 'w-11 h-11 text-sm rounded-xl' : 'w-9 h-9 text-xs rounded-xl'
  return (
    <div className={`${dim} flex items-center justify-center font-bold shrink-0 ${bg} ${text}`}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
}
