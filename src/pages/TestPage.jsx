import { useState, useEffect } from 'react'
import { api } from '../api/client'
import { CandidateTestView } from '../components/papers/CandidateTestView'

export function TestPage({ token }) {
  const [state,     setState]     = useState('loading') // 'loading' | 'ready' | 'done' | 'error'
  const [errorMsg,  setErrorMsg]  = useState('')
  const [testData,  setTestData]  = useState(null)       // { candidate, paper }

  useEffect(() => {
    api.getTest(token)
      .then((data) => {
        if (data.alreadySubmitted) {
          setState('done')
        } else {
          setTestData(data)
          setState('ready')
        }
      })
      .catch((err) => {
        setErrorMsg(err.message || 'This link is invalid or has already been used.')
        setState('error')
      })
  }, [token])

  const handleSubmit = async (answers) => {
    try {
      await api.submitTest(token, { answers })
      setState('done')
    } catch (err) {
      setErrorMsg(err.message || 'Submission failed. Please try again.')
      setState('error')
    }
  }

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <svg className="animate-spin w-8 h-8" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <p className="text-sm">Loading your test…</p>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">🔒</p>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Link unavailable</h1>
          <p className="text-sm text-gray-500">{errorMsg}</p>
        </div>
      </div>
    )
  }

  if (state === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">✅</p>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Test submitted!</h1>
          <p className="text-sm text-gray-500">Your responses have been recorded. You can close this tab.</p>
        </div>
      </div>
    )
  }

  const { candidate, paper } = testData

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-4 text-center">
          <p className="text-xs text-gray-400">Hi, <span className="font-semibold text-gray-600">{candidate.name}</span></p>
        </div>
        {/* CandidateTestView handles question rendering and submit trigger.
            We do NOT pass `submission` back after submit — instead setState('done')
            so the candidate never sees scores or correct answers. */}
        <CandidateTestView
          candidate={candidate}
          paper={paper}
          submission={null}
          onSubmit={handleSubmit}
          onManualGrade={() => {}}
          onClose={null}
        />
      </div>
    </div>
  )
}
