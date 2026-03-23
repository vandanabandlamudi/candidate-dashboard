import { useState, useRef } from 'react'
import { IcoTrash } from '../common/Icons'
import { parseQuestionsFromFile } from '../../utils/parseQuestionFile'

const ROLES = [
  'Senior Frontend Engineer',
  'Product Manager',
  'Data Scientist',
  'DevOps Engineer',
]

/** Classify a question into a set based on its ID */
function getSet(q) {
  if (q.id.includes('_doc_'))    return 'imported'
  if (q.id.includes('_custom_')) return 'custom'
  return 'default'
}

const SET_META = {
  default:  { label: 'Default Questions',  color: 'bg-indigo-50 text-indigo-700 border-indigo-200',  dot: 'bg-indigo-400' },
  custom:   { label: 'Manually Added',     color: 'bg-green-50  text-green-700  border-green-200',   dot: 'bg-green-400'  },
  imported: { label: 'Imported from File', color: 'bg-amber-50  text-amber-700  border-amber-200',   dot: 'bg-amber-400'  },
}

const SET_ORDER = ['default', 'custom', 'imported']

function QuestionSet({ setKey, questions, onRemove }) {
  const [open, setOpen] = useState(true)
  const meta = SET_META[setKey]

  return (
    <div className={`border rounded-xl overflow-hidden ${meta.color.split(' ').find(c => c.startsWith('border')) ?? 'border-gray-200'}`}>
      {/* Set header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-4 py-2.5 ${meta.color}`}
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
          <span className="text-xs font-semibold">{meta.label}</span>
          <span className="text-[10px] font-bold opacity-60">{questions.length}</span>
        </div>
        <span className="text-xs opacity-50">{open ? '▲' : '▼'}</span>
      </button>

      {/* Questions */}
      {open && (
        <div className="divide-y divide-gray-100 bg-white">
          {questions.map((q, i) => (
            <div key={q.id} className="flex gap-2.5 items-start px-4 py-2.5 group hover:bg-gray-50">
              <span className="text-xs font-bold text-indigo-400 mt-0.5 w-5 shrink-0">Q{i + 1}</span>
              <p className="flex-1 text-xs text-gray-700 leading-relaxed">{q.text}</p>
              {setKey !== 'default' && (
                <button
                  onClick={() => onRemove(q.id)}
                  className="shrink-0 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove question"
                >
                  <IcoTrash />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function ManageQuestionsModal({ questionBank, onSave, onClose }) {
  const [role,      setRole]      = useState(ROLES[0])
  const [text,      setText]      = useState('')
  const [bank,      setBank]      = useState(questionBank)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')
  const [dragOver,  setDragOver]  = useState(false)
  const fileRef = useRef()

  const questions = bank[role] ?? []

  // Group into sets
  const sets = SET_ORDER.reduce((acc, key) => {
    acc[key] = questions.filter((q) => getSet(q) === key)
    return acc
  }, {})

  const addQuestion = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    const prefix = role.split(' ').map((w) => w[0].toLowerCase()).join('')
    const id = `${prefix}_custom_${Date.now()}`
    setBank((prev) => ({
      ...prev,
      [role]: [...(prev[role] ?? []), { id, text: trimmed }],
    }))
    setText('')
  }

  const removeQuestion = (id) => {
    setBank((prev) => ({
      ...prev,
      [role]: prev[role].filter((q) => q.id !== id),
    }))
  }

  const handleFile = async (file) => {
    if (!file) return
    const allowed = ['.txt', '.doc', '.docx', '.pdf']
    if (!allowed.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      setUploadMsg('Unsupported file. Please upload a .txt, .docx, or .pdf file.')
      return
    }
    setUploading(true)
    setUploadMsg('')
    try {
      const parsed = await parseQuestionsFromFile(file)
      if (parsed.length === 0) {
        setUploadMsg('No questions found in the file.')
      } else {
        const prefix = role.split(' ').map((w) => w[0].toLowerCase()).join('')
        const newQs  = parsed.map((t, i) => ({
          id:   `${prefix}_doc_${Date.now()}_${i}`,
          text: t,
        }))
        setBank((prev) => ({
          ...prev,
          [role]: [...(prev[role] ?? []), ...newQs],
        }))
        setUploadMsg(`${parsed.length} question${parsed.length !== 1 ? 's' : ''} imported`)
      }
    } catch {
      setUploadMsg('Failed to read file. Try a .txt file.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">Question Bank</h2>
            <p className="text-xs text-gray-500 mt-0.5">Questions grouped by set · {questions.length} total for this role</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* Role tabs */}
        <div className="flex gap-1 px-6 pt-4 pb-0 overflow-x-auto shrink-0">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => { setRole(r); setUploadMsg('') }}
              className={`whitespace-nowrap text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                role === r ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r}
              <span className={`ml-1.5 text-[10px] font-semibold ${role === r ? 'text-indigo-200' : 'text-gray-400'}`}>
                {(bank[r] ?? []).length}
              </span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

          {/* Add input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addQuestion()}
              placeholder="Type a new question and press Enter…"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder-gray-400"
            />
            <button
              onClick={addQuestion}
              disabled={!text.trim()}
              className="text-sm bg-indigo-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              Add
            </button>
          </div>

          {/* Upload zone */}
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
            className={`flex flex-col items-center justify-center gap-1.5 border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition-colors ${
              dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
            }`}
          >
            <input ref={fileRef} type="file" accept=".txt,.doc,.docx,.pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
            <span className="text-base">{uploading ? '⏳' : '📄'}</span>
            <p className="text-xs font-medium text-gray-600">
              {uploading ? 'Parsing file…' : 'Drop a .txt, .docx, or .pdf to bulk import'}
            </p>
            <p className="text-[10px] text-gray-400">or click to browse · one question per line</p>
            {uploadMsg && (
              <p className={`text-[10px] font-semibold mt-0.5 ${
                uploadMsg.startsWith('No') || uploadMsg.startsWith('Unsupported') || uploadMsg.startsWith('Failed')
                  ? 'text-red-500' : 'text-green-600'
              }`}>
                {uploadMsg}
              </p>
            )}
          </div>

          {/* Question sets */}
          {questions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No questions for this role yet.</p>
          ) : (
            <div className="space-y-3">
              {SET_ORDER.filter((key) => sets[key].length > 0).map((key) => (
                <QuestionSet
                  key={key}
                  setKey={key}
                  questions={sets[key]}
                  onRemove={removeQuestion}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="flex gap-3 text-[10px] text-gray-400">
            {SET_ORDER.filter((k) => sets[k].length > 0).map((k) => (
              <span key={k} className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${SET_META[k].dot}`} />
                {SET_META[k].label}: {sets[k].length}
              </span>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="text-sm text-gray-600 font-medium px-4 py-2 rounded-xl hover:bg-gray-50 border border-gray-200"
            >
              Discard
            </button>
            <button
              onClick={() => { onSave(bank); onClose() }}
              className="text-sm bg-indigo-600 text-white font-semibold px-5 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
