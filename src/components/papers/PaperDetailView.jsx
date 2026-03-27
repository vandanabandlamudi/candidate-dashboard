const OPTION_LABELS = ['A', 'B', 'C', 'D']

function downloadPaper(paper) {
  const lines = []
  lines.push(paper.title)
  lines.push(`Role: ${paper.role}`)
  lines.push(`Total marks: ${paper.questions.reduce((s, q) => s + (q.marks ?? 1), 0)}`)
  lines.push('')
  lines.push('─'.repeat(60))
  lines.push('')

  paper.questions.forEach((q, idx) => {
    lines.push(`Q${idx + 1}. ${q.text}  [${q.marks} mark${q.marks !== 1 ? 's' : ''}]`)
    if (q.type === 'mcq') {
      q.options.forEach((opt, i) => lines.push(`   ${OPTION_LABELS[i]}) ${opt}`))
    } else {
      lines.push('   (Open-ended)')
    }
    lines.push('')
  })

  const mcqs = paper.questions.filter((q) => q.type === 'mcq')
  if (mcqs.length > 0) {
    lines.push('─'.repeat(60))
    lines.push('ANSWER KEY')
    lines.push('─'.repeat(60))
    lines.push('')
    mcqs.forEach((q, i) => {
      const qIdx = paper.questions.indexOf(q) + 1
      lines.push(`Q${qIdx}: ${OPTION_LABELS[q.correctOption]}`)
    })
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${paper.title.replace(/[^a-z0-9]/gi, '_')}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

const ROLE_COLOR = {
  'Senior Frontend Engineer': 'bg-violet-100 text-violet-700',
  'Product Manager':          'bg-amber-100 text-amber-700',
  'Data Scientist':           'bg-blue-100 text-blue-700',
  'DevOps Engineer':          'bg-green-100 text-green-700',
}


export function PaperDetailView({ paper, onAssign, onEdit }) {
  const mcqCount  = paper.questions.filter((q) => q.type === 'mcq').length
  const openCount = paper.questions.filter((q) => q.type === 'open').length
  const totalMarks = paper.questions.reduce((s, q) => s + (q.marks ?? 1), 0)

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
                onClick={() => downloadPaper(paper)}
                className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
              >
                ↓ Download
              </button>
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

      </div>
    </div>
  )
}
