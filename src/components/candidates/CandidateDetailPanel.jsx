import { useState } from 'react'
import { STATUS_META, FORWARD_MAP } from '../../constants/statuses'
import { StatusDropdown } from '../common/StatusDropdown'
import { fmtDate } from '../../utils/helpers'

const TABS = ['Profile', 'Interviews', 'Assessments', 'Questions']

function resultMeta(pct) {
  if (pct >= 85) return { label: 'Outstanding', bg: 'bg-green-100',  text: 'text-green-700'  }
  if (pct >= 70) return { label: 'Strong',      bg: 'bg-lime-100',   text: 'text-lime-700'   }
  if (pct >= 50) return { label: 'Average',     bg: 'bg-yellow-100', text: 'text-yellow-700' }
  return              { label: 'Needs Work',  bg: 'bg-red-100',    text: 'text-red-600'    }
}

export function CandidateDetailPanel({
  candidate,
  submissions = {},
  papers = [],
  pendingTokens = [],
  onRenewToken,
  onClose,
  onStatusChange,
  onForward,
  onReject,
  onSchedule,
  onDelete,
  onViewQuestions,
}) {
  const [tab,        setTab]        = useState('Profile')
  const [renewState, setRenewState] = useState({}) // { [paperId]: { loading, url, copied } }

  if (!candidate) return null

  const meta       = STATUS_META[candidate.status] ?? {}
  const initials   = candidate.name.split(' ').map((n) => n[0]).join('').slice(0, 2)
  const nextStatus = FORWARD_MAP[candidate.status]
  const hasQuestions = candidate.sentQuestions?.length > 0

  // For exclusively-MCQ submissions: determine if the button should say "Reject"
  const candidateSubs = submissions[candidate.id] ?? {}
  const exclusiveMcqSubs = Object.values(candidateSubs).filter(
    (sub) => sub.autoMax > 0 && sub.autoMax === sub.totalMax
  )
  const bestMcqPct = exclusiveMcqSubs.length > 0
    ? Math.max(...exclusiveMcqSubs.map((sub) => sub.autoScore / sub.autoMax))
    : null
  const showReject = bestMcqPct !== null && bestMcqPct < 0.8

  // Pipeline steps in order
  const pipeline = Object.keys(STATUS_META)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl flex flex-col bg-white shadow-2xl">

        {/* ── Header ── */}
        <div className="bg-indigo-700 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
              {initials}
            </div>
            <div>
              <h2 className="text-white font-bold text-base leading-tight">{candidate.name}</h2>
              <p className="text-indigo-200 text-xs">{candidate.title} · {candidate.company}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusDropdown currentStatus={candidate.status} onChange={(s) => onStatusChange(candidate.id, s)} />
            <button
              onClick={onClose}
              className="ml-2 text-white/70 hover:text-white text-xl leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Pipeline bar ── */}
        <div className="bg-indigo-50 border-b border-indigo-100 px-4 py-3 overflow-x-auto shrink-0">
          <div className="flex items-center min-w-max">
            {pipeline.map((s, i) => {
              const m       = STATUS_META[s]
              const isActive = s === candidate.status
              const isPast   = m.order < (STATUS_META[candidate.status]?.order ?? -1)
              return (
                <div key={s} className="flex items-center">
                  <button
                    onClick={() => onStatusChange(candidate.id, s)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap
                      ${isActive ? `${m.bg} ${m.text} ring-2 ring-offset-1 ${m.border}` : ''}
                      ${isPast  ? 'bg-indigo-100 text-indigo-500' : ''}
                      ${!isActive && !isPast ? 'bg-white text-gray-400 border border-gray-200' : ''}
                    `}
                  >
                    {(isActive || isPast) && <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />}
                    {m.label}
                  </button>
                  {i < pipeline.length - 1 && (
                    <span className="mx-1 text-gray-300 text-xs">›</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-gray-100 px-6 shrink-0">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {tab === 'Profile' && (
            <div className="space-y-5">
              {/* Contact */}
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Contact</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 mb-0.5">Email</p>
                    <p className="text-sm text-gray-800 font-medium break-all">{candidate.email}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 mb-0.5">Phone</p>
                    <p className="text-sm text-gray-800 font-medium">{candidate.phone}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 mb-0.5">Applied</p>
                    <p className="text-sm text-gray-800 font-medium">{fmtDate(candidate.appliedDate)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 mb-0.5">Experience</p>
                    <p className="text-sm text-gray-800 font-medium">{candidate.exp} years</p>
                  </div>
                </div>
              </section>

              {/* Role */}
              <section>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Role Applied</h3>
                <div className="bg-indigo-50 rounded-xl p-3">
                  <p className="text-sm text-indigo-800 font-semibold">{candidate.role}</p>
                </div>
              </section>

              {/* Summary */}
              {candidate.summary && (
                <section>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Summary</h3>
                  <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-3">{candidate.summary}</p>
                </section>
              )}

              {/* Skills */}
              {candidate.skills?.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.skills.map((s) => (
                      <span key={s} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-lg">{s}</span>
                    ))}
                  </div>
                </section>
              )}

            </div>
          )}

          {tab === 'Interviews' && (
            <div className="space-y-4">
              {candidate.interview ? (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-blue-800">Scheduled Interview</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-[10px] text-blue-400 mb-0.5">Date</p>
                      <p className="text-sm text-blue-900 font-medium">{fmtDate(candidate.interview.date)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-blue-400 mb-0.5">Time</p>
                      <p className="text-sm text-blue-900 font-medium">{candidate.interview.time}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-blue-400 mb-0.5">Type</p>
                      <p className="text-sm text-blue-900 font-medium">{candidate.interview.type}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-3xl mb-2">🗓</p>
                  <p className="text-sm">No interview scheduled yet</p>
                  <button
                    onClick={() => { onSchedule(candidate); onClose() }}
                    className="mt-3 text-xs bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    Schedule Interview
                  </button>
                </div>
              )}

              {/* Move forward */}
              {nextStatus && (
                <div className="border-t border-gray-100 pt-4">
                  <button
                    onClick={() => { onForward(candidate); onClose() }}
                    className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    Move to {nextStatus} →
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'Assessments' && (() => {
            const sentQuestions  = candidate.sentQuestions ?? []
            const assessments    = candidate.assessments ?? []
            const candidateSubs  = submissions[candidate.id] ?? {}
            const subEntries     = Object.entries(candidateSubs).map(([paperId, sub]) => ({
              paper: papers.find((p) => p.id === paperId), sub,
            })).filter((e) => e.paper)
            const myPending      = pendingTokens.filter((t) => String(t.candidate_id) === String(candidate.id))

            const hasQuestionnaire = sentQuestions.length > 0
            const hasMcq           = subEntries.length > 0
            const hasTestPapers    = myPending.length > 0 || subEntries.length > 0

            if (!hasQuestionnaire && !hasTestPapers) {
              return (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-3xl mb-2">📊</p>
                  <p className="text-sm">No assessments yet</p>
                </div>
              )
            }

            const handleRenew = async (paperId) => {
              setRenewState((prev) => ({ ...prev, [paperId]: { loading: true } }))
              try {
                const { url } = await onRenewToken(paperId, candidate.id)
                setRenewState((prev) => ({ ...prev, [paperId]: { loading: false, url, copied: false } }))
              } catch {
                setRenewState((prev) => ({ ...prev, [paperId]: { loading: false } }))
              }
            }

            const handleCopy = (paperId, url) => {
              navigator.clipboard.writeText(url)
              setRenewState((prev) => ({ ...prev, [paperId]: { ...prev[paperId], copied: true } }))
              setTimeout(() => setRenewState((prev) => ({ ...prev, [paperId]: { ...prev[paperId], copied: false } })), 2000)
            }

            const SCORE_LABEL = { 5: 'Excellent', 4: 'Good', 3: 'Average', 2: 'Below Avg', 1: 'Poor' }
            const SCORE_COLOR = {
              5: 'bg-green-100 text-green-700', 4: 'bg-lime-100 text-lime-700',
              3: 'bg-yellow-100 text-yellow-700', 2: 'bg-orange-100 text-orange-700',
              1: 'bg-red-100 text-red-600',
            }

            return (
              <div className="space-y-5">

                {/* ── Test Papers section ── */}
                {hasTestPapers && (
                  <section>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Test Papers</h3>
                    <div className="space-y-2">
                      {myPending.map((t) => {
                        const rs  = renewState[t.paper_id] ?? {}
                        const url = rs.url ?? `${window.location.origin}?token=${t.token}`
                        return (
                          <div key={t.paper_id} className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-xs font-semibold text-gray-900 leading-snug">{t.paper_title}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Sent {fmtDate(t.created_at)}</p>
                              </div>
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">Awaiting</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleCopy(t.paper_id, url)}
                                className="flex-1 text-[10px] font-semibold text-indigo-600 bg-white border border-indigo-200 px-2 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                              >
                                {rs.copied ? '✓ Copied!' : 'Copy link'}
                              </button>
                              <button
                                onClick={() => handleRenew(t.paper_id)}
                                disabled={rs.loading}
                                className="flex-1 text-[10px] font-semibold text-white bg-indigo-600 px-2 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60"
                              >
                                {rs.loading ? 'Renewing…' : 'Renew link'}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                      {subEntries.map(({ paper, sub }) => {
                        const pct = sub.autoMax > 0 ? Math.round((sub.autoScore / sub.autoMax) * 100) : null
                        return (
                          <div key={paper.id} className="bg-green-50 border border-green-200 rounded-xl p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-xs font-semibold text-gray-900 leading-snug">{paper.title}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Submitted {fmtDate(sub.submittedAt)}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Submitted</span>
                                {pct !== null && <span className="text-[10px] font-bold text-gray-700">{pct}%</span>}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )}

                {/* ── Questionnaire section ── */}
                {hasQuestionnaire && (
                  <section>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Questionnaire</h3>
                    <div className="space-y-2">
                      {sentQuestions.map((q, i) => {
                        const a = assessments.find((x) => x.questionId === q.id)
                        return (
                          <div key={q.id ?? i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 space-y-2">
                            <div className="flex gap-3 items-start">
                              <span className="text-xs font-bold text-indigo-400 shrink-0 mt-0.5">Q{i + 1}</span>
                              <p className="text-sm text-gray-800 leading-relaxed flex-1">{q.text}</p>
                              {a?.score != null && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${SCORE_COLOR[a.score] ?? 'bg-gray-100 text-gray-600'}`}>
                                  {a.score}/5 · {SCORE_LABEL[a.score]}
                                </span>
                              )}
                              {a?.score == null && (
                                <span className="text-[10px] text-gray-300 shrink-0">Not scored</span>
                              )}
                            </div>
                            {a?.notes && (
                              <p className="text-xs text-gray-500 pl-6 italic">{a.notes}</p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )}

                {/* ── MCQ test results section ── */}
                {hasMcq && (
                  <section>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">MCQ Tests</h3>
                    <div className="space-y-3">
                      {subEntries.map(({ paper, sub }) => {
                        const pct     = sub.autoMax > 0 ? Math.round((sub.autoScore / sub.autoMax) * 100) : null
                        const meta    = pct !== null ? resultMeta(pct) : null
                        const correct = sub.answers.filter((a) => a.autoGraded && a.correct).length
                        const wrong   = sub.answers.filter((a) => a.autoGraded && !a.correct).length

                        return (
                          <div key={paper.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{paper.title}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{fmtDate(sub.submittedAt)}</p>
                              </div>
                              {pct !== null && meta && (
                                <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${meta.bg} ${meta.text}`}>
                                  {pct}% · {meta.label}
                                </span>
                              )}
                            </div>
                            {pct !== null && (
                              <div>
                                <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                  <span>{sub.autoScore} / {sub.autoMax} marks</span>
                                  <span>{sub.answers.length} questions</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-400' : 'bg-red-500'}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            )}
                            <div className="flex gap-3">
                              <span className="text-xs text-gray-600">✅ <span className="font-semibold text-green-700">{correct}</span> correct</span>
                              <span className="text-xs text-gray-600">❌ <span className="font-semibold text-red-600">{wrong}</span> wrong</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {sub.answers.map((a, i) => (
                                <span
                                  key={a.questionId}
                                  title={`Q${i + 1}`}
                                  className={`w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center ${
                                    !a.autoGraded ? 'bg-gray-100 text-gray-400'
                                    : a.correct    ? 'bg-green-100 text-green-700'
                                    :                'bg-red-100 text-red-600'
                                  }`}
                                >
                                  {i + 1}
                                </span>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )}

              </div>
            )
          })()}

          {tab === 'Questions' && (() => {
            const subEntries = Object.entries(submissions[candidate.id] ?? {})
              .map(([paperId, sub]) => ({ paper: papers.find((p) => p.id === paperId), sub }))
              .filter((e) => e.paper)
            const hasAnything = hasQuestions || subEntries.length > 0

            if (!hasAnything) return (
              <div className="text-center py-10 text-gray-400">
                <p className="text-3xl mb-2">📋</p>
                <p className="text-sm">No questions sent yet</p>
              </div>
            )

            return (
              <div className="space-y-6">
                {/* ── MCQ submissions ── */}
                {subEntries.map(({ paper, sub }) => (
                  <section key={paper.id}>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                      {paper.title}
                    </h3>
                    <div className="space-y-3">
                      {paper.questions.map((q, i) => {
                        const ans = sub.answers.find((a) => String(a.questionId) === String(q.id))
                        const chosen = ans?.answer ?? null
                        return (
                          <div key={q.id ?? i} className="bg-white border border-gray-100 rounded-xl p-3 space-y-2 shadow-sm">
                            <div className="flex gap-2 items-start">
                              <span className="text-xs font-bold text-indigo-400 shrink-0 mt-0.5">Q{i + 1}</span>
                              <p className="text-sm text-gray-800 flex-1">{q.text}</p>
                              {ans?.autoGraded && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ans.correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                  {ans.correct ? 'Correct' : 'Wrong'}
                                </span>
                              )}
                            </div>
                            {q.options && (
                              <div className="pl-6 grid grid-cols-1 gap-1">
                                {q.options.map((opt, oi) => {
                                  const isChosen  = chosen === oi
                                  const isCorrect = q.correctOption === oi
                                  return (
                                    <div
                                      key={oi}
                                      className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg ${
                                        isChosen && isCorrect ? 'bg-green-100 text-green-800 font-medium'
                                        : isChosen            ? 'bg-red-100 text-red-700 font-medium'
                                        : isCorrect           ? 'bg-green-50 text-green-700'
                                        :                       'text-gray-500'
                                      }`}
                                    >
                                      <span className="font-bold shrink-0">{String.fromCharCode(65 + oi)}.</span>
                                      <span>{opt}</span>
                                      {isChosen  && <span className="ml-auto text-[10px]">{isCorrect ? '✓ chosen' : '✗ chosen'}</span>}
                                      {!isChosen && isCorrect && <span className="ml-auto text-[10px] text-green-600">correct</span>}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </section>
                ))}

                {/* ── Sent questionnaire ── */}
                {hasQuestions && (
                  <section>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Questionnaire</h3>
                    <div className="space-y-2">
                      {candidate.sentQuestions.map((q, i) => (
                        <div key={q.id ?? i} className="bg-gray-50 rounded-xl p-3 flex gap-3">
                          <span className="text-xs font-bold text-indigo-400 shrink-0 mt-0.5">Q{i + 1}</span>
                          <p className="text-sm text-gray-700">{q.text}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )
          })()}
        </div>

        {/* ── Footer actions ── */}
        <div className="border-t border-gray-100 px-6 py-3 flex items-center justify-between bg-gray-50 shrink-0">
          <button
            onClick={() => { onDelete(candidate); onClose() }}
            className="text-xs text-red-500 hover:text-red-700 font-medium"
          >
            Archive candidate
          </button>
          <div className="flex gap-2">
            {showReject ? (
              <button
                onClick={() => { onReject(candidate); onClose() }}
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Reject
              </button>
            ) : (
              nextStatus && (
                <button
                  onClick={() => { onForward(candidate); onClose() }}
                  className="text-xs bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Move to {nextStatus} →
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </>
  )
}
