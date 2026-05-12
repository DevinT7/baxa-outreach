import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getStats, getCompanies } from '../lib/supabase'
import StatusBadge from '../components/StatusBadge'

const METRICS = [
  {
    key: 'total',
    label: 'Total Companies',
    icon: '🏢',
    gradient: 'from-gray-900 to-gray-800',
    text: 'text-white',
    sub: 'text-white/50',
  },
  {
    key: 'not_contacted',
    label: 'Not Contacted',
    icon: '⏳',
    gradient: 'from-gray-50 to-gray-100/60',
    text: 'text-gray-800',
    sub: 'text-gray-400',
    border: 'border border-gray-200',
  },
  {
    key: 'draft_created',
    label: 'Drafts Created',
    icon: '📝',
    gradient: 'from-blue-50 to-indigo-50',
    text: 'text-blue-700',
    sub: 'text-blue-400',
    border: 'border border-blue-100',
  },
  {
    key: 'sent',
    label: 'Emails Sent',
    icon: '📨',
    gradient: 'from-amber-50 to-orange-50',
    text: 'text-amber-700',
    sub: 'text-amber-400',
    border: 'border border-amber-100',
  },
  {
    key: 'replied',
    label: 'Replied',
    icon: '✅',
    gradient: 'from-emerald-50 to-green-50',
    text: 'text-emerald-700',
    sub: 'text-emerald-400',
    border: 'border border-emerald-100',
  },
]

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
    <div className="page flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-baxa-orange border-t-transparent animate-spin" />
        <span className="text-sm text-gray-400">Loading dashboard…</span>
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
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">2026–2027 Corporate Outreach Season</p>
        </div>
        <Link to="/batch" className="btn-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
          Batch Send
        </Link>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {METRICS.map(({ key, label, icon, gradient, text, sub, border }) => (
          <div key={key} className={`rounded-2xl bg-gradient-to-br ${gradient} ${border ?? ''} p-5`}>
            <div className="text-xl mb-2">{icon}</div>
            <div className={`text-3xl font-bold tracking-tight ${text}`}>{stats[key] ?? 0}</div>
            <div className={`text-xs font-medium mt-1 ${sub}`}>{label}</div>
          </div>
        ))}
      </div>

      {/* Progress + pipeline */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Progress card */}
        <div className="col-span-2 card p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-gray-800">Outreach Progress</h2>
            <span className="text-sm font-bold text-baxa-orange">{pct}%</span>
          </div>
          <p className="text-xs text-gray-400 mb-4">{contacted} of {stats.total} companies reached</p>

          {/* Segmented progress bar */}
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex gap-0.5">
            {stats.replied > 0 && (
              <div className="h-full bg-emerald-400 rounded-full transition-all"
                style={{ width: `${(stats.replied / stats.total) * 100}%` }} />
            )}
            {stats.sent > 0 && (
              <div className="h-full bg-amber-400 rounded-full transition-all"
                style={{ width: `${(stats.sent / stats.total) * 100}%` }} />
            )}
            {stats.draft_created > 0 && (
              <div className="h-full bg-blue-400 rounded-full transition-all"
                style={{ width: `${(stats.draft_created / stats.total) * 100}%` }} />
            )}
          </div>

          <div className="flex gap-5 mt-4">
            {[
              { color: 'bg-emerald-400', label: 'Replied', val: stats.replied },
              { color: 'bg-amber-400',   label: 'Sent',    val: stats.sent },
              { color: 'bg-blue-400',    label: 'Drafted', val: stats.draft_created },
              { color: 'bg-gray-200',    label: 'Pending', val: stats.not_contacted },
            ].map(({ color, label, val }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${color}`} />
                <span className="text-xs text-gray-500">{label}</span>
                <span className="text-xs font-semibold text-gray-700">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card p-5 flex flex-col gap-3">
          <h2 className="font-semibold text-gray-800 mb-1">Quick Actions</h2>
          <Link to="/batch" className="group flex items-center gap-3 p-3 rounded-xl bg-baxa-orange/5 border border-baxa-orange/10 hover:bg-baxa-orange/10 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-baxa-orange/10 flex items-center justify-center text-sm">📨</div>
            <div>
              <div className="text-sm font-semibold text-gray-800">Batch Send</div>
              <div className="text-[11px] text-gray-400">{stats.not_contacted} pending</div>
            </div>
          </Link>
          <Link to="/companies" className="group flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm">🏢</div>
            <div>
              <div className="text-sm font-semibold text-gray-800">All Companies</div>
              <div className="text-[11px] text-gray-400">{stats.total} total</div>
            </div>
          </Link>
          <Link to="/settings" className="group flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm">⚙️</div>
            <div>
              <div className="text-sm font-semibold text-gray-800">Settings</div>
              <div className="text-[11px] text-gray-400">Template & sender info</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent companies */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Recent Activity</h2>
          <Link to="/companies" className="text-xs font-medium text-baxa-orange hover:underline underline-offset-2">
            View all companies →
          </Link>
        </div>
        <ul className="divide-y divide-gray-50">
          {recent.map(c => (
            <li key={c.id}>
              <Link to={`/companies/${c.id}`}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/70 transition-colors">
                <CompanyAvatar name={c.name} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 truncate">{c.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {c.contacts?.length ?? 0} contact{c.contacts?.length !== 1 ? 's' : ''}
                    {c.notes && <span className="ml-2 text-gray-300">· {c.notes.slice(0, 40)}{c.notes.length > 40 ? '…' : ''}</span>}
                  </div>
                </div>
                <StatusBadge status={c.status} />
                <svg className="text-gray-300 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function CompanyAvatar({ name, size = 'sm' }) {
  const colors = [
    ['bg-orange-100', 'text-orange-700'],
    ['bg-blue-100',   'text-blue-700'],
    ['bg-violet-100', 'text-violet-700'],
    ['bg-emerald-100','text-emerald-700'],
    ['bg-rose-100',   'text-rose-700'],
    ['bg-amber-100',  'text-amber-700'],
    ['bg-cyan-100',   'text-cyan-700'],
  ]
  const idx = name.charCodeAt(0) % colors.length
  const [bg, text] = colors[idx]
  const dim = size === 'lg' ? 'w-10 h-10 text-sm' : 'w-8 h-8 text-xs'
  return (
    <div className={`${dim} rounded-xl flex items-center justify-center font-bold shrink-0 ${bg} ${text}`}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  )
}
