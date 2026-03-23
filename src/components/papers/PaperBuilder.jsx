import { useState, useRef } from 'react'
import { IcoTrash } from '../common/Icons'
import { parseQuestionsFromFile } from '../../utils/parseQuestionFile'

const ROLES = [
  'Senior Frontend Engineer',
  'Product Manager',
  'Data Scientist',
  'DevOps Engineer',
]

const OPTION_LABELS = ['A', 'B', 'C', 'D']

function emptyMCQ() {
  return {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: 'mcq',
    text: '',
    options: ['', '', '', ''],
    correctOption: 0,
    marks: 1,
  }
}

function emptyOpen() {
  return {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: 'open',
    text: '',
    marks: 5,
  }
}

function MCQEditor({ q, idx, onChange, onDelete }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-indigo-400 w-6">Q{idx + 1}</span>
          <span className="text-[10px] font-semibold bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">MCQ</span>
        </div>
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <label className="text-[10px] text-gray-400">Marks</label>
          <input
            type="number"
            min={1}
            max={10}
            value={q.marks}
            onChange={(e) => onChange({ ...q, marks: Number(e.target.value) })}
            className="w-12 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <button onClick={onDelete} className="text-gray-300 hover:text-red-500 transition-colors"><IcoTrash /></button>
        </div>
      </div>

      {/* Question text */}
      <textarea
        rows={2}
        placeholder="Enter question…"
        value={q.text}
        onChange={(e) => onChange({ ...q, text: e.target.value })}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />

      {/* Options */}
      <div className="grid grid-cols-2 gap-2">
        {q.options.map((opt, i) => (
          <div key={i} className={`flex items-center gap-2 border rounded-xl px-3 py-2 transition-colors ${
            q.correctOption === i ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'
          }`}>
            <button
              onClick={() => onChange({ ...q, correctOption: i })}
              title="Mark as correct"
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                q.correctOption === i ? 'border-green-500 bg-green-500' : 'border-gray-300 hover:border-green-400'
              }`}
            >
              {q.correctOption === i && <span className="text-white text-[8px] font-bold">✓</span>}
            </button>
            <span className="text-[10px] font-bold text-gray-400 shrink-0">{OPTION_LABELS[i]}.</span>
            <input
              type="text"
              placeholder={`Option ${OPTION_LABELS[i]}`}
              value={opt}
              onChange={(e) => {
                const opts = [...q.options]
                opts[i] = e.target.value
                onChange({ ...q, options: opts })
              }}
              className="flex-1 text-xs text-gray-700 bg-transparent focus:outline-none placeholder-gray-300"
            />
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-400">Click the circle to mark the correct answer</p>
    </div>
  )
}

function OpenEditor({ q, idx, onChange, onDelete }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-indigo-400 w-6">Q{idx + 1}</span>
          <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Open</span>
        </div>
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <label className="text-[10px] text-gray-400">Marks</label>
          <input
            type="number"
            min={1}
            max={20}
            value={q.marks}
            onChange={(e) => onChange({ ...q, marks: Number(e.target.value) })}
            className="w-12 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
          <button onClick={onDelete} className="text-gray-300 hover:text-red-500 transition-colors"><IcoTrash /></button>
        </div>
      </div>
      <textarea
        rows={2}
        placeholder="Enter question…"
        value={q.text}
        onChange={(e) => onChange({ ...q, text: e.target.value })}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200"
      />
      <p className="text-[10px] text-gray-400">Open-ended — manually graded after submission</p>
    </div>
  )
}

export function PaperBuilder({ initial, onSave, onCancel }) {
  const [title,      setTitle]      = useState(initial?.title ?? '')
  const [role,       setRole]       = useState(initial?.role  ?? ROLES[0])
  const [questions,  setQuestions]  = useState(initial?.questions ?? [])
  const [error,      setError]      = useState('')
  const [uploading,  setUploading]  = useState(false)
  const [uploadMsg,  setUploadMsg]  = useState('')
  const [dragOver,   setDragOver]   = useState(false)
  const [importType, setImportType] = useState('open') // default import as open-ended
  const fileRef = useRef()

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
        const newQs = parsed.map((text) =>
          importType === 'mcq'
            ? { ...emptyMCQ(), text }
            : { ...emptyOpen(), text }
        )
        setQuestions((prev) => [...prev, ...newQs])
        setUploadMsg(`${parsed.length} question${parsed.length !== 1 ? 's' : ''} imported as ${importType === 'mcq' ? 'MCQ' : 'open-ended'}`)
      }
    } catch {
      setUploadMsg('Failed to read file. Try a .txt file.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const addQuestion = (type) => {
    setQuestions((prev) => [...prev, type === 'mcq' ? emptyMCQ() : emptyOpen()])
  }

  const updateQ = (id, updated) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? updated : q)))
  }

  const deleteQ = (id) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id))
  }

  const totalMarks = questions.reduce((s, q) => s + (q.marks ?? 1), 0)
  const mcqCount   = questions.filter((q) => q.type === 'mcq').length
  const openCount  = questions.filter((q) => q.type === 'open').length

  const handleSave = () => {
    if (!title.trim()) { setError('Please enter a paper title.'); return }
    if (questions.length === 0) { setError('Add at least one question.'); return }
    const invalid = questions.find((q) => !q.text.trim())
    if (invalid) { setError('All questions must have text.'); return }
    const invalidMCQ = questions.find((q) => q.type === 'mcq' && q.options.some((o) => !o.trim()))
    if (invalidMCQ) { setError('All MCQ options must be filled in.'); return }
    setError('')
    onSave({ title: title.trim(), role, questions })
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">{initial ? 'Edit' : 'New'} Question Paper</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {questions.length} question{questions.length !== 1 ? 's' : ''} · {totalMarks} mark{totalMarks !== 1 ? 's' : ''} total
            {mcqCount > 0 && <span> · {mcqCount} MCQ</span>}
            {openCount > 0 && <span> · {openCount} open-ended</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel} className="text-sm text-gray-600 font-medium px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSave} className="text-sm bg-indigo-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors">
            Save Paper
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-medium px-4 py-2.5 rounded-xl">
          {error}
        </div>
      )}

      {/* Meta */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex gap-4">
        <div className="flex-1">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Paper Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Frontend R1 Assessment"
            className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 placeholder-gray-300"
          />
        </div>
        <div className="w-56">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 bg-white"
          >
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Upload zone */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-500">Import from file</p>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
            {['open', 'mcq'].map((t) => (
              <button
                key={t}
                onClick={() => setImportType(t)}
                className={`text-[10px] font-semibold px-3 py-1 rounded-md transition-colors ${
                  importType === t
                    ? t === 'mcq' ? 'bg-violet-600 text-white' : 'bg-amber-500 text-white'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'mcq' ? 'As MCQ' : 'As Open-ended'}
              </button>
            ))}
          </div>
        </div>
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
          className={`flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-xl px-4 py-5 cursor-pointer transition-colors ${
            dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
          }`}
        >
          <input ref={fileRef} type="file" accept=".txt,.doc,.docx,.pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          <span className="text-xl">{uploading ? '⏳' : '📄'}</span>
          <p className="text-xs font-medium text-gray-600">
            {uploading ? 'Parsing file…' : 'Drop a .txt, .docx, or .pdf file here'}
          </p>
          <p className="text-[10px] text-gray-400">or click to browse · one question per line · numbered lists supported</p>
          {uploadMsg && (
            <p className={`text-[10px] font-semibold mt-0.5 ${
              uploadMsg.startsWith('No') || uploadMsg.startsWith('Unsup') || uploadMsg.startsWith('Failed')
                ? 'text-red-500' : 'text-green-600'
            }`}>
              {uploadMsg}
            </p>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-3">
        {questions.map((q, idx) =>
          q.type === 'mcq' ? (
            <MCQEditor key={q.id} q={q} idx={idx} onChange={(u) => updateQ(q.id, u)} onDelete={() => deleteQ(q.id)} />
          ) : (
            <OpenEditor key={q.id} q={q} idx={idx} onChange={(u) => updateQ(q.id, u)} onDelete={() => deleteQ(q.id)} />
          )
        )}
      </div>

      {/* Add question buttons */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={() => addQuestion('mcq')}
          className="flex items-center gap-2 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-4 py-2 rounded-xl hover:bg-violet-100 transition-colors"
        >
          + Add MCQ
        </button>
        <button
          onClick={() => addQuestion('open')}
          className="flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl hover:bg-amber-100 transition-colors"
        >
          + Add Open-ended
        </button>
      </div>
    </div>
  )
}
