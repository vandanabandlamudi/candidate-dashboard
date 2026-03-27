import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'

export function useJobs() {
  const [jobs,    setJobs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetchJobs = useCallback(() => {
    setLoading(true)
    setError(null)
    api.getJobs()
      .then(setJobs)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  return { jobs, loading, error, refetch: fetchJobs }
}
