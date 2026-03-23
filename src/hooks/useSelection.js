import { useState, useCallback } from 'react'

/**
 * Manages checkbox selection state for a list of items.
 * @param {Array} visibleItems - currently filtered/visible candidates
 */
export function useSelection(visibleItems) {
  const [selectedIds, setSelectedIds] = useState(new Set())

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    const allSelected = visibleItems.length > 0 && visibleItems.every((c) => selectedIds.has(c.id))
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        visibleItems.forEach((c) => next.delete(c.id))
        return next
      })
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        visibleItems.forEach((c) => next.add(c.id))
        return next
      })
    }
  }, [visibleItems, selectedIds])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  const removeFromSelection = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const allSelected  = visibleItems.length > 0 && visibleItems.every((c) => selectedIds.has(c.id))
  const someSelected = visibleItems.some((c) => selectedIds.has(c.id))

  return {
    selectedIds,
    toggleSelect,
    toggleAll,
    clearSelection,
    removeFromSelection,
    allSelected,
    someSelected,
  }
}
