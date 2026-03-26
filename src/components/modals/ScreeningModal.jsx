import { useState, useEffect } from 'react'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const VERDICT_STYLES = {
  'Strong Match':  { bar: 'bg-green-500',  badge: 'bg-green-50 text-green-700 border-green-200',  border: 'border-green-200' },
  'Good Match':    { bar: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-700 border-blue-200',     border: 'border-blue-200'  },
  'Partial Match': { bar: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-200',  border: 'border-amber-200' },
  'Not a Match':   { bar: 'bg-red-400',    badge: 'bg-red-50 text-red-600 border-red-200',        border: 'border-red-200'   },
}

function CandidateResult({ r }) {
  const style = VERDICT_STYLES[r.verdict] || VERDICT_STYLES['Partial Match']
  return (
    <div className={`rounded-xl border ${style.border} p-4 space-y-2.5`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
            {r.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{r.name}</p>
            <p className="text-[10px] text-gray-400">{r.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.badge}`}>{r.verdict}</span>
          <span className="text-sm font-bold text-gray-700">{r.score}/100</span>
        </div>
      </div>

      {/* Score bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full transition-all ${style.bar}`} style={{ width: `${r.score}%` }} />
      </div>

      {/* Reasons */}
      <ul className="space-y-0.5">
        {r.reasons.map((reason, i) => (
          <li key={i} className="text-[11px] text-gray-600 flex gap-1.5">
            <span className="text-green-500 shrink-0">✓</span>{reason}
          </li>
        ))}
      </ul>

      {/* Concern */}
      {r.concern && (
        <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 flex gap-1.5">
          <span className="shrink-0">⚠</span>{r.concern}
        </p>
      )}
    </div>
  )
}

export function ScreeningModal({ candidates, onClose }) {
  const [results,   setResults]  = useState({})
  const [loading,   setLoading]  = useState(true)
  const [error,     setError]    = useState(null)
  const [activeTab, setActiveTab] = useState(null)

  useEffect(() => {
    const roles = [...new Set(candidates.map((c) => c.role))]

    const mockJobs = {
      'Senior Frontend Engineer': { job_title: 'Senior Frontend Engineer', department: 'Frontend Engineering', experience_from: '4', experience_to: '8', salary_min: '1800000', salary_max: '2800000', employee_type: 'Full Time', is_remote: 0 },
      'Product Manager':          { job_title: 'Product Manager',          department: 'Product Management',   experience_from: '3', experience_to: '7', salary_min: '2000000', salary_max: '3200000', employee_type: 'Full Time', is_remote: 0 },
      'Data Scientist':           { job_title: 'Data Scientist',           department: 'Data Science',         experience_from: '2', experience_to: '5', salary_min: '1500000', salary_max: '2500000', employee_type: 'Full Time', is_remote: 1 },
      'DevOps Engineer':          { job_title: 'DevOps Engineer',          department: 'DevOps & SRE',         experience_from: '3', experience_to: '6', salary_min: '1600000', salary_max: '2400000', employee_type: 'Full Time', is_remote: 0 },
    }

    setActiveTab(roles[0])

    Promise.all(
      roles.map(async (role) => {
        const roleCandidates = candidates.filter((c) => c.role === role)
        const job = mockJobs[role] || { job_title: role, department: role, experience_from: '0', experience_to: '∞', salary_min: null, salary_max: null, employee_type: 'Full Time', is_remote: 0 }
        const res = await fetch(`${BASE}/api/screen`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job, candidates: roleCandidates }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Screening failed')
        return { role, data }
      })
    )
      .then((all) => {
        const map = {}
        all.forEach(({ role, data }) => { map[role] = data })
        setResults(map)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const roles = Object.keys(results)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-indigo-600 text-base">✦</span>
              <h2 className="text-base font-bold text-gray-900">AI Candidate Screening</h2>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">All candidates screened against their respective job roles</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 flex-1">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Claude is screening all candidates by role…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex-1 flex items-center justify-center py-12 text-center">
            <div>
              <p className="text-sm font-medium text-red-500">Screening failed: {error}</p>
              <p className="text-xs text-gray-400 mt-1">Check your ANTHROPIC_API_KEY in server/.env</p>
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && !error && (
          <>
            {/* Role tabs */}
            <div className="flex gap-1 px-6 pt-4 overflow-x-auto shrink-0">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveTab(role)}
                  className={`whitespace-nowrap text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === role ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {role.split(' ').slice(-2).join(' ')}
                  <span className={`ml-1.5 text-[10px] font-bold ${activeTab === role ? 'text-indigo-200' : 'text-gray-400'}`}>
                    {results[role]?.length}
                  </span>
                </button>
              ))}
            </div>

            {/* Results list */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
              {(results[activeTab] || []).map((r) => (
                <CandidateResult key={r.id} r={r} />
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="w-full text-sm text-gray-600 font-medium py-2 rounded-xl border border-gray-200 hover:bg-gray-50">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
