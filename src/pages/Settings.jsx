import { useState } from 'react'
import {
  getTemplate, getSubjectLine, getSenderInfo,
  saveTemplate, saveSubjectLine, saveSenderInfo,
  DEFAULT_TEMPLATE, DEFAULT_SUBJECT, renderEmail,
} from '../lib/emailTemplate'
// Gmail connection has moved to the Profile page

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
  const [template, setTemplate] = useState(getTemplate)
  const [subject, setSubject] = useState(getSubjectLine)
  const { name, title, attachmentName } = getSenderInfo()
  const [senderName, setSenderName] = useState(name)
  const [senderTitle, setSenderTitle] = useState(title)
  const [pdfName, setPdfName] = useState(attachmentName)
  const [saved, setSaved] = useState(false)
  const [preview, setPreview] = useState(false)

  function handleSave() {
    saveTemplate(template)
    saveSubjectLine(subject)
    saveSenderInfo({ name: senderName, title: senderTitle, attachmentName: pdfName })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function resetDefaults() {
    if (!confirm('Reset the email template to the original default?')) return
    setTemplate(DEFAULT_TEMPLATE)
    setSubject(DEFAULT_SUBJECT)
  }

  const previewHtml = preview
    ? renderEmail('Acme Corp', { name: senderName, title: senderTitle }).body
    : null

  return (
    <div>
      <div className="max-w-3xl mx-auto px-8 pt-10 pb-6">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="text-[10px] font-semibold tracking-widest text-black/30 uppercase mb-2">Configuration</div>
            <h1 className="font-serif italic text-4xl text-baxa-ink leading-tight">Settings</h1>
            <p className="text-sm text-black/35 mt-1">Configure your sender info and email template.</p>
          </div>
          <div className="mt-1">
            <button className="btn-orange" onClick={handleSave}>
              {saved ? (
                <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg> Saved!</>
              ) : 'Save Settings'}
            </button>
          </div>
        </div>

      <div className="space-y-5">
        {/* Sender info */}
        <Section
          title="Sender Information"
          description="This appears in the email signature on every outreach email.">
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
              The name shown in the email attachment. Note: to actually attach the PDF, upload it to Supabase Storage and update the sending logic in <code className="bg-black/[0.05] px-1 rounded">gmail.js</code>.
            </p>
          </div>
        </Section>

        {/* Email template */}
        <Section
          title="Email Template"
          description="Edit the outreach email here. Changes are saved locally in the browser.">
          <div>
            <label className="label">Subject Line</label>
            <input className="input" value={subject} onChange={e => setSubject(e.target.value)} />
            <p className="text-[11px] text-black/35 mt-1.5">
              Use <code className="bg-black/[0.05] px-1 rounded text-[11px]">{'{{companyName}}'}</code> as a placeholder for the company name.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label !mb-0">Email Body (HTML)</label>
              <div className="flex gap-2">
                <button className="btn-ghost text-xs py-1 px-2" onClick={() => setPreview(!preview)}>
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
                <button className="btn-ghost text-xs py-1 px-2 text-black/35" onClick={resetDefaults}>
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
            <p className="text-[11px] text-black/35 mt-1.5">
              Placeholders:{' '}
              {['{{companyName}}', '{{yourName}}', '{{yourTitle}}'].map(p => (
                <code key={p} className="bg-black/[0.05] px-1 rounded text-[11px] mr-1">{p}</code>
              ))}
            </p>
          </div>
        </Section>
      </div>

      {/* Sticky save bar */}
      <div className="mt-6 flex justify-end">
        <button className="btn-primary px-8" onClick={handleSave}>
          {saved ? '✓ Settings Saved' : 'Save Settings'}
        </button>
      </div>
      </div>
    </div>
  )
}
