import { IcoTrash } from '../common/Icons'

export function DeleteModal({ candidate, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
          <IcoTrash />
        </div>
        <h2 className="text-base font-bold text-gray-900 mb-1">Archive candidate?</h2>
        <p className="text-sm text-gray-500 mb-6">
          <span className="font-semibold text-gray-700">{candidate.name}</span> will be removed from the pipeline.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2 rounded-xl hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-500 text-white text-sm font-semibold py-2 rounded-xl hover:bg-red-600 transition-colors"
          >
            Archive
          </button>
        </div>
      </div>
    </div>
  )
}
