import { QUESTIONS_PER_BATCH } from '../constants/questionBank'

/**
 * Pick a batch of unused questions for a given role.
 * @param {string} role
 * @param {Set<string>} usedIds - set of already-sent question IDs
 * @param {Object} questionBank - the active question bank
 * @returns {Array} array of question objects
 */
export function pickQuestions(role, usedIds, questionBank) {
  const pool = (questionBank[role] ?? []).filter((q) => !usedIds.has(q.id))
  return [...pool].sort(() => Math.random() - 0.5).slice(0, QUESTIONS_PER_BATCH)
}

/**
 * Generate a deterministic video meeting link for a candidate.
 * @param {number} id
 * @returns {string}
 */
export function getVideoLink(id) {
  return `https://meet.scripbox.com/int-${id.toString(16).padStart(4, '0')}`
}

/**
 * Format an ISO date string to a human-readable short date.
 * @param {string} dateStr
 * @returns {string}
 */
export function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  })
}

/**
 * Highlight matching substrings in a string with <mark> elements.
 * Returns the original string if no keyword provided.
 * @param {string} text
 * @param {string} keyword
 * @returns {string | Array<JSX>}
 */
export function highlight(text, keyword) {
  if (!keyword || typeof text !== 'string') return text
  const regex = new RegExp(
    `(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    'gi'
  )
  return text
    .split(regex)
    .map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    )
}
