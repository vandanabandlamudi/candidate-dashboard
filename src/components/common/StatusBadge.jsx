import { STATUS_META } from '../../constants/statuses'

export function StatusBadge({ status }) {
  const m = STATUS_META[status] ?? { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400', label: status }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  )
}
