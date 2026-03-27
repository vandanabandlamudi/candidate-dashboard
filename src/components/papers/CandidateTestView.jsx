import { useState } from 'react'

const OPTION_LABELS = ['A', 'B', 'C', 'D']

function resultMeta(pct) {
  if (pct >= 85) return { label: 'Outstanding', bg: 'bg-green-100',  text: 'text-green-700',  bar: 'bg-green-500'  }
  if (pct >= 70) return { label: 'Strong',      bg: 'bg-lime-100',   text: 'text-lime-700',   bar: 'bg-lime-500'   }
  if (pct >= 50) return { label: 'Average',     bg: 'bg-yellow-100', text: 'text-yellow-700', bar: 'bg-yellow-400' }
  return              { label: 'Needs Work',  bg: 'bg-red-100',    text: 'text-red-600',    bar: 'bg-red-500'    }
}

function ScoreBar({ score, max, barColor }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0
  return (
    <div className="h-2 bg-white/60 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function CandidateTestView({ candidate, paper, submission, onSubmit, onClose }) {
  const [answers,   setAnswers]   = useState(() => {
    if (!submission) return {}
    const map = {}
    submission.answers.forEach((a) => { map[a.questionId] = a.answer })
    return map
  })
  const [submitted, setSubmitted] = useState(!!submission)
  const [error,     setError]     = useState('')

  const handleSubmit = () => {
    const unanswered = paper.questions.filter((q) => q.type === 'mcq' && answers[q.id] == null)
    if (unanswered.length > 0) {
      setError(`Please answer all MCQ questions (${unanswered.length} remaining).`)
      return
    }
    setError('')
    setSubmitted(true)
    onSubmit(answers)
  }

  const result   = submission ?? null
  const autoPct  = result?.autoMax > 0 ? Math.round((result.autoScore / result.autoMax) * 100) : null
  const autoMeta = autoPct !== null ? resultMeta(autoPct) : null

  const getAnswerStatus = (q, optIdx) => {
    if (!submitted || q.type !== 'mcq') return 'neutral'
    const ans = result?.answers.find((a) => a.questionId === q.id)
    if (optIdx === q.correctOption) return 'correct'
    if (ans?.answer === optIdx)     return 'wrong'
    return 'neutral'
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">{paper.title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {candidate.name} · {paper.role} ·{' '}
            {paper.questions.length} question{paper.questions.length !== 1 ? 's' : ''} ·{' '}
            {paper.questions.reduce((s, q) => s + (q.marks ?? 1), 0)} marks
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50">
            ← Back
          </button>
        )}
      </div>

      {/* ── Result banner (after submit) ── */}
      {submitted && result && autoMeta && (
        <div className={`rounded-2xl border px-6 py-4 ${autoMeta.bg}`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className={`text-sm font-bold ${autoMeta.text}`}>{autoMeta.label}</p>
              <p className="text-xs text-gray-500 mt-1">
                Score: <span className="font-bold text-gray-800">{result.autoScore} / {result.autoMax}</span>
                {result.autoMax < result.totalMax && (
                  <span className="ml-2 text-gray-400">· open-ended excluded from auto-score</span>
                )}
              </p>
            </div>
            <span className={`text-2xl font-black ${autoMeta.text}`}>{autoPct}%</span>
          </div>
          <ScoreBar score={result.autoScore} max={result.autoMax} barColor={autoMeta.bar} />
          <div className="mt-3 flex gap-4 flex-wrap">
            <span className="text-xs text-gray-600">
              ✅ Correct: <span className="font-bold text-green-700">{result.answers.filter((a) => a.autoGraded && a.correct).length}</span>
            </span>
            <span className="text-xs text-gray-600">
              ❌ Wrong: <span className="font-bold text-red-600">{result.answers.filter((a) => a.autoGraded && !a.correct).length}</span>
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-medium px-4 py-2.5 rounded-xl">{error}</div>
      )}

      {/* ── Questions ── */}
      <div className="space-y-4">
        {paper.questions.map((q, idx) => {
          const answerData  = result?.answers.find((a) => a.questionId === q.id)
          const selectedIdx = answers[q.id] ?? null

          let borderCls = 'border-gray-100'
          if (submitted && q.type === 'mcq') {
            borderCls = answerData?.correct ? 'border-green-200' : 'border-red-200'
          }

          return (
            <div key={q.id} className={`bg-white border rounded-2xl shadow-sm p-5 space-y-3 ${borderCls}`}>
              <div className="flex items-start gap-3">
                <span className="text-xs font-bold text-indigo-400 shrink-0 mt-0.5">Q{idx + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      q.type === 'mcq' ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {q.type === 'mcq' ? 'MCQ' : 'Open'}
                    </span>
                    <span className="text-[10px] text-gray-400">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                    {submitted && q.type === 'mcq' && (
                      <span className={`ml-auto text-[10px] font-bold ${answerData?.correct ? 'text-green-600' : 'text-red-500'}`}>
                        {answerData?.correct ? `+${answerData.marks}` : '0'} / {q.marks}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed">{q.text}</p>
                </div>
              </div>

              {/* MCQ options */}
              {q.type === 'mcq' && (
                <div className="grid grid-cols-2 gap-2 pl-6">
                  {q.options.map((opt, i) => {
                    const status     = getAnswerStatus(q, i)
                    const isSelected = selectedIdx === i

                    let cls = 'border-gray-200 bg-white text-gray-700'
                    if (submitted) {
                      if (status === 'correct')    cls = 'border-green-400 bg-green-50 text-green-800'
                      else if (status === 'wrong') cls = 'border-red-300   bg-red-50   text-red-700'
                      else if (isSelected)         cls = 'border-gray-200  bg-gray-50  text-gray-500'
                    } else if (isSelected) {
                      cls = 'border-indigo-400 bg-indigo-50 text-indigo-800'
                    }

                    return (
                      <button
                        key={i}
                        disabled={submitted}
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: i }))}
                        className={`flex items-center gap-2 border rounded-xl px-3 py-2.5 text-left transition-colors disabled:cursor-default ${cls}`}
                      >
                        <span className="text-[10px] font-bold shrink-0 opacity-60">{OPTION_LABELS[i]}.</span>
                        <span className="text-xs">{opt}</span>
                        {submitted && status === 'correct' && <span className="ml-auto text-green-600 text-xs">✓</span>}
                        {submitted && status === 'wrong'   && <span className="ml-auto text-red-500   text-xs">✗</span>}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Open-ended answer */}
              {q.type === 'open' && (
                <div className="pl-6">
                  <textarea
                    rows={3}
                    disabled={submitted}
                    placeholder="Type your answer here…"
                    value={answers[q.id] ?? ''}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-50"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Submit button ── */}
      {!submitted && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleSubmit}
            className="text-sm bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Submit Assessment
          </button>
        </div>
      )}
    </div>
  )
}
