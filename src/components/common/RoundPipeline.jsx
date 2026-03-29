const STAGES = ['Shortlist', 'Screen', 'In Evaluation R1', 'In Evaluation R2', 'In Evaluation R3', 'Offer']

export function RoundPipeline({ status }) {
  const activeIndex = STAGES.indexOf(status)
  if (activeIndex === -1) return null

  return (
    <div className="flex items-center gap-1 mt-2 ml-7">
      {STAGES.map((stage, i) => (
        <div key={stage} className="flex items-center gap-1">
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border-2 ${
              i < activeIndex    ? 'bg-indigo-500 border-indigo-500 text-white'
              : i === activeIndex ? 'bg-white border-indigo-500 text-indigo-600'
              : 'bg-white border-gray-200 text-gray-400'
            }`}
          >
            {i + 1}
          </div>
          {i < STAGES.length - 1 && (
            <div className={`w-3 h-0.5 ${i < activeIndex ? 'bg-indigo-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}
