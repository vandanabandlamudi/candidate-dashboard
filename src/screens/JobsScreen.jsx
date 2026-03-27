import { useState, useEffect } from 'react'
import { useJobs } from '../hooks/useJobs'
import { api } from '../api/client.js'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const TYPE_COLORS = {
  'Full Time':  'bg-green-50 text-green-700',
  'Part Time':  'bg-blue-50 text-blue-700',
  'Contract':   'bg-amber-50 text-amber-700',
  'Internship': 'bg-purple-50 text-purple-700',
}

const VERDICT_STYLES = {
  'Strong Match':  { bar: 'bg-green-500',  badge: 'bg-green-50 text-green-700',  border: 'border-green-200' },
  'Good Match':    { bar: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-700',    border: 'border-blue-200'  },
  'Partial Match': { bar: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700',  border: 'border-amber-200' },
  'Not a Match':   { bar: 'bg-red-400',    badge: 'bg-red-50 text-red-600',      border: 'border-red-200'   },
}

// ── Screening Modal ───────────────────────────────────────────────────────────
function ScreeningModal({ job, results, loading, error, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900"> Shortlisting Candidates </h2>
            <p className="text-xs text-gray-500 mt-0.5">{job.job_title} · {job.department}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Claude is screening candidates…</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12 text-red-500">
              <p className="text-sm font-medium">Screening failed: {error}</p>
              <p className="text-xs text-gray-400 mt-1">Check your ANTHROPIC_API_KEY in server/.env</p>
            </div>
          )}

          {!loading && !error && results.map((r) => {
            const style = VERDICT_STYLES[r.verdict] || VERDICT_STYLES['Partial Match']
            return (
              <div key={r.id} className={`rounded-xl border ${style.border} p-4 space-y-2.5`}>
                {/* Name + verdict + score */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {r.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badge}`}>{r.verdict}</span>
                    <span className="text-sm font-bold text-gray-700">{r.score}/100</span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${style.bar}`} style={{ width: `${r.score}%` }} />
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
          })}
        </div>

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

// ── Job Card ──────────────────────────────────────────────────────────────────
function JobCard({ job, candidates, onScreen, onViewScreened, isAllScreened, hasNoCandidates }) {
  const [expanded, setExpanded] = useState(false)
  const typeColor = TYPE_COLORS[job.employee_type] || 'bg-gray-100 text-gray-600'

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm leading-tight">{job.job_title}</p>
          <p className="text-[11px] text-gray-500 mt-0.5">{job.group_company} · {job.department}</p>
        </div>
        <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColor}`}>
          {job.employee_type || 'N/A'}
        </span>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {job.is_remote === 1 && (
          <span className="text-[10px] font-medium bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">Remote</span>
        )}
        {job.post_on_ijp_page === 1 && (
          <span className="text-[10px] font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">IJP</span>
        )}
        {job.post_on_refer_page === 1 && (
          <span className="text-[10px] font-medium bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">Referral</span>
        )}
        {job.business_unit && (
          <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{job.business_unit}</span>
        )}
      </div>

      {/* Location */}
      {job.location?.length > 0 && (
        <div className="flex items-start gap-1.5">
          <span className="text-gray-400 text-xs mt-0.5">📍</span>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            {job.location_city?.join(', ')} · {job.location_country}
          </p>
        </div>
      )}

      {/* Experience */}
      {(job.experience_from || job.experience_to) && (
        <p className="text-[11px] text-gray-500">
          ⏱ Exp: {job.experience_from || '0'} – {job.experience_to || '∞'} yrs
        </p>
      )}

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-gray-100 pt-3 space-y-1.5 text-[11px] text-gray-500">
          <p><span className="font-medium text-gray-700">Job Code:</span> {job.job_code}</p>
          <p><span className="font-medium text-gray-700">Job ID:</span> {job.job_id}</p>
          {job.parent_department && (
            <p><span className="font-medium text-gray-700">Parent Dept:</span> {job.parent_department}</p>
          )}
          {job.division && (
            <p><span className="font-medium text-gray-700">Division:</span> {job.division}</p>
          )}
          {(job.salary_min || job.salary_max) && (
            <p><span className="font-medium text-gray-700">Salary:</span> ₹{Number(job.salary_min).toLocaleString('en-IN')} – ₹{Number(job.salary_max).toLocaleString('en-IN')}</p>
          )}
          <p><span className="font-medium text-gray-700">Created:</span> {job.job_created_timestamp}</p>
          <p><span className="font-medium text-gray-700">Updated:</span> {job.job_updated_timestamp}</p>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-[11px] text-indigo-500 font-medium hover:text-indigo-700"
        >
          {expanded ? 'Less ▲' : 'Details ▼'}
        </button>
        {hasNoCandidates ? (
          <span className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-gray-400 cursor-default">
            No Candidates
          </span>
        ) : isAllScreened ? (
          <button
            onClick={() => onViewScreened(job)}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            👁 View Screened
          </button>
        ) : (
          <button
            onClick={() => onScreen(job)}
            className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            ✦ Screen Candidates
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export function JobsScreen({ candidates = [] }) {
  const { jobs, loading, error, refetch } = useJobs()
  const [search,        setSearch]        = useState('')
  const [typeFilter,    setTypeFilter]    = useState('All')
  const [screenJob,     setScreenJob]     = useState(null)
  const [screenRes,     setScreenRes]     = useState([])
  const [screenLoad,    setScreenLoad]    = useState(false)
  const [screenErr,     setScreenErr]     = useState(null)
  const [screenedRows,  setScreenedRows]  = useState([]) // all DB screening results

  // Load existing screening results on mount
  useEffect(() => {
    api.getScreeningResults().then(setScreenedRows).catch(() => {})
  }, [])

  const types = ['All', ...new Set(jobs.map((j) => j.employee_type).filter(Boolean))]

  const filtered = jobs.filter((j) => {
    const matchType   = typeFilter === 'All' || j.employee_type === typeFilter
    const q           = search.toLowerCase()
    const matchSearch = !q || [j.job_title, j.department, j.group_company, j.job_code]
      .some((v) => v?.toLowerCase().includes(q))
    return matchType && matchSearch
  })

  // A job matches a candidate role if either string contains the other (case-insensitive)
  const roleMatchesJob = (candidateRole, jobTitle) => {
    if (!candidateRole || !jobTitle) return false
    const r = candidateRole.toLowerCase()
    const j = jobTitle.toLowerCase()
    return r === j || j.includes(r) || r.includes(j)
  }

  // Candidates that match this job by role title
  const jobCandidates = (job) =>
    candidates.filter((c) => roleMatchesJob(c.role, job.job_title))

  // Screening results already saved for this job (match by candidate role against job title)
  const jobScreenedRows = (job) =>
    screenedRows.filter((r) => roleMatchesJob(r.role, job.job_title))

  // All matching candidates are already screened
  const allScreened = (job) => {
    const jc = jobCandidates(job)
    if (jc.length === 0) return false
    const screenedIds = new Set(jobScreenedRows(job).map((r) => r.candidate_id))
    return jc.every((c) => screenedIds.has(c.id))
  }

  const handleViewScreened = (job) => {
    const rows = jobScreenedRows(job)
    const results = rows.map((r) => ({
      id:      r.candidate_id,
      name:    r.candidate_name,
      score:   r.score,
      verdict: r.verdict,
      reasons: r.reasons ?? [],
      concern: r.concern,
    }))
    setScreenJob(job)
    setScreenRes(results)
    setScreenErr(null)
    setScreenLoad(false)
  }

  const handleScreen = async (job) => {
    setScreenJob(job)
    setScreenRes([])
    setScreenErr(null)
    setScreenLoad(true)

    // Only screen candidates not yet in DB for this job
    const screenedIds = new Set(jobScreenedRows(job).map((r) => r.candidate_id))
    const toScreen = jobCandidates(job).filter((c) => !screenedIds.has(c.id))

    if (toScreen.length === 0) {
      handleViewScreened(job)
      return
    }

    try {
      const res = await fetch(`${BASE}/api/screen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job, candidates: toScreen }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Screening failed')

      // Save new results to DB
      const nameToId = Object.fromEntries(toScreen.map((c) => [c.name.toLowerCase(), c.id]))
      const enriched = data.map((r) => ({
        ...r,
        id: nameToId[r.name?.toLowerCase()] ?? r.id,
        job_title: job.job_title,
        department: job.department,
      }))
      await api.saveScreeningResults(enriched)

      // Refresh DB rows and merge with any already-screened for this job
      const fresh = await api.getScreeningResults()
      setScreenedRows(fresh)

      const allForJob = fresh
        .filter((r) => r.job_title?.toLowerCase() === job.job_title?.toLowerCase())
        .map((r) => ({
          id:      r.candidate_id,
          name:    r.candidate_name,
          score:   r.score,
          verdict: r.verdict,
          reasons: r.reasons ?? [],
          concern: r.concern,
        }))
      setScreenRes(allForJob)
    } catch (err) {
      setScreenErr(err.message)
    } finally {
      setScreenLoad(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-5 space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-end gap-4 flex-wrap">
        <button
          onClick={refetch}
          disabled={loading}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3 flex flex-wrap gap-3 items-end">
        <div className="flex-[2] min-w-0 w-full sm:w-auto sm:min-w-48">
          <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Job title, department, company…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div className="flex-1 min-w-0 w-full sm:w-auto sm:min-w-36">
          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            {types.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {loading && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-base font-medium">Loading jobs…</p>
        </div>
      )}
      {error && (
        <div className="text-center py-16 text-red-400">
          <p className="text-base font-medium">Failed to load jobs: {error}</p>
        </div>
      )}

      {!loading && !error && (
        filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((job) => (
              <JobCard
                key={job.job_id}
                job={job}
                candidates={candidates}
                onScreen={handleScreen}
                onViewScreened={handleViewScreened}
                isAllScreened={allScreened(job)}
                hasNoCandidates={jobCandidates(job).length === 0}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-3">🔍</p>
            <p className="text-base font-medium text-gray-500">No jobs match your filters</p>
          </div>
        )
      )}

      {screenJob && (
        <ScreeningModal
          job={screenJob}
          results={screenRes}
          loading={screenLoad}
          error={screenErr}
          onClose={() => setScreenJob(null)}
        />
      )}
    </div>
  )
}
