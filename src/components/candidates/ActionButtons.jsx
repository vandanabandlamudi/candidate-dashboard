import { useState } from 'react'
import { IcoCal, IcoVideo } from '../common/Icons'
import { api } from '../../api/client'
import { fmtDate } from '../../utils/helpers'

export function ActionButtons({ candidate, onSchedule, onVideo, onMeetLinkSaved, onInterviewDeleted }) {
  const [showPaste,  setShowPaste]  = useState(false)
  const [link,       setLink]       = useState('')
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  const interviewDate = candidate.interviewDate
  const interviewType = candidate.interviewType
  const hasInterview  = !!interviewDate
  const meetLink      = candidate.meetLink

  const handleSaveLink = async () => {
    if (!link.trim()) return
    setSaving(true)
    try {
      await api.updateMeetLink(candidate.id, link.trim())
      onMeetLinkSaved?.(candidate.id, link.trim())
      setShowPaste(false)
      setLink('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        {hasInterview ? (
          <>
            <span className="text-[10px] text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-lg whitespace-nowrap">
              🗓 {fmtDate(interviewDate)} · {interviewType}
            </span>
            {/* Reschedule icon */}
            <button
              onClick={() => onSchedule(candidate)}
              title="Reschedule"
              className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            {/* Delete — opens Google Calendar and removes from DB */}
            <a
              href="https://calendar.google.com"
              target="_blank"
              rel="noopener noreferrer"
              title="Delete from Google Calendar"
              onClick={async (e) => {
                if (deleting) { e.preventDefault(); return }
                setDeleting(true)
                try {
                  await api.deleteInterview(candidate.id)
                  onInterviewDeleted?.(candidate.id)
                } finally {
                  setDeleting(false)
                }
              }}
              className="p-1.5 rounded-lg border border-gray-200 text-red-400 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              {deleting ? (
                <div className="w-3.5 h-3.5 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" />
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </a>
          </>
        ) : (
          <button
            onClick={() => onSchedule(candidate)}
            title="Schedule interview"
            className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <IcoCal />
          </button>
        )}

        {/* Video CTA — commented out until Google OAuth is set up
        {meetLink ? (
          <a href={meetLink} target="_blank" rel="noopener noreferrer" title="Join Google Meet"
            className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 hover:text-green-700 transition-colors">
            <IcoVideo />
          </a>
        ) : hasInterview ? (
          <button onClick={() => setShowPaste((v) => !v)} title="Paste Meet link"
            className={`p-1.5 rounded-lg transition-colors ${showPaste ? 'bg-purple-100 text-purple-700' : 'text-purple-400 hover:bg-purple-50 hover:text-purple-600'}`}>
            <IcoVideo />
          </button>
        ) : (
          <button onClick={() => onVideo(candidate)} title="Video link"
            className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-50 hover:text-purple-600 transition-colors">
            <IcoVideo />
          </button>
        )}
        */}
      </div>

      {/* Paste Meet link input — commented out until Google OAuth is set up
      {showPaste && (
        <div className="flex items-center gap-1 mt-0.5" onClick={(e) => e.stopPropagation()}>
          <input autoFocus type="url" value={link} onChange={(e) => setLink(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveLink()} placeholder="Paste Meet link…"
            className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 w-44 focus:outline-none focus:ring-1 focus:ring-indigo-300" />
          <button onClick={handleSaveLink} disabled={saving || !link.trim()}
            className="text-[11px] font-medium px-2 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
            {saving ? '…' : 'Save'}
          </button>
        </div>
      )}
      */}
    </div>
  )
}
