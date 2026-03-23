import { useState, useCallback } from 'react'

/**
 * Simple toast notification hook.
 * @param {number} duration - milliseconds to show the toast (default 2800)
 */
export function useToast(duration = 2800) {
  const [message, setMessage] = useState(null)

  const showToast = useCallback(
    (msg) => {
      setMessage(msg)
      setTimeout(() => setMessage(null), duration)
    },
    [duration]
  )

  return { toastMessage: message, showToast }
}
