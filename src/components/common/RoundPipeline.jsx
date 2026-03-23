const ROUNDS = ['Interview R1', 'Interview R2', 'Interview R3']

export function RoundPipeline({ status }) {
  const activeIndex = ROUNDS.indexOf(status)
  if (activeIndex === -1) return null

  return (
    <div className="flex items-center gap-1 mt-1.5">
      {ROUNDS.map((round, i) => (
        <div key={round} className="flex items-center gap-1">
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border-2 ${
              i < activeIndex  ? 'bg-indigo-500 border-indigo-500 text-white'
              : i === activeIndex ? 'bg-white border-indigo-500 text-indigo-600'
              : 'bg-white border-gray-200 text-gray-400'
            }`}
          >
            {i + 1}
          </div>
          {i < 2 && (
            <div className={`w-3 h-0.5 ${i < activeIndex ? 'bg-indigo-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
      <span className="text-[10px] text-gray-400 ml-1">Round {activeIndex + 1}/3</span>
    </div>
  )
}
