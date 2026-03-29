import { useState } from 'react'
import { STATUS_META } from '../constants/statuses'
import { AssessmentDetailPanel } from '../components/assessments/AssessmentDetailPanel'
import { fmtDate } from '../utils/helpers'

const ASSESSMENT_TYPE = {
  'Senior Frontend Engineer': 'Technical',
  'Data Scientist':           'Technical',
  'DevOps Engineer':          'Technical',
  'Product Manager':          'Psychometric',
}

const TYPE_META = {
  Technical:    { label: 'Technical / Coding', color: 'bg-violet-100 text-violet-700' },
  Psychometric: { label: 'Psychometric',        color: 'bg-amber-100  text-amber-700'  },
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

export function AssessmentsScreen({ candidates, loading, onUpdateAssessment, pendingTokens = [] }) {
  const [tab,      setTab]     = useState('questionnaire')
  const [selected, setSelected] = useState(null)

  // ── Questionnaire tab ──────────────────────────────────────────────────────
  const assessed = candidates.filter((c) => c.sentQuestions?.length > 0)
  const selectedCandidate = assessed.find((c) => c.id === selected) ?? null

  const switchTab = (t) => { setTab(t); setSelected(null) }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mr-3" />
      <p className="text-sm font-medium">Loading candidates…</p>
    </div>
  )

  return (
    <div className="flex flex-1 min-h-0">
      {/* ── Left panel ───────────────────────────────────────── */}
      <div className={`${selected ? 'hidden md:flex' : 'flex'} w-full md:w-80 md:shrink-0 border-r border-gray-200 bg-white flex-col`}>
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => switchTab('questionnaire')}
              className={`flex-1 text-[10px] font-semibold px-2 py-1 rounded-md transition-colors ${
                tab === 'questionnaire' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Questionnaire
            </button>
            <button
              onClick={() => switchTab('mcq')}
              className={`flex-1 text-[10px] font-semibold px-2 py-1 rounded-md transition-colors ${
                tab === 'mcq' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              MCQ Tests
              {pendingTokens.length > 0 && (
                <span className="ml-1 bg-amber-400 text-white rounded-full px-1.5 py-0.5 text-[9px] font-bold">
                  {pendingTokens.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* ── Questionnaire list ── */}
          {tab === 'questionnaire' && (
            assessed.length === 0 ? (
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
            )
          )}

          {/* ── Active MCQ tests (pending) list ── */}
          {tab === 'mcq' && (
            pendingTokens.length === 0 ? (
              <div className="text-center mt-16 px-6">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-sm text-gray-500 font-medium">No pending tests</p>
                <p className="text-xs text-gray-400 mt-1">All assigned tests have been submitted.</p>
              </div>
            ) : (
              <ul>
                {pendingTokens.map((t) => (
                  <li key={t.token}>
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {t.candidate_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </span>
                          <div>
                            <p className="text-xs font-semibold text-gray-900">{t.candidate_name}</p>
                            <p className="text-[10px] text-gray-400 truncate max-w-[160px]">{t.paper_title}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                          Awaiting
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-gray-400">
                          Sent {fmtDate(t.created_at)}
                        </span>
                        <button
                          onClick={() => navigator.clipboard.writeText(`${window.location.origin}?token=${t.token}`)}
                          className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium"
                        >
                          Copy link
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      </div>

      {/* ── Right panel ──────────────────────────────────────── */}
      <div className={`${selected ? 'flex' : 'hidden md:flex'} flex-1 flex-col overflow-y-auto bg-gray-50`}>
        {/* Back button — mobile only */}
        {selected && (
          <button
            onClick={() => setSelected(null)}
            className="md:hidden flex items-center gap-2 px-4 py-3 text-xs font-medium text-indigo-600 border-b border-gray-200 bg-white"
          >
            ← Back to list
          </button>
        )}
        {tab === 'questionnaire' && (
          selectedCandidate ? (
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
          )
        )}

        {tab === 'mcq' && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="text-4xl mb-3">⏳</p>
            <p className="text-sm font-medium text-gray-500">Waiting for candidates to submit</p>
            <p className="text-xs mt-1">Completed results appear in each candidate's profile</p>
          </div>
        )}
      </div>
    </div>
  )
}
