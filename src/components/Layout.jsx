import { Outlet, NavLink, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const nav = [
  {
    to: '/dashboard', label: 'Dashboard',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  },
  {
    to: '/companies', label: 'Companies',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></svg>,
  },
  {
    to: '/batch', label: 'Batch Sender',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  },
  {
    to: '/quick-draft', label: 'Quick Draft',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  },
  {
    to: '/verify', label: 'Email Verifier',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  },
  {
    to: '/import', label: 'CSV Import',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  },
  {
    to: '/settings', label: 'Settings',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  },
]

export default function Layout() {
  const { user } = useAuth()
  const avatarUrl = user?.user_metadata?.avatar_url
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Officer'
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen flex bg-baxa-cream">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 flex flex-col fixed top-0 left-0 h-screen z-20 bg-white border-r border-black/[0.06]">

        {/* Logo */}
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 flex items-center justify-center shadow-sm"
              style={{ background: '#7B52AB' }}>
              <img src="/baxa-logo.png" alt="BAXA" className="w-[85%] h-[85%] object-contain" />
            </div>
            <div>
              <div className="font-bold text-sm text-baxa-ink tracking-tight">BAXA</div>
              <div className="text-[10px] text-black/30 font-medium">Outreach Portal</div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-black/[0.05] mb-4" />

        {/* Nav label */}
        <div className="px-5 mb-1.5">
          <span className="text-[9px] font-bold tracking-[0.18em] text-black/25 uppercase">Navigation</span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-0.5">
          {nav.map(({ to, label, icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-baxa-ink text-white shadow-sm'
                    : 'text-black/45 hover:text-baxa-ink hover:bg-black/[0.04]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`shrink-0 transition-colors ${isActive ? 'text-white/60' : 'text-black/25 group-hover:text-black/45'}`}>
                    {icon}
                  </span>
                  <span className="flex-1">{label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-baxa-orange shrink-0" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Season badge */}
        <div className="mx-4 mb-3">
          <div className="bg-baxa-cream/80 border border-black/[0.06] rounded-xl px-3.5 py-2.5">
            <div className="text-[9px] font-bold tracking-[0.15em] text-black/25 uppercase mb-0.5">Season</div>
            <div className="text-xs font-semibold text-baxa-ink/50">2026 – 2027</div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-black/[0.05]" />

        {/* User */}
        <div className="p-3">
          <Link to="/profile"
            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-black/[0.04] transition-colors">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-lg object-cover shrink-0 block ring-1 ring-black/10"
                style={{ minWidth: '1.75rem' }} />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-baxa-orange/10 flex items-center justify-center text-[10px] font-bold text-baxa-orange shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-baxa-ink/60 truncate group-hover:text-baxa-ink transition-colors">
                {displayName}
              </div>
              <div className="text-[10px] text-black/25">View profile</div>
            </div>
            <svg className="text-black/15 group-hover:text-black/35 transition-colors shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-56 min-h-screen overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
