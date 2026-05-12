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
      // Supabase will redirect back after auth
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #f8f6f3 0%, #f0ede8 100%)' }}>

      {/* Subtle grid texture */}
      <div className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #d4c9bb 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          opacity: 0.4,
        }} />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-[0_8px_48px_-8px_rgba(0,0,0,0.12)] p-10 text-center">

          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-gray-100 shadow-md flex items-center justify-center"
              style={{ background: '#7B52AB' }}>
              <img src="/baxa-logo.png" alt="BAXA" className="w-[85%] h-[85%] object-contain" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1.5">Welcome back</h1>
          <p className="text-sm text-gray-400 mb-8">Sign in to access the outreach portal.</p>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
              {error}
            </div>
          )}

          {/* Google sign-in button */}
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl
                       bg-gray-900 text-white text-sm font-semibold
                       hover:bg-gray-800 active:scale-[0.98]
                       transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
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

          <p className="mt-6 text-[11px] text-gray-400 leading-relaxed">
            Access is restricted to approved BAXA officers.<br />
            Contact your VP External to get access.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Business Analytics Association · UT Austin
        </p>
      </div>
    </div>
  )
}
