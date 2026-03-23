import { IcoTrash } from '../common/Icons'

const ROLE_COLOR = {
  'Senior Frontend Engineer': 'bg-violet-100 text-violet-700',
  'Product Manager':          'bg-amber-100  text-amber-700',
  'Data Scientist':           'bg-blue-100   text-blue-700',
  'DevOps Engineer':          'bg-green-100  text-green-700',
}

function submissionCount(paperId, submissions) {
  return Object.values(submissions).filter((s) => s[paperId]).length
}

export function PaperList({ papers, candidates, submissions, onEdit, onDelete, onAssign, onViewTest }) {
  if (papers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <p className="text-4xl mb-3">📄</p>
        <p className="text-sm font-medium text-gray-500">No question papers yet</p>
        <p className="text-xs mt-1">Click "New Question Paper" to build your first assessment</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {papers.map((paper) => {
        const mcqCount  = paper.questions.filter((q) => q.type === 'mcq').length
        const openCount = paper.questions.filter((q) => q.type === 'open').length
        const total     = paper.questions.reduce((s, q) => s + (q.marks ?? 1), 0)
        const submitted = submissionCount(paper.id, submissions)

        // Candidates matching this paper's role who have a submission
        const assignedCandidates = candidates.filter(
          (c) => c.role === paper.role && submissions[c.id]?.[paper.id]
        )

        return (
          <div key={paper.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-gray-900">{paper.title}</h3>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROLE_COLOR[paper.role] ?? 'bg-gray-100 text-gray-600'}`}>
                    {paper.role}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] text-gray-400">{paper.questions.length} question{paper.questions.length !== 1 ? 's' : ''}</span>
                  {mcqCount > 0  && <span className="text-[10px] font-medium bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full">{mcqCount} MCQ</span>}
                  {openCount > 0 && <span className="text-[10px] font-medium bg-amber-50  text-amber-600  px-2 py-0.5 rounded-full">{openCount} Open</span>}
                  <span className="text-[10px] text-gray-400">{total} marks total</span>
                  {submitted > 0 && (
                    <span className="text-[10px] font-medium bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                      {submitted} submission{submitted !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onAssign(paper)}
                  className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl hover:bg-indigo-100 transition-colors"
                >
                  Assign to Candidate
                </button>
                <button
                  onClick={() => onEdit(paper)}
                  className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(paper.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors p-1.5"
                >
                  <IcoTrash />
                </button>
              </div>
            </div>

            {/* Assigned candidates with results */}
            {assignedCandidates.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Results</p>
                <div className="flex flex-wrap gap-2">
                  {assignedCandidates.map((c) => {
                    const sub        = submissions[c.id]?.[paper.id]
                    const isAuto     = sub?.correctionMode !== 'manual'
                    const score      = isAuto ? sub?.autoScore : Object.values(sub?.manualScores ?? {}).reduce((s, m) => s + (m ?? 0), 0)
                    const max        = isAuto ? sub?.autoMax   : sub?.totalMax
                    const pct        = sub && max > 0 ? Math.round((score / max) * 100) : null
                    const graded     = !isAuto && sub ? Object.keys(sub.manualScores ?? {}).length : null
                    const totalQ     = sub ? sub.answers.length : 0
                    const color = pct === null ? 'bg-gray-100 text-gray-500'
                      : pct >= 80 ? 'bg-green-100 text-green-700'
                      : pct >= 60 ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-600'

                    return (
                      <button
                        key={c.id}
                        onClick={() => onViewTest(c, paper)}
                        className={`flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full border border-transparent hover:border-indigo-200 hover:bg-indigo-50 transition-colors ${color}`}
                      >
                        <span className="w-4 h-4 rounded-full bg-white/60 flex items-center justify-center text-[8px] font-bold">
                          {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </span>
                        {c.name.split(' ')[0]}
                        {pct !== null
                          ? <span className="font-bold">{pct}%</span>
                          : !isAuto && graded !== null
                          ? <span className="opacity-70">{graded}/{totalQ} graded</span>
                          : null
                        }
                        <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${isAuto ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>
                          {isAuto ? 'auto' : 'manual'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
