import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { STATUSES, STATUS_META } from '../../constants/statuses'
import { IcoCheck, IcoDown } from './Icons'

export function StatusDropdown({ currentStatus, onChange }) {
  const [open, setOpen] = useState(false)
  const [pos,  setPos]  = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)
  const m = STATUS_META[currentStatus] ?? STATUS_META['Shortlist']

  const handleOpen = (e) => {
    e.stopPropagation()
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
    }
    setOpen((v) => !v)
  }

  // Close on scroll / resize
  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => { window.removeEventListener('scroll', close, true); window.removeEventListener('resize', close) }
  }, [open])

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleOpen}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap hover:brightness-95 transition-all ${m.bg} ${m.text} ${m.border}`}
        title="Change status"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
        {m.label}
        <IcoDown />
      </button>

      {open && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-200 min-w-44 py-1"
            style={{ top: pos.top, right: pos.right, left: 'auto' }}
          >
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 pt-2 pb-1">
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
        </>,
        document.body
      )}
    </div>
  )
}
