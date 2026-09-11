import { useI18n } from './I18nContext'

export function LanguageToggle() {
  const { lang, setLang, t } = useI18n()
  return (
    <label className="lang-toggle">
      <span>{t('language')}</span>
      <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label={t('language')}>
        <option value="en">English</option>
        <option value="ar">العربية</option>
      </select>
    </label>
  )
}
