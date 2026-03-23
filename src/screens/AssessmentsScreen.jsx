import { useState } from 'react'
import { STATUS_META } from '../constants/statuses'
import { AssessmentDetailPanel } from '../components/assessments/AssessmentDetailPanel'

const ASSESSMENT_TYPE = {
  'Senior Frontend Engineer': 'Technical',
  'Data Scientist':           'Technical',
  'DevOps Engineer':          'Technical',
  'Product Manager':          'Psychometric',
}

const TYPE_META = {
  Technical:   { label: 'Technical / Coding', color: 'bg-violet-100 text-violet-700', dot: 'bg-violet-400' },
  Psychometric: { label: 'Psychometric',       color: 'bg-amber-100  text-amber-700',  dot: 'bg-amber-400'  },
}

function scoreLabel(avg) {
  if (avg === null) return { label: 'Pending',  color: 'text-gray-400' }
  if (avg >= 4)     return { label: 'Strong',   color: 'text-green-600' }
  if (avg >= 3)     return { label: 'Average',  color: 'text-yellow-600' }
  return              { label: 'Weak',     color: 'text-red-500' }
}

function avgScore(assessments) {
  if (!assessments?.length) return null
  const scored = assessments.filter((a) => a.score !== null)
  if (!scored.length) return null
  return scored.reduce((s, a) => s + a.score, 0) / scored.length
}

export function AssessmentsScreen({ candidates, onUpdateAssessment }) {
  const [selected, setSelected] = useState(null)

  // Only candidates who have been sent questions
  const assessed = candidates.filter((c) => c.sentQuestions?.length > 0)

  const selectedCandidate = assessed.find((c) => c.id === selected) ?? null

  return (
    <div className="flex flex-1 min-h-0">
      {/* ── Left: candidate list ─────────────────────────────── */}
      <div className="w-80 shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">Assessments</h2>
          <p className="text-xs text-gray-400 mt-0.5">{assessed.length} candidate{assessed.length !== 1 ? 's' : ''} assessed</p>
        </div>

        {assessed.length === 0 ? (
          <p className="text-sm text-gray-400 text-center mt-16 px-6">
            No candidates have been sent questions yet.
          </p>
        ) : (
          <ul>
            {assessed.map((c) => {
              const type  = ASSESSMENT_TYPE[c.role] ?? 'Technical'
              const meta  = TYPE_META[type]
              const avg   = avgScore(c.assessments)
              const score = scoreLabel(avg)
              const statusMeta = STATUS_META[c.status]
              const answered = (c.assessments ?? []).filter((a) => a.score !== null).length
              const total    = c.sentQuestions?.length ?? 0

              return (
                <li key={c.id}>
                  <button
                    onClick={() => setSelected(c.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      selected === c.id ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-gray-900">{c.name}</p>
                          <p className="text-[10px] text-gray-400">{c.role}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-semibold shrink-0 ${score.color}`}>{score.label}</span>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
                        {meta.label}
                      </span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusMeta.bg} ${statusMeta.text}`}>
                        {statusMeta.label}
                      </span>
                      <span className="ml-auto text-[10px] text-gray-400">{answered}/{total} scored</span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* ── Right: detail panel ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {selectedCandidate ? (
          <AssessmentDetailPanel
            candidate={selectedCandidate}
            assessmentType={ASSESSMENT_TYPE[selectedCandidate.role] ?? 'Technical'}
            onUpdateAssessment={onUpdateAssessment}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm font-medium">Select a candidate to review their assessment</p>
          </div>
        )}
      </div>
    </div>
  )
}
