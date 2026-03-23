import { useState } from 'react'

const SCORE_OPTIONS = [
  { value: 5, label: 'Excellent', color: 'bg-green-500' },
  { value: 4, label: 'Good',      color: 'bg-lime-500'  },
  { value: 3, label: 'Average',   color: 'bg-yellow-400' },
  { value: 2, label: 'Below Avg', color: 'bg-orange-400' },
  { value: 1, label: 'Poor',      color: 'bg-red-500'   },
]

const TYPE_CONFIG = {
  Technical: {
    label:    'Technical / Coding Assessment',
    sections: ['Problem Solving', 'Code Quality', 'Efficiency', 'Communication'],
    color:    'indigo',
  },
  Psychometric: {
    label:    'Psychometric Assessment',
    sections: ['Personality Fit', 'Behavioural Traits', 'Situational Judgement', 'Cultural Alignment'],
    color:    'amber',
  },
}

function ScoreDots({ score }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((v) => (
        <span
          key={v}
          className={`w-2 h-2 rounded-full ${v <= (score ?? 0) ? 'bg-indigo-500' : 'bg-gray-200'}`}
        />
      ))}
    </div>
  )
}

function overallScore(assessments, questions) {
  if (!assessments?.length || !questions?.length) return null
  const scored = questions.map((q) => assessments.find((a) => a.questionId === q.id)).filter((a) => a?.score != null)
  if (!scored.length) return null
  const avg = scored.reduce((s, a) => s + a.score, 0) / scored.length
  return avg
}

function resultBadge(avg) {
  if (avg === null) return { label: 'Pending',     bg: 'bg-gray-100',   text: 'text-gray-500' }
  if (avg >= 4.5)   return { label: 'Outstanding', bg: 'bg-green-100',  text: 'text-green-700' }
  if (avg >= 3.5)   return { label: 'Strong',      bg: 'bg-lime-100',   text: 'text-lime-700' }
  if (avg >= 2.5)   return { label: 'Average',     bg: 'bg-yellow-100', text: 'text-yellow-700' }
  return               { label: 'Weak',         bg: 'bg-red-100',    text: 'text-red-600' }
}

export function AssessmentDetailPanel({ candidate, assessmentType, onUpdateAssessment }) {
  const config   = TYPE_CONFIG[assessmentType] ?? TYPE_CONFIG.Technical
  const questions = candidate.sentQuestions ?? []
  const assessments = candidate.assessments ?? []

  const [notes, setNotes] = useState(() => {
    const map = {}
    assessments.forEach((a) => { map[a.questionId] = a.notes ?? '' })
    return map
  })

  const getAssessment = (qId) => assessments.find((a) => a.questionId === qId)

  const setScore = (qId, score) => {
    onUpdateAssessment(candidate.id, qId, { score, notes: notes[qId] ?? '' })
  }

  const saveNote = (qId) => {
    const existing = getAssessment(qId)
    onUpdateAssessment(candidate.id, qId, { score: existing?.score ?? null, notes: notes[qId] ?? '' })
  }

  const avg    = overallScore(assessments, questions)
  const result = resultBadge(avg)
  const scored = questions.filter((q) => getAssessment(q.id)?.score != null).length

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
      {/* Candidate header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center shrink-0">
            {candidate.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </span>
          <div>
            <h2 className="text-base font-bold text-gray-900">{candidate.name}</h2>
            <p className="text-xs text-gray-500">{candidate.role} · {candidate.company}</p>
            <p className="text-xs text-indigo-500 mt-0.5">{config.label}</p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${result.bg} ${result.text}`}>
            {result.label}
          </span>
          <p className="text-[10px] text-gray-400 mt-1.5">
            {scored}/{questions.length} questions scored
            {avg !== null && <span className="ml-1">· avg {avg.toFixed(1)}/5</span>}
          </p>
        </div>
      </div>

      {/* Section tags */}
      <div className="flex flex-wrap gap-2">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider self-center mr-1">Evaluating:</span>
        {config.sections.map((s) => (
          <span key={s} className="text-xs bg-indigo-50 text-indigo-600 font-medium px-3 py-1 rounded-full">{s}</span>
        ))}
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, i) => {
          const assessment = getAssessment(q.id)
          const currentScore = assessment?.score ?? null

          return (
            <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 space-y-3">
              {/* Question */}
              <div className="flex gap-3 items-start">
                <span className="text-xs font-bold text-indigo-400 mt-0.5 w-5 shrink-0">Q{i + 1}</span>
                <p className="text-sm text-gray-800 leading-relaxed">{q.text}</p>
              </div>

              {/* Score selector */}
              <div className="flex items-center gap-2 pl-8">
                <span className="text-xs text-gray-400 mr-1">Score:</span>
                {SCORE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setScore(q.id, opt.value)}
                    title={opt.label}
                    className={`w-7 h-7 rounded-lg text-[10px] font-bold text-white transition-all ${
                      currentScore === opt.value
                        ? `${opt.color} ring-2 ring-offset-1 ring-indigo-400 scale-110`
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {opt.value}
                  </button>
                ))}
                {currentScore !== null && (
                  <span className="ml-2 text-xs text-gray-400">
                    {SCORE_OPTIONS.find((o) => o.value === currentScore)?.label}
                  </span>
                )}
                <ScoreDots score={currentScore} />
              </div>

              {/* Notes */}
              <div className="pl-8">
                <textarea
                  rows={2}
                  placeholder="Add notes…"
                  value={notes[q.id] ?? ''}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  onBlur={() => saveNote(q.id)}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 text-gray-700 placeholder-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Overall result footer */}
      {avg !== null && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-700">Overall Assessment Result</p>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {[1,2,3,4,5].map((v) => (
                <span key={v} className={`w-3 h-3 rounded-full ${v <= Math.round(avg) ? 'bg-indigo-500' : 'bg-gray-200'}`} />
              ))}
            </div>
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${result.bg} ${result.text}`}>
              {result.label} · {avg.toFixed(1)}/5
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
