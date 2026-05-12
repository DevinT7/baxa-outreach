import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCompanies, addCompany } from '../lib/supabase'
import StatusBadge, { STATUS_OPTIONS } from '../components/StatusBadge'
import { CompanyAvatar } from './Dashboard'

const ALL = 'all'

export default function CompanyList() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(ALL)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    getCompanies()
      .then(setCompanies)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = companies.filter(c => {
    const matchStatus = filter === ALL || c.status === filter
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  async function handleCompanyAdded() {
    setShowModal(false)
    const updated = await getCompanies()
    setCompanies(updated)
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Companies</h1>
          <p className="page-subtitle">{filtered.length} of {companies.length} shown</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setShowModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Company
          </button>
          <Link to="/batch" className="btn-primary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
            Batch Send
          </Link>
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="flex gap-2.5 mb-5">
        <div className="relative flex-1 max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className="input pl-9"
            placeholder="Search companies…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input max-w-[180px]"
          value={filter}
          onChange={e => setFilter(e.target.value)}
        >
          <option value={ALL}>All Statuses</option>
          {STATUS_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div>
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
                <tr key={c.id} className="table-row" onClick={() => window.location.href = `/companies/${c.id}`}>
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <CompanyAvatar name={c.name} />
                      <span className="font-semibold text-gray-800">{c.name}</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    {c.contacts?.length > 0 ? (
                      <span className="text-gray-500">
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
                  <td className="table-cell">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="table-cell max-w-[200px]">
                    <span className="text-gray-400 text-xs truncate block">{c.notes || '—'}</span>
                  </td>
                  <td className="table-cell text-right">
                    <svg className="text-gray-300 inline" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400 text-sm">
                    No companies match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <AddCompanyModal
          onClose={() => setShowModal(false)}
          onAdded={handleCompanyAdded}
        />
      )}
    </div>
  )
}

function AddCompanyModal({ onClose, onAdded }) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [emails, setEmails] = useState([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function addEmail() {
    const trimmed = emailInput.trim()
    if (!trimmed) return
    const parts = trimmed.split(/[\n,]+/).map(e => e.trim()).filter(Boolean)
    setEmails(prev => [...new Set([...prev, ...parts])])
    setEmailInput('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { e.preventDefault(); addEmail() }
  }

  function removeEmail(email) {
    setEmails(prev => prev.filter(e => e !== email))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Company name is required.'); return }
    setSaving(true)
    setError(null)
    try {
      const finalEmails = emailInput.trim()
        ? [...new Set([...emails, ...emailInput.split(/[\n,]+/).map(e => e.trim()).filter(Boolean)])]
        : emails
      const company = await addCompany(name.trim(), finalEmails)
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
        <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Add New Company</h2>
            <p className="text-xs text-gray-400 mt-0.5">Add a company and its contacts to the outreach list.</p>
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
            <input
              className="input"
              placeholder="e.g. Salesforce"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="label">Contact Emails</label>
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="email@company.com"
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button type="button" className="btn-secondary whitespace-nowrap shrink-0" onClick={addEmail}>
                Add
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              Press Enter after each email, or paste multiple separated by commas.
            </p>

            {emails.length > 0 && (
              <ul className="mt-2.5 space-y-1.5">
                {emails.map(email => (
                  <li key={email} className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm">
                    <div className="w-5 h-5 rounded-md bg-baxa-orange/10 flex items-center justify-center shrink-0">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#BF5700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                    <span className="flex-1 text-gray-700 text-xs">{email}</span>
                    <button type="button" onClick={() => removeEmail(email)}
                      className="text-gray-300 hover:text-red-400 transition-colors ml-1">
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
            <button type="button" className="btn-secondary flex-1 justify-center" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={saving}>
              {saving ? 'Adding…' : 'Add Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
