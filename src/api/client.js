const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

// ── Candidates ────────────────────────────────────────────────────────────────
export const api = {
  getCandidates:   ()           => request('/api/candidates'),
  getCandidate:    (id)         => request(`/api/candidates/${id}`),
  createCandidate: (data)       => request('/api/candidates', { method: 'POST', body: JSON.stringify(data) }),
  updateCandidate: (id, patch)  => request(`/api/candidates/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteCandidate: (id)         => request(`/api/candidates/${id}`, { method: 'DELETE' }),

  // Interviews
  getInterviews:   (id)         => request(`/api/candidates/${id}/interviews`),
  createInterview: (id, data)   => request(`/api/candidates/${id}/interviews`, { method: 'POST', body: JSON.stringify(data) }),
  deleteInterview: (id)         => request(`/api/candidates/${id}/interviews`, { method: 'DELETE' }),
  updateMeetLink:  (id, link)   => request(`/api/candidates/${id}/interviews/meet-link`, { method: 'PATCH', body: JSON.stringify({ meet_link: link }) }),

  // Submissions
  getSubmissions:      (id) => request(`/api/candidates/${id}/submissions`),
  getAllSubmissions:    ()   => request('/api/submissions'),
  getPendingTokens:    ()   => request('/api/tokens/pending'),
  // getSubmissions:      (id)              => request(`/api/candidates/${id}/submissions`),
  createSubmission:    (id, data)        => request(`/api/candidates/${id}/submissions`, { method: 'POST', body: JSON.stringify(data) }),
  gradeSubmission:     (id, paperId, data) => request(`/api/candidates/${id}/submissions/${paperId}/grade`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Sent questions
  getSentQuestions:    (id)              => request(`/api/candidates/${id}/sent-questions`),
  createSentQuestions: (id, questionIds) => request(`/api/candidates/${id}/sent-questions`, { method: 'POST', body: JSON.stringify({ questionIds }) }),

  // Assessments
  getAssessments:      (id)              => request(`/api/candidates/${id}/assessments`),
  upsertAssessment:    (id, data)        => request(`/api/candidates/${id}/assessments`, { method: 'PUT', body: JSON.stringify(data) }),

  // Roles & Statuses
  getRoles:        ()           => request('/api/roles'),
  getStatuses:     ()           => request('/api/statuses'),

  // Questions
  getQuestions:    ()           => request('/api/questions'),

  // Jobs
  getJobs: () => request('/api/jobs'),

  // Settings
  getSettings:    ()       => request('/api/settings'),
  updateSettings: (patch)  => request('/api/settings', { method: 'PATCH', body: JSON.stringify(patch) }),

  // Google Meet
  createMeet: (candidateId, date, time) => request('/api/meet', { method: 'POST', body: JSON.stringify({ candidateId, date, time }) }),

  // Screening Results
  getScreeningResults:  ()       => request('/api/screening-results'),
  saveScreeningResults: (results) => request('/api/screening-results', { method: 'POST', body: JSON.stringify({ results }) }),
  clearScreeningResults: ()      => request('/api/screening-results', { method: 'DELETE' }),

  // Papers
  getPapers:       ()           => request('/api/papers'),
  createPaper:     (data)       => request('/api/papers', { method: 'POST', body: JSON.stringify(data) }),
  updatePaper:     (id, patch)  => request(`/api/papers/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deletePaper:     (id)         => request(`/api/papers/${id}`, { method: 'DELETE' }),

  // Google Drive import
  importPaperFromDrive: (role) =>
    request('/api/papers/import-from-drive', { method: 'POST', body: JSON.stringify({ role }) }),

  // Assign paper → shareable token
  assignPaper: (paperId, candidateId) =>
    request(`/api/papers/${paperId}/assign`, { method: 'POST', body: JSON.stringify({ candidateId }) }),

  // Public test endpoints (used by TestPage)
  getTest:    (token)       => request(`/api/test/${token}`),
  submitTest: (token, data) => request(`/api/test/${token}/submit`, { method: 'POST', body: JSON.stringify(data) }),
}
