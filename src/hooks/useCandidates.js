import { useState, useCallback } from 'react'
import { initialCandidates } from '../data/candidates'
import { FORWARD_MAP } from '../constants/statuses'
import { getVideoLink } from '../utils/helpers'

/**
 * Manages all candidate state and mutation handlers.
 */
export function useCandidates(showToast) {
  const [candidates, setCandidates] = useState(initialCandidates)

  const updateCandidate = useCallback((id, patch) => {
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
  }, [])

  const handleStatusChange = useCallback(
    (id, newStatus) => {
      const candidate = candidates.find((c) => c.id === id)
      updateCandidate(id, { status: newStatus })
      showToast(`${candidate.name} moved to ${newStatus}`)
    },
    [candidates, updateCandidate, showToast]
  )

  const handleForward = useCallback(
    (candidate) => {
      const next = FORWARD_MAP[candidate.status]
      if (!next) return
      updateCandidate(candidate.id, { status: next })
      showToast(`${candidate.name} → ${next}`)
    },
    [updateCandidate, showToast]
  )

  const handleSchedule = useCallback(
    (candidate, interviewData) => {
      updateCandidate(candidate.id, { interview: interviewData })
      showToast(
        `Interview scheduled for ${candidate.name} on ${interviewData.date} at ${interviewData.time} · ${interviewData.type}`
      )
    },
    [updateCandidate, showToast]
  )

  const handleVideo = useCallback(
    (candidate) => {
      const link = getVideoLink(candidate.id)
      try {
        navigator.clipboard.writeText(link)
      } catch {
        // clipboard not available in all environments
      }
      showToast(`Link copied: ${link}`)
    },
    [showToast]
  )

  const handleDelete = useCallback(
    (candidate, clearFromSelection) => {
      setCandidates((prev) => prev.filter((c) => c.id !== candidate.id))
      clearFromSelection(candidate.id)
      showToast(`${candidate.name} archived`)
    },
    [showToast]
  )

  const applySentQuestions = useCallback((selectedIds, previewMap) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (!selectedIds.has(c.id) || c.status !== 'Interview R1') return c
        const questions = previewMap[c.role] ?? []
        return { ...c, sentQuestions: [...(c.sentQuestions ?? []), ...questions] }
      })
    )
  }, [])

  const updateAssessment = useCallback((candidateId, questionId, { score, notes }) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c
        const existing = c.assessments ?? []
        const idx = existing.findIndex((a) => a.questionId === questionId)
        const updated = idx >= 0
          ? existing.map((a, i) => i === idx ? { ...a, score, notes } : a)
          : [...existing, { questionId, score, notes }]
        return { ...c, assessments: updated }
      })
    )
  }, [])

  return {
    candidates,
    handleStatusChange,
    handleForward,
    handleSchedule,
    handleVideo,
    handleDelete,
    applySentQuestions,
    updateAssessment,
  }
}
