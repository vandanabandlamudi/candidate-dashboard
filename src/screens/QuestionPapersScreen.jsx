import { useState } from 'react'
import { PaperBuilder }          from '../components/papers/PaperBuilder'
import { PaperDetailView }       from '../components/papers/PaperDetailView'
import { AssignPaperModal }      from '../components/papers/AssignPaperModal'
import { ImportFromDriveModal }  from '../components/papers/ImportFromDriveModal'
import { IcoTrash }              from '../components/common/Icons'
import { api }                   from '../api/client'

const ROLE_COLOR = {
  'Senior Frontend Engineer': 'bg-violet-100 text-violet-700',
  'Product Manager':          'bg-amber-100 text-amber-700',
  'Data Scientist':           'bg-blue-100 text-blue-700',
  'DevOps Engineer':          'bg-green-100 text-green-700',
}

export function QuestionPapersScreen({
  papers, candidates, submissions, pendingTokens = [],
  loading,
  onAddPaper, onUpdatePaper, onDeletePaper,
  onImportFromDrive, importing, importError,
}) {
  const [selectedId,    setSelectedId]    = useState(null)
  const [view,          setView]          = useState('list')   // 'list' | 'builder' | 'edit'
  const [editPaper,     setEditPaper]     = useState(null)
  const [assignPaper,   setAssignPaper]   = useState(null)
  const [showDriveModal, setShowDriveModal] = useState(false)

  const selectedPaper = papers.find((p) => p.id === selectedId) ?? null

  const openBuilder = (paper = null) => {
    setEditPaper(paper)
    setView(paper ? 'edit' : 'builder')
    setSelectedId(null)
  }

  const handleSave = (paper) => {
    if (editPaper) {
      onUpdatePaper(editPaper.id, paper)
    } else {
      onAddPaper(paper)
    }
    setView('list')
    setEditPaper(null)
  }

  if (view === 'builder' || view === 'edit') {
    return (
      <PaperBuilder
        initial={editPaper}
        onSave={handleSave}
        onCancel={() => { setView('list'); setEditPaper(null) }}
      />
    )
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mr-3" />
      <p className="text-sm font-medium">Loading …</p>
    </div>
  )

  // ── Split-panel list view ──────────────────────────────────────────────────
  return (
    <div className="flex flex-1 min-h-0">

      {/* ── Left: paper list ──────────────────────────────────── */}
      <div className={`${selectedId ? 'hidden md:flex' : 'flex'} w-full md:w-72 md:shrink-0 border-r border-gray-200 bg-white flex-col`}>
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">{papers.length} paper{papers.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowDriveModal(true)}
              className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
              title="Import random paper from Google Drive"
            >
              Drive
            </button>
            <button
              onClick={() => openBuilder()}
              className="text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 rounded-xl hover:bg-indigo-100 transition-colors"
            >
              + New
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {papers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-gray-400">
              <p className="text-3xl mb-2">📄</p>
              <p className="text-xs font-medium text-gray-500">No papers yet</p>
              <p className="text-[10px] mt-1">Click + New to create one</p>
            </div>
          ) : (
            <ul>
              {papers.map((paper) => {
                const mcqCount   = paper.questions.filter((q) => q.type === 'mcq').length
                const openCount  = paper.questions.filter((q) => q.type === 'open').length
                const isSelected = selectedId === paper.id

                return (
                  <li key={paper.id}>
                    <button
                      onClick={() => setSelectedId(paper.id)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-gray-900 leading-snug">{paper.title}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeletePaper(paper.id); if (isSelected) setSelectedId(null) }}
                          className="text-gray-300 hover:text-red-500 transition-colors shrink-0 mt-0.5"
                        >
                          <IcoTrash />
                        </button>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${ROLE_COLOR[paper.role] ?? 'bg-gray-100 text-gray-600'}`}>
                          {paper.role.split(' ').slice(0, 2).join(' ')}
                        </span>
                        {mcqCount > 0  && <span className="text-[9px] text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full">{mcqCount} MCQ</span>}
                        {openCount > 0 && <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">{openCount} Open</span>}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ── Right: detail view ────────────────────────────────── */}
      {selectedPaper ? (
        <div className={`${selectedId ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-h-0`}>
          <button
            onClick={() => setSelectedId(null)}
            className="md:hidden flex items-center gap-2 px-4 py-3 text-xs font-medium text-indigo-600 border-b border-gray-200 bg-white shrink-0"
          >
            ← Back to list
          </button>
          <PaperDetailView
            paper={selectedPaper}
            onEdit={openBuilder}
            onAssign={setAssignPaper}
          />
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm font-medium text-gray-500">Select a paper to view questions</p>
          {papers.length === 0 && (
            <button
              onClick={() => openBuilder()}
              className="mt-4 text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors"
            >
              + Create your first paper
            </button>
          )}
        </div>
      )}

      {/* ── Assign modal ──────────────────────────────────────── */}
      {assignPaper && (
        <AssignPaperModal
          paper={assignPaper}
          candidates={candidates}
          submissions={submissions}
          pendingTokens={pendingTokens}
          onGetLink={async (candidate) => {
            const { token } = await api.assignPaper(assignPaper.id, candidate.id)
            return { token, url: `${window.location.origin}?token=${token}` }
          }}
          onClose={() => setAssignPaper(null)}
        />
      )}

      {/* ── Drive import modal ────────────────────────────────── */}
      {showDriveModal && (
        <ImportFromDriveModal
          importing={importing}
          error={importError}
          onImport={async (role) => {
            const paper = await onImportFromDrive(role)
            if (paper) {
              setShowDriveModal(false)
              setSelectedId(paper.id)
            }
          }}
          onClose={() => setShowDriveModal(false)}
        />
      )}
    </div>
  )
}
