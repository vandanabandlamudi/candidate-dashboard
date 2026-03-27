import { IcoGrid, IcoList, IcoSearch } from '../common/Icons'

const SCREEN_TITLE = {
  hiring:      'Candidates',
  assessments: 'Assessments',
  papers:      'Question Papers',
  screening:   'Shortlisting',
  jobs:        'Job Listings',
}

export function Header({ screen, globalSearch, onGlobalSearch, viewMode, onViewModeChange }) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-4">
      {/* Screen title */}
      <h2 className="text-sm font-bold text-gray-900 shrink-0">{SCREEN_TITLE[screen]}</h2>

      {screen === 'hiring' && (
        <>
          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <IcoSearch />
            </span>
            <input
              type="text"
              placeholder="Search by name, email or phone…"
              value={globalSearch}
              onChange={(e) => onGlobalSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400"
            />
            {globalSearch && (
              <button
                onClick={() => onGlobalSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* View toggle */}
          <div className="ml-auto flex border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {[
              { value: 'card',  label: 'Cards', Icon: IcoGrid },
              { value: 'table', label: 'Table', Icon: IcoList  },
            ].map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => onViewModeChange(value)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                  viewMode === value ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon /> {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
