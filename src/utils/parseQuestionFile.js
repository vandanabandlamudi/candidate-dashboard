/**
 * Parse a user-uploaded file into an array of question strings.
 * Supports .txt, .docx, and .pdf (no external libraries).
 *
 * Accepted question formats:
 *   1. Question text        (numbered list)
 *   Q2. Question text       (Q-prefixed)
 *   Question text           (plain line, one per line)
 */

// ─── ZIP / DOCX ─────────────────────────────────────────────────────────────

/**
 * Minimal ZIP parser — finds a file entry by name and returns its raw bytes.
 * Only handles DEFLATE (method 8) and stored (method 0) entries.
 */
async function readZipEntry(arrayBuffer, targetName) {
  const view  = new DataView(arrayBuffer)
  const bytes = new Uint8Array(arrayBuffer)
  let offset  = 0

  while (offset + 30 < bytes.length) {
    const sig = view.getUint32(offset, true)
    if (sig !== 0x04034b50) break // local file header signature

    const method      = view.getUint16(offset + 8,  true)
    const compSize    = view.getUint32(offset + 18, true)
    const fnLen       = view.getUint16(offset + 26, true)
    const extraLen    = view.getUint16(offset + 28, true)
    const fnBytes     = bytes.slice(offset + 30, offset + 30 + fnLen)
    const name        = new TextDecoder().decode(fnBytes)
    const dataStart   = offset + 30 + fnLen + extraLen
    const compData    = bytes.slice(dataStart, dataStart + compSize)

    if (name === targetName) {
      if (method === 0) {
        // Stored — no compression
        return compData
      } else if (method === 8) {
        // DEFLATE — use DecompressionStream (available in all modern browsers)
        const ds     = new DecompressionStream('deflate-raw')
        const writer = ds.writable.getWriter()
        writer.write(compData)
        writer.close()
        const chunks = []
        const reader = ds.readable.getReader()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
        }
        const total  = chunks.reduce((s, c) => s + c.length, 0)
        const result = new Uint8Array(total)
        let pos = 0
        for (const chunk of chunks) { result.set(chunk, pos); pos += chunk.length }
        return result
      }
    }

    offset = dataStart + compSize
  }
  return null
}

async function extractDocxText(file) {
  const buf        = await file.arrayBuffer()
  const xmlBytes   = await readZipEntry(buf, 'word/document.xml')

  if (!xmlBytes) {
    // Fallback: naive decode — may produce garbage for compressed entries
    const raw = new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(buf))
    return raw.replace(/<[^>]+>/g, ' ')
  }

  const xml     = new TextDecoder('utf-8').decode(xmlBytes)
  const matches = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]

  // Each <w:p> paragraph should become its own line.
  // We reconstruct by replacing paragraph tags with newlines first.
  const withNewlines = xml
    .replace(/<w:p[ >]/g, '\n<w:p ')   // paragraph start → newline before
    .replace(/<\/w:p>/g, '\n')          // paragraph end → newline
  const lineMatches = [...withNewlines.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]

  if (lineMatches.length === 0 && matches.length === 0) {
    return xml.replace(/<[^>]+>/g, ' ')
  }

  // Build output preserving paragraph breaks
  // Group runs by paragraph using the newline-annotated version
  const paragraphs = withNewlines
    .split('\n')
    .map((seg) => {
      const runs = [...seg.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
      return runs.map((m) => m[1]).join('')
    })
    .filter((p) => p.trim().length > 0)

  return paragraphs.join('\n')
}

// ─── PDF ────────────────────────────────────────────────────────────────────

/** Decompress a zlib/deflate stream (PDF FlateDecode). */
async function inflateZlib(bytes) {
  // zlib streams start with a 2-byte header (0x78 ...) — strip it for deflate-raw
  const deflateBytes = bytes[0] === 0x78 ? bytes.slice(2) : bytes
  try {
    const ds     = new DecompressionStream('deflate-raw')
    const writer = ds.writable.getWriter()
    writer.write(deflateBytes)
    writer.close()
    const chunks = []
    const reader = ds.readable.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
    const total  = chunks.reduce((s, c) => s + c.length, 0)
    const result = new Uint8Array(total)
    let pos = 0
    for (const c of chunks) { result.set(c, pos); pos += c.length }
    return result
  } catch {
    return null
  }
}

/** Extract readable text from a BT...ET PDF text block. */
function extractBtEtText(block) {
  const parts = []
  // Parenthesised string literals: (Hello world)
  for (const m of block.matchAll(/\(([^)\\]*(?:\\.[^)\\]*)*)\)/g)) {
    const decoded = m[1]
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)))
      .replace(/\\(.)/g, '$1')
    if (decoded.trim()) parts.push(decoded)
  }
  // Hex strings <AABB>
  for (const m of block.matchAll(/<([0-9a-fA-F\s]+)>/g)) {
    const hex = m[1].replace(/\s/g, '')
    if (hex.length % 2 !== 0) continue
    let str = ''
    for (let i = 0; i < hex.length; i += 2)
      str += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16))
    if (str.trim()) parts.push(str)
  }
  return parts.join(' ')
}

async function extractPdfText(file) {
  const buf   = await file.arrayBuffer()
  const bytes = new Uint8Array(buf)
  const raw   = new TextDecoder('latin1').decode(bytes)

  // Find all stream...endstream regions. Some may be FlateDecode-compressed.
  // Strategy:
  //   1. Scan each PDF object for /Filter /FlateDecode (or /FL)
  //   2. If found, decompress the stream bytes and scan BT...ET there
  //   3. Also scan the raw document for uncompressed BT...ET blocks

  const allText = []

  // Locate stream byte ranges
  const streamRe = /stream\r?\n/g
  let match
  while ((match = streamRe.exec(raw)) !== null) {
    const streamStart = match.index + match[0].length
    // Look for the object header before this stream to check for FlateDecode
    const headerSlice = raw.slice(Math.max(0, match.index - 300), match.index)
    const isFlate = /\/Filter\s*\/FlateDecode|\/Filter\s*\[.*?\/FlateDecode|\/FL\b/.test(headerSlice)

    // Find endstream
    const endIdx = raw.indexOf('endstream', streamStart)
    if (endIdx === -1) continue
    const streamEnd = endIdx

    if (isFlate) {
      const compressed = bytes.slice(streamStart, streamEnd)
      const decompressed = await inflateZlib(compressed)
      if (decompressed) {
        const decoded = new TextDecoder('latin1').decode(decompressed)
        for (const btm of decoded.matchAll(/BT([\s\S]*?)ET/g)) {
          const t = extractBtEtText(btm[1])
          if (t.trim()) allText.push(t)
        }
      }
    } else {
      const streamRaw = raw.slice(streamStart, streamEnd)
      for (const btm of streamRaw.matchAll(/BT([\s\S]*?)ET/g)) {
        const t = extractBtEtText(btm[1])
        if (t.trim()) allText.push(t)
      }
    }
  }

  // Fallback: scan entire raw for uncompressed BT...ET (catches simple PDFs)
  if (allText.length === 0) {
    for (const btm of raw.matchAll(/BT([\s\S]*?)ET/g)) {
      const t = extractBtEtText(btm[1])
      if (t.trim()) allText.push(t)
    }
  }

  return allText.join('\n')
}

// ─── TXT ────────────────────────────────────────────────────────────────────

async function extractTxtText(file) {
  return new Promise((resolve, reject) => {
    const reader   = new FileReader()
    reader.onload  = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

// ─── MCQ parser ─────────────────────────────────────────────────────────────

/**
 * Parse raw text into an array of MCQ question objects.
 *
 * Expected format (flexible):
 *   1. What is React?
 *   A) A backend framework
 *   B) A frontend library
 *   C) A database
 *   D) A CSS tool
 *   Answer: B
 *
 * Returns: [{ text, options: { A, B, C, D }, correctOption, type: 'mcq' }]
 * Falls back to open-ended { text, type: 'open-ended' } if no options found.
 */
function parseMcqBlocks(raw) {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  const questions = []
  let current     = null
  let lastOption  = null  // track last option key for multi-line option text

  const isQuestionLine = (l) => /^(\(?\d+[\.\)]\s*|Q\d+[\.\):\s]+)/i.test(l)
  const isOptionLine   = (l) => /^[A-Da-d][\.\)]\s+\S/.test(l)
  const isAnswerLine   = (l) => /^(answer|ans|correct)[:\s]+[A-Da-d]/i.test(l)

  const pushCurrent = () => {
    if (!current) return
    const hasOptions = Object.keys(current.options).length >= 2
    if (hasOptions) {
      questions.push({ ...current, type: 'mcq' })
    } else if (current.text.length > 5) {
      questions.push({ text: current.text, type: 'open-ended', options: {}, correctOption: null })
    }
    current    = null
    lastOption = null
  }

  for (const line of lines) {
    if (isQuestionLine(line)) {
      pushCurrent()
      const text = line
        .replace(/^\(?\d+[\.\)]\s*/, '')
        .replace(/^Q\d+[\.\):\s]+/i, '')
        .trim()
      current    = { text, options: {}, correctOption: null }
      lastOption = null
    } else if (isOptionLine(line) && current) {
      const key       = line[0].toUpperCase()
      const val       = line.replace(/^[A-Da-d][\.\)]\s+/, '').trim()
      current.options[key] = val
      lastOption      = key
    } else if (isAnswerLine(line) && current) {
      const match = line.match(/[A-Da-d]/i)
      if (match) current.correctOption = match[0].toUpperCase()
      lastOption = null
    } else if (current) {
      // continuation line — append to last option if inside options, else to question text
      if (lastOption) {
        current.options[lastOption] += ' ' + line
      } else if (Object.keys(current.options).length === 0) {
        current.text += ' ' + line
      }
    }
  }
  pushCurrent()

  return questions
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export async function parseQuestionsFromFile(file) {
  const name = file.name.toLowerCase()
  let raw = ''

  if (name.endsWith('.pdf')) {
    raw = await extractPdfText(file)
  } else if (name.endsWith('.docx')) {
    raw = await extractDocxText(file)
  } else {
    raw = await extractTxtText(file)
  }

  return parseMcqBlocks(raw)
}
