import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { signOutUser } from '../lib/auth'
import { requestGmailAccess, signOut as disconnectGmail, isAuthenticated } from '../lib/gmail'
import { useNavigate } from 'react-router-dom'

function ProfileSection({ title, description, children }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-5 border-b border-black/[0.06]">
        <h2 className="font-semibold text-sm text-baxa-ink">{title}</h2>
        {description && <p className="text-xs text-black/35 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

export default function Profile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [gmailAuthed, setGmailAuthed] = useState(isAuthenticated())
  const [signingOut, setSigningOut] = useState(false)
  const [gmailLoading, setGmailLoading] = useState(false)

  const avatarUrl = user?.user_metadata?.avatar_url
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Officer'
  const email = user?.email || ''
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  async function handleGmailConnect() {
    setGmailLoading(true)
    try {
      await requestGmailAccess()
      setGmailAuthed(true)
    } catch (e) {
      alert('Gmail connection failed: ' + e.message)
    } finally {
      setGmailLoading(false)
    }
  }

  function handleGmailDisconnect() {
    disconnectGmail()
    setGmailAuthed(false)
  }

  async function handleSignOut() {
    setSigningOut(true)
    try {
      if (gmailAuthed) disconnectGmail()
      await signOutUser()
      navigate('/')
    } catch (e) {
      alert(e.message)
      setSigningOut(false)
    }
  }

  return (
    <div>
      <div className="max-w-2xl mx-auto px-8 pt-10 pb-6">
        <div className="flex items-center gap-4 mb-8">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-2xl object-cover shrink-0 block ring-2 ring-black/[0.06]"
              style={{ minWidth: '3.5rem' }} />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-baxa-orange/10 flex items-center justify-center text-lg font-bold text-baxa-orange shrink-0">
              {initials}
            </div>
          )}
          <div>
            <div className="text-[10px] font-semibold tracking-widest text-black/30 uppercase mb-1">Profile</div>
            <h1 className="font-serif italic text-3xl text-baxa-ink leading-tight">{displayName}</h1>
            <p className="text-sm text-black/35 mt-0.5">{email}</p>
          </div>
        </div>
      <div className="space-y-4">
        {/* Gmail Connection */}
        <ProfileSection
          title="Gmail Connection"
          description="Connect the BAXA Gmail account to create drafts from the Batch Sender.">
          {gmailAuthed ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-baxa-ink">Gmail Connected</div>
                  <div className="text-xs text-black/35 mt-0.5">Ready to create drafts in Batch Sender</div>
                </div>
              </div>
              <button onClick={handleGmailDisconnect}
                className="btn-ghost text-xs text-black/40 hover:text-red-500">
                Disconnect
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-black/[0.05] border border-black/[0.08] flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-baxa-ink">Gmail Not Connected</div>
                  <div className="text-xs text-black/35 mt-0.5">Connect to enable automated draft creation</div>
                </div>
              </div>
              <button onClick={handleGmailConnect} disabled={gmailLoading}
                className="btn-primary text-xs">
                {gmailLoading ? (
                  <><span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> Connecting…</>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                    Connect Gmail
                  </>
                )}
              </button>
            </div>
          )}

          <div className="mt-4 p-4 bg-baxa-cream/60 rounded-xl border border-black/[0.06]">
            <div className="text-xs font-semibold text-black/40 mb-2">How it works</div>
            <ol className="space-y-1.5 text-xs text-black/35">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-black/10 text-black/40 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</span>
                Connect the BAXA Gmail account (texasbaxassociation@gmail.com)
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-black/10 text-black/40 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</span>
                Go to Batch Sender and select companies to reach out to
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-black/10 text-black/40 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</span>
                Click "Generate Drafts" — personalized emails appear in Gmail
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-black/10 text-black/40 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">4</span>
                Review and send from Gmail at your own pace
              </li>
            </ol>
          </div>
        </ProfileSection>

        {/* Season info */}
        <ProfileSection
          title="Organization"
          description="Your current role and season.">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Organization', value: 'BAXA' },
              { label: 'Role', value: 'Corporate Director' },
              { label: 'Season', value: '2026 – 2027' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-baxa-cream/60 border border-black/[0.06] rounded-xl p-3.5">
                <div className="text-[10px] font-semibold text-black/35 uppercase tracking-widest mb-1">{label}</div>
                <div className="text-sm font-semibold text-baxa-ink">{value}</div>
              </div>
            ))}
          </div>
        </ProfileSection>

        {/* Sign out */}
        <div className="card px-6 py-5 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-baxa-ink">Sign Out</div>
            <div className="text-xs text-black/35 mt-0.5">You'll need to sign in again to access the portal.</div>
          </div>
          <button onClick={handleSignOut} disabled={signingOut}
            className="btn text-sm font-medium text-red-600 bg-red-50 border border-red-100 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors">
            {signingOut ? 'Signing out…' : 'Sign Out'}
          </button>
        </div>
      </div>
      </div>
    </div>
  )
}
