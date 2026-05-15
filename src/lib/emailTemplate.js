/**
 * Email template helpers
 *
 * The template is stored in localStorage so it persists across sessions
 * and future directors can customise it from the Settings page.
 */

export const DEFAULT_SUBJECT = 'BAXA x {{companyName}} — Partnership Opportunity'

export const DEFAULT_TEMPLATE = `<p>Hi,</p>

<p>I hope you're having a great day! My name is {{yourName}}, and I'm the Corporate Director of the Business Analytics Association (BAXA) at UT Austin. We're a 200+ member student org focused on data, technology, and business, and we're currently seeking industry partners for the 2026–2027 year.</p>

<p>We'd love to explore a partnership with {{companyName}}. Our members are highly engaged students from Business Analytics, CS, Statistics, and MIS — many of whom are actively recruiting. Past sponsors have connected with our talent through info sessions, case competitions, and workshops.</p>

<p>I've attached our Engagement Guide with sponsorship details. Would you be open to a quick call to discuss?</p>

<p>Thanks,<br>
<strong>{{yourName}}</strong><br>
{{yourTitle}}<br>
Business Analytics Association · UT Austin<br>
<a href="https://txbaxa.web.app/">txbaxa.web.app</a> · texasbaxassociation@gmail.com</p>`

const STORAGE_KEYS = {
  template: 'baxa_email_template',
  subject: 'baxa_email_subject',
  senderName: 'baxa_sender_name',
  senderTitle: 'baxa_sender_title',
  attachmentName: 'baxa_attachment_name',
}

export function getTemplate() {
  return localStorage.getItem(STORAGE_KEYS.template) || DEFAULT_TEMPLATE
}

export function getSubjectLine() {
  return localStorage.getItem(STORAGE_KEYS.subject) || DEFAULT_SUBJECT
}

export function getSenderInfo() {
  return {
    name: localStorage.getItem(STORAGE_KEYS.senderName) || 'Devin Thenuwara',
    title: localStorage.getItem(STORAGE_KEYS.senderTitle) || 'Corporate Director',
    attachmentName: localStorage.getItem(STORAGE_KEYS.attachmentName) || 'BAXA Engagement Guide.pdf',
  }
}

export function saveTemplate(template) {
  localStorage.setItem(STORAGE_KEYS.template, template)
}

export function saveSubjectLine(subject) {
  localStorage.setItem(STORAGE_KEYS.subject, subject)
}

export function saveSenderInfo({ name, title, attachmentName }) {
  localStorage.setItem(STORAGE_KEYS.senderName, name)
  localStorage.setItem(STORAGE_KEYS.senderTitle, title)
  localStorage.setItem(STORAGE_KEYS.attachmentName, attachmentName)
}

/**
 * Render the template for a specific company.
 * Replaces {{companyName}}, {{yourName}}, {{yourTitle}}.
 */
export function renderEmail(companyName, overrides = {}) {
  const { name, title } = { ...getSenderInfo(), ...overrides }
  const subject = getSubjectLine().replace('{{companyName}}', companyName)
  const body = getTemplate()
    .replace(/\{\{companyName\}\}/g, companyName)
    .replace(/\{\{yourName\}\}/g, name)
    .replace(/\{\{yourTitle\}\}/g, title)
  return { subject, body }
}
