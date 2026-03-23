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

export function CandidateTestView({ candidate, paper, submission, onSubmit, onManualGrade, onClose }) {
  const [answers,        setAnswers]        = useState(() => {
    if (!submission) return {}
    const map = {}
    submission.answers.forEach((a) => { map[a.questionId] = a.answer })
    return map
  })
  const [correctionMode, setCorrectionMode] = useState(submission?.correctionMode ?? 'auto')
  const [submitted,      setSubmitted]      = useState(!!submission)
  const [error,          setError]          = useState('')
  // local manual score inputs (before saving)
  const [manualInputs,   setManualInputs]   = useState(submission?.manualScores ?? {})

  const handleSubmit = () => {
    const unanswered = paper.questions.filter((q) => q.type === 'mcq' && answers[q.id] == null)
    if (unanswered.length > 0) {
      setError(`Please answer all MCQ questions (${unanswered.length} remaining).`)
      return
    }
    setError('')
    setSubmitted(true)
    onSubmit(answers, correctionMode)
  }

  const saveManualScore = (questionId, value) => {
    const marks = Math.max(0, Number(value))
    setManualInputs((prev) => ({ ...prev, [questionId]: marks }))
    onManualGrade(candidate.id, paper.id, questionId, marks)
  }

  // Derived display values
  const result = submission ?? null
  const isAuto = (result?.correctionMode ?? correctionMode) === 'auto'

  // Auto mode score
  const autoPct  = result && isAuto ? Math.round((result.autoScore / result.autoMax) * 100) : null
  const autoMeta = autoPct !== null ? resultMeta(autoPct) : null

  // Manual mode score (sum of reviewer-entered marks)
  const manualTotal = result
    ? Object.values(result.manualScores ?? {}).reduce((s, m) => s + (m ?? 0), 0)
    : null
  const manualPct  = result && !isAuto && result.totalMax > 0
    ? Math.round((manualTotal / result.totalMax) * 100)
    : null
  const manualMeta = manualPct !== null ? resultMeta(manualPct) : null

  const getAnswerStatus = (q, optIdx) => {
    if (!submitted || q.type !== 'mcq' || !isAuto) return 'neutral'
    const ans = result?.answers.find((a) => a.questionId === q.id)
    if (optIdx === q.correctOption)  return 'correct'
    if (ans?.answer === optIdx)      return 'wrong'
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
        <button onClick={onClose} className="text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50">
          ← Back
        </button>
      </div>

      {/* ── Correction mode picker (before submit only) ── */}
      {!submitted && (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm px-5 py-4">
          <p className="text-xs font-semibold text-gray-500 mb-3">Correction Mode</p>
          <div className="flex gap-3">
            <button
              onClick={() => setCorrectionMode('auto')}
              className={`flex-1 flex items-start gap-3 border rounded-xl px-4 py-3 text-left transition-colors ${
                correctionMode === 'auto'
                  ? 'border-indigo-400 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                correctionMode === 'auto' ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
              }`}>
                {correctionMode === 'auto' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
              <div>
                <p className="text-xs font-semibold text-gray-900">Auto Correction</p>
                <p className="text-[10px] text-gray-400 mt-0.5">MCQs are graded instantly on submit. Open-ended left for review.</p>
              </div>
            </button>

            <button
              onClick={() => setCorrectionMode('manual')}
              className={`flex-1 flex items-start gap-3 border rounded-xl px-4 py-3 text-left transition-colors ${
                correctionMode === 'manual'
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${
                correctionMode === 'manual' ? 'border-amber-500 bg-amber-500' : 'border-gray-300'
              }`}>
                {correctionMode === 'manual' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </span>
              <div>
                <p className="text-xs font-semibold text-gray-900">Manual Correction</p>
                <p className="text-[10px] text-gray-400 mt-0.5">All questions reviewed and scored by the interviewer after submission.</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ── Result banner (after submit) ── */}
      {submitted && result && (
        <>
          {/* Auto result */}
          {isAuto && autoMeta && (
            <div className={`rounded-2xl border px-6 py-4 ${autoMeta.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">Auto Corrected</span>
                    <p className={`text-sm font-bold ${autoMeta.text}`}>{autoMeta.label}</p>
                  </div>
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
                {result.answers.some((a) => !a.autoGraded) && (
                  <span className="text-xs text-gray-600">
                    📝 Open-ended: <span className="font-bold text-amber-600">{result.answers.filter((a) => !a.autoGraded).length} pending review</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Manual result */}
          {!isAuto && (
            <div className={`rounded-2xl border px-6 py-4 ${manualMeta ? manualMeta.bg : 'bg-amber-50'}`}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Manual Correction</span>
                    {manualMeta && <p className={`text-sm font-bold ${manualMeta.text}`}>{manualMeta.label}</p>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Scored: <span className="font-bold text-gray-800">{manualTotal} / {result.totalMax}</span>
                    {' '}· enter marks below for each question
                  </p>
                </div>
                {manualPct !== null && (
                  <span className={`text-2xl font-black ${manualMeta.text}`}>{manualPct}%</span>
                )}
              </div>
              {manualPct !== null && (
                <ScoreBar score={manualTotal} max={result.totalMax} barColor={manualMeta.bar} />
              )}
            </div>
          )}
        </>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-medium px-4 py-2.5 rounded-xl">{error}</div>
      )}

      {/* ── Questions ── */}
      <div className="space-y-4">
        {paper.questions.map((q, idx) => {
          const answerData  = result?.answers.find((a) => a.questionId === q.id)
          const selectedIdx = answers[q.id] ?? null

          // Border colour after submit
          let borderCls = 'border-gray-100'
          if (submitted && isAuto && q.type === 'mcq') {
            borderCls = answerData?.correct ? 'border-green-200' : 'border-red-200'
          }

          return (
            <div key={q.id} className={`bg-white border rounded-2xl shadow-sm p-5 space-y-3 ${borderCls}`}>
              {/* Question header */}
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

                    {/* Auto mode score chip */}
                    {submitted && isAuto && q.type === 'mcq' && (
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
                    if (submitted && isAuto) {
                      if (status === 'correct')      cls = 'border-green-400 bg-green-50 text-green-800'
                      else if (status === 'wrong')   cls = 'border-red-300   bg-red-50   text-red-700'
                      else if (isSelected)           cls = 'border-gray-200  bg-gray-50  text-gray-500'
                    } else if (submitted && !isAuto) {
                      // show selected but no correct/wrong reveal
                      if (isSelected) cls = 'border-indigo-300 bg-indigo-50 text-indigo-800'
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
                        {submitted && isAuto && status === 'correct' && <span className="ml-auto text-green-600 text-xs">✓</span>}
                        {submitted && isAuto && status === 'wrong'   && <span className="ml-auto text-red-500   text-xs">✗</span>}
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

              {/* Manual marks input (shown after submit in manual mode) */}
              {submitted && !isAuto && (
                <div className="pl-6 pt-1 flex items-center gap-3">
                  <label className="text-xs text-gray-500 font-medium shrink-0">Marks awarded:</label>
                  <input
                    type="number"
                    min={0}
                    max={q.marks}
                    value={manualInputs[q.id] ?? ''}
                    onChange={(e) => saveManualScore(q.id, e.target.value)}
                    placeholder="—"
                    className="w-16 border border-amber-300 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-amber-200"
                  />
                  <span className="text-xs text-gray-400">/ {q.marks}</span>
                  {manualInputs[q.id] != null && (
                    <span className={`text-xs font-semibold ${
                      manualInputs[q.id] >= q.marks ? 'text-green-600'
                      : manualInputs[q.id] > 0      ? 'text-yellow-600'
                      : 'text-red-500'
                    }`}>
                      {manualInputs[q.id] >= q.marks ? 'Full marks' : manualInputs[q.id] > 0 ? 'Partial' : 'Zero'}
                    </span>
                  )}
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
