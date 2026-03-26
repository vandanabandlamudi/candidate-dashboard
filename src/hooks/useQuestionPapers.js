import { useState, useEffect } from 'react'
import { api } from '../api/client'

export function useQuestionPapers() {
  const [papers,      setPapers]      = useState([])
  const [submissions, setSubmissions] = useState({})

  // ── Load papers from DB on mount ──────────────────────────────────────────
  useEffect(() => {
    api.getPapers()
      .then((rows) => setPapers(rows))
      .catch(() => {}) // fail silently — papers stay empty
  }, [])

  const addPaper = (paper) => {
    const newPaper = { ...paper, id: `paper_${Date.now()}` }
    setPapers((prev) => [...prev, newPaper])
    api.createPaper(newPaper).catch(() => {})
  }

  const updatePaper = (paperId, patch) => {
    setPapers((prev) => prev.map((p) => (p.id === paperId ? { ...p, ...patch } : p)))
    api.updatePaper(paperId, patch).catch(() => {})
  }

  const deletePaper = (paperId) => {
    setPapers((prev) => prev.filter((p) => p.id !== paperId))
    api.deletePaper(paperId).catch(() => {})
  }

  const submitPaper = (candidateId, paperId, answers, correctionMode = 'auto') => {
    const paper = papers.find((p) => p.id === paperId)
    if (!paper) return

    let autoScore = 0
    let autoMax   = 0

    const gradedAnswers = paper.questions.map((q) => {
      const answer = answers[q.id] ?? null
      const marks  = q.marks ?? 1

      if (correctionMode === 'auto' && q.type === 'mcq') {
        autoMax += marks
        const correct = answer === q.correctOption
        autoScore += correct ? marks : 0
        return { questionId: q.id, answer, correct, autoGraded: true, marks: correct ? marks : 0, maxMarks: marks }
      }

      return { questionId: q.id, answer, correct: null, autoGraded: false, marks: null, maxMarks: marks }
    })

    setSubmissions((prev) => ({
      ...prev,
      [candidateId]: {
        ...(prev[candidateId] ?? {}),
        [paperId]: {
          paperId,
          candidateId,
          correctionMode,
          submittedAt: new Date().toISOString(),
          answers: gradedAnswers,
          autoScore,
          autoMax,
          totalMax: paper.questions.reduce((s, q) => s + (q.marks ?? 1), 0),
          manualScores: {},
        },
      },
    }))
  }

  const manualGrade = (candidateId, paperId, questionId, marks) => {
    setSubmissions((prev) => {
      const sub = prev[candidateId]?.[paperId]
      if (!sub) return prev
      const manualScores = { ...sub.manualScores, [questionId]: marks }
      const manualTotal  = Object.values(manualScores).reduce((s, m) => s + (m ?? 0), 0)
      return {
        ...prev,
        [candidateId]: {
          ...prev[candidateId],
          [paperId]: { ...sub, manualScores, manualTotal },
        },
      }
    })
  }

  const getSubmission = (candidateId, paperId) => submissions[candidateId]?.[paperId] ?? null

  return { papers, addPaper, updatePaper, deletePaper, submitPaper, manualGrade, getSubmission, submissions }
}
