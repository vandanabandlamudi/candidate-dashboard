import { useMemo } from 'react'
import { PER_PAGE_OPTIONS } from '../../constants/statuses'

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const pages = [1]
  if (currentPage > 3) pages.push('…')
  const lo = Math.max(2, currentPage - 1)
  const hi = Math.min(totalPages - 1, currentPage + 1)
  for (let i = lo; i <= hi; i++) pages.push(i)
  if (currentPage < totalPages - 2) pages.push('…')
  if (totalPages > 1) pages.push(totalPages)
  return pages
}

export function Pagination({ currentPage, totalPages, perPage, totalItems, onPageChange, onPerPageChange }) {
  const start = (currentPage - 1) * perPage + 1
  const end   = Math.min(currentPage * perPage, totalItems)
  const pages = useMemo(() => getPageNumbers(currentPage, totalPages), [currentPage, totalPages])

  if (totalItems === 0) return null

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Showing {start}–{end} of {totalItems}</span>
        <select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          {PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n} per page</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-xs">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 text-xs font-medium rounded-lg border transition-colors ${
                p === currentPage
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
