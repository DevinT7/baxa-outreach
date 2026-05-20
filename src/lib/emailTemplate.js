/**
 * Email template helpers
 *
 * The template is stored in localStorage so it persists across sessions
 * and future directors can customise it from the Settings page.
 */

export const DEFAULT_SUBJECT = 'BAXA x {{companyName}} — Partnership Opportunity'

export const DEFAULT_TEMPLATE = `<p>Hi {{contactName}},</p>

<p>I hope you're having a great day! My name is {{yourName}}, and I'm the Corporate Director of the Business Analytics Association (BAXA) at UT Austin. We're a 200+ member student org focused on data, technology, and business, and we're currently seeking industry partners for the 2026–2027 year.</p>

<p>We'd love to explore a partnership with {{companyName}}. Our members are highly engaged students from Business Analytics, CS, Statistics, and MIS — many of whom are actively recruiting. Past sponsors have connected with our talent through info sessions, case competitions, and workshops.</p>

<p>I've attached our Engagement Guide with sponsorship details. Would you be open to a quick call to discuss?</p>

<p>Thanks,<br>
<strong>{{yourName}}</strong><br>
{{yourTitle}}<br>
Business Analytics Association · UT Austin<br>
<a href="https://txbaxa.web.app/">txbaxa.web.app</a> · texasbaxassociation@gmail.com</p>`

export const DEFAULT_FOLLOWUP_SUBJECT = 'Following up — BAXA x {{companyName}}'

export const DEFAULT_FOLLOWUP_TEMPLATE = `<p>Hi {{contactName}},</p>

<p>I wanted to follow up on my previous email about a potential partnership between BAXA and {{companyName}}. If you have any questions, please let me know!</p>

<p>We'd love to schedule a quick 15-minute call, and I'm happy to work around your schedule!</p>

<p>Thanks again,<br>
<strong>{{yourName}}</strong><br>
{{yourTitle}}<br>
Business Analytics Association · UT Austin<br>
<a href="https://txbaxa.web.app/">txbaxa.web.app</a> · texasbaxassociation@gmail.com</p>`

const STORAGE_KEYS = {
  template: 'baxa_email_template',
  subject: 'baxa_email_subject',
  followupTemplate: 'baxa_followup_template',
  followupSubject: 'baxa_followup_subject',
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

export function getFollowupTemplate() {
  return localStorage.getItem(STORAGE_KEYS.followupTemplate) || DEFAULT_FOLLOWUP_TEMPLATE
}

export function getFollowupSubject() {
  return localStorage.getItem(STORAGE_KEYS.followupSubject) || DEFAULT_FOLLOWUP_SUBJECT
}

export function saveFollowupTemplate(template) {
  localStorage.setItem(STORAGE_KEYS.followupTemplate, template)
}

export function saveFollowupSubject(subject) {
  localStorage.setItem(STORAGE_KEYS.followupSubject, subject)
}

export function saveSenderInfo({ name, title, attachmentName }) {
  localStorage.setItem(STORAGE_KEYS.senderName, name)
  localStorage.setItem(STORAGE_KEYS.senderTitle, title)
  localStorage.setItem(STORAGE_KEYS.attachmentName, attachmentName)
}

/**
 * Extract a capitalized first name from an email address.
 * e.g. "natalie.seal@capitalone.com" → "Natalie"
 *      "john_smith@company.com"      → "John"
 */
function extractFirstNameFromEmail(email) {
  const local = email.split('@')[0]
  const first = local.split(/[._\-+]/)[0]
  if (!first) return 'there'
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
}

/**
 * Render the template for a specific company.
 * Replaces {{companyName}}, {{contactName}}, {{yourName}}, {{yourTitle}}.
 * Name priority: stored contact name → extracted from email → "there"
 */
/**
 * Render the follow-up template for a specific contact.
 * Same placeholder logic as renderEmail.
 */
export function renderFollowUp(companyName, contactName = null, contactEmail = null, overrides = {}) {
  const { name, title } = { ...getSenderInfo(), ...overrides }
  const subject = getFollowupSubject().replace('{{companyName}}', companyName)
  const firstName = contactName
    ? contactName.trim().split(' ')[0]
    : contactEmail
      ? extractFirstNameFromEmail(contactEmail)
      : 'there'
  const body = getFollowupTemplate()
    .replace(/\{\{companyName\}\}/g, companyName)
    .replace(/\{\{contactName\}\}/g, firstName)
    .replace(/\{\{yourName\}\}/g, name)
    .replace(/\{\{yourTitle\}\}/g, title)
  return { subject, body }
}

export function renderEmail(companyName, contactName = null, contactEmail = null, overrides = {}) {
  const { name, title } = { ...getSenderInfo(), ...overrides }
  const subject = getSubjectLine().replace('{{companyName}}', companyName)
  const firstName = contactName
    ? contactName.trim().split(' ')[0]
    : contactEmail
      ? extractFirstNameFromEmail(contactEmail)
      : 'there'
  const body = getTemplate()
    .replace(/\{\{companyName\}\}/g, companyName)
    .replace(/\{\{contactName\}\}/g, firstName)
    .replace(/\{\{yourName\}\}/g, name)
    .replace(/\{\{yourTitle\}\}/g, title)
  return { subject, body }
}
