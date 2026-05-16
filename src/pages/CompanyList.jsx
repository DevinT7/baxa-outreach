import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCompanies, addCompany, updateCompany } from '../lib/supabase'
import StatusBadge, { STATUS_OPTIONS } from '../components/StatusBadge'
import Select from '../components/Select'
import { CompanyAvatar } from './Dashboard'

const ALL = 'all'

const KANBAN_COLUMNS = [
  { key: 'not_contacted',  label: 'Not Contacted',  dot: 'bg-black/20' },
  { key: 'draft_created',  label: 'Draft Created',  dot: 'bg-sky-400' },
  { key: 'sent',           label: 'Sent',           dot: 'bg-amber-400' },
  { key: 'replied',        label: 'Replied',        dot: 'bg-emerald-400' },
  { key: 'not_interested', label: 'Not Interested', dot: 'bg-red-300' },
]

export default function CompanyList() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(ALL)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [view, setView] = useState(() => localStorage.getItem('baxa_view') || 'table')
  const [draggingId, setDraggingId] = useState(null)
  const [dragOverCol, setDragOverCol] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    getCompanies()
      .then(setCompanies)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function switchView(v) {
    setView(v)
    localStorage.setItem('baxa_view', v)
  }

  const filtered = companies.filter(c => {
    const matchStatus = view === 'kanban' || filter === ALL || c.status === filter
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  async function handleCompanyAdded() {
    setShowModal(false)
    const updated = await getCompanies()
    setCompanies(updated)
  }

  // ── Drag and drop ────────────────────────────────────────────────────────────

  function handleDragStart(e, id) {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragEnd() {
    setDraggingId(null)
    setDragOverCol(null)
  }

  async function handleDrop(e, status) {
    e.preventDefault()
    if (!draggingId) return
    const company = companies.find(c => c.id === draggingId)
    if (!company || company.status === status) {
      setDraggingId(null)
      setDragOverCol(null)
      return
    }
    // Optimistic update
    setCompanies(prev => prev.map(c => c.id === draggingId ? { ...c, status } : c))
    setDraggingId(null)
    setDragOverCol(null)
    try {
      await updateCompany(company.id, { status })
    } catch {
      // Revert on error
      setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, status: company.status } : c))
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className={`mx-auto px-8 pt-10 pb-6 ${view === 'kanban' ? 'max-w-none' : 'max-w-5xl'}`}>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="text-[10px] font-semibold tracking-widest text-black/30 uppercase mb-2">Sponsorship Pipeline</div>
            <h1 className="font-serif italic text-4xl text-baxa-ink leading-tight">Companies</h1>
            <p className="text-sm text-black/35 mt-1">
              {view === 'kanban'
                ? `${companies.length} companies across ${KANBAN_COLUMNS.length} stages`
                : `${filtered.length} of ${companies.length} shown`}
            </p>
          </div>
          <div className="flex gap-2 mt-1">

            {/* View toggle */}
            <div className="flex rounded-lg border border-black/[0.08] overflow-hidden bg-white">
              <button
                onClick={() => switchView('table')}
                title="Table view"
                className={`px-3 py-2 transition-colors ${view === 'table' ? 'bg-baxa-ink text-white' : 'text-black/35 hover:text-baxa-ink'}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </button>
              <button
                onClick={() => switchView('kanban')}
                title="Kanban view"
                className={`px-3 py-2 transition-colors border-l border-black/[0.08] ${view === 'kanban' ? 'bg-baxa-ink text-white' : 'text-black/35 hover:text-baxa-ink'}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="5" height="15" rx="1"/>
                </svg>
              </button>
            </div>

            <button className="btn-secondary" onClick={() => setShowModal(true)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Company
            </button>
            <Link to="/batch" className="btn-orange">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Batch Send
            </Link>
          </div>
        </div>

        {/* Search / filter bar */}
        <div className="flex gap-2.5 mb-5">
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="input pl-9"
              placeholder="Search companies…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {view === 'table' && (
            <Select
              className="max-w-[180px]"
              value={filter}
              onChange={setFilter}
              options={[{ value: ALL, label: 'All Statuses' }, ...STATUS_OPTIONS]}
            />
          )}
        </div>

        {/* ── Table view ── */}
        {view === 'table' && (
          loading ? (
            <div className="flex items-center justify-center h-48 text-black/30 text-sm">Loading…</div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="table-head">
                    <th>Company</th>
                    <th>Contacts</th>
                    <th>Status</th>
                    <th>Notes</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="table-row" onClick={() => navigate(`/companies/${c.id}`)}>
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          <CompanyAvatar name={c.name} />
                          <span className="font-semibold text-baxa-ink">{c.name}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        {c.contacts?.length > 0 ? (
                          <span className="text-black/40">
                            {c.contacts.length} email{c.contacts.length !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-red-400 font-medium">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                            No contacts
                          </span>
                        )}
                      </td>
                      <td className="table-cell"><StatusBadge status={c.status} /></td>
                      <td className="table-cell max-w-[200px]">
                        <span className="text-black/30 text-xs truncate block">{c.notes || '—'}</span>
                      </td>
                      <td className="table-cell text-right">
                        <svg className="text-black/15 inline" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-black/30 text-sm">
                        No companies match your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* ── Kanban view ── */}
        {view === 'kanban' && (
          loading ? (
            <div className="flex items-center justify-center h-48 text-black/30 text-sm">Loading…</div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-6" style={{ minHeight: '65vh' }}>
              {KANBAN_COLUMNS.map(col => {
                const cards = filtered.filter(c => c.status === col.key)
                const isOver = dragOverCol === col.key
                return (
                  <div
                    key={col.key}
                    className={`flex-shrink-0 w-[220px] flex flex-col rounded-2xl transition-colors duration-150 ${isOver ? 'bg-baxa-orange/[0.05]' : 'bg-black/[0.025]'}`}
                    onDragOver={e => { e.preventDefault(); setDragOverCol(col.key) }}
                    onDragLeave={e => {
                      if (!e.currentTarget.contains(e.relatedTarget)) setDragOverCol(null)
                    }}
                    onDrop={e => handleDrop(e, col.key)}
                  >
                    {/* Column header */}
                    <div className="px-3 pt-3.5 pb-2.5 flex items-center gap-2 shrink-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
                      <span className="text-xs font-semibold text-baxa-ink truncate">{col.label}</span>
                      <span className="ml-auto text-xs font-bold text-black/25 tabular-nums">{cards.length}</span>
                    </div>

                    {/* Cards */}
                    <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto">
                      {cards.map(c => (
                        <div
                          key={c.id}
                          draggable
                          onDragStart={e => handleDragStart(e, c.id)}
                          onDragEnd={handleDragEnd}
                          onClick={() => navigate(`/companies/${c.id}`)}
                          className={`bg-white border border-black/[0.07] rounded-xl p-3 cursor-pointer select-none transition-all duration-150
                            hover:shadow-md hover:border-black/[0.13]
                            ${draggingId === c.id ? 'opacity-40 scale-[0.97]' : ''}`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <CompanyAvatar name={c.name} />
                            <span className="font-semibold text-sm text-baxa-ink leading-tight line-clamp-2">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {c.contacts?.length > 0 ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-black/35">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                                </svg>
                                {c.contacts.length} contact{c.contacts.length !== 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-[11px] text-red-400 font-medium">No contacts</span>
                            )}
                          </div>
                          {c.notes && (
                            <p className="mt-2 pt-2 border-t border-black/[0.05] text-[11px] text-black/30 line-clamp-2 leading-relaxed">{c.notes}</p>
                          )}
                        </div>
                      ))}

                      {/* Empty column drop zone */}
                      {cards.length === 0 && (
                        <div className={`flex items-center justify-center h-24 rounded-xl border-2 border-dashed transition-colors ${isOver ? 'border-baxa-orange/40 bg-baxa-orange/[0.03]' : 'border-black/[0.07]'}`}>
                          <span className="text-xs text-black/20">Drop here</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>

      {showModal && (
        <AddCompanyModal
          onClose={() => setShowModal(false)}
          onAdded={handleCompanyAdded}
        />
      )}
    </div>
  )
}

// ── Add Company Modal ──────────────────────────────────────────────────────────

function AddCompanyModal({ onClose, onAdded }) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [contactName, setContactName] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [contacts, setContacts] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function addContact() {
    const email = emailInput.trim()
    if (!email) return
    if (contacts.find(c => c.email === email)) { setEmailInput(''); return }
    setContacts(prev => [...prev, { email, name: contactName.trim() || null }])
    setEmailInput('')
    setContactName('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); addContact() }
  }

  function removeContact(email) {
    setContacts(prev => prev.filter(c => c.email !== email))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Company name is required.'); return }
    setSaving(true)
    setError(null)
    try {
      const finalContacts = emailInput.trim()
        ? [...contacts, { email: emailInput.trim(), name: contactName.trim() || null }]
        : contacts
      const company = await addCompany(name.trim(), finalContacts)
      onAdded(company)
      navigate(`/companies/${company.id}`)
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10, 10, 20, 0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-modal w-full max-w-md overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-black/[0.06]">
          <div>
            <h2 className="text-base font-bold text-baxa-ink">Add New Company</h2>
            <p className="text-xs text-black/35 mt-0.5">Add a company and its contacts to the outreach list.</p>
          </div>
          <button onClick={onClose} className="btn-ghost w-8 h-8 !px-0 justify-center rounded-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">{error}</div>
          )}

          <div>
            <label className="label">Company Name *</label>
            <input className="input" placeholder="e.g. Salesforce"
              value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>

          <div>
            <label className="label">Add Contact</label>
            <div className="flex gap-2 mb-2">
              <input className="input" placeholder="First Last"
                value={contactName} onChange={e => setContactName(e.target.value)}
                onKeyDown={handleKeyDown} />
              <input className="input" placeholder="email@company.com" type="email"
                value={emailInput} onChange={e => setEmailInput(e.target.value)}
                onKeyDown={handleKeyDown} />
              <button type="button" className="btn-secondary whitespace-nowrap shrink-0" onClick={addContact}>
                Add
              </button>
            </div>
            <p className="text-[11px] text-black/30">Name is optional but enables personalized greetings.</p>

            {contacts.length > 0 && (
              <ul className="mt-2.5 space-y-1.5">
                {contacts.map(c => (
                  <li key={c.email} className="flex items-center gap-2 bg-baxa-cream/60 border border-black/[0.06] rounded-xl px-3 py-2">
                    <div className="w-5 h-5 rounded-md bg-baxa-orange/10 flex items-center justify-center shrink-0">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#BF5700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      {c.name && <div className="text-xs font-semibold text-baxa-ink truncate">{c.name}</div>}
                      <div className="text-xs text-black/40 truncate">{c.email}</div>
                    </div>
                    <button type="button" onClick={() => removeContact(c.email)}
                      className="text-black/20 hover:text-red-400 transition-colors ml-1 shrink-0">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-2.5 pt-1">
            <button type="button" className="btn-secondary flex-1 justify-center" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
              {saving ? 'Adding…' : 'Add Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
