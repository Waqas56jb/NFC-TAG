import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { ar } from './ar'
import { en } from './en'
import { ERROR_KEYS } from './helpers'

const STORAGE_KEY = 'nfc-teacher-lang'
const dictionaries = { en, ar }
const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'ar' ? 'ar' : 'en'
    } catch {
      return 'en'
    }
  })

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    document.title = (dictionaries[lang] || en).docTitle
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      /* ignore */
    }
  }, [lang])

  const value = useMemo(() => {
    function t(key, vars) {
      let text = dictionaries[lang]?.[key] || dictionaries.en[key] || key
      if (vars) {
        Object.entries(vars).forEach(([name, val]) => {
          text = text.replaceAll(`{${name}}`, String(val ?? ''))
        })
      }
      return text
    }
    function tx(message) {
      const key = ERROR_KEYS[message]
      return key ? t(key) : message || ''
    }
    return {
      lang,
      setLang: setLangState,
      t,
      tx,
      dir: lang === 'ar' ? 'rtl' : 'ltr',
    }
  }, [lang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
