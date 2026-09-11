import { useTeacher } from '../context/TeacherContext'

export function FeedbackChrome() {
  const { toast, actionBusy } = useTeacher()
  return (
    <>
      <div className={`action-progress${actionBusy > 0 ? ' on' : ''}`} aria-hidden="true" />
      {toast ? (
        <div
          className={`toast ${toast.tone === 'bad' ? 'bad' : 'ok'}`}
          role="status"
          aria-live="polite"
          key={toast.id}
        >
          <span className="toast-dot" aria-hidden="true" />
          <span>{toast.message}</span>
        </div>
      ) : null}
    </>
  )
}
