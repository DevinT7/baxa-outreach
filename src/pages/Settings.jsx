import { useState } from 'react'
import {
  getTemplate, getSubjectLine, getSenderInfo,
  saveTemplate, saveSubjectLine, saveSenderInfo,
  DEFAULT_TEMPLATE, DEFAULT_SUBJECT, renderEmail,
  getFollowupTemplate, getFollowupSubject,
  saveFollowupTemplate, saveFollowupSubject,
  DEFAULT_FOLLOWUP_TEMPLATE, DEFAULT_FOLLOWUP_SUBJECT,
  renderFollowUp,
} from '../lib/emailTemplate'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'

function Section({ title, description, children }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-5 border-b border-black/[0.06] bg-baxa-cream/40">
        <h2 className="font-semibold text-sm text-baxa-ink">{title}</h2>
        {description && <p className="text-xs text-black/35 mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  )
}

export default function Settings() {
  const toast = useToast()
  const confirm = useConfirm()

  // Outreach template
  const [template, setTemplate]     = useState(getTemplate)
  const [subject, setSubject]       = useState(getSubjectLine)
  const [preview, setPreview]       = useState(false)

  // Follow-up template
  const [followupTemplate, setFollowupTemplate] = useState(getFollowupTemplate)
  const [followupSubject, setFollowupSubject]   = useState(getFollowupSubject)
  const [followupPreview, setFollowupPreview]   = useState(false)

  // Sender info
  const { name, title, attachmentName } = getSenderInfo()
  const [senderName, setSenderName]     = useState(name)
  const [senderTitle, setSenderTitle]   = useState(title)
  const [pdfName, setPdfName]           = useState(attachmentName)

  function handleSave() {
    saveTemplate(template)
    saveSubjectLine(subject)
    saveFollowupTemplate(followupTemplate)
    saveFollowupSubject(followupSubject)
    saveSenderInfo({ name: senderName, title: senderTitle, attachmentName: pdfName })
    toast('Settings saved')
  }

  async function resetOutreach() {
    const ok = await confirm({
      title: 'Reset outreach template?',
      message: 'This will restore the original outreach email body and subject line.',
      confirmLabel: 'Reset',
      danger: true,
    })
    if (!ok) return
    setTemplate(DEFAULT_TEMPLATE)
    setSubject(DEFAULT_SUBJECT)
  }

  async function resetFollowup() {
    const ok = await confirm({
      title: 'Reset follow-up template?',
      message: 'This will restore the original follow-up email body and subject line.',
      confirmLabel: 'Reset',
      danger: true,
    })
    if (!ok) return
    setFollowupTemplate(DEFAULT_FOLLOWUP_TEMPLATE)
    setFollowupSubject(DEFAULT_FOLLOWUP_SUBJECT)
  }

  const previewHtml = preview
    ? renderEmail('Acme Corp', null, null, { name: senderName, title: senderTitle }).body
    : null

  const followupPreviewHtml = followupPreview
    ? renderFollowUp('Acme Corp', null, null, { name: senderName, title: senderTitle }).body
    : null

  const placeholderHint = (
    <p className="text-[11px] text-black/35 mt-1.5">
      Placeholders:{' '}
      {['{{companyName}}', '{{contactName}}', '{{yourName}}', '{{yourTitle}}'].map(p => (
        <code key={p} className="bg-black/[0.05] px-1 rounded text-[11px] mr-1">{p}</code>
      ))}
    </p>
  )

  return (
    <div>
      <div className="max-w-3xl mx-auto px-8 pt-10 pb-6">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="text-[10px] font-semibold tracking-widest text-black/30 uppercase mb-2">Configuration</div>
            <h1 className="font-serif italic text-4xl text-baxa-ink leading-tight">Settings</h1>
            <p className="text-sm text-black/35 mt-1">Configure your sender info and email templates.</p>
          </div>
          <div className="mt-1">
            <button className="btn-orange" onClick={handleSave}>Save Settings</button>
          </div>
        </div>

        <div className="space-y-5">

          {/* ── Sender info ── */}
          <Section
            title="Sender Information"
            description="Appears in the email signature on every outreach and follow-up email.">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Your Name</label>
                <input className="input" value={senderName} onChange={e => setSenderName(e.target.value)} />
              </div>
              <div>
                <label className="label">Your Title</label>
                <input className="input" value={senderTitle} onChange={e => setSenderTitle(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Attachment Filename</label>
              <input className="input" value={pdfName}
                onChange={e => setPdfName(e.target.value)}
                placeholder="BAXA Engagement Guide.pdf" />
              <p className="text-xs text-black/35 mt-1.5">
                The filename shown on the PDF attachment in Gmail.
              </p>
            </div>
          </Section>

          {/* ── Outreach email template ── */}
          <Section
            title="Outreach Email"
            description="The first email sent to a new company contact.">
            <div>
              <label className="label">Subject Line</label>
              <input className="input" value={subject} onChange={e => setSubject(e.target.value)} />
              <p className="text-[11px] text-black/35 mt-1.5">
                Use <code className="bg-black/[0.05] px-1 rounded text-[11px]">{'{{companyName}}'}</code> as a placeholder.
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label !mb-0">Email Body (HTML)</label>
                <div className="flex gap-2">
                  <button className="btn-ghost text-xs py-1 px-2" onClick={() => setPreview(p => !p)}>
                    {preview ? (
                      <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg> Edit</>
                    ) : (
                      <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg> Preview</>
                    )}
                  </button>
                  <button className="btn-ghost text-xs py-1 px-2 text-black/35" onClick={resetOutreach}>
                    Reset default
                  </button>
                </div>
              </div>
              {preview ? (
                <div className="border border-black/10 rounded-xl p-5 text-sm bg-white min-h-[280px] text-baxa-ink/80"
                  dangerouslySetInnerHTML={{ __html: previewHtml }} />
              ) : (
                <textarea className="input font-mono text-xs min-h-[280px] resize-y leading-relaxed"
                  value={template} onChange={e => setTemplate(e.target.value)} />
              )}
              {placeholderHint}
            </div>
          </Section>

          {/* ── Follow-up email template ── */}
          <Section
            title="Follow-up Email"
            description="Sent as a follow-up to companies that haven't responded yet.">
            <div>
              <label className="label">Subject Line</label>
              <input className="input" value={followupSubject} onChange={e => setFollowupSubject(e.target.value)} />
              <p className="text-[11px] text-black/35 mt-1.5">
                Use <code className="bg-black/[0.05] px-1 rounded text-[11px]">{'{{companyName}}'}</code> as a placeholder.
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label !mb-0">Email Body (HTML)</label>
                <div className="flex gap-2">
                  <button className="btn-ghost text-xs py-1 px-2" onClick={() => setFollowupPreview(p => !p)}>
                    {followupPreview ? (
                      <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg> Edit</>
                    ) : (
                      <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg> Preview</>
                    )}
                  </button>
                  <button className="btn-ghost text-xs py-1 px-2 text-black/35" onClick={resetFollowup}>
                    Reset default
                  </button>
                </div>
              </div>
              {followupPreview ? (
                <div className="border border-black/10 rounded-xl p-5 text-sm bg-white min-h-[200px] text-baxa-ink/80"
                  dangerouslySetInnerHTML={{ __html: followupPreviewHtml }} />
              ) : (
                <textarea className="input font-mono text-xs min-h-[200px] resize-y leading-relaxed"
                  value={followupTemplate} onChange={e => setFollowupTemplate(e.target.value)} />
              )}
              {placeholderHint}
            </div>
          </Section>

        </div>

        <div className="mt-6 flex justify-end">
          <button className="btn-primary px-8" onClick={handleSave}>Save Settings</button>
        </div>
      </div>
    </div>
  )
}
