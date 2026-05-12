import { Outlet, NavLink, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const nav = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    to: '/companies',
    label: 'Companies',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>
      </svg>
    ),
  },
  {
    to: '/batch',
    label: 'Batch Sender',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
]

export default function Layout() {
  const { user } = useAuth()

  const avatarUrl = user?.user_metadata?.avatar_url
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Officer'
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen flex bg-[#f6f7f9]">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 flex flex-col fixed top-0 left-0 h-screen z-20"
        style={{ background: 'linear-gradient(160deg, #0f0f1a 0%, #1a1025 100%)' }}>

        {/* Logo */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-2 ring-white/10 flex items-center justify-center"
              style={{ background: '#7B52AB' }}>
              <img src="/baxa-logo.png" alt="BAXA" className="w-[85%] h-[85%] object-contain" />
            </div>
            <div>
              <div className="text-white font-bold text-sm leading-tight tracking-tight">BAXA</div>
              <div className="text-white/40 text-[10px] font-medium tracking-wide">Outreach Portal</div>
            </div>
          </div>
        </div>

        <div className="mx-5 h-px bg-white/[0.06] mb-3" />

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          {nav.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/[0.06]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`transition-colors ${isActive ? 'text-[#F26522]' : 'text-white/30 group-hover:text-white/50'}`}>
                    {icon}
                  </span>
                  {label}
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#F26522]" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mx-5 h-px bg-white/[0.06] mb-3" />

        {/* User profile footer */}
        <div className="px-3 pb-4">
          <Link to="/profile"
            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-lg object-cover ring-1 ring-white/10 shrink-0 block"
                style={{ minWidth: '1.75rem' }}
              />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-baxa-orange/20 flex items-center justify-center text-[10px] font-bold text-[#F26522] shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-white/70 truncate group-hover:text-white/90 transition-colors">
                {displayName}
              </div>
              <div className="text-[10px] text-white/30 truncate">View profile</div>
            </div>
            <svg className="text-white/20 group-hover:text-white/40 transition-colors shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60 min-h-screen overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
