import { STATUSES, STATUS_META } from '../../constants/statuses'
import { IcoSend } from '../common/Icons'

export function BulkActionBar({
  selectedCount,
  r1SelectedCount,
  bulkStatus,
  onBulkStatusChange,
  onApplyBulk,
  onSendQuestionnaire,
  onClearSelection,
}) {
  if (selectedCount === 0) return null

  return (
    <div className="rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3 bg-indigo-600">
      {/* Count */}
      <span className="text-white text-sm font-semibold">{selectedCount} selected</span>

      {/* Questionnaire trigger */}
      {r1SelectedCount > 0 && (
        <button
          onClick={onSendQuestionnaire}
          className="flex items-center gap-1.5 bg-white text-indigo-700 font-semibold text-xs px-3 py-1.5 rounded-xl hover:bg-indigo-50 transition-colors"
        >
          <IcoSend />
          Send R1 Questionnaire
          <span className="bg-indigo-100 text-indigo-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
            {r1SelectedCount}
          </span>
        </button>
      )}

      {/* Bulk status */}
      <div className="flex items-center gap-2 ml-auto">
        <span className="text-white/70 text-xs">Move all to:</span>
        <select
          value={bulkStatus}
          onChange={(e) => onBulkStatusChange(e.target.value)}
          className="border-0 rounded-lg px-3 py-1.5 text-sm bg-white text-gray-800 font-medium focus:outline-none"
        >
          <option value="">Pick status…</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_META[s]?.label ?? s}</option>
          ))}
        </select>
        <button
          onClick={onApplyBulk}
          disabled={!bulkStatus}
          className="bg-white/20 border border-white/30 text-white font-semibold text-sm px-3 py-1.5 rounded-lg disabled:opacity-40 hover:bg-white/30 transition-colors"
        >
          Apply
        </button>
        <button
          onClick={onClearSelection}
          className="text-white/60 hover:text-white text-sm"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
