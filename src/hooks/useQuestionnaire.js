import { useState, useMemo } from 'react'
import { pickQuestions } from '../utils/helpers'

const STORAGE_KEY = 'usedQuestionIds'

const INITIAL_USED = {
  'Senior Frontend Engineer': new Set(),
  'Product Manager':          new Set(),
  'Data Scientist':           new Set(),
  'DevOps Engineer':          new Set(),
}

function loadFromSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return INITIAL_USED
    const parsed = JSON.parse(raw)
    const result = { ...INITIAL_USED }
    Object.keys(parsed).forEach((role) => {
      result[role] = new Set(parsed[role])
    })
    return result
  } catch {
    return INITIAL_USED
  }
}

function saveToSession(usedQIds) {
  const serializable = {}
  Object.keys(usedQIds).forEach((role) => {
    serializable[role] = [...usedQIds[role]]
  })
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
}

/**
 * Manages questionnaire state — used question tracking, modal visibility,
 * per-role question preview, and confirm logic.
 *
 * @param {Array}  candidates
 * @param {Set}    selectedIds
 * @param {Function} applySentQuestions - from useCandidates
 * @param {Function} clearSelection
 * @param {Function} showToast
 */
export function useQuestionnaire(candidates, selectedIds, applySentQuestions, clearSelection, showToast, questionBank) {
  const [usedQIds,   setUsedQIds]   = useState(loadFromSession)
  const [showQModal, setShowQModal] = useState(false)

  // Candidates that are selected AND in Screening stage (where assignments are sent)
  const r1Selected = useMemo(
    () => candidates.filter((c) => selectedIds.has(c.id) && c.status === 'Screen'),
    [candidates, selectedIds]
  )

  // One preview batch per role (only unused questions)
  const previewMap = useMemo(() => {
    const map = {}
    const roles = [...new Set(r1Selected.map((c) => c.role))]
    roles.forEach((role) => {
      map[role] = pickQuestions(role, usedQIds[role] ?? new Set(), questionBank)
    })
    return map
  }, [r1Selected, usedQIds, questionBank])

  const usedCountByRole = useMemo(() => {
    const counts = {}
    Object.keys(usedQIds).forEach((role) => {
      counts[role] = usedQIds[role].size
    })
    return counts
  }, [usedQIds])

  const totalByRole = useMemo(() => {
    const counts = {}
    Object.keys(questionBank).forEach((role) => {
      counts[role] = questionBank[role].length
    })
    return counts
  }, [questionBank])

  const confirmSend = () => {
    // Mark all previewed questions as used
    const newUsed = { ...usedQIds }
    Object.entries(previewMap).forEach(([role, qs]) => {
      newUsed[role] = new Set([...(newUsed[role] ?? []), ...qs.map((q) => q.id)])
    })
    setUsedQIds(newUsed)
    saveToSession(newUsed)

    applySentQuestions(selectedIds, previewMap)
    setShowQModal(false)
    showToast(`Questionnaire sent to ${r1Selected.length} candidate${r1Selected.length > 1 ? 's' : ''}`)
    clearSelection()
  }

  return {
    showQModal, setShowQModal,
    r1Selected,
    previewMap,
    usedCountByRole,
    totalByRole,
    confirmSend,
  }
}
