export const STATUSES = [
  'Applied',
  'Shortlist',
  'In Evaluation R1',
  'In Evaluation R2',
  'In Evaluation HR',
  'Offer',
  'Reject',
]

export const FORWARD_MAP = {
  Applied:                'Shortlist',
  Shortlist:              'In Evaluation R1',
  'In Evaluation R1':     'In Evaluation R2',
  'In Evaluation R2':     'In Evaluation HR',
  'In Evaluation HR':   'Offer',
}

// Display labels for each status key — single source of truth
export const STATUS_LABELS = {
  Applied:            'Applied',
  Shortlist:          'Shortlisted',
  'In Evaluation R1': 'Evaluated R1',
  'In Evaluation R2': 'Evaluated R2',
  'In Evaluation HR': 'Evaluated HR',
  Offer:              'Offer',
  Reject:             'Reject',
}

export const STATUS_META = {
  Applied:               { bg: 'bg-sky-100',    text: 'text-sky-800',    dot: 'bg-sky-400',    border: 'border-sky-300',    label: STATUS_LABELS['Applied'],            order: 0 },
  Shortlist:             { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-400', border: 'border-yellow-300', label: STATUS_LABELS['Shortlist'],          order: 1 },
  'In Evaluation R1':    { bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-400',   border: 'border-blue-300',   label: STATUS_LABELS['In Evaluation R1'],   order: 2 },
  'In Evaluation R2':    { bg: 'bg-violet-100', text: 'text-violet-800', dot: 'bg-violet-400', border: 'border-violet-300', label: STATUS_LABELS['In Evaluation R2'],   order: 3 },
  'In Evaluation HR':    { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-400', border: 'border-indigo-300', label: STATUS_LABELS['In Evaluation HR'],   order: 4 },
  Offer:                 { bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500',  border: 'border-green-300',  label: STATUS_LABELS['Offer'],              order: 5 },
  Reject:                { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-400',    border: 'border-red-300',    label: STATUS_LABELS['Reject'],             order: 7 },
}

export const ALL_STATUSES_FILTER = ['All Statuses', ...STATUSES]

export const PER_PAGE_OPTIONS = [15, 25, 50]
