import { useState } from 'react'
import { STATUSES, STATUS_META } from '../../constants/statuses'
import { IcoCheck, IcoDown } from './Icons'

export function StatusDropdown({ currentStatus, onChange }) {
  const [open, setOpen] = useState(false)
  const m = STATUS_META[currentStatus] ?? STATUS_META['Screening']

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open) }}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap hover:brightness-95 transition-all ${m.bg} ${m.text} ${m.border}`}
        title="Change status"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
        {m.label}
        <IcoDown />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-20 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden min-w-40">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pt-2.5 pb-1">
              Move to
            </p>
            {STATUSES.map((s) => {
              const sc = STATUS_META[s]
              return (
                <button
                  key={s}
                  onClick={(e) => { e.stopPropagation(); onChange(s); setOpen(false) }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 ${s === currentStatus ? 'font-semibold' : 'font-normal text-gray-700'}`}
                >
                  <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                  {sc.label}
                  {s === currentStatus && (
                    <span className="ml-auto text-gray-400"><IcoCheck /></span>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
