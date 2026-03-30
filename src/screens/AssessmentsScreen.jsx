import { fmtDate } from '../utils/helpers'

export function AssessmentsScreen({ loading, pendingTokens = [] }) {
  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mr-3" />
      <p className="text-sm font-medium">Loading …</p>
    </div>
  )

  return (
    <div className="flex h-full min-h-0">
      {/* ── Left panel ───────────────────────────────────────── */}
      <div className="flex w-full md:w-80 md:shrink-0 border-r border-gray-200 bg-white flex-col h-full">
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-700">MCQ Tests
            {pendingTokens.length > 0 && (
              <span className="ml-1 bg-amber-400 text-white rounded-full px-1.5 py-0.5 text-[9px] font-bold">
                {pendingTokens.length}
              </span>
            )}
          </p>
        </div>

        <div className="overflow-y-auto flex-1">
          {pendingTokens.length === 0 ? (
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
          )}
        </div>
      </div>

      {/* ── Right panel ──────────────────────────────────────── */}
      <div className="hidden md:flex flex-1 flex-col overflow-y-auto bg-gray-50">
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <p className="text-4xl mb-3">⏳</p>
          <p className="text-sm font-medium text-gray-500">Coming soon...</p>
          <p className="text-xs mt-1">Waiting for candidates to submit. Completed results appear in each candidate's profile</p>
        </div>
      </div>
    </div>
  )
}
