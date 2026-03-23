import { FORWARD_MAP, STATUS_META } from '../../constants/statuses'
import { IcoForward, IcoCal, IcoVideo, IcoTrash } from '../common/Icons'

export function ActionButtons({ candidate, onForward, onSchedule, onVideo, onDelete }) {
  const nextStage = FORWARD_MAP[candidate.status]

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onForward(candidate)}
        disabled={!nextStage}
        title={nextStage ? `Move to ${STATUS_META[nextStage]?.label}` : 'No next stage'}
        className={`p-1.5 rounded-lg transition-colors ${
          nextStage
            ? 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
            : 'text-gray-200 cursor-not-allowed'
        }`}
      >
        <IcoForward />
      </button>

      <button
        onClick={() => onSchedule(candidate)}
        title="Schedule interview"
        className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
      >
        <IcoCal />
      </button>

      <button
        onClick={() => onVideo(candidate)}
        title="Copy video link"
        className="p-1.5 rounded-lg text-purple-400 hover:bg-purple-50 hover:text-purple-600 transition-colors"
      >
        <IcoVideo />
      </button>

      <button
        onClick={() => onDelete(candidate)}
        title="Archive candidate"
        className="p-1.5 rounded-lg text-red-300 hover:bg-red-50 hover:text-red-500 transition-colors"
      >
        <IcoTrash />
      </button>
    </div>
  )
}
