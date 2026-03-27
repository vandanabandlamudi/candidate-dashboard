const STAT_CONFIG = [
  { key: 'total',  label: 'Total',            color: 'text-gray-800',   bg: 'bg-white',       status: null                },
  { key: 'short',  label: 'Shortlist',     color: 'text-sky-700',    bg: 'bg-sky-50',      status: 'Shortlist'      },
  { key: 'screen', label: 'Screen',        color: 'text-yellow-700', bg: 'bg-yellow-50',   status: 'Screen'         },
  { key: 'ev1',    label: 'Evaluation R1',    color: 'text-blue-700',   bg: 'bg-blue-50',     status: 'In Evaluation R1'  },
  { key: 'ev2',    label: 'Evaluation R2',    color: 'text-violet-700', bg: 'bg-violet-50',   status: 'In Evaluation R2'  },
  { key: 'ev3',    label: 'Evaluation R3',    color: 'text-indigo-700', bg: 'bg-indigo-50',   status: 'In Evaluation R3'  },
  { key: 'offer',  label: 'Offer',            color: 'text-green-700',  bg: 'bg-green-50',    status: 'Offer'             },
  // { key: 'active', label: 'Active Employees', color: 'text-teal-700',   bg: 'bg-teal-50',     status: 'Active Employees'  },
  { key: 'reject', label: 'Reject',         color: 'text-red-600',    bg: 'bg-red-50',      status: 'Reject'          },
]

const ROLE_COLORS = [
  { color: 'text-indigo-700', bg: 'bg-indigo-50',  ring: 'ring-indigo-300',  border: 'border-indigo-300'  },
  { color: 'text-pink-700',   bg: 'bg-pink-50',    ring: 'ring-pink-300',    border: 'border-pink-300'    },
  { color: 'text-teal-700',   bg: 'bg-teal-50',    ring: 'ring-teal-300',    border: 'border-teal-300'    },
  { color: 'text-orange-700', bg: 'bg-orange-50',  ring: 'ring-orange-300',  border: 'border-orange-300'  },
  { color: 'text-cyan-700',   bg: 'bg-cyan-50',    ring: 'ring-cyan-300',    border: 'border-cyan-300'    },
  { color: 'text-rose-700',   bg: 'bg-rose-50',    ring: 'ring-rose-300',    border: 'border-rose-300'    },
  { color: 'text-lime-700',   bg: 'bg-lime-50',    ring: 'ring-lime-300',    border: 'border-lime-300'    },
  { color: 'text-purple-700', bg: 'bg-purple-50',  ring: 'ring-purple-300',  border: 'border-purple-300'  },
]

export function StatusBar({ candidates, selectedRole, activeStatus, onStatusFilter, onRoleFilter }) {
  const base = selectedRole === 'All Roles' ? candidates : candidates.filter((c) => c.role === selectedRole)

  const stats = {
    total:  base.length,
    short:  base.filter((c) => c.status === 'Shortlist').length,
    screen: base.filter((c) => c.status === 'Screen').length,
    ev1:    base.filter((c) => c.status === 'In Evaluation R1').length,
    ev2:    base.filter((c) => c.status === 'In Evaluation R2').length,
    ev3:    base.filter((c) => c.status === 'In Evaluation R3').length,
    offer:  base.filter((c) => c.status === 'Offer').length,
    // active: base.filter((c) => c.status === 'Active Employees').length,
    reject: base.filter((c) => c.status === 'Reject').length,
  }

  const roles = [...new Set(candidates.map((c) => c.role).filter(Boolean))].sort()
  const roleCounts = Object.fromEntries(roles.map((r) => [r, candidates.filter((c) => c.role === r).length]))

  const handleStatusClick = (status) => {
    if (!onStatusFilter) return
    const next = status ?? 'All Statuses'
    if (activeStatus === next) return
    onStatusFilter(next)
  }

  const handleRoleClick = (role) => {
    if (!onRoleFilter) return
    if (selectedRole === role) return
    onRoleFilter(role)
  }

  return (
    <div className="space-y-8">
      {/* Status count cards */}
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2 sm:gap-3">
        {STAT_CONFIG.map(({ key, label, color, bg, status }) => {
          const isActive = status === null ? activeStatus === 'All Statuses' : activeStatus === status
          return (
            <button
              key={key}
              onClick={() => handleStatusClick(status)}
              className={`${bg} rounded-xl border p-2.5 text-center transition-all cursor-pointer
                ${isActive ? 'border-gray-400 ring-2 ring-offset-1 ring-gray-300 shadow-sm' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}
              `}
            >
              <p className={`text-xl font-bold ${color}`}>{stats[key]}</p>
              <p className="text-[12px] text-gray-600 mt-0.5 leading-tight">{label}</p>
            </button>
          )
        })}
      </div>

      {/* Role count cards */}
      {roles.length > 0 && (
        <div className="flex gap-2 sm:gap-3 flex-wrap">
          {roles.map((role, i) => {
            const { color, bg, ring, border } = ROLE_COLORS[i % ROLE_COLORS.length]
            const isActive = selectedRole === role
            return (
              <button
                key={role}
                onClick={() => handleRoleClick(role)}
                className={`${bg} rounded-xl border px-3 py-2 text-left transition-all cursor-pointer flex items-center gap-2.5
                  ${isActive ? `${border} ring-2 ring-offset-1 ${ring} shadow-sm` : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}
                `}
              >
                <p className={`text-lg font-bold ${color}`}>{roleCounts[role]}</p>
                <p className="text-[14px] text-gray-600 leading-tight max-w-[150px] ">{role}</p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
