export function SentQuestionsDrawer({ candidate, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start">
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Round 1 Questions</h3>
            <p className="text-xs text-gray-500 mt-0.5">Sent to {candidate.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {candidate.sentQuestions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center mt-8">No questions sent yet.</p>
          ) : (
            candidate.sentQuestions.map((q, i) => (
              <div key={q.id} className="flex gap-3 bg-indigo-50 rounded-xl px-4 py-3">
                <span className="text-xs font-bold text-indigo-400 mt-0.5 shrink-0">Q{i + 1}</span>
                <p className="text-xs text-gray-700 leading-relaxed">{q.text}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
