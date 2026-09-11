import { useState } from 'react'
import { useI18n } from '../i18n/I18nContext'

export function Secret({ value }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  return (
    <span className="secret">
      <span>{open ? value : '••••••••'}</span>
      <button type="button" className="linkish" onClick={() => setOpen((v) => !v)}>
        {open ? t('hide') : t('view')}
      </button>
    </span>
  )
}
