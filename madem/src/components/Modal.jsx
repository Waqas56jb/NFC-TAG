import { useI18n } from '../i18n/I18nContext'

export function Modal({
  title,
  hint,
  children,
  onClose,
  onSubmit,
  submitLabel,
  wide = false,
  hideSubmit = false,
}) {
  const { t } = useI18n()
  const submitText = submitLabel || t('save')
  return (
    <div className="modal-back" onClick={onClose} role="presentation">
      <form
        className={`modal${wide ? ' wide' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          if (!hideSubmit) onSubmit()
        }}
      >
        <h3>{title}</h3>
        {hint ? <p className="muted">{hint}</p> : null}
        {children}
        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onClose}>
            {hideSubmit ? t('close') : t('cancel')}
          </button>
          {hideSubmit ? null : (
            <button type="submit" className="primary">
              {submitText}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}
