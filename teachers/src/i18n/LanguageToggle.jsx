import { useI18n } from './I18nContext'

export function LanguageToggle({ compact = false }) {
  const { lang, setLang, t } = useI18n()

  if (compact) {
    return (
      <div className="lang-seg" role="group" aria-label={t('language')}>
        <button
          type="button"
          className={lang === 'en' ? 'on' : ''}
          onClick={() => setLang('en')}
          aria-pressed={lang === 'en'}
        >
          EN
        </button>
        <button
          type="button"
          className={lang === 'ar' ? 'on' : ''}
          onClick={() => setLang('ar')}
          aria-pressed={lang === 'ar'}
        >
          ع
        </button>
      </div>
    )
  }

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
