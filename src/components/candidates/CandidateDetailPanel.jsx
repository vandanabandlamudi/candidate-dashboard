import { useState } from 'react'
import { STATUSES, STATUS_META, FORWARD_MAP } from '../../constants/statuses'
import { StatusDropdown } from '../common/StatusDropdown'
import { fmtDate } from '../../utils/helpers'

const TABS = ['Profile', 'Interviews', 'Assessments', 'Questions']

export function CandidateDetailPanel({
  candidate,
  onClose,
  onStatusChange,
  onForward,
  onSchedule,
  onDelete,
  onViewQuestions,
}) {
  const [tab, setTab] = useState('Profile')

  if (!candidate) return null

  const meta       = STATUS_META[candidate.status] ?? {}
  const initials   = candidate.name.split(' ').map((n) => n[0]).join('').slice(0, 2)
  const nextStatus = FORWARD_MAP[candidate.status]
  const hasQuestions = candidate.sentQuestions?.length > 0

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

          {tab === 'Assessments' && (
            <div>
              {candidate.assessments?.length > 0 ? (
                <div className="space-y-3">
                  {candidate.assessments.map((a) => (
                    <div key={a.questionId} className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">Question ID: {a.questionId}</p>
                      <p className="text-sm font-semibold text-gray-800">Score: {a.score}</p>
                      {a.notes && <p className="text-xs text-gray-600 mt-1">{a.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-3xl mb-2">📊</p>
                  <p className="text-sm">No assessments recorded yet</p>
                </div>
              )}
            </div>
          )}

          {tab === 'Questions' && (
            <div>
              {hasQuestions ? (
                <div className="space-y-2">
                  {candidate.sentQuestions.map((q, i) => (
                    <div key={q.id ?? i} className="bg-gray-50 rounded-xl p-3 flex gap-3">
                      <span className="text-xs font-bold text-indigo-400 shrink-0 mt-0.5">Q{i + 1}</span>
                      <p className="text-sm text-gray-700">{q.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <p className="text-3xl mb-2">📋</p>
                  <p className="text-sm">No questions sent yet</p>
                </div>
              )}
            </div>
          )}
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
            {nextStatus && (
              <button
                onClick={() => { onForward(candidate); onClose() }}
                className="text-xs bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Move to {nextStatus} →
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
