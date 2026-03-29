import { useState, useEffect } from 'react'
import { api } from '../api/client.js'
import { ActionButtons } from '../components/candidates/ActionButtons'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const VERDICT_STYLES = {
  'Strong Match':  { bar: 'bg-green-500',  badge: 'bg-green-50 text-green-700 border-green-200',  border: 'border-green-200' },
  'Good Match':    { bar: 'bg-blue-500',   badge: 'bg-blue-50 text-blue-700 border-blue-200',     border: 'border-blue-200'  },
  'Partial Match': { bar: 'bg-amber-400',  badge: 'bg-amber-50 text-amber-700 border-amber-200',  border: 'border-amber-200' },
  'Not a Match':   { bar: 'bg-red-400',    badge: 'bg-red-50 text-red-600 border-red-200',        border: 'border-red-200'   },
}


function CandidateResult({ r, candidate, selected, onToggle, onSchedule, onVideo, onSendQuestionnaire, onViewDetail, onStatusChange, onMeetLinkSaved, onInterviewDeleted }) {
  const style = VERDICT_STYLES[r.verdict] || VERDICT_STYLES['Partial Match']
  const alreadyMoved = r.status && r.status !== 'Shortlist'

  // full candidate object for ActionButtons (falls back to r if not found)
  const fullCandidate = candidate ?? r

  return (
    <div
      className={`rounded-xl border-2 bg-white transition-all overflow-hidden flex flex-col cursor-pointer ${
        selected
          ? 'border-indigo-400 shadow-md'
          : alreadyMoved
          ? 'border-green-200 hover:border-green-300'
          : style.border + ' hover:border-indigo-200'
      }`}
      onClick={() => onViewDetail?.(r)}
    >
      <div className="p-4 flex-1 space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {/* Checkbox — stop propagation so it doesn't open detail */}
            <div
              onClick={(e) => { e.stopPropagation(); onToggle(r.id) }}
              className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                selected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'
              }`}
            >
              {selected && (
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
              {r.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{r.name}</p>
              {alreadyMoved
                ? <p className="text-[10px] text-green-600 font-medium">✓ {r.status}</p>
                : r.role && <p className="text-[10px] text-gray-400">{r.role}</p>
              }
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${style.badge}`}>{r.verdict}</span>
            <span className="text-sm font-bold text-gray-700">{r.score}/100</span>
          </div>
        </div>

        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div className={`h-1.5 rounded-full transition-all ${style.bar}`} style={{ width: `${r.score}%` }} />
        </div>

        <ul className="space-y-0.5">
          {r.reasons.map((reason, i) => (
            <li key={i} className="text-[11px] text-gray-600 flex gap-1.5">
              <span className="text-green-500 shrink-0">✓</span>{reason}
            </li>
          ))}
        </ul>

        {r.concern && (
          <p className="text-[11px] text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 flex gap-1.5">
            <span className="shrink-0">⚠</span>{r.concern}
          </p>
        )}
      </div>

      {/* Card footer */}
      <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-between bg-gray-50" onClick={(e) => e.stopPropagation()}>
        <div>
          {selected && !alreadyMoved && (
            <button
              onClick={() => onStatusChange?.(r.id, 'Screen')}
              className="text-[11px] font-semibold px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              Move to Screen
            </button>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <ActionButtons
            candidate={fullCandidate}
            onSchedule={onSchedule}
            onVideo={onVideo}
            onMeetLinkSaved={onMeetLinkSaved}
            onInterviewDeleted={onInterviewDeleted}
          />
          {alreadyMoved && onSendQuestionnaire && (() => {
            const hasSent = fullCandidate.sentQuestions?.length > 0
            return (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-green-600">Moved to Screen</span>
                {hasSent ? (
                  <>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-green-600 bg-green-50 px-2.5 py-1.5 rounded-lg">
                      ✅ Questions Sent
                    </span>
                    <button
                      onClick={() => onSendQuestionnaire(new Set([r.id]))}
                      title="Resend questionnaire"
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onSendQuestionnaire(new Set([r.id]))}
                    title="Send questionnaire"
                    className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                  >
                    📋 Send Questionnaire
                  </button>
                )}
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}


export function ScreeningScreen({ candidates, candidatesLoading, onStatusChange, onSchedule, onVideo, onSendQuestionnaire, onViewDetail, onMeetLinkSaved, onInterviewDeleted }) {
  const [results,    setResults]    = useState({})
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [activeTab,  setActiveTab]  = useState(null)
  const [screened,   setScreened]   = useState(false)
  const [selected,   setSelected]   = useState(new Set())
  const [moving,     setMoving]     = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [verdictFilter, setVerdictFilter] = useState('All')
  const [jobsMap,    setJobsMap]    = useState({})

  // Fetch real job data on mount — keyed by job_title for quick lookup
  useEffect(() => {
    fetch(`${BASE}/api/jobs`)
      .then((r) => r.json())
      .then((jobs) => {
        const map = {}
        jobs.forEach((j) => { map[j.job_title] = j })
        setJobsMap(map)
      })
      .catch(() => {})
  }, [])

  // Build a status lookup from candidates prop
  const statusById = Object.fromEntries(candidates.map((c) => [c.id, c.status]))

  const buildCardMap = (rows) => {
    const seen = new Set()
    const deduped = rows.filter((r) => {
      if (seen.has(r.candidate_id)) return false
      seen.add(r.candidate_id)
      return true
    })
    const map = {}
    deduped.forEach((r) => {
      const role = r.role ?? 'Unknown'
      if (!map[role]) map[role] = []
      map[role].push({
        id:      r.candidate_id,
        name:    r.candidate_name,
        role,
        score:   r.score,
        verdict: r.verdict,
        reasons: r.reasons ?? [],
        concern: r.concern,
        status:  statusById[r.candidate_id] ?? 'Shortlist',
      })
    })
    return map
  }

  useEffect(() => {
    api.getScreeningResults()
      .then((rows) => {
        if (rows.length > 0) {
          const map = buildCardMap(rows)
          setResults(map)
          setActiveTab(null)
          setScreened(true)
        }
      })
      .catch(() => {})
  }, [])

  const screenRoles = async (rolesToScreen) => {
    return Promise.all(
      rolesToScreen.map(async (role) => {
        const allRoleCandidates = candidates.filter((c) => c.role === role)
        // Skip candidates already beyond Shortlist (Screen, Offer, etc.)
        const toScreen = allRoleCandidates.filter((c) => !statusById[c.id] || statusById[c.id] === 'Shortlist')
        const alreadyMoved = allRoleCandidates.filter((c) => statusById[c.id] && statusById[c.id] !== 'Shortlist')

        const job = jobsMap[role] || { job_title: role, department: role, experience_from: '0', experience_to: '∞', salary_min: null, salary_max: null, employee_type: 'Full Time', is_remote: 0 }

        let newData = []
        if (toScreen.length > 0) {
          const res = await fetch(`${BASE}/api/screen`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ job, candidates: toScreen }),
          })
          const text = await res.text()
          let parsed
          try { parsed = JSON.parse(text) } catch (_) {
            throw new Error(`Server returned non-JSON response (${res.status}): ${text.slice(0, 200)}`)
          }
          if (!res.ok) throw new Error(parsed?.error || `Shortlisting failed (${res.status})`)

          const nameToId = Object.fromEntries(toScreen.map((c) => [c.name.toLowerCase(), c.id]))
          newData = parsed.map((r) => ({
            ...r,
            id: nameToId[r.name?.toLowerCase()] ?? r.id,
          }))
        }

        // Preserve existing results for already-moved candidates
        const existingResults = (results[role] || []).filter((r) => alreadyMoved.some((c) => c.id === r.id))
        const data = [...newData, ...existingResults]

        return { role, data, job, roleCandidates: allRoleCandidates }
      })
    )
  }

  const runScreening = () => {
    setLoading(true)
    setError(null)
    setResults({})
    setSelected(new Set())
    setActiveTab(null)

    const allRoles = [...new Set(candidates.map((c) => c.role))]
    screenRoles(allRoles)
      .then(async (all) => {
        setSaving(true)
        const flat = all.flatMap(({ data, job }) =>
          data.map((r) => ({ ...r, job_title: job.job_title, department: job.department }))
        )
        try {
          await api.saveScreeningResults(flat)
          // Auto-promote candidates with score >= 85 to Screen
          const toPromote = flat.filter((r) => r.score >= 85 && (statusById[r.id] === 'Shortlist' || !statusById[r.id]))
          if (toPromote.length > 0) {
            await Promise.all(toPromote.map((r) => api.updateCandidate(r.id, { status: 'Screen' })))
            onStatusChange?.()
          }
          const promotedIds = new Set(toPromote.map((r) => r.id))
          const map = {}
          all.forEach(({ role, data }) => {
            map[role] = data.map((r) => ({
              ...r,
              status: promotedIds.has(r.id) ? 'Screen' : (statusById[r.id] ?? 'Shortlist'),
            }))
          })
          setResults(map)
        } catch (_) {
          const map = {}
          all.forEach(({ role, data }) => {
            map[role] = data.map((r) => ({ ...r, status: statusById[r.id] ?? 'Shortlist' }))
          })
          setResults(map)
        }
        setScreened(true)
        setSaving(false)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  const [roleLoading, setRoleLoading] = useState(null) // role string being screened

  const runScreeningForRole = (role) => {
    setRoleLoading(role)
    setError(null)

    screenRoles([role])
      .then(async (all) => {
        const { data } = all[0]
        setSaving(true)
        const flat = all.flatMap(({ data: d, job }) =>
          d.map((r) => ({ ...r, job_title: job.job_title, department: job.department }))
        )
        try {
          await api.saveScreeningResults(flat)
          // Auto-promote candidates with score >= 85 to Screen
          const toPromote = flat.filter((r) => r.score >= 85 && (statusById[r.id] === 'Shortlist' || !statusById[r.id]))
          if (toPromote.length > 0) {
            await Promise.all(toPromote.map((r) => api.updateCandidate(r.id, { status: 'Screen' })))
            onStatusChange?.()
          }
          const promotedIds = new Set(toPromote.map((r) => r.id))
          const enriched = data.map((r) => ({
            ...r,
            status: promotedIds.has(r.id) ? 'Screen' : (statusById[r.id] ?? 'Shortlist'),
          }))
          setResults((prev) => ({ ...prev, [role]: enriched }))
        } catch (_) {
          const enriched = data.map((r) => ({ ...r, status: statusById[r.id] ?? 'Shortlist' }))
          setResults((prev) => ({ ...prev, [role]: enriched }))
        }
        setSaving(false)
        setScreened(true)
        setActiveTab(role)
      })
      .catch((err) => setError(err.message))
      .finally(() => setRoleLoading(null))
  }

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    const ids = activeResults.filter((r) => !r.status || r.status === 'Shortlist').map((r) => r.id)
    const allSel = ids.length > 0 && ids.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(prev)
      allSel ? ids.forEach((id) => next.delete(id)) : ids.forEach((id) => next.add(id))
      return next
    })
  }

  const moveToNextLevel = async () => {
    if (selected.size === 0) return
    setMoving(true)
    try {
      await Promise.all([...selected].map((id) => api.updateCandidate(id, { status: 'Screen' })))
      onStatusChange?.()
      // Update status in cards — keep them selected so "Send Questionnaire" appears
      setResults((prev) => {
        const next = { ...prev }
        for (const role of Object.keys(next)) {
          next[role] = next[role].map((r) =>
            selected.has(r.id) ? { ...r, status: 'Screen' } : r
          )
        }
        return next
      })
      setSelected(new Set())
    } finally {
      setMoving(false)
    }
  }


  // All unique roles across both screened results and unscreened candidates
  const screenedRoles = Object.keys(results)
  const allRoles = [...new Set([...screenedRoles, ...candidates.map((c) => c.role)])]
  const roles = allRoles

  const activeResults = activeTab === null
    ? Object.values(results).flat()
    : results[activeTab] || []

  // Candidates who have no screening result yet for the active tab/role
  const allScreenedIds = new Set(Object.values(results).flat().map((r) => r.id))
  const notShortlisted = candidates.filter((c) => {
    if (activeTab !== null && c.role !== activeTab) return false
    return !allScreenedIds.has(c.id)
  })

  const verdictCounts = activeResults.reduce((acc, r) => { acc[r.verdict] = (acc[r.verdict] || 0) + 1; return acc }, {})
  const visibleResults = verdictFilter === 'All' ? activeResults : activeResults.filter((r) => r.verdict === verdictFilter)
  const eligibleInTab = visibleResults.filter((r) => !r.status || r.status === 'Shortlist')
  const selectedInTab = eligibleInTab.filter((r) => selected.has(r.id))
  const allTabSelected = eligibleInTab.length > 0 && eligibleInTab.every((r) => selected.has(r.id))
  // Screen-status candidates selected (for questionnaire)
  const screenSelected = [...selected].filter((id) => {
    const found = activeResults.find((r) => r.id === id)
    return found?.status === 'Screen'
  })

  if (candidatesLoading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <div className="w-6 h-6 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mr-3" />
      <p className="text-sm font-medium">Loading candidates…</p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-5 space-y-6 overflow-x-hidden w-full">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-gray-400">Shortlist candidates against their respective job roles using AI</p>
        <button
          onClick={runScreening}
          disabled={loading || candidates.length === 0}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {loading ? (
            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Shortlisting…</>
          ) : screened ? (
            <>↺ Re-shortlist All</>
          ) : (
            <>✦ Shortlist All</>
          )}
        </button>
      </div>

      {/* ── Not yet shortlisted — shown before any shortlisting, grouped by role ── */}
      {!screened && !loading && !error && candidates.length > 0 && (
        <div className="space-y-4">
          {[...new Set(candidates.map((c) => c.role))].map((role) => {
            const roleCands = candidates.filter((c) => c.role === role)
            return (
              <div key={role} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{role}</p>
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">{roleCands.length}</span>
                  <div className="flex-1" />
                  <button
                    onClick={() => runScreeningForRole(role)}
                    disabled={roleLoading !== null}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50 shrink-0"
                  >
                    {roleLoading === role ? (
                      <><div className="w-3 h-3 border-2 border-indigo-400 border-t-indigo-600 rounded-full animate-spin" />Shortlisting…</>
                    ) : <>✦ Shortlist</>}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-100">
                  {roleCands.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 px-4 py-3 bg-white">
                      <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center shrink-0">
                        {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-700 truncate">{c.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{c.title} · {c.company}</p>
                      </div>
                      <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">
                        {c.exp}y
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">AI is shortlisting all candidates by role…</p>
          <p className="text-xs text-gray-400">This may take a few seconds</p>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-sm font-medium text-red-500">Shortlisting failed: {error}</p>
            <p className="text-xs text-gray-400 mt-1">Check that the backend server is running</p>
          </div>
        </div>
      )}

      {!loading && !error && roles.length > 0 && (
        <div className="space-y-4">
          {/* Saved indicator */}
          {saving && (
            <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl bg-gray-50 text-gray-400 w-fit">
              <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
              Saving....
            </div>
          )}

          {/* Role tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => { setActiveTab(null); setVerdictFilter('All') }}
              className={`whitespace-nowrap text-xs font-medium px-4 py-2 rounded-xl transition-colors ${
                activeTab === null ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
              }`}
            >
              All
              <span className={`ml-2 text-[10px] font-bold ${activeTab === null ? 'text-indigo-200' : 'text-gray-400'}`}>
                {candidates.length}
              </span>
            </button>
            {roles.map((role) => {
              const roleTotal = candidates.filter((c) => c.role === role).length
              const isScreened = !!results[role]
              return (
                <div key={role} className="flex items-center gap-1">
                  <button
                    onClick={() => { setActiveTab(role); setVerdictFilter('All') }}
                    className={`whitespace-nowrap text-xs font-medium px-4 py-2 rounded-xl transition-colors ${
                      activeTab === role ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-indigo-300'
                    }`}
                  >
                    {role}
                    <span className={`ml-2 text-[10px] font-bold ${activeTab === role ? 'text-indigo-200' : 'text-gray-400'}`}>
                      {roleTotal}
                    </span>
                  </button>
                  <button
                    onClick={() => runScreeningForRole(role)}
                    disabled={roleLoading === role || loading}
                    title={isScreened ? `Re-shortlist ${role}` : `Shortlist ${role}`}
                    className="text-[10px] font-semibold px-2 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {roleLoading === role ? (
                      <div className="w-3 h-3 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                    ) : isScreened ? '↺' : '✦'}
                  </button>
                </div>
              )
            })}
          </div>

          {/* Not yet shortlisted — above results, grouped by role */}
          {notShortlisted.length > 0 && verdictFilter === 'All' && (() => {
            const unscreenedRoles = [...new Set(notShortlisted.map((c) => c.role))]
            return (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Not Yet Shortlisted</p>
                {unscreenedRoles.map((role) => {
                  const group = notShortlisted.filter((c) => c.role === role)
                  return (
                    <div key={role} className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">{role}</p>
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">{group.length}</span>
                        <div className="flex-1" />
                        <button
                          onClick={() => runScreeningForRole(role)}
                          disabled={roleLoading !== null || loading}
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50 shrink-0"
                        >
                          {roleLoading === role ? (
                            <><div className="w-3 h-3 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />Shortlisting…</>
                          ) : <>✦ Shortlist</>}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-gray-100">
                        {group.map((c) => (
                          <div key={c.id} className="flex items-center gap-3 px-4 py-3 bg-white">
                            <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center shrink-0">
                              {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-700 truncate">{c.name}</p>
                              <p className="text-[10px] text-gray-400 truncate">{c.title} · {c.company}</p>
                            </div>
                            <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full shrink-0">{c.exp}y</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {/* Divider before screened results */}
                {visibleResults.length > 0 && (
                  <div className="flex items-center gap-3 pt-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">Shortlisted</p>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>
                )}
              </div>
            )
          })()}

          {/* Toolbar — select all + verdict filters, above shortlisted cards */}
          {activeResults.length > 0 && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={toggleAll}
                  className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                    allTabSelected ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
                  }`}
                >
                  <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${allTabSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-400'}`}>
                    {allTabSelected && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  {allTabSelected ? 'Deselect all' : 'Select all'}
                </button>
                <button
                  onClick={() => setVerdictFilter('All')}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                    verdictFilter === 'All' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  All <span className={`ml-1 font-bold ${verdictFilter === 'All' ? 'text-gray-300' : 'text-gray-400'}`}>{activeResults.length}</span>
                </button>
                {Object.entries(VERDICT_STYLES).map(([verdict, style]) => {
                  const count = verdictCounts[verdict] || 0
                  if (!count) return null
                  return (
                    <button
                      key={verdict}
                      onClick={() => setVerdictFilter(verdictFilter === verdict ? 'All' : verdict)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                        verdictFilter === verdict ? style.badge : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {count} {verdict}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {selectedInTab.length > 0 && (
                  <button
                    onClick={moveToNextLevel}
                    disabled={moving}
                    className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm disabled:opacity-60"
                  >
                    {moving ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    )}
                    Move {selectedInTab.length} to Screen
                  </button>
                )}
                {screenSelected.length > 0 && onSendQuestionnaire && (
                  <button
                    onClick={() => onSendQuestionnaire(new Set(screenSelected))}
                    className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    📋 Send Questionnaire ({screenSelected.length})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleResults.map((r) => (
              <CandidateResult
                key={r.id}
                r={r}
                candidate={candidates.find((c) => c.id === r.id)}
                selected={selected.has(r.id)}
                onToggle={toggleSelect}
                onSchedule={onSchedule}
                onVideo={onVideo}
                onSendQuestionnaire={onSendQuestionnaire}
                onViewDetail={onViewDetail}
                onStatusChange={async (id, status) => {
                  await api.updateCandidate(id, { status })
                  onStatusChange?.()
                  setResults((prev) => {
                    const next = { ...prev }
                    for (const role of Object.keys(next)) {
                      next[role] = next[role].map((c) => c.id === id ? { ...c, status } : c)
                    }
                    return next
                  })
                }}
                onMeetLinkSaved={onMeetLinkSaved}
                onInterviewDeleted={onInterviewDeleted}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
