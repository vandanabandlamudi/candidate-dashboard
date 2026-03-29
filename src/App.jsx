import { useState } from 'react'

// Hooks
import { useToast }         from './hooks/useToast'
import { useCandidates }    from './hooks/useCandidates'
import { useFilters }       from './hooks/useFilters'
import { useSelection }     from './hooks/useSelection'
import { useQuestionBank }    from './hooks/useQuestionBank'
import { useQuestionPapers }  from './hooks/useQuestionPapers'

// Layout
import { Header }         from './components/layout/Header'
import { Sidebar }        from './components/layout/Sidebar'
import { StatusBar }       from './components/layout/StatusBar'
import { FilterPanel }    from './components/layout/FilterPanel'
import { BulkActionBar }  from './components/layout/BulkActionBar'

// Candidates
import { CandidateCard }         from './components/candidates/CandidateCard'
import { CandidateTable }        from './components/candidates/CandidateTable'
import { CandidateDetailPanel }  from './components/candidates/CandidateDetailPanel'

// Common
import { Pagination } from './components/common/Pagination'
import { Toast }      from './components/common/Toast'
import { IcoCheck }   from './components/common/Icons'

// Modals
import { ScheduleModal }       from './components/modals/ScheduleModal'
import { DeleteModal }         from './components/modals/DeleteModal'
import { SentQuestionsDrawer }   from './components/modals/SentQuestionsDrawer'
import { ManageQuestionsModal }  from './components/modals/ManageQuestionsModal'
import { AssignPaperModal }      from './components/papers/AssignPaperModal'
import { AssessmentsScreen }     from './screens/AssessmentsScreen'
import { QuestionPapersScreen }  from './screens/QuestionPapersScreen'
import { JobsScreen }            from './screens/JobsScreen'
import { ScreeningScreen }       from './screens/ScreeningScreen'
// import { SettingsScreen }        from './screens/SettingsScreen'

export default function App() {
  // ── Core state ─────────────────────────────────────────────────────────────
  const [screen,         setScreen]         = useState(() => localStorage.getItem('activeScreen') || 'hiring')
  const [viewMode,       setViewMode]       = useState('card')
  const [bulkStatus,     setBulkStatus]     = useState('')
  const [scheduleC,      setScheduleC]      = useState(null)
  const [deleteC,        setDeleteC]        = useState(null)
  const [drawerC,        setDrawerC]        = useState(null)
  const [showManageQ,    setShowManageQ]    = useState(false)
  const [detailC,        setDetailC]        = useState(null)
  const [sidebarOpen,    setSidebarOpen]    = useState(false)
  const [assignModal,    setAssignModal]    = useState(null)  // { candidate, paper }

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { toastMessage, showToast } = useToast()
  const { questionBank, setQuestionBank } = useQuestionBank()
  const {
    papers, addPaper, updatePaper, deletePaper, submissions, pendingTokens, renewToken,
    importFromDrive, importing, importError,
  } = useQuestionPapers()

  const {
    candidates,
    loading,
    error,
    refetch,
    handleStatusChange,
    handleForward,
    handleReject,
    handleSchedule,
    handleVideo,
    handleDelete,
    handleMeetLinkSaved,
    handleInterviewDeleted,
    updateAssessment,
  } = useCandidates(showToast)

  const {
    globalSearch, setGlobalSearch,
    selectedRole, setSelectedRole,
    selectedStatus, setSelectedStatus,
    keyword, setKeyword,
    sortField, sortDir, handleSort,
    currentPage, setCurrentPage,
    perPage, setPerPage,
    filtered, paginated, totalPages,
    rolesFilter,
    hasActiveFilters, clearAllFilters, resetPage,
  } = useFilters(candidates)

  const {
    selectedIds,
    toggleSelect,
    toggleAll,
    clearSelection,
    removeFromSelection,
    allSelected,
    someSelected,
  } = useSelection(filtered)

  // ── Assign paper (Send Questionnaire from Candidates screen) ───────────────
  const openAssignModal = () => {
    const shortlisted = [...selectedIds]
      .map((id) => candidates.find((c) => c.id === id))
      .filter((c) => c && c.status === 'Shortlist')
    if (shortlisted.length === 0) return
    const candidate = shortlisted[0]
    const paper = papers.find((p) => p.role === candidate.role) ?? null
    setAssignModal({ candidate, paper })
  }

  // ── Bulk status ────────────────────────────────────────────────────────────
  const applyBulkStatus = () => {
    if (!bulkStatus || selectedIds.size === 0) return
    selectedIds.forEach((id) => handleStatusChange(id, bulkStatus))
    showToast(`${selectedIds.size} candidates → ${bulkStatus}`)
    clearSelection()
    setBulkStatus('')
  }

  // ── Schedule handler (needs both candidate + data) ─────────────────────────
  const onScheduleConfirm = (data) => {
    handleSchedule(scheduleC, data)
    setScheduleC(null)
  }

  // ── Delete handler ─────────────────────────────────────────────────────────
  const onDeleteConfirm = () => {
    handleDelete(deleteC, removeFromSelection)
    setDeleteC(null)
  }

  // ── Shared props for card & table ──────────────────────────────────────────
  const candidateHandlers = {
    onStatusChange:   handleStatusChange,
    onForward:        handleForward,
    onSchedule:       setScheduleC,
    onVideo:          handleVideo,
    onViewQuestions:  setDrawerC,
    onViewDetail:     setDetailC,
    onMeetLinkSaved:      handleMeetLinkSaved,
    onInterviewDeleted:   handleInterviewDeleted,
  }

  const searchTerm = globalSearch || keyword

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans">
      {/* Sidebar */}
      <Sidebar
        screen={screen}
        onScreenChange={(s) => { setScreen(s); localStorage.setItem('activeScreen', s) }}
        onManageQuestions={() => setShowManageQ(true)}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-56 h-screen">
        {/* Header */}
        <Header
          globalSearch={globalSearch}
          onGlobalSearch={(v) => { setGlobalSearch(v); resetPage() }}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          screen={screen}
          onMenuOpen={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* {screen === 'settings' && <SettingsScreen />} */}

          {screen === 'jobs' && <JobsScreen candidates={candidates} />}

          {screen === 'screening' && (
            <ScreeningScreen
              candidates={candidates}
              candidatesLoading={loading}
              onStatusChange={refetch}
              onSchedule={setScheduleC}
              onVideo={handleVideo}
              onViewDetail={(r) => setDetailC(candidates.find((c) => c.id === r.id) ?? r)}
              onMeetLinkSaved={handleMeetLinkSaved}
              onInterviewDeleted={handleInterviewDeleted}
              papers={papers}
              submissions={submissions}
              pendingTokens={pendingTokens}
              onGetLink={renewToken}
            />
          )}

          {screen === 'assessments' && (
            <AssessmentsScreen
              candidates={candidates}
              loading={loading}
              onUpdateAssessment={updateAssessment}
              pendingTokens={pendingTokens}
            />
          )}

          {screen === 'papers' && (
            <QuestionPapersScreen
              papers={papers}
              candidates={candidates}
              loading={loading}
              submissions={submissions}
              pendingTokens={pendingTokens}
              onAddPaper={addPaper}
              onUpdatePaper={updatePaper}
              onDeletePaper={deletePaper}
              onImportFromDrive={importFromDrive}
              importing={importing}
              importError={importError}
            />
          )}

          {screen === 'hiring' && (
            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-5 space-y-4">
              {/* Loading / error states */}
              {loading && (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-base font-medium">Loading candidates…</p>
                </div>
              )}
              {error && (
                <div className="text-center py-16 text-red-400">
                  <p className="text-base font-medium">Failed to load candidates: {error}</p>
                  <p className="text-sm mt-1 text-gray-400">Try again ...</p>
                </div>
              )}
              {!loading && !error && (
              <>
              {/* Stats */}
              <StatusBar
                candidates={candidates}
                selectedRole={selectedRole}
                activeStatus={selectedStatus}
                onStatusFilter={(v) => { setSelectedStatus(v); resetPage(); clearSelection() }}
                onRoleFilter={(v) => { setSelectedRole(v); resetPage(); clearSelection() }}
              />

              {/* Filters */}
              <div className="py-2">
              <FilterPanel
                roles={rolesFilter}
                selectedRole={selectedRole}     onRoleChange={(v)   => { setSelectedRole(v);   resetPage(); clearSelection() }}
                selectedStatus={selectedStatus} onStatusChange={(v) => { setSelectedStatus(v); resetPage(); clearSelection() }}
                keyword={keyword}               onKeywordChange={(v) => { setKeyword(v);        resetPage(); clearSelection() }}
                hasActiveFilters={hasActiveFilters}
                onClearAll={() => { clearAllFilters(); clearSelection() }}
              />
</div>
              {/* Bulk actions */}
              <BulkActionBar
                selectedCount={selectedIds.size}
                r1SelectedCount={[...selectedIds].filter((id) => candidates.find((c) => c.id === id)?.status === 'Shortlist').length}
                bulkStatus={bulkStatus}
                onBulkStatusChange={setBulkStatus}
                onApplyBulk={applyBulkStatus}
                onSendQuestionnaire={openAssignModal}
                onClearSelection={() => { clearSelection(); setBulkStatus('') }}
              />

              {/* Results row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Select all */}
                  <button
                    onClick={toggleAll}
                    className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                      allSelected  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : someSelected ? 'bg-gray-50 border-gray-300 text-gray-600'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      allSelected  ? 'bg-indigo-500 border-indigo-500'
                      : someSelected ? 'bg-indigo-200 border-indigo-400'
                      : 'border-gray-400'
                    }`}>
                      {allSelected  && <IcoCheck />}
                      {someSelected && !allSelected && <span className="w-1.5 h-0.5 bg-indigo-600 rounded" />}
                    </span>
                    {allSelected ? 'Deselect all' : 'Select all'}
                  </button>

                  <p className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-800">{filtered.length}</span>{' '}
                    candidate{filtered.length !== 1 ? 's' : ''}
                    {globalSearch && (
                      <span> · name/email: <span className="text-indigo-600 font-medium">"{globalSearch}"</span></span>
                    )}
                    {keyword && (
                      <span> · keyword: <span className="text-indigo-600 font-medium">"{keyword}"</span></span>
                    )}
                  </p>
                </div>

                {selectedIds.size > 0 && (
                  <p className="text-xs text-indigo-600 font-medium">{selectedIds.size} selected</p>
                )}
              </div>

              {/* Card or Table view */}
              {viewMode === 'card' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.length > 0 ? (
                    paginated.map((c) => (
                      <CandidateCard
                        key={c.id}
                        candidate={c}
                        searchTerm={searchTerm}
                        selected={selectedIds.has(c.id)}
                        onToggleSelect={toggleSelect}
                        {...candidateHandlers}
                      />
                    ))
                  ) : (
                    <div className="col-span-3 flex flex-col items-center justify-center text-gray-400">
                      <p className="text-5xl mb-3">🔍</p>
                      <p className="text-base font-medium text-gray-500">No candidates match your filters</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="min-h-[400px]">
                  {paginated.length > 0 ? (
                    <CandidateTable
                      rows={paginated}
                      searchTerm={searchTerm}
                      selectedIds={selectedIds}
                      onToggleSelect={toggleSelect}
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                      {...candidateHandlers}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] text-gray-400">
                      <p className="text-5xl mb-3">🔍</p>
                      <p className="text-base font-medium text-gray-500">No candidates match your filters</p>
                    </div>
                  )}
                </div>
              )}

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                perPage={perPage}
                totalItems={filtered.length}
                onPageChange={(p) => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                onPerPageChange={(n) => { setPerPage(n); setCurrentPage(1) }}
              />
              </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── Modals & overlays ─────────────────────────────────────────────── */}
      {assignModal && (
        <AssignPaperModal
          paper={assignModal.paper}
          candidates={[assignModal.candidate]}
          submissions={submissions}
          pendingTokens={pendingTokens}
          onGetLink={(c) => renewToken(assignModal.paper.id, c.id)}
          onClose={() => setAssignModal(null)}
        />
      )}

      {showManageQ && (
        <ManageQuestionsModal
          questionBank={questionBank}
          onSave={setQuestionBank}
          onClose={() => setShowManageQ(false)}
        />
      )}

      {drawerC && (
        <SentQuestionsDrawer candidate={drawerC} onClose={() => setDrawerC(null)} />
      )}

      {scheduleC && (
        <ScheduleModal
          candidate={scheduleC}
          onConfirm={onScheduleConfirm}
          onClose={() => setScheduleC(null)}
        />
      )}

      {deleteC && (
        <DeleteModal
          candidate={deleteC}
          onConfirm={onDeleteConfirm}
          onClose={() => setDeleteC(null)}
        />
      )}

      {detailC && (
        <CandidateDetailPanel
          candidate={candidates.find((c) => c.id === detailC.id) ?? detailC}
          submissions={submissions}
          papers={papers}
          pendingTokens={pendingTokens}
          onRenewToken={renewToken}
          onClose={() => setDetailC(null)}
          onStatusChange={handleStatusChange}
          onForward={handleForward}
          onReject={handleReject}
          onSchedule={setScheduleC}
          onViewQuestions={setDrawerC}
        />
      )}

      <Toast message={toastMessage} />
    </div>
  )
}
