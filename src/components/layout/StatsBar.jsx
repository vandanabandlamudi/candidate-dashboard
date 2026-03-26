const STAT_CONFIG = [
  { key: 'total',    label: 'Total',     color: 'text-gray-800',   bg: 'bg-white',       status: null           },
  { key: 'screen',   label: 'Screening', color: 'text-yellow-700', bg: 'bg-yellow-50',   status: 'Screening'    },
  { key: 'r1',       label: 'Round 1',   color: 'text-blue-700',   bg: 'bg-blue-50',     status: 'Interview R1' },
  { key: 'r2',       label: 'Round 2',   color: 'text-violet-700', bg: 'bg-violet-50',   status: 'Interview R2' },
  { key: 'r3',       label: 'Round 3',   color: 'text-indigo-700', bg: 'bg-indigo-50',   status: 'Interview R3' },
  { key: 'offer',    label: 'Offer',     color: 'text-green-700',  bg: 'bg-green-50',    status: 'Offer'        },
  { key: 'rejected', label: 'Rejected',  color: 'text-red-600',    bg: 'bg-red-50',      status: 'Rejected'     },
]

export function StatsBar({ candidates, selectedRole, activeStatus, onStatusFilter }) {
  const base = selectedRole === 'All Roles' ? candidates : candidates.filter((c) => c.role === selectedRole)

  const stats = {
    total:    base.length,
    screen:   base.filter((c) => c.status === 'Screening').length,
    r1:       base.filter((c) => c.status === 'Interview R1').length,
    r2:       base.filter((c) => c.status === 'Interview R2').length,
    r3:       base.filter((c) => c.status === 'Interview R3').length,
    offer:    base.filter((c) => c.status === 'Offer').length,
    rejected: base.filter((c) => c.status === 'Rejected').length,
  }

  const handleClick = (status) => {
    if (!onStatusFilter) return
    // clicking the active filter or Total clears it
    onStatusFilter(activeStatus === status && status !== null ? 'All Statuses' : (status ?? 'All Statuses'))
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
      {STAT_CONFIG.map(({ key, label, color, bg, status }) => {
        const isActive = status === null ? activeStatus === 'All Statuses' : activeStatus === status
        return (
          <button
            key={key}
            onClick={() => handleClick(status)}
            className={`${bg} rounded-xl border p-2.5 text-center transition-all cursor-pointer
              ${isActive ? 'border-gray-400 ring-2 ring-offset-1 ring-gray-300 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}
            `}
          >
            <p className={`text-xl font-bold ${color}`}>{stats[key]}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{label}</p>
          </button>
        )
      })}
    </div>
  )
}
