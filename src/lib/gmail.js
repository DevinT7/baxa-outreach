/**
 * Gmail API integration
 *
 * Uses Google Identity Services (GIS) for OAuth and the Gmail REST API
 * to create drafts. Requires VITE_GOOGLE_CLIENT_ID in your .env.
 *
 * Scopes needed:
 *   https://www.googleapis.com/auth/gmail.compose
 */

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPES = 'https://www.googleapis.com/auth/gmail.compose'

let tokenClient = null
let accessToken = null

// ── Auth ──────────────────────────────────────────────────────────────────────

export function initGoogleAuth() {
  return new Promise((resolve, reject) => {
    if (typeof google === 'undefined') {
      reject(new Error('Google Identity Services script not loaded. Check your index.html.'))
      return
    }
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error))
          return
        }
        accessToken = response.access_token
        resolve(accessToken)
      },
    })
    resolve(null) // initialized, not yet authenticated
  })
}

export async function requestGmailAccess() {
  if (!tokenClient) await initGoogleAuth()
  return new Promise((resolve, reject) => {
    tokenClient.callback = (response) => {
      if (response.error) { reject(new Error(response.error)); return }
      accessToken = response.access_token
      resolve(accessToken)
    }
    tokenClient.requestAccessToken({ prompt: '' })
  })
}

export function isAuthenticated() {
  return !!accessToken
}

export function signOut() {
  if (accessToken) {
    google.accounts.oauth2.revoke(accessToken)
    accessToken = null
  }
}

// ── MIME helpers ──────────────────────────────────────────────────────────────

function toBase64Url(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// RFC 2047 encoding — required for any non-ASCII characters in email headers
// (e.g. em dashes, smart quotes). Without this, Gmail renders them as â€" etc.
function encodeEmailSubject(subject) {
  return `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`
}

function buildMimeMessage({ to, subject, htmlBody, attachmentBase64, attachmentName }) {
  const boundary = `baxa_boundary_${Date.now()}`

  const headers = [
    `To: ${to}`,
    `Subject: ${encodeEmailSubject(subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
  ].join('\r\n')

  const htmlPart = [
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: quoted-printable',
    '',
    htmlBody,
    '',
  ].join('\r\n')

  let attachmentPart = ''
  if (attachmentBase64 && attachmentName) {
    attachmentPart = [
      `--${boundary}`,
      `Content-Type: application/pdf; name="${attachmentName}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${attachmentName}"`,
      '',
      attachmentBase64,
      '',
    ].join('\r\n')
  }

  const closing = `--${boundary}--`

  const full = [headers, htmlPart, attachmentPart, closing].join('\r\n')
  return btoa(unescape(encodeURIComponent(full)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// ── Attachment helper ─────────────────────────────────────────────────────────

let _attachmentCache = null

/**
 * Fetches the Engagement Guide PDF from /public and returns it as a base64 string.
 * Result is cached so subsequent calls are instant.
 */
export async function getEngagementGuideBase64() {
  if (_attachmentCache) return _attachmentCache
  const res = await fetch('/Engagement Guide.pdf')
  if (!res.ok) throw new Error('Could not load Engagement Guide.pdf — make sure it is in the public/ folder.')
  const buffer = await res.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  _attachmentCache = btoa(binary)
  return _attachmentCache
}

// ── Draft creation ────────────────────────────────────────────────────────────

/**
 * Creates a Gmail draft for the given company.
 *
 * @param {object} opts
 * @param {string}   opts.toEmails         Comma-separated recipient emails
 * @param {string}   opts.subject
 * @param {string}   opts.htmlBody         Full HTML email body
 * @param {string}   [opts.attachmentBase64]  Base64-encoded PDF content
 * @param {string}   [opts.attachmentName]    PDF filename
 * @returns {Promise<{draftId: string, draftUrl: string}>}
 */
export async function createDraft({ toEmails, subject, htmlBody, attachmentBase64, attachmentName }) {
  if (!accessToken) {
    await requestGmailAccess()
  }

  const raw = buildMimeMessage({
    to: toEmails,
    subject,
    htmlBody,
    attachmentBase64,
    attachmentName,
  })

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message: { raw } }),
  })

  if (!res.ok) {
    const err = await res.json()
    // Token expired — clear and retry once
    if (res.status === 401) {
      accessToken = null
      return createDraft({ toEmails, subject, htmlBody, attachmentBase64, attachmentName })
    }
    throw new Error(err.error?.message || 'Gmail API error')
  }

  const draft = await res.json()
  const draftId = draft.id
  const draftUrl = `https://mail.google.com/mail/#drafts/${draftId}`
  return { draftId, draftUrl }
}
