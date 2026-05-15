import { useState } from 'react'
import { signInWithGoogle } from '../lib/auth'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSignIn() {
    setLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f5f3ef' }}>

      {/* ── Left panel ── */}
      <div className="hidden lg:flex w-[52%] flex-col bg-baxa-ink relative overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(ellipse at 30% 20%, rgba(191,87,0,0.25) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(123,82,171,0.15) 0%, transparent 50%)',
        }}>

        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }} />

        {/* Content */}
        <div className="relative flex flex-col h-full px-12 py-12">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
              style={{ background: '#7B52AB' }}>
              <img src="/baxa-logo.png" alt="BAXA" className="w-[85%] h-[85%] object-contain" />
            </div>
            <div>
              <div className="font-bold text-sm text-white tracking-tight">BAXA</div>
              <div className="text-[10px] text-white/30 font-medium">Outreach Portal</div>
            </div>
          </div>

          {/* Hero copy */}
          <div className="mb-auto">
            <h2 className="font-serif italic text-5xl text-white leading-tight mb-4">
              Corporate<br />Outreach,<br />streamlined.
            </h2>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              Manage sponsorship outreach for hundreds of companies — track status, generate personalized Gmail drafts, and close deals faster.
            </p>
          </div>

          {/* Stats strip */}
          <div className="flex gap-6 border-t border-white/[0.08] pt-6">
            {[
              { val: '65+', label: 'Companies tracked' },
              { val: '1-click', label: 'Draft creation' },
              { val: '100%', label: 'Personalized' },
            ].map(({ val, label }) => (
              <div key={label}>
                <div className="text-xl font-bold text-white tabular-nums">{val}</div>
                <div className="text-[11px] text-white/30 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 mb-10">
            <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
              style={{ background: '#7B52AB' }}>
              <img src="/baxa-logo.png" alt="BAXA" className="w-[85%] h-[85%] object-contain" />
            </div>
            <div className="font-bold text-sm text-baxa-ink">BAXA</div>
          </div>

          <div className="text-[10px] font-semibold tracking-widest text-black/30 uppercase mb-2">
            Officers only
          </div>
          <h1 className="font-serif italic text-4xl text-baxa-ink mb-2 leading-tight">
            Welcome back
          </h1>
          <p className="text-sm text-black/35 mb-8">
            Sign in to access the outreach portal.
          </p>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
              {error}
            </div>
          )}

          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl
                       bg-baxa-ink text-white text-sm font-semibold
                       hover:bg-black active:scale-[0.98]
                       transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-[0_4px_16px_rgba(26,24,20,0.2)]"
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {loading ? 'Signing in…' : 'Continue with Google'}
          </button>

          <p className="mt-6 text-[11px] text-black/30 leading-relaxed text-center">
            Access is restricted to approved BAXA officers.<br />
            Contact your VP External to get access.
          </p>

          <div className="mt-12 pt-6 border-t border-black/[0.06] text-center text-xs text-black/20">
            Business Analytics Association · UT Austin
          </div>
        </div>
      </div>
    </div>
  )
}
