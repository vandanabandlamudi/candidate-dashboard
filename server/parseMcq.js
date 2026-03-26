/**
 * Server-side MCQ parser.
 * Splits the document at the answer key heading, then parses each section independently.
 */

// ─── Split inline options ─────────────────────────────────────────────────────
// Handles "A) foo  B) bar  C) baz  D) qux" on a single line.

function splitInlineOptions(line) {
  const markerRe = /(?:^|\s)([A-Da-d])\s*[\.\)]\s+/g
  const positions = []
  let m
  while ((m = markerRe.exec(line)) !== null) {
    positions.push({ letter: m[1].toUpperCase(), index: m.index })
  }
  if (positions.length < 2) return null

  const options = {}
  for (let i = 0; i < positions.length; i++) {
    const afterMarker = line.indexOf(')', positions[i].index) + 1
    const end = i + 1 < positions.length ? positions[i + 1].index : line.length
    options[positions[i].letter] = line.slice(afterMarker, end).trim()
  }
  return options
}

// ─── Find where the answer key section starts ────────────────────────────────

const ANSWER_HEADING_RE = /^(answer\s*(key|sheet|section)?|answers?)\s*[:\-]?\s*$/i

function splitDocument(lines) {
  const headingIdx = lines.findIndex((l) => ANSWER_HEADING_RE.test(l))
  if (headingIdx === -1) {
    return { questionLines: lines, answerLines: [] }
  }
  return {
    questionLines: lines.slice(0, headingIdx),
    answerLines:   lines.slice(headingIdx + 1),
  }
}

// ─── Parse question blocks ────────────────────────────────────────────────────

function parseQuestionBlocks(lines) {
  const questions = []
  let current     = null
  let lastOption  = null

  const isQuestionLine = (l) => /^(\(?\d+[\.\)]\s*|Q\d+[\.\):\s]+)/i.test(l)
  const isOptionLine   = (l) => /^[A-Da-d][\.\)]\s+\S/.test(l)
  const isInlineAnswer = (l) => /^(answer|ans|correct)[:\s]+[A-Da-d]/i.test(l)

  const pushCurrent = () => {
    if (!current) return
    if (Object.keys(current.options).length >= 2) questions.push({ ...current, type: 'mcq' })
    current    = null
    lastOption = null
  }

  for (const line of lines) {
    if (isQuestionLine(line)) {
      const numMatch = line.match(/^(\d+)/)
      const lineNum  = numMatch ? parseInt(numMatch[1], 10) : (questions.length + 1)
      pushCurrent()
      const text = line.replace(/^\(?\d+[\.\)]\s*/, '').replace(/^Q\d+[\.\):\s]+/i, '').trim()
      current    = { number: lineNum, text, options: {}, correctOption: null }
      lastOption = null
    } else if (current) {
      const inlineOpts = splitInlineOptions(line)
      if (inlineOpts && Object.keys(inlineOpts).length >= 2) {
        Object.assign(current.options, inlineOpts)
        lastOption = null
      } else if (isInlineAnswer(line)) {
        const match = line.match(/[A-Da-d]/i)
        if (match) current.correctOption = match[0].toUpperCase()
        lastOption = null
      } else if (isOptionLine(line)) {
        const key            = line[0].toUpperCase()
        const val            = line.replace(/^[A-Da-d][\.\)]\s+/, '').trim()
        current.options[key] = val
        lastOption           = key
      } else if (lastOption) {
        current.options[lastOption] += ' ' + line
      } else if (Object.keys(current.options).length === 0) {
        current.text += ' ' + line
      }
    }
  }
  pushCurrent()
  return questions
}

// ─── Parse answer key lines only ─────────────────────────────────────────────
// Handles: "1. B"  "1) B"  "1: B"  "1-B"  "1. B - explanation"

function parseAnswerKey(lines) {
  const answerMap = new Map()
  for (const line of lines) {
    const entryRe = /(\d+)\s*[\.\)\:\-]\s*([A-Da-d])\b/g
    let match
    while ((match = entryRe.exec(line)) !== null) {
      answerMap.set(parseInt(match[1], 10), match[2].toUpperCase())
    }
  }
  return answerMap
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function parseMcq(rawText) {
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

  const { questionLines, answerLines } = splitDocument(lines)

  const questions = parseQuestionBlocks(questionLines)
  const answerKey = parseAnswerKey(answerLines)

  return questions.map((q, idx) => {
    let correctLetter = q.correctOption
    if (!correctLetter && answerKey.has(q.number))  correctLetter = answerKey.get(q.number)
    if (!correctLetter && answerKey.has(idx + 1))   correctLetter = answerKey.get(idx + 1)
    correctLetter = (correctLetter ?? 'A').toUpperCase()

    return {
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      type: 'mcq',
      text: q.text,
      options: ['A', 'B', 'C', 'D'].map((k) => q.options[k] ?? ''),
      correctOption: Math.max(0, 'ABCD'.indexOf(correctLetter)),
      marks: 1,
    }
  })
}
