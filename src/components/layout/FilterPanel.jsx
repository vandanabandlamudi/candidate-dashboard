import { ALL_ROLES_FILTER, ALL_STATUSES_FILTER } from '../../constants/statuses'

export function FilterPanel({
  selectedRole, onRoleChange,
  selectedStatus, onStatusChange,
  keyword, onKeywordChange,
  hasActiveFilters, onClearAll,
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3 flex flex-wrap gap-3 items-end">
      {/* Role */}
      <div className="flex-1 min-w-40">
        <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
        <select
          value={selectedRole}
          onChange={(e) => onRoleChange(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {ALL_ROLES_FILTER.map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>

      {/* Status */}
      <div className="flex-1 min-w-36">
        <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          {ALL_STATUSES_FILTER.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Keyword */}
      <div className="flex-[2] min-w-48">
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Keyword Filter{' '}
          <span className="text-gray-400 font-normal">(skills, summary, company)</span>
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="e.g. React, NLP, Razorpay…"
            value={keyword}
            onChange={(e) => onKeywordChange(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          {keyword && (
            <button
              onClick={() => onKeywordChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Clear all */}
      {hasActiveFilters && (
        <button
          onClick={onClearAll}
          className="text-xs text-indigo-600 font-medium hover:text-indigo-800 whitespace-nowrap pb-1"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
