import { useState } from 'react'

const INTERVIEW_TYPES = [
  { value: 'Video Call', emoji: '🎥' },
  { value: 'Phone',      emoji: '📞' },
  { value: 'In-person',  emoji: '🏢' },
]

export function ScheduleModal({ candidate, onConfirm, onClose }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('10:00')
  const [type, setType] = useState('Video Call')
  const today = new Date().toISOString().split('T')[0]

  const handleConfirm = () => {
    if (!date) return
    onConfirm({ date, time, type })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-base font-bold text-gray-900 mb-0.5">Schedule Interview</h2>
        <p className="text-xs text-gray-500 mb-5">
          for <span className="font-semibold text-gray-700">{candidate.name}</span> · {candidate.role}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Date</label>
            <input
              type="date"
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Interview Type</label>
            <div className="grid grid-cols-3 gap-2">
              {INTERVIEW_TYPES.map(({ value, emoji }) => (
                <button
                  key={value}
                  onClick={() => setType(value)}
                  className={`text-xs py-2 rounded-xl border-2 font-medium transition-all ${
                    type === value
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-600 hover:border-indigo-200'
                  }`}
                >
                  {emoji} {value}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 text-sm border border-gray-200 text-gray-600 font-medium py-2 rounded-xl hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!date}
            className="flex-1 text-sm bg-indigo-600 text-white font-semibold py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
