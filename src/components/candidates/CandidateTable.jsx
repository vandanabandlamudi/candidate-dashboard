import { useState, useEffect } from 'react'
import { StatusDropdown } from '../common/StatusDropdown'
import { RoundPipeline }  from '../common/RoundPipeline'
import { IcoCheck }       from '../common/Icons'
import { ActionButtons }  from './ActionButtons'
import { fmtDate, highlight } from '../../utils/helpers'

function SortableHeader({ field, label, sortField, sortDir, onSort }) {
  const active = sortField === field
  return (
    <th className="px-4 py-3 text-left">
      <button
        onClick={() => onSort(field)}
        className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-800 transition-colors"
      >
        {label}
        <span className={`text-[10px] ${active ? 'text-indigo-500' : 'text-gray-300'}`}>
          {active && sortDir === 'asc' ? '↑' : '↓'}
        </span>
      </button>
    </th>
  )
}

function TableRow({ c, searchTerm, selected, onToggleSelect, onStatusChange, onSchedule, onVideo, onDelete, onViewQuestions }) {
  const [pendingStatus, setPendingStatus] = useState(c.status)
  useEffect(() => { setPendingStatus(c.status) }, [c.status])
  const isDirty = pendingStatus !== c.status
  const hl = (text) => highlight(text, searchTerm)
  const hasQuestions = c.sentQuestions?.length > 0

  return (
    <tr className={`transition-colors ${selected ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}>
      {/* Checkbox */}
      <td className="px-4 py-3">
        <button
          onClick={() => onToggleSelect(c.id)}
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
            selected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 hover:border-indigo-400'
          }`}
        >
          {selected && <IcoCheck />}
        </button>
      </td>

      {/* Candidate info */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-semibold">
              {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            {hasQuestions && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border border-white" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-tight">{hl(c.name)}</p>
            <p className="text-xs text-gray-400">{c.email}</p>
            <p className="text-xs text-gray-400">{c.phone}</p>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-4 py-3">
        <p className="text-xs font-medium text-gray-700 leading-tight">{c.role}</p>
        <p className="text-[11px] text-gray-400">{c.title} · {c.company}</p>
      </td>

      {/* Stage */}
      <td className="px-4 py-3">
        <div className="space-y-1">
          <StatusDropdown currentStatus={pendingStatus} onChange={setPendingStatus} />
          <RoundPipeline status={c.status} />
        </div>
      </td>

      {/* Applied */}
      <td className="px-4 py-3">
        <p className="text-xs text-gray-600">{fmtDate(c.appliedDate)}</p>
        {c.interview && (
          <p className="text-[10px] text-blue-500 font-medium mt-0.5">
            🗓 {fmtDate(c.interview.date)}
          </p>
        )}
        {hasQuestions && (
          <button
            onClick={() => onViewQuestions(c)}
            className="text-[10px] text-green-600 font-medium mt-0.5 hover:text-green-800"
          >
            📋 Questions
          </button>
        )}
      </td>

      {/* Exp */}
      <td className="px-4 py-3 text-xs text-gray-600">{c.exp}y</td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {isDirty && (
            <button
              onClick={() => onStatusChange(c.id, pendingStatus)}
              className="text-[11px] font-semibold px-3 py-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
            >
              Move
            </button>
          )}
          <ActionButtons
            candidate={c}
            onSchedule={onSchedule}
            onVideo={onVideo}
            onDelete={onDelete}
          />
        </div>
      </td>
    </tr>
  )
}

export function CandidateTable({
  rows,
  searchTerm,
  selectedIds,
  onToggleSelect,
  onStatusChange,
  onSchedule,
  onVideo,
  onDelete,
  onViewQuestions,
  sortField,
  sortDir,
  onSort,
}) {

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 w-10" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidate</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
              <SortableHeader field="status"      label="Stage"   sortField={sortField} sortDir={sortDir} onSort={onSort} />
              <SortableHeader field="appliedDate" label="Applied" sortField={sortField} sortDir={sortDir} onSort={onSort} />
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Exp</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-gray-400 text-sm">
                  No candidates match your filters
                </td>
              </tr>
            ) : (
              rows.map((c) => (
                <TableRow
                  key={c.id}
                  c={c}
                  searchTerm={searchTerm}
                  selected={selectedIds.has(c.id)}
                  onToggleSelect={onToggleSelect}
                  onStatusChange={onStatusChange}
                  onSchedule={onSchedule}
                  onVideo={onVideo}
                  onDelete={onDelete}
                  onViewQuestions={onViewQuestions}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
