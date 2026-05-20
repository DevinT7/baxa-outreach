import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase env vars. Copy .env.example to .env and fill in values.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Companies ─────────────────────────────────────────────────────────────────

export async function addCompany(name, contacts = []) {
  const { data: company, error } = await supabase
    .from('companies')
    .insert({ name: name.trim() })
    .select()
    .single()
  if (error) throw error

  if (contacts.length > 0) {
    const rows = contacts.map(c => ({
      company_id: company.id,
      email: (typeof c === 'string' ? c : c.email).trim(),
      name: typeof c === 'string' ? null : (c.name?.trim() || null),
    }))
    const { error: contactError } = await supabase.from('contacts').insert(rows)
    if (contactError) throw contactError
  }

  return company
}

export async function getCompanies() {
  const { data, error } = await supabase
    .from('companies')
    .select('*, contacts(*), email_logs(*)')
    .order('name')
  if (error) throw error
  return data
}

export async function getCompany(id) {
  const { data, error } = await supabase
    .from('companies')
    .select('*, contacts(*), email_logs(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function updateCompany(id, updates) {
  const { data, error } = await supabase
    .from('companies')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function addContact(companyId, email, name = null) {
  const { data, error } = await supabase
    .from('contacts')
    .insert({ company_id: companyId, email, name })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteContact(contactId) {
  const { error } = await supabase.from('contacts').delete().eq('id', contactId)
  if (error) throw error
}

// ── Email Logs ────────────────────────────────────────────────────────────────

export async function logDraft(companyId, { gmailDraftId, subject, sentBy, contactEmail, contactName, isFollowup = false }) {
  const { data, error } = await supabase
    .from('email_logs')
    .insert({
      company_id: companyId,
      gmail_draft_id: gmailDraftId,
      status: 'draft',
      subject,
      sent_by: sentBy,
      contact_email: contactEmail ?? null,
      contact_name: contactName ?? null,
      is_followup: isFollowup,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function markEmailSent(logId) {
  const { data, error } = await supabase
    .from('email_logs')
    .update({ status: 'sent' })
    .eq('id', logId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getStats() {
  const { data, error } = await supabase
    .from('companies')
    .select('status')
  if (error) throw error

  const counts = { not_contacted: 0, draft_created: 0, sent: 0, replied: 0, not_interested: 0 }
  data.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1 })
  return { total: data.length, ...counts }
}
