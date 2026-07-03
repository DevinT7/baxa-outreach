import { useState } from 'react'
import { createDraft, requestGmailAccess, isAuthenticated, getEngagementGuideBase64 } from '../lib/gmail'
import { renderEmail, getSenderInfo } from '../lib/emailTemplate'
import { useToast } from '../context/ToastContext'

// ── Domain → company name lookup ──────────────────────────────────────────────
// Built from our contactout-tracker + common recruiter targets

const KNOWN_DOMAINS = {
  // Big 4 & Consulting
  'deloitte.com':       'Deloitte',
  'pwc.com':            'PwC',
  'ey.com':             'EY',
  'kpmg.com':           'KPMG',
  'accenture.com':      'Accenture',
  'mckinsey.com':       'McKinsey & Company',
  'bcg.com':            'Boston Consulting Group',
  'bain.com':           'Bain & Company',
  'westmonroe.com':     'West Monroe',
  'fticonsulting.com':  'FTI Consulting',
  'gartner.com':        'Gartner',
  'oliverwyman.com':    'Oliver Wyman',
  'protiviti.com':      'Protiviti',
  // Tech
  'google.com':         'Google',
  'microsoft.com':      'Microsoft',
  'amazon.com':         'Amazon',
  'meta.com':           'Meta',
  'facebook.com':       'Meta',
  'apple.com':          'Apple',
  'salesforce.com':     'Salesforce',
  'palantir.com':       'Palantir Technologies',
  'snowflake.com':      'Snowflake',
  'databricks.com':     'Databricks',
  'alteryx.com':        'Alteryx',
  'tableau.com':        'Tableau',
  'ibm.com':            'IBM',
  'oracle.com':         'Oracle',
  'sap.com':            'SAP',
  'workday.com':        'Workday',
  'cisco.com':          'Cisco',
  'intel.com':          'Intel',
  'nvidia.com':         'NVIDIA',
  'amd.com':            'AMD',
  'qualcomm.com':       'Qualcomm',
  'dell.com':           'Dell Technologies',
  'hpe.com':            'Hewlett Packard Enterprise',
  'tesla.com':          'Tesla',
  'uber.com':           'Uber',
  'lyft.com':           'Lyft',
  'airbnb.com':         'Airbnb',
  'stripe.com':         'Stripe',
  'shopify.com':        'Shopify',
  'hubspot.com':        'HubSpot',
  'zendesk.com':        'Zendesk',
  'splunk.com':         'Splunk',
  'servicenow.com':     'ServiceNow',
  'twilio.com':         'Twilio',
  'okta.com':           'Okta',
  'adobe.com':          'Adobe',
  'autodesk.com':       'Autodesk',
  'indeed.com':         'Indeed',
  'coinbase.com':       'Coinbase',
  'robinhood.com':      'Robinhood',
  'netflix.com':        'Netflix',
  'spotify.com':        'Spotify',
  'bumble.com':         'Bumble',
  'nxp.com':            'NXP Semiconductors',
  'silabs.com':         'Silicon Labs',
  'cirrus.com':         'Cirrus Logic',
  'ni.com':             'National Instruments',
  // Finance & Banking
  'goldmansachs.com':   'Goldman Sachs',
  'gs.com':             'Goldman Sachs',
  'jpmorgan.com':       'JPMorgan Chase',
  'jpmchase.com':       'JPMorgan Chase',
  'morganstanley.com':  'Morgan Stanley',
  'bankofamerica.com':  'Bank of America',
  'wellsfargo.com':     'Wells Fargo',
  'capitalone.com':     'Capital One',
  'bloomberg.net':      'Bloomberg',
  'bloomberg.com':      'Bloomberg',
  'janestreet.com':     'Jane Street',
  'twosigma.com':       'Two Sigma',
  'blackrock.com':      'BlackRock',
  'fidelity.com':       'Fidelity Investments',
  'visa.com':           'Visa',
  'mastercard.com':     'Mastercard',
  'amex.com':           'American Express',
  'schwab.com':         'Charles Schwab',
  // Austin & other
  'heb.com':            'H-E-B',
  'vrbo.com':           'Vrbo',
  'homeaway.com':       'Vrbo',
  'target.com':         'Target',
  'walmart.com':        'Walmart',
  'southwest.com':      'Southwest Airlines',
  'att.com':            'AT&T',
  'chevron.com':        'Chevron',
  'exxonmobil.com':     'ExxonMobil',
  'conocophillips.com': 'ConocoPhillips',
  'pg.com':             'Procter & Gamble',
  'jnj.com':            'Johnson & Johnson',
  'wholefoodsmarket.com': 'Whole Foods Market',
}

function guessCompany(email) {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return ''
  if (KNOWN_DOMAINS[domain]) return KNOWN_DOMAINS[domain]
  // Fallback: extract main domain part and title-case it
  const main = domain.split('.').slice(0, -1).join(' ')
  return main.split(/[-_\s]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function guessName(email) {
  const local = email.split('@')[0] || ''
  // john.smith → "John", j.smith → "J", johnsmith → "Johnsmith"
  const cleaned = local.replace(/\+.*$/, '') // strip + aliases
  const first = cleaned.split(/[._\-]/)[0]
  if (!first) return ''
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
}

function parseEmails(raw) {
  // Split by newlines, commas, semicolons, whitespace
  const tokens = raw.split(/[\n,;\s]+/).map(t => t.trim()).filter(Boolean)
  const emails = tokens.filter(t => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t))
  // Deduplicate (case-insensitive)
  const seen = new Set()
  return emails.filter(e => {
    const key = e.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function QuickDraft() {
  const toast = useToast()
  const [raw, setRaw]       = useState('')
  const [rows, setRows]     = useState([])   // {email, name, company, selected}
  const [step, setStep]     = useState('input') // input | running | done
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [results, setResults]   = useState([])

  // ── Parse ────────────────────────────────────────────────────────────────
  function handleParse() {
    const emails = parseEmails(raw)
    if (emails.length === 0) {
      toast('No valid email addresses found — make sure emails contain @', 'error')
      return
    }
    setRows(emails.map(email => ({
      email,
      name:    guessName(email),
      company: guessCompany(email),
      selected: true,
    })))
  }

  // ── Table edits ───────────────────────────────────────────────────────────
  function updateRow(i, field, value) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }
  function toggleRow(i) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r))
  }
  function toggleAll() {
    const allOn = rows.every(r => r.selected)
    setRows(prev => prev.map(r => ({ ...r, selected: !allOn })))
  }

  const selectedRows = rows.filter(r => r.selected)

  // ── Generate drafts ───────────────────────────────────────────────────────
  async function generate() {
    if (selectedRows.length === 0) return
    setStep('running')
    setProgress({ done: 0, total: selectedRows.length })
    setResults([])

    try {
      if (!isAuthenticated()) await requestGmailAccess()
    } catch (e) {
      toast('Gmail sign-in failed: ' + e.message, 'error')
      setStep('input')
      return
    }

    const { attachmentName } = getSenderInfo()
    const attachmentBase64   = await getEngagementGuideBase64()
    const newResults = []

    for (let i = 0; i < selectedRows.length; i++) {
      const r = selectedRows[i]
      try {
        const { subject, body } = renderEmail(
          r.company || 'your organization',
          r.name    || null,
          r.email
        )
        await createDraft({
          toEmails:       r.email,
          subject,
          htmlBody:       body,
          attachmentBase64,
          attachmentName,
        })
        newResults.push({ email: r.email, company: r.company, name: r.name, ok: true })
        await sleep(300)
      } catch (e) {
        newResults.push({ email: r.email, company: r.company, ok: false, error: e.message })
      }
      setProgress({ done: i + 1, total: selectedRows.length })
      setResults([...newResults])
    }

    setStep('done')
    const ok  = newResults.filter(r => r.ok).length
    const err = newResults.filter(r => !r.ok).length
    if (err === 0) toast(`${ok} draft${ok !== 1 ? 's' : ''} created in Gmail`)
    else toast(`${ok} created, ${err} failed`, 'error')
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  function reset() {
    setStep('input')
    setRows([])
    setRaw('')
    setResults([])
    setProgress({ done: 0, total: 0 })
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: INPUT — empty textarea
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'input' && rows.length === 0) return (
    <div className="max-w-2xl mx-auto px-8 pt-10 pb-10">
      <div className="mb-8">
        <div className="text-[10px] font-semibold tracking-widest text-black/30 uppercase mb-2">Gmail Integration</div>
        <h1 className="font-serif italic text-4xl text-baxa-ink leading-tight">Quick Draft</h1>
        <p className="text-sm text-black/35 mt-1">
          Paste emails from ContactOut or LinkedIn → auto-detect company → create Gmail drafts instantly.
        </p>
      </div>

      <div className="card p-5 mb-4">
        <label className="label">Paste Emails</label>
        <textarea
          className="input font-mono text-sm min-h-[200px] resize-y leading-relaxed"
          placeholder={`Paste any mix of emails — one per line, comma-separated, or just dumped in:\n\njohn.smith@deloitte.com\njane.doe@capitalone.com, bob.lee@google.com\nalice.wang@janestreet.com`}
          value={raw}
          onChange={e => setRaw(e.target.value)}
        />
        <p className="text-[11px] text-black/30 mt-2.5 leading-relaxed">
          Company name and contact name are auto-detected from the email address. You can edit them before generating.
          Duplicates are removed automatically.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <p className="text-xs text-black/30">
          Uses your saved email template from{' '}
          <a href="/settings" className="underline underline-offset-2 hover:text-black/50 transition-colors">Settings</a>.
        </p>
        <button
          className="btn-orange"
          onClick={handleParse}
          disabled={!raw.trim()}
        >
          Preview Emails →
        </button>
      </div>
    </div>
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: INPUT — preview/edit table
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'input' && rows.length > 0) return (
    <div className="max-w-4xl mx-auto px-8 pt-10 pb-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="text-[10px] font-semibold tracking-widest text-black/30 uppercase mb-2">Gmail Integration</div>
          <h1 className="font-serif italic text-4xl text-baxa-ink leading-tight">Quick Draft</h1>
          <p className="text-sm text-black/35 mt-1">
            {selectedRows.length} of {rows.length} selected — edit names or companies if needed, then generate.
          </p>
        </div>
        <div className="flex gap-2 mt-1 shrink-0">
          <button className="btn-secondary" onClick={reset}>← Back</button>
          <button
            className="btn-orange"
            onClick={generate}
            disabled={selectedRows.length === 0}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            Generate {selectedRows.length} Draft{selectedRows.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="table-head">
              <th className="w-12 text-center">
                <input
                  type="checkbox"
                  checked={rows.every(r => r.selected)}
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              <th>Email</th>
              <th className="w-[150px]">Contact Name</th>
              <th className="w-[190px]">Company</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr
                key={r.email}
                className={`table-row cursor-pointer ${r.selected ? '' : 'opacity-40'}`}
                onClick={() => toggleRow(i)}
              >
                <td className="table-cell text-center" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={r.selected}
                    onChange={() => toggleRow(i)}
                    className="rounded"
                  />
                </td>
                <td className="table-cell">
                  <span className="font-mono text-xs text-black/55">{r.email}</span>
                </td>
                <td className="table-cell" onClick={e => e.stopPropagation()}>
                  <input
                    className="input text-xs py-1.5 px-2.5 w-full"
                    value={r.name}
                    onChange={e => updateRow(i, 'name', e.target.value)}
                    placeholder="(auto from email)"
                  />
                </td>
                <td className="table-cell" onClick={e => e.stopPropagation()}>
                  <input
                    className="input text-xs py-1.5 px-2.5 w-full"
                    value={r.company}
                    onChange={e => updateRow(i, 'company', e.target.value)}
                    placeholder="Company name"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-black/30">
        Each selected email gets its own draft in Gmail. Drafts are created 300ms apart to stay within rate limits.
      </p>
    </div>
  )

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: RUNNING
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'running') {
    const pct = progress.total > 0 ? (progress.done / progress.total) * 100 : 0
    return (
      <div className="max-w-2xl mx-auto px-8 pt-10 pb-10">
        <div className="mb-8">
          <div className="text-[10px] font-semibold tracking-widest text-black/30 uppercase mb-2">Gmail Integration</div>
          <h1 className="font-serif italic text-4xl text-baxa-ink leading-tight">Creating Drafts…</h1>
          <p className="text-sm text-black/35 mt-1">
            {progress.done} of {progress.total} done — please don't close this window.
          </p>
        </div>

        <div className="card p-6">
          <div className="h-2.5 bg-black/[0.05] rounded-full overflow-hidden mb-5">
            <div
              className="h-full bg-baxa-orange rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          {results.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {results.map((r, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
                    r.ok
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                      : 'text-red-600 bg-red-50 border-red-100'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${r.ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  {r.company || r.email.split('@')[0]}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: DONE
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 'done') {
    const ok  = results.filter(r => r.ok)
    const err = results.filter(r => !r.ok)

    return (
      <div className="max-w-2xl mx-auto px-8 pt-10 pb-10">
        <div className="mb-8">
          <div className="text-[10px] font-semibold tracking-widest text-black/30 uppercase mb-2">Gmail Integration</div>
          <h1 className="font-serif italic text-4xl text-baxa-ink leading-tight">
            {err.length === 0 ? 'Drafts Ready' : 'Done with Errors'}
          </h1>
          <p className="text-sm text-black/35 mt-1">
            {ok.length} draft{ok.length !== 1 ? 's' : ''} created in Gmail
            {err.length > 0 ? `, ${err.length} failed` : ' — review and send when ready.'}
          </p>
        </div>

        {/* Success list */}
        {ok.length > 0 && (
          <div className="card overflow-hidden mb-4">
            {ok.map((r, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-5 py-3 ${i > 0 ? 'border-t border-black/[0.05]' : ''}`}
              >
                <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-baxa-ink">
                    {r.company || r.email}
                  </div>
                  <div className="text-xs text-black/35 font-mono">{r.email}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error list */}
        {err.length > 0 && (
          <div className="card overflow-hidden mb-4 border border-red-100">
            {err.map((r, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-5 py-3 ${i > 0 ? 'border-t border-black/[0.05]' : ''}`}
              >
                <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-baxa-ink">{r.email}</div>
                  <div className="text-xs text-red-500">{r.error || 'Failed to create draft'}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <a
            href="https://mail.google.com/mail/#drafts"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-orange"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Open Gmail Drafts
          </a>
          <button className="btn-secondary" onClick={reset}>
            New Batch
          </button>
        </div>
      </div>
    )
  }

  return null
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
