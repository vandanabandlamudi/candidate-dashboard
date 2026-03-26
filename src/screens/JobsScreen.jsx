import { useState } from 'react'
import { useJobs } from '../hooks/useJobs'

const TYPE_COLORS = {
  'Full Time':  'bg-green-50 text-green-700',
  'Part Time':  'bg-blue-50 text-blue-700',
  'Contract':   'bg-amber-50 text-amber-700',
  'Internship': 'bg-purple-50 text-purple-700',
}

function JobCard({ job }) {
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

      {/* Tags row */}
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
        <p className="text-[10px] text-gray-400">{job.job_code}</p>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-[11px] text-indigo-500 font-medium hover:text-indigo-700"
        >
          {expanded ? 'Less ▲' : 'Details ▼'}
        </button>
      </div>
    </div>
  )
}

export function JobsScreen() {
  const { jobs, loading, error, refetch } = useJobs()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')

  const types = ['All', ...new Set(jobs.map((j) => j.employee_type).filter(Boolean))]

  const filtered = jobs.filter((j) => {
    const matchType   = typeFilter === 'All' || j.employee_type === typeFilter
    const q           = search.toLowerCase()
    const matchSearch = !q || [j.job_title, j.department, j.group_company, j.job_code]
      .some((v) => v?.toLowerCase().includes(q))
    return matchType && matchSearch
  })

  return (
    <div className="max-w-7xl mx-auto px-6 py-5 space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-bold text-gray-900">Job Listings</h2>
          <p className="text-xs text-gray-400 mt-0.5">Pulled from Darwinbox · {jobs.length} open jobs</p>
        </div>
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
        <div className="flex-[2] min-w-48">
          <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Job title, department, company…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div className="flex-1 min-w-36">
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

      {/* States */}
      {loading && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-base font-medium">Loading jobs from Darwinbox…</p>
        </div>
      )}
      {error && (
        <div className="text-center py-16 text-red-400">
          <p className="text-base font-medium">Failed to load jobs: {error}</p>
          <p className="text-sm mt-1 text-gray-400">Make sure the backend server is running and Darwinbox credentials are set.</p>
        </div>
      )}

      {/* Grid */}
      {!loading && !error && (
        filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((job) => <JobCard key={job.job_id} job={job} />)}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-400">
            <p className="text-5xl mb-3">🔍</p>
            <p className="text-base font-medium text-gray-500">No jobs match your filters</p>
          </div>
        )
      )}
    </div>
  )
}
