import { useState } from 'react'
import { useI18n } from '../i18n/I18nContext'

export function Modal({
  title,
  hint,
  children,
  onClose,
  onSubmit,
  submitLabel,
  busyLabel,
  wide = false,
  hideSubmit = false,
}) {
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)
  const submitText = busy ? busyLabel || t('working') : submitLabel || t('save')

  return (
    <div className="modal-back" onClick={busy ? undefined : onClose} role="presentation">
      <form
        className={`modal${wide ? ' wide' : ''}${busy ? ' is-busy' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onSubmit={async (e) => {
          e.preventDefault()
          if (hideSubmit || busy) return
          setBusy(true)
          try {
            await onSubmit?.()
          } finally {
            setBusy(false)
          }
        }}
      >
        <h3>{title}</h3>
        {hint ? <p className="muted">{hint}</p> : null}
        <fieldset disabled={busy} className="modal-fields">
          {children}
        </fieldset>
        <div className="modal-actions">
          <button type="button" className="ghost" onClick={onClose} disabled={busy}>
            {hideSubmit ? t('close') : t('cancel')}
          </button>
          {hideSubmit ? null : (
            <button type="submit" className={`primary${busy ? ' is-loading' : ''}`} disabled={busy}>
              {busy ? <span className="btn-spinner" aria-hidden="true" /> : null}
              <span>{submitText}</span>
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
