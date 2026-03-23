const OPTION_LABELS = ['A', 'B', 'C', 'D']

const ROLE_COLOR = {
  'Senior Frontend Engineer': 'bg-violet-100 text-violet-700',
  'Product Manager':          'bg-amber-100 text-amber-700',
  'Data Scientist':           'bg-blue-100 text-blue-700',
  'DevOps Engineer':          'bg-green-100 text-green-700',
}

function resultMeta(pct) {
  if (pct >= 85) return { label: 'Outstanding', bg: 'bg-green-100',  text: 'text-green-700'  }
  if (pct >= 70) return { label: 'Strong',      bg: 'bg-lime-100',   text: 'text-lime-700'   }
  if (pct >= 50) return { label: 'Average',     bg: 'bg-yellow-100', text: 'text-yellow-700' }
  return              { label: 'Needs Work',  bg: 'bg-red-100',    text: 'text-red-600'    }
}

export function PaperDetailView({ paper, candidates, submissions, onAssign, onEdit, onViewTest }) {
  const mcqCount  = paper.questions.filter((q) => q.type === 'mcq').length
  const openCount = paper.questions.filter((q) => q.type === 'open').length
  const totalMarks = paper.questions.reduce((s, q) => s + (q.marks ?? 1), 0)

  const assignedCandidates = candidates.filter(
    (c) => c.role === paper.role && submissions[c.id]?.[paper.id]
  )

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">{paper.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROLE_COLOR[paper.role] ?? 'bg-gray-100 text-gray-600'}`}>
                  {paper.role}
                </span>
                <span className="text-[10px] text-gray-400">{paper.questions.length} question{paper.questions.length !== 1 ? 's' : ''}</span>
                {mcqCount > 0  && <span className="text-[10px] font-medium bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full">{mcqCount} MCQ</span>}
                {openCount > 0 && <span className="text-[10px] font-medium bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">{openCount} Open-ended</span>}
                <span className="text-[10px] text-gray-400">{totalMarks} marks total</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => onEdit(paper)}
                className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => onAssign(paper)}
                className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition-colors"
              >
                Assign to Candidate
              </button>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Questions</p>
          <div className="space-y-3">
            {paper.questions.map((q, idx) => (
              <div key={q.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-bold text-indigo-400 shrink-0 mt-0.5">Q{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        q.type === 'mcq' ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {q.type === 'mcq' ? 'MCQ' : 'Open-ended'}
                      </span>
                      <span className="text-[10px] text-gray-400">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">{q.text}</p>
                  </div>
                </div>

                {q.type === 'mcq' && (
                  <div className="grid grid-cols-2 gap-2 pl-6">
                    {q.options.map((opt, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 border rounded-xl px-3 py-2 ${
                          i === q.correctOption
                            ? 'border-green-400 bg-green-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <span className="text-[10px] font-bold shrink-0 text-gray-400">{OPTION_LABELS[i]}.</span>
                        <span className="text-xs text-gray-700">{opt || <span className="text-gray-300 italic">—</span>}</span>
                        {i === q.correctOption && (
                          <span className="ml-auto text-green-600 text-xs font-bold">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {q.type === 'open' && (
                  <div className="pl-6">
                    <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl px-4 py-3">
                      <p className="text-[10px] text-gray-400 italic">Open-ended — candidate types their answer</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submissions */}
        {assignedCandidates.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Submissions · {assignedCandidates.length}
            </p>
            <div className="space-y-2">
              {assignedCandidates.map((c) => {
                const sub    = submissions[c.id]?.[paper.id]
                const isAuto = sub?.correctionMode !== 'manual'
                const score  = isAuto
                  ? sub?.autoScore
                  : Object.values(sub?.manualScores ?? {}).reduce((s, m) => s + (m ?? 0), 0)
                const max  = isAuto ? sub?.autoMax : sub?.totalMax
                const pct  = sub && max > 0 ? Math.round((score / max) * 100) : null
                const meta = pct !== null ? resultMeta(pct) : null

                return (
                  <button
                    key={c.id}
                    onClick={() => onViewTest(c, paper)}
                    className="w-full flex items-center gap-3 bg-white border border-gray-100 rounded-2xl shadow-sm px-4 py-3 hover:border-indigo-200 hover:bg-indigo-50 transition-colors text-left"
                  >
                    <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900">{c.name}</p>
                      <p className="text-[10px] text-gray-400">{c.status} · {c.company}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isAuto ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-700'}`}>
                        {isAuto ? 'Auto' : 'Manual'}
                      </span>
                      {pct !== null ? (
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${meta.bg} ${meta.text}`}>
                          {pct}% · {meta.label}
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">
                          {Object.keys(sub?.manualScores ?? {}).length}/{sub?.answers.length ?? 0} graded
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {assignedCandidates.length === 0 && (
          <div className="bg-white border border-dashed border-gray-200 rounded-2xl px-6 py-8 text-center">
            <p className="text-sm text-gray-400">No submissions yet</p>
            <button
              onClick={() => onAssign(paper)}
              className="mt-3 text-xs font-semibold text-indigo-600 hover:underline"
            >
              Assign to a candidate →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
