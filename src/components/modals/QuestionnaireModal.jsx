import { IcoSend } from '../common/Icons'
import { QUESTION_BANK } from '../../constants/questionBank'

export function QuestionnaireModal({
  candidates,
  previewMap,
  usedCountByRole,
  totalByRole,
  onConfirm,
  onClose,
}) {
  const roles = [...new Set(candidates.map((c) => c.role))]
  const allExhausted = roles.every((r) => (previewMap[r] ?? []).length === 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Send Round 1 Questionnaire</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {candidates.length} candidate{candidates.length !== 1 ? 's' : ''} · {5} unused questions per role
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-6">
          {/* Recipients */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recipients</p>
            <div className="flex flex-wrap gap-2">
              {candidates.map((c) => (
                <span key={c.id} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1 rounded-full">
                  <span className="w-5 h-5 rounded-full bg-indigo-200 flex items-center justify-center text-[9px] font-bold">
                    {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </span>
                  {c.name}
                </span>
              ))}
            </div>
          </div>

          {/* Questions per role */}
          {roles.map((role) => {
            const questions = previewMap[role] ?? []
            const used  = usedCountByRole[role] ?? 0
            const total = totalByRole[role] ?? (QUESTION_BANK[role]?.length ?? 0)
            const remaining = total - used - questions.length

            return (
              <div key={role}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{role}</p>
                  <span className="text-[10px] text-gray-400">{remaining} remaining after this send</span>
                </div>

                {questions.length === 0 ? (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600 font-medium">
                    ⚠️ All questions used for this role. Cannot send questionnaire.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {questions.map((q, i) => (
                      <div key={q.id} className="flex gap-2.5 bg-gray-50 rounded-xl px-4 py-2.5">
                        <span className="text-xs font-bold text-indigo-400 mt-0.5 w-4 shrink-0">Q{i + 1}</span>
                        <p className="text-xs text-gray-700 leading-relaxed">{q.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="text-sm text-gray-600 font-medium px-4 py-2 rounded-xl hover:bg-gray-50 border border-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={allExhausted}
            className="text-sm bg-indigo-600 text-white font-semibold px-5 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-40 flex items-center gap-2 transition-colors"
          >
            <IcoSend /> Send Questionnaire
          </button>
        </div>
      </div>
    </div>
  )
}
