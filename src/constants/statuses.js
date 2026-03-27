export const STATUSES = [
  'Shortlist',
  'Screen',
  'In Evaluation R1',
  'In Evaluation R2',
  'In Evaluation R3',
  'Offer',
  'Reject',
]

export const FORWARD_MAP = {
  Shortlist:           'Screen',
  Screen:              'In Evaluation R1',
  'In Evaluation R1':  'In Evaluation R2',
  'In Evaluation R2':  'In Evaluation R3',
  'In Evaluation R3':  'Offer',
}

export const STATUS_META = {
  Shortlist:           { bg: 'bg-sky-100',    text: 'text-sky-800',    dot: 'bg-sky-400',    border: 'border-sky-300',    label: 'Shortlist',         order: 0 },
  Screen:              { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-400', border: 'border-yellow-300', label: 'Screen',            order: 1 },
  'In Evaluation R1':  { bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-400',   border: 'border-blue-300',   label: 'In Evaluation · R1',order: 2 },
  'In Evaluation R2':  { bg: 'bg-violet-100', text: 'text-violet-800', dot: 'bg-violet-400', border: 'border-violet-300', label: 'In Evaluation · R2',order: 3 },
  'In Evaluation R3':  { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-400', border: 'border-indigo-300', label: 'In Evaluation · R3',order: 4 },
  Offer:               { bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500',  border: 'border-green-300',  label: 'Offer',             order: 5 },
  Reject:            { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-400',    border: 'border-red-300',    label: 'Reject',          order: 7 },
}

export const ALL_STATUSES_FILTER = ['All Statuses', ...STATUSES]

export const PER_PAGE_OPTIONS = [15, 25, 50]
