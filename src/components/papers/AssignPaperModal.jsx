import { useState } from 'react'

export function AssignPaperModal({ paper, candidates, submissions, pendingTokens = [], onGetLink, onClose }) {
  if (!paper) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-3">
        <h2 className="text-base font-bold text-gray-900">No Question Paper Found</h2>
        <p className="text-sm text-gray-500">No question paper has been imported for this role yet. Go to <strong>Question Papers</strong> and import one from Google Drive first.</p>
        <button onClick={onClose} className="w-full text-sm font-medium py-2 rounded-xl border border-gray-200 hover:bg-gray-50">Close</button>
      </div>
    </div>
  )

  const eligible = candidates.length === 1
    ? candidates
    : candidates.filter((c) => c.role === paper.role && c.status === 'Shortlist')
  const [linkInfo,    setLinkInfo]    = useState(null)   // { candidateName, url }
  const [generating,  setGenerating]  = useState(false)
  const [genError,    setGenError]    = useState('')
  const [copied,      setCopied]      = useState(false)

  const handleCandidateClick = async (c) => {
    setGenerating(true)
    setGenError('')
    try {
      const { url } = await onGetLink(c)
      setLinkInfo({ candidateName: c.name, url })
    } catch (err) {
      setGenError(err.message || 'Failed to generate link.')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(linkInfo.url).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Assign Paper</h2>
            <p className="text-xs text-gray-500 mt-0.5">{paper.title} · {paper.role}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {linkInfo ? (
          /* ── Link ready panel ── */
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
              <span className="text-lg">✅</span>
              Link generated for <span className="font-semibold">{linkInfo.candidateName}</span>
            </div>
            <p className="text-xs text-gray-500">Share this link with the candidate. It can only be used once.</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={linkInfo.url}
                className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 font-mono truncate focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className={`shrink-0 text-xs font-semibold px-4 py-2 rounded-xl border transition-colors ${
                  copied
                    ? 'bg-green-50 border-green-300 text-green-700'
                    : 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button
              onClick={() => { setLinkInfo(null); setCopied(false) }}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              ← Assign to another candidate
            </button>
          </div>
        ) : (
          /* ── Candidate list ── */
          <>
            <div className="px-6 py-4 space-y-2 overflow-y-auto max-h-80">
              {generating && (
                <p className="text-xs text-indigo-500 text-center py-2">Generating link…</p>
              )}
              {genError && (
                <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2">{genError}</p>
              )}
              {eligible.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No candidates in Screen for this role.</p>
              ) : (
                eligible.map((c) => {
                  const submitted = !!submissions[c.id]?.[paper.id]
                  const hasActive = pendingTokens.some((t) => String(t.candidate_id) === String(c.id))
                  const blocked   = submitted || hasActive
                  return (
                    <button
                      key={c.id}
                      onClick={() => !blocked && !generating && handleCandidateClick(c)}
                      disabled={blocked || generating}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
                        blocked || generating
                          ? 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                      }`}
                    >
                      <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                        {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                        <p className="text-[10px] text-gray-400">{c.status} · {c.company}</p>
                      </div>
                      {submitted && (
                        <span className="ml-auto text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          Submitted
                        </span>
                      )}
                      {!submitted && hasActive && (
                        <span className="ml-auto text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          Test active
                        </span>
                      )}
                    </button>
                  )
                })
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <button onClick={onClose} className="w-full text-sm text-gray-600 font-medium py-2 rounded-xl border border-gray-200 hover:bg-gray-50">
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
