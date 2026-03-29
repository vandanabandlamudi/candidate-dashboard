import { useState, useEffect } from 'react'
import { api } from '../api/client.js'

export function SettingsScreen() {
  const [email, setEmail]   = useState('')
  const [saved,  setSaved]  = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    api.getSettings()
      .then((s) => { setEmail(s.organizer_email || ''); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!email) return
    setSaving(true)
    setError(null)
    try {
      await api.updateSettings({ organizer_email: email })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Configure interview and scheduling preferences.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 mb-1">Interview Organizer Email</h3>
          <p className="text-xs text-gray-500 mb-3">
            Google Meet invites will be sent from this email. The service account must have domain-wide delegation for this address.
          </p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. vandana.bandlamudi@scripbox.com"
            disabled={loading}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-50"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving || loading || !email}
          className="flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
          ) : saved ? (
            <>✓ Saved</>
          ) : (
            <>Save</>
          )}
        </button>
      </div>
    </div>
  )
}
