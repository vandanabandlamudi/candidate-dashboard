import { useState, useMemo, useCallback } from 'react'
import { STATUS_META } from '../constants/statuses'

/**
 * Manages search, filter, sort, and pagination state.
 * @param {Array} candidates - full candidate list
 */
export function useFilters(candidates) {
  const [globalSearch, setGlobalSearch] = useState('')
  const [selectedRole,   setSelectedRole]   = useState('All Roles')
  const [selectedStatus, setSelectedStatus] = useState('All Statuses')
  const [keyword,        setKeyword]        = useState('')
  const [sortField,      setSortField]      = useState(null)   // 'appliedDate' | 'status'
  const [sortDir,        setSortDir]        = useState('asc')  // 'asc' | 'desc'
  const [currentPage,    setCurrentPage]    = useState(1)
  const [perPage,        setPerPage]        = useState(10)

  const resetPage = useCallback(() => setCurrentPage(1), [])

  const handleSort = useCallback(
    (field) => {
      if (sortField === field) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      } else {
        setSortField(field)
        setSortDir('asc')
      }
      resetPage()
    },
    [sortField, resetPage]
  )

  const clearAllFilters = useCallback(() => {
    setGlobalSearch('')
    setSelectedRole('All Roles')
    setSelectedStatus('All Statuses')
    setKeyword('')
    resetPage()
  }, [resetPage])

  const filtered = useMemo(() => {
    let result = candidates.filter((c) => {
      const gs = globalSearch.toLowerCase().trim()
      const gsMatch = !gs || [c.name, c.email, c.phone].some((v) => v.toLowerCase().includes(gs))

      const roleMatch   = selectedRole   === 'All Roles'     || c.role   === selectedRole
      const statusMatch = selectedStatus === 'All Statuses'  || c.status === selectedStatus

      const kw = keyword.toLowerCase().trim()
      const kwMatch = !kw || [c.name, c.role, c.title, c.company, c.summary, c.status, ...c.skills]
        .some((v) => v.toLowerCase().includes(kw))

      return gsMatch && roleMatch && statusMatch && kwMatch
    })

    if (sortField) {
      result = [...result].sort((a, b) => {
        const av = sortField === 'appliedDate'
          ? new Date(a.appliedDate)
          : (STATUS_META[a.status]?.order ?? 99)
        const bv = sortField === 'appliedDate'
          ? new Date(b.appliedDate)
          : (STATUS_META[b.status]?.order ?? 99)
        return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
      })
    }

    return result
  }, [candidates, globalSearch, selectedRole, selectedStatus, keyword, sortField, sortDir])

  const totalPages = Math.ceil(filtered.length / perPage)
  const paginated  = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  const hasActiveFilters =
    globalSearch || selectedRole !== 'All Roles' || selectedStatus !== 'All Statuses' || keyword

  return {
    globalSearch, setGlobalSearch,
    selectedRole, setSelectedRole,
    selectedStatus, setSelectedStatus,
    keyword, setKeyword,
    sortField, sortDir, handleSort,
    currentPage, setCurrentPage,
    perPage, setPerPage,
    filtered, paginated, totalPages,
    hasActiveFilters, clearAllFilters, resetPage,
  }
}
