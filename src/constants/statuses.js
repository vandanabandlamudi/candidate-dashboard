export const STATUSES = [
  'Screening',
  'Interview R1',
  'Interview R2',
  'Interview R3',
  'Offer',
  'Rejected',
]

export const FORWARD_MAP = {
  Screening:      'Interview R1',
  'Interview R1': 'Interview R2',
  'Interview R2': 'Interview R3',
  'Interview R3': 'Offer',
}

export const STATUS_META = {
  Screening:      { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-400', border: 'border-yellow-300', label: 'Screening',      order: 0 },
  'Interview R1': { bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-400',   border: 'border-blue-300',   label: 'Interview · R1', order: 1 },
  'Interview R2': { bg: 'bg-violet-100', text: 'text-violet-800', dot: 'bg-violet-400', border: 'border-violet-300', label: 'Interview · R2', order: 2 },
  'Interview R3': { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-400', border: 'border-indigo-300', label: 'Interview · R3', order: 3 },
  Offer:          { bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500',  border: 'border-green-300',  label: 'Offer',          order: 4 },
  Rejected:       { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-400',    border: 'border-red-300',    label: 'Rejected',       order: 5 },
}

export const ALL_ROLES_FILTER = [
  'All Roles',
  'Senior Frontend Engineer',
  'Product Manager',
  'Data Scientist',
  'DevOps Engineer',
]

export const ALL_STATUSES_FILTER = ['All Statuses', ...STATUSES]

export const PER_PAGE_OPTIONS = [10, 25, 50]
