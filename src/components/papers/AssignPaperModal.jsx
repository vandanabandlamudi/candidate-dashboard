export function AssignPaperModal({ paper, candidates, submissions, onAssign, onClose }) {
  const eligible = candidates.filter((c) => c.role === paper.role)

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

        <div className="px-6 py-4 space-y-2 overflow-y-auto max-h-80">
          {eligible.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No candidates for this role.</p>
          ) : (
            eligible.map((c) => {
              const already = !!submissions[c.id]?.[paper.id]
              return (
                <button
                  key={c.id}
                  onClick={() => !already && onAssign(c)}
                  disabled={already}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
                    already
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
                  {already && (
                    <span className="ml-auto text-[10px] font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      Submitted
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
      </div>
    </div>
  )
}
