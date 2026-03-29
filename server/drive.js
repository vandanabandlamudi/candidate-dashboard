import { google } from 'googleapis'
import path from 'path'
import dotenv from 'dotenv'
import mammoth from 'mammoth'

dotenv.config()

const ROOT_FOLDER = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID ?? ''

// In-process cache: roleName → folderId
const folderCache = new Map()

function getAuth(scopes, impersonateEmail = null) {
  const opts = { scopes }
  if (impersonateEmail) opts.subject = impersonateEmail
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    opts.credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON)
  } else {
    opts.keyFile = path.resolve(process.env.GOOGLE_SERVICE_ACCOUNT_PATH ?? './service-account.json')
  }
  return new google.auth.GoogleAuth(opts)
}

function getDriveClient() {
  return google.drive({ version: 'v3', auth: getAuth(['https://www.googleapis.com/auth/drive.readonly']) })
}

/**
 * Creates a Google Calendar event with a Meet link.
 * Requires the service account to have domain-wide delegation
 * and the Calendar API enabled.
 */
export async function createMeetEvent({ organizerEmail, candidateEmail, candidateName, role, date, time }) {
  const auth = getAuth(
    ['https://www.googleapis.com/auth/calendar'],
    organizerEmail
  )
  const calendar = google.calendar({ version: 'v3', auth })

  const startDateTime = new Date(`${date}T${time}:00`)
  const endDateTime   = new Date(startDateTime.getTime() + 60 * 60 * 1000) // 1 hour

  const toISO = (d) => d.toISOString()

  const event = {
    summary: `Interview – ${candidateName} (${role})`,
    description: `Interview scheduled via AI-Powered Resume Screening dashboard.`,
    start:  { dateTime: toISO(startDateTime), timeZone: 'Asia/Kolkata' },
    end:    { dateTime: toISO(endDateTime),   timeZone: 'Asia/Kolkata' },
    attendees: [
      { email: organizerEmail },
      ...(candidateEmail ? [{ email: candidateEmail }] : []),
    ],
    conferenceData: {
      createRequest: {
        requestId: `interview-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  }

  const res = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    sendUpdates: 'all',
    resource: event,
  })

  const meetLink = res.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video')?.uri
  return { eventId: res.data.id, meetLink, eventLink: res.data.htmlLink }
}

/**
 * Returns the Drive folder ID for the given role name.
 * Looks up the subfolder inside ROOT_FOLDER that exactly matches `roleName`.
 */
export async function getFolderIdForRole(roleName) {
  if (folderCache.has(roleName)) return folderCache.get(roleName)

  const drive = getDriveClient()
  const res = await drive.files.list({
    q: `'${ROOT_FOLDER}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
  })

  for (const folder of res.data.files ?? []) {
    folderCache.set(folder.name, folder.id)
  }

  return folderCache.get(roleName) ?? null
}

const SUPPORTED_MIME_TYPES = [
  'application/vnd.google-apps.document',                                          // Google Docs
  'application/pdf',                                                                // PDF
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',       // DOCX
  'text/plain',                                                                     // TXT
]

/**
 * Lists all supported files in `folderId` and returns one chosen at random.
 * Returns { fileId, fileName, mimeType } or null if the folder is empty.
 */
export async function pickRandomDocFromFolder(folderId) {
  const drive = getDriveClient()
  const mimeFilter = SUPPORTED_MIME_TYPES.map((m) => `mimeType = '${m}'`).join(' or ')
  const res = await drive.files.list({
    q: `'${folderId}' in parents and (${mimeFilter}) and trashed = false`,
    fields: 'files(id, name, mimeType)',
  })

  const files = res.data.files ?? []
  if (files.length === 0) return null

  const picked = files[Math.floor(Math.random() * files.length)]
  return { fileId: picked.id, fileName: picked.name, mimeType: picked.mimeType }
}

/**
 * Exports a file as plain UTF-8 text.
 * - Google Docs: files.export → text/plain
 * - DOCX: download bytes → mammoth.extractRawText
 * - TXT: download bytes → UTF-8 decode
 */
export async function exportDocAsText(fileId, mimeType) {
  const drive = getDriveClient()

  if (mimeType === 'application/vnd.google-apps.document') {
    const res = await drive.files.export(
      { fileId, mimeType: 'text/plain' },
      { responseType: 'text' }
    )
    return res.data
  }

  // Download raw bytes for all other types
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  )
  const buffer = Buffer.from(res.data)

  if (mimeType === 'application/pdf') {
    const { createRequire } = await import('module')
    const req = createRequire(import.meta.url)
    const pdfParse = req('pdf-parse')
    const result = await pdfParse(buffer)
    return result.text
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  // TXT or fallback
  return buffer.toString('utf-8')
}
