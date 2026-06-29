import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCompanies, addCompany, addContact } from '../lib/supabase'
import { useToast } from '../context/ToastContext'

// ── CSV Parser ─────────────────────────────────────────────────────────────────

function parseLine(line) {
  const fields = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === ',' && !inQuotes) {
      fields.push(cur.trim())
      cur = ''
    } else {
      cur += ch
    }
  }
  fields.push(cur.trim())
  return fields
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return { error: 'CSV must have at least a header row and one data row.' }

  const rawHeaders = parseLine(lines[0])
  const headers = rawHeaders.map(h => h.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''))

  // Auto-detect columns — supports our template, Apollo.io, Hunter.io exports
  const find = (...names) => headers.findIndex(h => names.includes(h))
  const colIdx = {
    company:   find('company_name', 'company', 'organization', 'account', 'employer', 'company_name_for_emails'),
    // email is OPTIONAL — company-only imports are supported
    email:     find('contact_email', 'email', 'work_email', 'email_address', 'corporate_email', 'email1'),
    name:      find('contact_name', 'name', 'full_name', 'contact_full_name', 'person_name'),
    firstName: find('first_name', 'firstname', 'first'),
    lastName:  find('last_name', 'lastname', 'last'),
  }

  if (colIdx.company === -1)
    return { error: `Could not find a company column. Add a "company_name" header. Found: ${rawHeaders.join(', ')}` }

  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const fields = parseLine(line)

    const companyName = fields[colIdx.company]?.trim()
    if (!companyName) continue

    // Email is optional
    const rawEmail = colIdx.email !== -1 ? (fields[colIdx.email]?.trim() || null) : null
    const email = rawEmail && rawEmail.includes('@') ? rawEmail : null

    // Contact name (only meaningful if we have an email)
    let contactName = null
    if (email) {
      if (colIdx.name !== -1 && fields[colIdx.name]?.trim()) {
        contactName = fields[colIdx.name].trim()
      } else if (colIdx.firstName !== -1) {
        const first = fields[colIdx.firstName]?.trim() || ''
        const last  = colIdx.lastName !== -1 ? (fields[colIdx.lastName]?.trim() || '') : ''
        contactName = [first, last].filter(Boolean).join(' ') || null
      }
    }

    rows.push({ companyName, email, contactName })
  }

  if (rows.length === 0)
    return { error: 'No valid rows found. Make sure the CSV has a company_name column with data.' }

  // Group by company name (case-insensitive), deduplicate emails within each company
  const grouped = new Map()
  for (const row of rows) {
    const key = row.companyName.toLowerCase()
    if (!grouped.has(key)) grouped.set(key, { name: row.companyName, contacts: [] })
    const company = grouped.get(key)
    if (row.email && !company.contacts.some(c => c.email.toLowerCase() === row.email.toLowerCase())) {
      company.contacts.push({ email: row.email, name: row.contactName })
    }
  }

  return { companies: [...grouped.values()] }
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CSVImport() {
  const navigate = useNavigate()
  const toast = useToast()
  const fileInputRef = useRef()

  const [dragging, setDragging]     = useState(false)
  const [step, setStep]             = useState('upload') // upload | preview | importing | done
  const [parsed, setParsed]         = useState(null)
  const [parseError, setParseError] = useState(null)
  const [progress, setProgress]     = useState({ done: 0, total: 0, errors: 0 })
  const [results, setResults]       = useState([])
  const [importedIds, setImportedIds] = useState([]) // IDs of all new/updated companies

  // ── File handling ────────────────────────────────────────────────────────────

  async function handleFile(file) {
    if (!file) return
    setParseError(null)
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setParseError('Please upload a .csv file.')
      return
    }

    const text = await file.text()
    const { error, companies } = parseCSV(text)
    if (error) { setParseError(error); return }

    // Load existing companies to detect duplicates
    let existing = []
    try {
      existing = await getCompanies()
    } catch (err) {
      setParseError('Failed to load existing companies: ' + err.message)
      return
    }

    const enriched = companies.map(c => {
      const match = existing.find(ex => ex.name.toLowerCase() === c.name.toLowerCase())
      if (match) {
        const existingEmails = new Set(match.contacts.map(ct => ct.email.toLowerCase()))
        const newContacts = c.contacts.filter(ct => !existingEmails.has(ct.email.toLowerCase()))
        return { ...c, existingId: match.id, existingName: match.name, newContacts }
      }
      return { ...c, existingId: null, newContacts: c.contacts }
    })

    setParsed(enriched)
    setStep('preview')
  }

  function onDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  function downloadTemplate() {
    const csv = [
      'company_name,contact_name,contact_email',
      'Google,John Smith,jsmith@google.com',
      'Microsoft,Jane Doe,jdoe@microsoft.com',
      'Microsoft,Bob Lee,blee@microsoft.com',
      'Amazon,,',
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'baxa-import-template.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  // ── Import ───────────────────────────────────────────────────────────────────

  async function runImport() {
    setStep('importing')
    setProgress({ done: 0, total: parsed.length, errors: 0 })
    const newResults = []

    const newIds = []

    for (let i = 0; i < parsed.length; i++) {
      const c = parsed[i]
      try {
        if (!c.existingId) {
          // New company — create it (with or without contacts)
          const created = await addCompany(c.name, c.newContacts)
          newResults.push({ name: c.name, ok: true, isNew: true, added: c.newContacts.length, id: created.id })
          if (created.id) newIds.push(created.id)
        } else if (c.newContacts.length > 0) {
          // Existing company with new contacts to add
          for (const contact of c.newContacts) {
            await addContact(c.existingId, contact.email, contact.name)
          }
          newResults.push({ name: c.existingName, ok: true, isNew: false, added: c.newContacts.length, id: c.existingId })
          newIds.push(c.existingId)
        } else {
          // Existing company, nothing new — skip
          newResults.push({ name: c.existingName || c.name, ok: true, skipped: true, added: 0 })
        }
        setProgress(p => ({ ...p, done: i + 1 }))
      } catch (err) {
        newResults.push({ name: c.name, ok: false, error: err.message })
        setProgress(p => ({ ...p, done: i + 1, errors: p.errors + 1 }))
      }
      setResults([...newResults])
    }

    setImportedIds(newIds)
    setStep('done')
    const createdCount = newResults.filter(r => r.ok && r.isNew).length
    const contacts     = newResults.filter(r => r.ok && !r.skipped).reduce((s, r) => s + r.added, 0)
    const failed       = newResults.filter(r => !r.ok).length
    if (failed === 0) {
      toast(`${createdCount} ${createdCount === 1 ? 'company' : 'companies'} added${contacts > 0 ? `, ${contacts} contacts` : ''}`)
    } else {
      toast(`Import finished — ${failed} error${failed !== 1 ? 's' : ''}`, 'error')
    }
  }

  function reset() {
    setParsed(null)
    setResults([])
    setParseError(null)
    setProgress({ done: 0, total: 0, errors: 0 })
    setStep('upload')
  }

  // ── Step: Upload ─────────────────────────────────────────────────────────────

  if (step === 'upload') return (
    <div>
      <div className="max-w-2xl mx-auto px-8 pt-10 pb-10">
        <div className="mb-8">
          <div className="text-[10px] font-semibold tracking-widest text-black/30 uppercase mb-2">Bulk Import</div>
          <h1 className="font-serif italic text-4xl text-baxa-ink leading-tight">CSV Import</h1>
          <p className="text-sm text-black/35 mt-1">Add companies and contacts in bulk from a spreadsheet.</p>
        </div>

        {/* Drop zone */}
        <div
          className={`relative border-2 border-dashed rounded-2xl transition-all duration-150 cursor-pointer
            ${dragging
              ? 'border-baxa-orange bg-baxa-orange/[0.04] scale-[1.01]'
              : 'border-black/15 hover:border-black/25 bg-white hover:bg-black/[0.01]'
            }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={e => handleFile(e.target.files[0])}
          />
          <div className="py-16 flex flex-col items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors
              ${dragging ? 'bg-baxa-orange text-white' : 'bg-black/[0.04] text-black/25'}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm text-baxa-ink">
                {dragging ? 'Drop to upload' : 'Drop your CSV here'}
              </p>
              <p className="text-xs text-black/35 mt-1">or click to browse</p>
            </div>
          </div>
        </div>

        {parseError && (
          <div className="mt-4 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 leading-relaxed">
            {parseError}
          </div>
        )}

        {/* Format guide */}
        <div className="mt-6 card overflow-hidden">
          <div className="px-5 py-4 border-b border-black/[0.06] bg-baxa-cream/40 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-baxa-ink">Expected CSV Format</h3>
              <p className="text-xs text-black/35 mt-0.5">
                contact_name and contact_email are optional — you can import company names first, add contacts later.
              </p>
            </div>
            <button className="btn-secondary text-xs shrink-0" onClick={downloadTemplate}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download Template
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-black/[0.025]">
                  {[
                    { col: 'company_name', required: true },
                    { col: 'contact_name', required: false },
                    { col: 'contact_email', required: false },
                  ].map(({ col, required }) => (
                    <th key={col} className="px-4 py-2.5 text-left font-mono font-semibold text-black/40 border-b border-black/[0.05]">
                      {col}
                      {required
                        ? <span className="ml-1.5 text-[9px] font-semibold text-baxa-orange bg-baxa-orange/10 px-1.5 py-0.5 rounded uppercase tracking-wide">required</span>
                        : <span className="ml-1.5 text-[9px] font-semibold text-black/25 bg-black/[0.04] px-1.5 py-0.5 rounded uppercase tracking-wide">optional</span>
                      }
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Google', 'John Smith', 'jsmith@google.com'],
                  ['Microsoft', 'Jane Doe', 'jdoe@microsoft.com'],
                  ['Microsoft', 'Bob Lee', 'blee@microsoft.com'],
                  ['Amazon', '', ''],
                ].map((row, i) => (
                  <tr key={i} className={i > 0 ? 'border-t border-black/[0.04]' : ''}>
                    {row.map((cell, j) => (
                      <td key={j} className={`px-4 py-2.5 font-mono ${cell ? 'text-black/55' : 'text-black/20 italic'}`}>
                        {cell || 'empty — company created with no contacts'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-4 border-t border-black/[0.05] bg-black/[0.01] space-y-1.5">
            <p className="text-[11px] text-black/40">
              <span className="font-semibold text-black/50">Import companies now, add contacts later.</span> Upload a list of company names to get them into the portal, then manually add contacts or re-import with emails once you have them from Apollo/Hunter.
            </p>
            <p className="text-[11px] text-black/40">
              Also works with <span className="font-semibold text-black/50">Apollo.io</span> exports (Company, Email, First Name, Last Name) and <span className="font-semibold text-black/50">Hunter.io</span> exports.
            </p>
            <p className="text-[11px] text-black/40">
              Companies that already exist will have <span className="font-semibold text-black/50">new contacts added</span> to them — no duplicate companies created.
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  // ── Step: Preview ────────────────────────────────────────────────────────────

  if (step === 'preview') {
    const newCos          = parsed.filter(c => !c.existingId)
    const updateCos       = parsed.filter(c => c.existingId && c.newContacts.length > 0)
    const skipCos         = parsed.filter(c => c.existingId && c.newContacts.length === 0)
    const totalNewContacts = parsed.reduce((s, c) => s + c.newContacts.length, 0)
    const totalActionable  = newCos.length + updateCos.length

    // IDs of all companies in this CSV that already exist (for the "email anyway" path)
    const allExistingIds = parsed.filter(c => c.existingId).map(c => c.existingId)

    function goToBatchWithAll() {
      navigate(`/batch?from=import&ids=${allExistingIds.join(',')}`)
    }

    return (
      <div>
        <div className="max-w-3xl mx-auto px-8 pt-10 pb-10">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="text-[10px] font-semibold tracking-widest text-black/30 uppercase mb-2">Bulk Import</div>
              <h1 className="font-serif italic text-4xl text-baxa-ink leading-tight">Preview Import</h1>
              <p className="text-sm text-black/35 mt-1">
                {newCos.length > 0 && <>{newCos.length} new {newCos.length === 1 ? 'company' : 'companies'}{totalNewContacts > 0 ? ' · ' : ''}</>}
                {totalNewContacts > 0 && <><span className="font-semibold text-black/50">{totalNewContacts} contact{totalNewContacts !== 1 ? 's' : ''}</span> to add</>}
                {totalActionable === 0 && <span className="text-black/35">All companies already in portal</span>}
              </p>
            </div>
            <div className="flex gap-2 mt-1 shrink-0">
              <button className="btn-secondary" onClick={reset}>← Back</button>
              {totalActionable === 0 ? (
                // Nothing new to import — go straight to Batch Sender with these companies
                <button className="btn-orange" onClick={goToBatchWithAll}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  Email These Companies →
                </button>
              ) : (
                <button className="btn-orange" onClick={runImport}>
                  {`Import ${newCos.length > 0 ? `${newCos.length} ${newCos.length === 1 ? 'Company' : 'Companies'}` : ''}${newCos.length > 0 && totalNewContacts > 0 ? ' + ' : ''}${totalNewContacts > 0 ? `${totalNewContacts} Contacts` : ''}`}
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="card p-4 bg-emerald-50/50">
              <div className="text-2xl font-bold text-emerald-600">{newCos.length}</div>
              <div className="text-xs text-black/40 mt-0.5">New Companies</div>
            </div>
            <div className="card p-4 bg-baxa-orange/[0.04]">
              <div className="text-2xl font-bold text-baxa-orange">{totalNewContacts}</div>
              <div className="text-xs text-black/40 mt-0.5">Contacts to Add</div>
            </div>
            <div className="card p-4 bg-black/[0.02]">
              <div className="text-2xl font-bold text-black/30">{skipCos.length}</div>
              <div className="text-xs text-black/40 mt-0.5">Already in Portal</div>
            </div>
          </div>

          {totalActionable === 0 && (
            <div className="mb-5 flex items-start gap-3 px-4 py-3.5 bg-baxa-orange/[0.05] border border-baxa-orange/20 rounded-xl">
              <div className="w-5 h-5 rounded-full bg-baxa-orange/15 flex items-center justify-center shrink-0 mt-0.5 text-baxa-orange">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-baxa-ink">All companies already imported.</span>
                <span className="text-black/45"> Click <span className="font-semibold text-baxa-orange">Email These Companies →</span> to open Batch Sender pre-loaded with exactly these {allExistingIds.length} companies, all pre-selected and ready to send.</span>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="table-head">
                  <th className="w-[35%]">Company</th>
                  <th>Contacts</th>
                  <th className="w-[140px]">Action</th>
                </tr>
              </thead>
              <tbody>
                {parsed.map((c, i) => (
                  <tr key={i} className={`table-row ${c.existingId && c.newContacts.length === 0 ? 'opacity-40' : ''}`}>
                    <td className="table-cell">
                      <span className="font-semibold text-baxa-ink">{c.existingName || c.name}</span>
                    </td>
                    <td className="table-cell">
                      {c.newContacts.length > 0 ? (
                        <div className="space-y-1">
                          {c.newContacts.map((ct, j) => (
                            <div key={j} className="text-xs text-black/50 leading-snug">
                              {ct.name && <span className="text-black/70 font-medium">{ct.name} · </span>}
                              {ct.email}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-black/25 italic">
                          {c.existingId ? 'Already up to date' : 'No contacts — add later'}
                        </span>
                      )}
                    </td>
                    <td className="table-cell">
                      {c.existingId && c.newContacts.length === 0 ? (
                        <span className="text-xs text-black/30 font-medium">Skip</span>
                      ) : c.existingId ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                          Add contacts
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                          ✦ New company
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {skipCos.length > 0 && (
            <p className="mt-3 text-xs text-black/35">
              {skipCos.length} {skipCos.length === 1 ? 'company is' : 'companies are'} already in the portal and will be skipped.
            </p>
          )}
        </div>
      </div>
    )
  }

  // ── Step: Importing ──────────────────────────────────────────────────────────

  if (step === 'importing') {
    const pct = progress.total > 0 ? (progress.done / progress.total) * 100 : 0
    return (
      <div>
        <div className="max-w-2xl mx-auto px-8 pt-10">
          <div className="mb-8">
            <div className="text-[10px] font-semibold tracking-widest text-black/30 uppercase mb-2">Bulk Import</div>
            <h1 className="font-serif italic text-4xl text-baxa-ink leading-tight">Importing…</h1>
            <p className="text-sm text-black/35 mt-1">
              {progress.done} of {progress.total} companies processed
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
                  <span key={i} className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                    r.ok
                      ? 'text-emerald-700 bg-emerald-50 border border-emerald-100'
                      : 'text-red-600 bg-red-50 border border-red-100'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${r.ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    {r.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Step: Done ───────────────────────────────────────────────────────────────

  if (step === 'done') {
    const created    = results.filter(r => r.ok && r.isNew)
    const updated    = results.filter(r => r.ok && !r.isNew && !r.skipped)
    const skipped    = results.filter(r => r.ok && r.skipped)
    const failed     = results.filter(r => !r.ok)
    const totalAdded = [...created, ...updated].reduce((s, r) => s + (r.added || 0), 0)

    // Only companies with contacts can be emailed
    const emailableIds = results.filter(r => r.ok && !r.skipped && r.added > 0 && r.id).map(r => r.id)

    function goToBatch() {
      navigate(`/batch?from=import&ids=${importedIds.join(',')}`)
    }

    return (
      <div>
        <div className="max-w-2xl mx-auto px-8 pt-10 pb-10">
          <div className="mb-8">
            <div className="text-[10px] font-semibold tracking-widest text-black/30 uppercase mb-2">Bulk Import</div>
            <h1 className="font-serif italic text-4xl text-baxa-ink leading-tight">Import Complete</h1>
            <p className="text-sm text-black/35 mt-1">
              {created.length > 0 && <>{created.length} new {created.length === 1 ? 'company' : 'companies'} created</>}
              {updated.length > 0 && <>{created.length > 0 ? ' · ' : ''}{updated.length} updated</>}
              {totalAdded > 0 && <> · {totalAdded} contacts added</>}
            </p>
          </div>

          {/* CTA — send emails to newly imported companies */}
          {emailableIds.length > 0 && (
            <div className="mb-5 card p-5 bg-baxa-orange/[0.03] border border-baxa-orange/20 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-baxa-orange/10 flex items-center justify-center shrink-0 text-baxa-orange">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-baxa-ink">Ready to send outreach?</div>
                <div className="text-xs text-black/40 mt-0.5">
                  {emailableIds.length} {emailableIds.length === 1 ? 'company has' : 'companies have'} contacts — jump straight to Batch Sender with them pre-selected.
                </div>
              </div>
              <button className="btn-orange shrink-0" onClick={goToBatch}>
                Email These Companies →
              </button>
            </div>
          )}

          <div className="card overflow-hidden mb-5">
            {created.map((r, i) => (
              <div key={i} className={`flex items-center gap-3 px-5 py-3.5 ${i > 0 ? 'border-t border-black/[0.05]' : ''}`}>
                <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <span className="font-semibold text-sm text-baxa-ink flex-1">{r.name}</span>
                <span className="text-xs text-emerald-600 font-medium">
                  New{r.added > 0 ? ` · ${r.added} contact${r.added !== 1 ? 's' : ''}` : ' · No contacts yet'}
                </span>
              </div>
            ))}
            {updated.map((r, i) => (
              <div key={i} className={`flex items-center gap-3 px-5 py-3.5 ${(created.length + i) > 0 ? 'border-t border-black/[0.05]' : ''}`}>
                <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <span className="font-semibold text-sm text-baxa-ink flex-1">{r.name}</span>
                <span className="text-xs text-blue-500 font-medium">
                  Updated · {r.added} contact{r.added !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
            {skipped.map((r, i) => (
              <div key={i} className={`flex items-center gap-3 px-5 py-3.5 opacity-40 ${(created.length + updated.length + i) > 0 ? 'border-t border-black/[0.05]' : ''}`}>
                <span className="w-5 h-5 rounded-full bg-black/[0.06] flex items-center justify-center shrink-0 text-[10px] text-black/30">—</span>
                <span className="font-semibold text-sm text-baxa-ink flex-1">{r.name}</span>
                <span className="text-xs text-black/35">Already up to date</span>
              </div>
            ))}
            {failed.map((r, i) => (
              <div key={i} className={`flex items-center gap-3 px-5 py-3.5 ${(created.length + updated.length + skipped.length + i) > 0 ? 'border-t border-black/[0.05]' : ''}`}>
                <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </span>
                <span className="font-semibold text-sm text-baxa-ink flex-1">{r.name}</span>
                <span className="text-xs text-red-500 truncate max-w-[200px]" title={r.error}>{r.error}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button className="btn-secondary" onClick={() => navigate('/companies')}>
              View All Companies
            </button>
            <button className="btn-ghost" onClick={reset}>
              Import Another File
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
