import { useState, useEffect } from 'react'
import { api } from '../api/client'

export function useQuestionPapers() {
  const [papers,        setPapers]        = useState([])
  const [submissions,   setSubmissions]   = useState({})
  const [pendingTokens, setPendingTokens] = useState([])

  // ── Load papers and submissions from DB on mount ──────────────────────────
  useEffect(() => {
    api.getPapers()
      .then((rows) => setPapers(rows))
      .catch(() => {})
    api.getAllSubmissions()
      .then((rows) => {
        const map = {}
        for (const s of rows) {
          if (!map[s.candidate_id]) map[s.candidate_id] = {}
          map[s.candidate_id][s.paper_id] = {
            paperId:        s.paper_id,
            candidateId:    s.candidate_id,
            correctionMode: s.correction_mode,
            submittedAt:    s.submitted_at,
            autoScore:      s.auto_score,
            autoMax:        s.auto_max,
            totalMax:       s.total_max,
            manualScores:   {},
            answers: s.answers.map((a) => ({
              questionId:  a.question_id,
              answer:      a.answer !== null ? (isNaN(Number(a.answer)) ? a.answer : Number(a.answer)) : null,
              correct:     a.correct,
              autoGraded:  a.auto_graded,
              marks:       a.marks,
              maxMarks:    a.max_marks,
            })),
          }
        }
        setSubmissions(map)
      })
      .catch(() => {})
    api.getPendingTokens()
      .then((rows) => setPendingTokens(rows))
      .catch(() => {})
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

    const submission = {
      paperId,
      candidateId,
      correctionMode,
      submittedAt: new Date().toISOString(),
      answers: gradedAnswers,
      autoScore,
      autoMax,
      totalMax: paper.questions.reduce((s, q) => s + (q.marks ?? 1), 0),
      manualScores: {},
    }

    setSubmissions((prev) => ({
      ...prev,
      [candidateId]: { ...(prev[candidateId] ?? {}), [paperId]: submission },
    }))

    // Persist to DB
    api.createSubmission(candidateId, submission).catch(() => {})
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

    // Persist to DB
    api.gradeSubmission(candidateId, paperId, { questionId, marks }).catch(() => {})
  }

  const getSubmission = (candidateId, paperId) => submissions[candidateId]?.[paperId] ?? null

  // ── Drive import ───────────────────────────────────────────────────────────
  const [importing,   setImporting]   = useState(false)
  const [importError, setImportError] = useState(null)

  const importFromDrive = async (role) => {
    setImporting(true)
    setImportError(null)
    try {
      const paper = await api.importPaperFromDrive(role)
      setPapers((prev) => [paper, ...prev])
      return paper
    } catch (err) {
      setImportError(err.message)
      return null
    } finally {
      setImporting(false)
    }
  }

  const renewToken = async (paperId, candidateId) => {
    const { token } = await api.assignPaper(paperId, candidateId)
    setPendingTokens((prev) => {
      const old = prev.find((t) => String(t.candidate_id) === String(candidateId) && t.paper_id === paperId)
      const rest = prev.filter((t) => !(String(t.candidate_id) === String(candidateId) && t.paper_id === paperId))
      return [{ ...old, token, created_at: new Date().toISOString() }, ...rest]
    })
    return { token, url: `${window.location.origin}?token=${token}` }
  }

  return {
    papers, addPaper, updatePaper, deletePaper, submitPaper, manualGrade, getSubmission,
    submissions, pendingTokens, renewToken,
    importFromDrive, importing, importError,
  }
}
