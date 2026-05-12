/**
 * Email template helpers
 *
 * The template is stored in localStorage so it persists across sessions
 * and future directors can customise it from the Settings page.
 */

export const DEFAULT_SUBJECT = 'BAXA x {{companyName}} — Partnership Opportunity'

export const DEFAULT_TEMPLATE = `<p>Hello,</p>

<p>I hope this message finds you well. My name is {{yourName}}, and I'm reaching out on behalf of the Business Analytics Association (BAXA) at UT Austin. BAXA is a student-led organization of 100+ members passionate about data, technology, and business. We are reaching out to establish a professional connection between BAXA and <strong>{{companyName}}</strong>. Below we have outlined the benefits of collaborating with our student organization as well as potential opportunities.</p>

<p><strong>Why partner with BAXA?</strong><br>
BAXA is the only business analytics organization on campus, supported by McCombs' Center for Analytics and Supply Chain Management Center. Our interdisciplinary members come from Business Analytics, Computer Science, Statistics &amp; Data Science, Management Information Systems, and Economics. BAXA alumni have gone on to work at Meta, Dell, Wells Fargo, BCG, and more, equipped with real-world experience from our case competitions, technical workshops, and networking events.</p>

<p><strong>How we can collaborate</strong><br>
We've attached our Engagement Guide, which outlines ways to engage with BAXA from event sponsorships to talent development initiatives. We'd love to explore how we can support your goals and would be happy to set up a meeting at your convenience.</p>

<p>Thanks,<br>
<strong>{{yourName}}</strong><br>
{{yourTitle}}<br>
The University of Texas at Austin | McCombs School of Business<br>
<a href="https://txbaxa.web.app/">https://txbaxa.web.app/</a><br>
texasbaxassociation@gmail.com</p>`

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
