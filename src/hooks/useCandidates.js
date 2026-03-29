import { useState, useCallback, useEffect } from 'react'
import { api } from '../api/client'
import { FORWARD_MAP } from '../constants/statuses'

/**
 * Manages all candidate state and mutation handlers.
 * Data is fetched from the PostgreSQL backend via REST API.
 */
export function useCandidates(showToast) {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ── Fetch candidates on mount + refetch on window focus ───────────────────
  const fetchCandidates = useCallback(() => {
    api.getCandidates()
      .then((data) => setCandidates(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchCandidates()
    window.addEventListener('focus', fetchCandidates)
    return () => window.removeEventListener('focus', fetchCandidates)
  }, [fetchCandidates])

  const updateCandidate = useCallback((id, patch) => {
    // Optimistic UI update
    setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
    // Persist to backend
    api.updateCandidate(id, patch).catch((err) => {
      showToast(`Error: ${err.message}`)
      // Revert on failure
      api.getCandidates().then(setCandidates)
    })
  }, [showToast])

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

  const handleReject = useCallback(
    (candidate) => {
      updateCandidate(candidate.id, { status: 'Reject' })
      showToast(`${candidate.name} → Reject`)
    },
    [updateCandidate, showToast]
  )

  const handleSchedule = useCallback(
    (candidate, interviewData) => {
      api.createInterview(candidate.id, interviewData)
        .then(() => fetchCandidates())
        .catch((err) => { showToast(`Error saving interview: ${err.message}`) })

      // Build a Google Calendar event URL for all interview types
      const typeLabel = interviewData.type === 'Video Call' ? '🎥 Video Call'
        : interviewData.type === 'Phone' ? '📞 Phone Interview'
        : '🏢 In-Person Interview'
      const title   = encodeURIComponent(`Interview – ${candidate.name} (${candidate.role})`)
      const details = encodeURIComponent(
        `Interview Type: ${typeLabel}\nCandidate: ${candidate.name}\nRole: ${candidate.role}\nEmail: ${candidate.email || 'N/A'}\n\nScheduled via AI-Powered Resume Screening dashboard.`
      )
      const guests   = candidate.email ? encodeURIComponent(candidate.email) : ''
      const startStr = `${interviewData.date.replace(/-/g, '')}T${interviewData.time.replace(':', '')}00`
      const [h, m]   = interviewData.time.split(':').map(Number)
      const endH     = String(h + 1).padStart(2, '0')
      const endStr   = `${interviewData.date.replace(/-/g, '')}T${endH}${String(m).padStart(2, '0')}00`
      const calUrl   = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&add=${guests}&sf=true&output=xml`
      window.open(calUrl, '_blank')
      showToast(`Calendar event created for ${candidate.name}`)
    },
    [updateCandidate, showToast]
  )

  const handleVideo = useCallback(
    () => {
      // Opens a real Google Meet — user copies the link from there
      window.open('https://meet.google.com/new', '_blank')
    },
    []
  )

  const handleDelete = useCallback(
    (candidate, clearFromSelection) => {
      // Optimistic UI update
      setCandidates((prev) => prev.filter((c) => c.id !== candidate.id))
      clearFromSelection(candidate.id)
      showToast(`${candidate.name} archived`)
      // Persist to backend
      api.deleteCandidate(candidate.id).catch((err) => {
        showToast(`Error: ${err.message}`)
        api.getCandidates().then(setCandidates)
      })
    },
    [showToast]
  )

  const applySentQuestions = useCallback((selectedIds, previewMap) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (!selectedIds.has(c.id) || c.status !== 'Screen') return c
        const questions = previewMap[c.role] ?? []
        const updated = { ...c, sentQuestions: [...(c.sentQuestions ?? []), ...questions] }
        // Persist to sent_questions table
        const questionIds = questions.map((q) => q.id).filter(Boolean)
        if (questionIds.length) {
          api.createSentQuestions(c.id, questionIds).catch(() => {})
        }
        return updated
      })
    )
  }, [])

  const updateAssessment = useCallback((candidateId, questionId, { score, notes }) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id !== candidateId) return c
        const existing = c.assessments ?? []
        const idx = existing.findIndex((a) => a.questionId === questionId)
        const updated =
          idx >= 0
            ? existing.map((a, i) => (i === idx ? { ...a, score, notes } : a))
            : [...existing, { questionId, score, notes }]
        return { ...c, assessments: updated }
      })
    )
    // Persist to assessments table via upsert
    api.upsertAssessment(candidateId, { questionId, score, notes }).catch(() => {})
  }, [])

  const handleMeetLinkSaved = useCallback((id, meetLink) => {
    setCandidates((prev) => prev.map((c) => c.id === id ? { ...c, meetLink } : c))
  }, [])

  const handleInterviewDeleted = useCallback((id) => {
    setCandidates((prev) => prev.map((c) => c.id === id ? { ...c, interviewDate: null, interviewTime: null, interviewType: null, meetLink: null } : c))
  }, [])

  return {
    candidates,
    loading,
    error,
    refetch: fetchCandidates,
    handleStatusChange,
    handleForward,
    handleReject,
    handleSchedule,
    handleVideo,
    handleDelete,
    handleMeetLinkSaved,
    handleInterviewDeleted,
    applySentQuestions,
    updateAssessment,
  }
}
