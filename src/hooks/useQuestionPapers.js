import { useState } from 'react'

export function useQuestionPapers() {
  const [papers, setPapers] = useState([])
  const [submissions, setSubmissions] = useState({})

  const addPaper = (paper) => {
    setPapers((prev) => [...prev, { ...paper, id: `paper_${Date.now()}` }])
  }

  const updatePaper = (paperId, patch) => {
    setPapers((prev) => prev.map((p) => (p.id === paperId ? { ...p, ...patch } : p)))
  }

  const deletePaper = (paperId) => {
    setPapers((prev) => prev.filter((p) => p.id !== paperId))
  }

  /**
   * Submit a candidate's answers.
   * correctionMode: 'auto' → MCQs graded immediately, 'manual' → all left for reviewer
   */
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

      // manual mode OR open-ended → pending review
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
          manualScores: {}, // { questionId: marks } — filled by reviewer
        },
      },
    }))
  }

  /**
   * Reviewer manually sets marks for a question (used in manual correction mode).
   */
  const manualGrade = (candidateId, paperId, questionId, marks) => {
    setSubmissions((prev) => {
      const sub = prev[candidateId]?.[paperId]
      if (!sub) return prev
      const manualScores = { ...sub.manualScores, [questionId]: marks }
      const totalManual  = Object.values(manualScores).reduce((s, m) => s + (m ?? 0), 0)
      return {
        ...prev,
        [candidateId]: {
          ...prev[candidateId],
          [paperId]: { ...sub, manualScores, manualTotal: totalManual },
        },
      }
    })
  }

  const getSubmission = (candidateId, paperId) => submissions[candidateId]?.[paperId] ?? null

  return { papers, addPaper, updatePaper, deletePaper, submitPaper, manualGrade, getSubmission, submissions }
}
