import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCompany, updateCompany, addContact, deleteContact, logDraft } from '../lib/supabase'
import { createDraft, requestGmailAccess, isAuthenticated, getEngagementGuideBase64 } from '../lib/gmail'
import { renderEmail, getSenderInfo } from '../lib/emailTemplate'
import StatusBadge, { STATUS_OPTIONS } from '../components/StatusBadge'
import Select from '../components/Select'
import { CompanyAvatar } from './Dashboard'

export default function CompanyDetail() {
  const { id } = useParams()
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newContactName, setNewContactName] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [draftResults, setDraftResults] = useState([])
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => { reload() }, [id])

  async function reload() {
    setLoading(true)
    try {
      const c = await getCompany(id)
      setCompany(c)
      setNotes(c.notes || '')
      setStatus(c.status)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateCompany(id, { notes, status })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      await reload()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  async function handleAddContact(e) {
    e.preventDefault()
    if (!newEmail.trim()) return
    try {
      await addContact(id, newEmail.trim(), newContactName.trim() || null)
      setNewEmail('')
      setNewContactName('')
      await reload()
    } catch (e) { setError(e.message) }
  }

  async function handleDeleteContact(contactId) {
    if (!confirm('Remove this contact?')) return
    try { await deleteContact(contactId); await reload() }
    catch (e) { setError(e.message) }
  }

  async function handleCreateDraft() {
    setDrafting(true)
    setError(null)
    setDraftResults([])
    try {
      if (!isAuthenticated()) await requestGmailAccess()
      const { attachmentName, name: senderName } = getSenderInfo()
      const attachmentBase64 = await getEngagementGuideBase64()
      const results = []
      // One draft per contact
      for (const contact of company.contacts) {
        const { subject, body } = renderEmail(company.name, contact.name, contact.email)
        const { draftId, draftUrl } = await createDraft({
          toEmails: contact.email,
          subject,
          htmlBody: body,
          attachmentBase64,
          attachmentName,
        })
        await logDraft(id, { gmailDraftId: draftId, subject, sentBy: senderName })
        results.push({ email: contact.email, name: contact.name, draftUrl })
      }
      await updateCompany(id, { status: 'draft_created' })
      setStatus('draft_created')
      setDraftResults(results)
      await reload()
    } catch (e) { setError(e.message) }
    finally { setDrafting(false) }
  }

  if (loading) return (
    <div className="page flex items-center justify-center min-h-[60vh]">
      <div className="w-7 h-7 rounded-full border-2 border-baxa-orange border-t-transparent animate-spin" />
    </div>
  )

  if (!company) return (
    <div className="page"><p className="text-red-500 text-sm">Company not found.</p></div>
  )

  // Preview uses first contact's name if available
  const previewContact = company.contacts[0] ?? null
  const { subject, body } = renderEmail(company.name, previewContact?.name, previewContact?.email)

  return (
    <div className="page">
      {/* Breadcrumb + header */}
      <div className="mb-6">
        <Link to="/companies"
          className="inline-flex items-center gap-1.5 text-xs text-black/35 hover:text-baxa-ink transition-colors mb-3 group">
          <svg className="group-hover:-translate-x-0.5 transition-transform" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Companies
        </Link>
        <div className="flex items-center gap-4">
          <CompanyAvatar name={company.name} size="lg" />
          <div>
            <h1 className="page-title">{company.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={company.status} />
              <span className="text-xs text-black/35">
                {company.contacts.length} contact{company.contacts.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-start gap-2">
          <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        {/* ── Left ── */}
        <div className="col-span-2 space-y-5">

          {/* Email preview */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-black/[0.06] flex items-center justify-between bg-baxa-cream/40">
              <div>
                <h2 className="font-semibold text-sm text-baxa-ink">Email Preview</h2>
                <p className="text-[11px] text-black/35 mt-0.5">
                  {company.contacts.length > 0
                    ? `${company.contacts.length} draft${company.contacts.length !== 1 ? 's' : ''} will be created — one per contact`
                    : <span className="text-red-400">No contacts yet</span>}
                </p>
              </div>
              {draftResults.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {draftResults.map(r => (
                    <a key={r.email} href={r.draftUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-baxa-ink bg-baxa-cream border border-black/[0.08] px-2.5 py-1 rounded-full hover:bg-baxa-cream-2 transition-colors">
                      {r.name ? r.name.split(' ')[0] : r.email.split('@')[0]} →
                    </a>
                  ))}
                </div>
              ) : (
                <button className="btn-primary text-xs" onClick={handleCreateDraft}
                  disabled={drafting || company.contacts.length === 0}
                  title={company.contacts.length === 0 ? 'Add contacts first' : ''}>
                  {drafting ? (
                    <><span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> Creating…</>
                  ) : (
                    <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg> Create Drafts</>
                  )}
                </button>
              )}
            </div>
            <div className="p-5">
              <div className="text-xs text-black/40 mb-3 pb-3 border-b border-black/[0.06]">
                <span className="font-semibold text-baxa-ink/80">Subject: </span>{subject}
              </div>
              <div className="text-sm text-baxa-ink/80 max-h-72 overflow-y-auto pr-1"
                dangerouslySetInnerHTML={{ __html: body }} />
            </div>
          </div>

          {/* Contacts */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-black/[0.06] flex items-center justify-between bg-baxa-cream/40">
              <h2 className="font-semibold text-sm text-baxa-ink">
                Contacts
                <span className="ml-2 text-xs font-normal text-black/35">{company.contacts.length}</span>
              </h2>
            </div>
            <ul className="divide-y divide-black/[0.04]">
              {company.contacts.map(c => (
                <li key={c.id} className="flex items-center gap-3 px-5 py-3 group">
                  <div className="w-7 h-7 rounded-lg bg-baxa-orange/[0.08] border border-baxa-orange/10 flex items-center justify-center shrink-0">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#BF5700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    {c.name && <div className="text-xs font-semibold text-baxa-ink truncate">{c.name}</div>}
                    <div className="text-sm text-baxa-ink/60 truncate">{c.email}</div>
                  </div>
                  <button onClick={() => handleDeleteContact(c.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-black/20 hover:text-red-400 shrink-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </li>
              ))}
              {company.contacts.length === 0 && (
                <li className="px-5 py-4 text-sm text-black/35">No contacts yet.</li>
              )}
            </ul>
            <form onSubmit={handleAddContact}
              className="flex gap-2 px-5 py-3 border-t border-black/[0.06] bg-baxa-cream/30">
              <input className="input text-sm" placeholder="First Last (optional)"
                value={newContactName} onChange={e => setNewContactName(e.target.value)} />
              <input className="input text-sm" placeholder="email@company.com"
                value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" />
              <button type="submit" className="btn-secondary text-xs whitespace-nowrap shrink-0">
                + Add
              </button>
            </form>
          </div>

          {/* Email history */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-black/[0.06] bg-baxa-cream/40">
              <h2 className="font-semibold text-sm text-baxa-ink">Email History</h2>
            </div>
            {company.email_logs?.length > 0 ? (
              <ul className="divide-y divide-black/[0.04]">
                {company.email_logs.map(log => (
                  <li key={log.id} className="px-5 py-3.5 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      log.status === 'replied' ? 'bg-emerald-400' :
                      log.status === 'sent' ? 'bg-amber-400' : 'bg-blue-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-baxa-ink/80 truncate">{log.subject || 'BAXA Outreach'}</div>
                      <div className="text-[11px] text-black/35 mt-0.5">
                        {log.sent_by && <span className="mr-2">{log.sent_by}</span>}
                        {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      log.status === 'replied' ? 'bg-emerald-50 text-emerald-600' :
                      log.status === 'sent' ? 'bg-amber-50 text-amber-600' :
                      'bg-blue-50 text-blue-600'}`}>
                      {log.status}
                    </span>
                    {log.gmail_draft_id && (
                      <a href={`https://mail.google.com/mail/#drafts/${log.gmail_draft_id}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs text-baxa-orange hover:underline underline-offset-2 shrink-0">
                        Open →
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 py-8 text-center text-sm text-black/35">
                No emails sent yet.
              </div>
            )}
          </div>
        </div>

        {/* ── Right ── */}
        <div className="space-y-4">
          {/* Status + notes */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-sm text-baxa-ink">Details</h2>
            <div>
              <label className="label">Status</label>
              <Select
                value={status}
                onChange={setStatus}
                options={STATUS_OPTIONS}
              />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="input min-h-[96px] resize-none text-sm" value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. Spoke at GM spring 2026, interested in next year…" />
            </div>
            <button className="btn-primary w-full justify-center" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
            </button>
          </div>

          {/* Info */}
          <div className="card p-5">
            <h2 className="font-semibold text-sm text-baxa-ink mb-4">Info</h2>
            <dl className="space-y-3">
              {[
                { label: 'Status', value: <StatusBadge status={company.status} /> },
                { label: 'Contacts', value: <span className="font-semibold">{company.contacts.length}</span> },
                { label: 'Emails sent', value: <span className="font-semibold">{company.email_logs?.filter(l => l.status !== 'draft').length ?? 0}</span> },
                { label: 'Last updated', value: <span className="text-black/35 text-xs">{new Date(company.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span> },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <dt className="text-xs text-black/35">{label}</dt>
                  <dd className="text-sm">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
