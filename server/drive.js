import { google } from 'googleapis'
import path from 'path'
import dotenv from 'dotenv'
import mammoth from 'mammoth'
import { PDFParse } from 'pdf-parse'

dotenv.config()

const KEY_FILE  = path.resolve(process.env.GOOGLE_SERVICE_ACCOUNT_PATH ?? './service-account.json')
const ROOT_FOLDER = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID ?? ''

// In-process cache: roleName → folderId
const folderCache = new Map()

function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  })
  return google.drive({ version: 'v3', auth })
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
    const parser = new PDFParse({ data: buffer })
    const result = await parser.getText()
    return result.text
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  // TXT or fallback
  return buffer.toString('utf-8')
}
