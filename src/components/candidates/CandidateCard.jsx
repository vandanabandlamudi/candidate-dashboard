import { useState } from 'react'
import { StatusDropdown } from '../common/StatusDropdown'
import { RoundPipeline }  from '../common/RoundPipeline'
import { IcoCheck }       from '../common/Icons'
import { ActionButtons }  from './ActionButtons'
import { fmtDate, highlight } from '../../utils/helpers'
import { STATUSES, STATUS_LABELS } from '../../constants/statuses'

export function CandidateCard({
  candidate,
  searchTerm,
  selected,
  onToggleSelect,
  onStatusChange,
  onSchedule,
  onVideo,
  onViewQuestions,
  onViewDetail,
  onMeetLinkSaved,
  onInterviewDeleted,
  onSendQuestionnaire,
}) {
  const [expanded,      setExpanded]      = useState(false)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const hl = (text) => highlight(text, searchTerm)
  const hasQuestions = candidate.sentQuestions?.length > 0

  return (
    <>
    <div
      className={`bg-white rounded-2xl border-2 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col ${
        selected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-200'
      }`}
    >
      <div className="p-4 flex-1 cursor-pointer" onClick={() => onViewDetail?.(candidate)}>
        {/* Top row */}
        <div className="flex items-start gap-2.5">
          {/* Checkbox */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSelect(candidate.id) }}
            className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
              selected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 hover:border-indigo-400'
            }`}
          >
            {selected && <IcoCheck />}
          </button>

          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold">
              {candidate.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            {hasQuestions && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <IcoCheck />
              </span>
            )}
          </div>

          {/* Name & company */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate leading-tight">{hl(candidate.name)}</p>
            <p className="text-[11px] text-gray-500 truncate">{hl(candidate.title)} · {hl(candidate.company)}</p>
          </div>

          {/* Status */}
          <div onClick={(e) => e.stopPropagation()}>
            <StatusDropdown currentStatus={candidate.status} onChange={(s) => { onStatusChange(candidate.id, s); if (selected) onToggleSelect(candidate.id) }} />
          </div>
        </div>

        <RoundPipeline status={candidate.status} />

        {/* Skills */}
        <div className="mt-2.5 flex flex-wrap gap-1 ml-7">
          {(candidate.skills ?? []).map((skill) => (
            <span
              key={skill}
              className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
                searchTerm && skill.toLowerCase().includes(searchTerm.toLowerCase())
                  ? 'bg-yellow-200 text-yellow-900'
                  : 'bg-indigo-50 text-indigo-700'
              }`}
            >
              {skill}
            </span>
          ))}
        </div>

        {/* Meta */}
        <div className="mt-2 ml-7 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-400">
          <span>🎯 {candidate.role}</span>
          <span>⏱ {candidate.exp}y</span>
          <span>📅 {fmtDate(candidate.appliedDate)}</span>
        </div>

        {hasQuestions && (
          <button
            onClick={(e) => { e.stopPropagation(); onViewQuestions(candidate) }}
            className="mt-1.5 ml-7 text-[11px] text-green-600 font-medium hover:text-green-800"
          >
            📋 View questions sent
          </button>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
          className="mt-1.5 ml-7 text-[11px] text-indigo-500 font-medium hover:text-indigo-700"
        >
          {expanded ? 'Hide ▲' : 'Details ▼'}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 space-y-1.5">
          <p className="text-[11px] text-gray-600">📧 {candidate.email}</p>
          <p className="text-[11px] text-gray-600">📞 {candidate.phone}</p>
          <p className="text-[11px] text-gray-600 leading-relaxed">📝 {hl(candidate.summary)}</p>
        </div>
      )}

      {/* Card footer with actions */}
      <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400">Applied {fmtDate(candidate.appliedDate)}</span>
          {candidate.status === 'Shortlist' && onSendQuestionnaire && (
            <button
              onClick={(e) => { e.stopPropagation(); onSendQuestionnaire(candidate) }}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
            >
              Send Questionnaire
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          {selected && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowMoveModal(true) }}
              className="text-[11px] font-semibold px-3 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Move
            </button>
          )}
          <ActionButtons
            candidate={candidate}
            onSchedule={onSchedule}
            onVideo={onVideo}
            onMeetLinkSaved={onMeetLinkSaved}
            onInterviewDeleted={onInterviewDeleted}
          />
        </div>
      </div>
    </div>

    {/* Move modal */}
    {showMoveModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowMoveModal(false)} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs p-5 space-y-3">
          <h2 className="text-sm font-bold text-gray-900">Move <span className="text-indigo-600">{candidate.name}</span> to</h2>
          <div className="space-y-1.5">
            {STATUSES.filter((s) => s !== candidate.status).map((s) => (
              <button
                key={s}
                onClick={() => { onStatusChange(candidate.id, s); setShowMoveModal(false); if (selected) onToggleSelect(candidate.id) }}
                className="w-full text-left px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
              >
                {STATUS_LABELS[s] ?? s}
              </button>
            ))}
          </div>
          <button onClick={() => setShowMoveModal(false)} className="w-full text-xs text-gray-400 hover:text-gray-600 pt-1">Cancel</button>
        </div>
      </div>
    )}
    </>
  )
}
