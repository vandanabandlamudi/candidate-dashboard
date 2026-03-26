import { useState } from 'react'

const ROLES = [
  { name: 'Senior Frontend Engineer', color: 'indigo' },
  { name: 'Product Manager',          color: 'violet' },
  { name: 'Data Scientist',           color: 'emerald' },
  { name: 'DevOps Engineer',          color: 'orange' },
]

const COLOR = {
  indigo:  { btn: 'border-indigo-500 bg-indigo-50 text-indigo-700',  badge: 'bg-indigo-100 text-indigo-700' },
  violet:  { btn: 'border-violet-500 bg-violet-50 text-violet-700',  badge: 'bg-violet-100 text-violet-700' },
  emerald: { btn: 'border-emerald-500 bg-emerald-50 text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
  orange:  { btn: 'border-orange-500 bg-orange-50 text-orange-700',  badge: 'bg-orange-100 text-orange-700' },
}

export function ImportFromDriveModal({ onImport, onClose, importing, error }) {
  const [selectedRole, setSelectedRole] = useState(ROLES[0].name)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={!importing ? onClose : undefined} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h2 className="text-base font-bold text-gray-900 mb-0.5">Import from Google Drive</h2>
        <p className="text-xs text-gray-500 mb-5">
          Pick a random paper from the matching role subfolder in Drive.
        </p>

        <div className="space-y-2 mb-5">
          {ROLES.map(({ name, color }) => {
            const active = selectedRole === name
            const c = COLOR[color]
            return (
              <button
                key={name}
                onClick={() => setSelectedRole(name)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-colors ${
                  active ? c.btn : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${active ? c.badge : 'bg-gray-100 text-gray-500'}`}>
                  {name.split(' ').slice(-1)[0]}
                </span>
                <span className="text-sm font-medium text-gray-800">{name}</span>
              </button>
            )
          })}
        </div>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={importing}
            className="flex-1 text-sm text-gray-600 font-medium py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onImport(selectedRole)}
            disabled={importing}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 py-2.5 rounded-xl disabled:opacity-60 transition-colors"
          >
            {importing ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
                Importing…
              </>
            ) : (
              'Import Paper'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
