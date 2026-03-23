const Icon = ({ d, className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
)

export const IcoGrid    = () => <Icon d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
export const IcoList    = () => <Icon d="M4 6h16M4 10h16M4 14h16M4 18h16" />
export const IcoForward = () => <Icon d="M13 7l5 5m0 0l-5 5m5-5H6" />
export const IcoCal     = () => <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
export const IcoVideo   = () => <Icon d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.259a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
export const IcoTrash   = () => <Icon d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
export const IcoSearch  = () => <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
export const IcoCheck   = () => <Icon d="M5 13l4 4L19 7" className="w-3 h-3" />
export const IcoDown    = () => <Icon d="M19 9l-7 7-7-7" className="w-3 h-3" />
export const IcoSend    = () => <Icon d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
export const IcoX       = () => <Icon d="M6 18L18 6M6 6l12 12" className="w-4 h-4" />
