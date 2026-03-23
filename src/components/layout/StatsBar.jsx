const STAT_CONFIG = [
  { key: 'total',    label: 'Total',     color: 'text-gray-800',   bg: 'bg-white' },
  { key: 'screen',   label: 'Screening', color: 'text-yellow-700', bg: 'bg-yellow-50' },
  { key: 'r1',       label: 'Round 1',   color: 'text-blue-700',   bg: 'bg-blue-50' },
  { key: 'r2',       label: 'Round 2',   color: 'text-violet-700', bg: 'bg-violet-50' },
  { key: 'r3',       label: 'Round 3',   color: 'text-indigo-700', bg: 'bg-indigo-50' },
  { key: 'offer',    label: 'Offer',     color: 'text-green-700',  bg: 'bg-green-50' },
  { key: 'rejected', label: 'Rejected',  color: 'text-red-600',    bg: 'bg-red-50' },
]

export function StatsBar({ candidates, selectedRole }) {
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

  return (
    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
      {STAT_CONFIG.map(({ key, label, color, bg }) => (
        <div key={key} className={`${bg} rounded-xl border border-gray-200 p-2.5 text-center`}>
          <p className={`text-xl font-bold ${color}`}>{stats[key]}</p>
          <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{label}</p>
        </div>
      ))}
    </div>
  )
}
