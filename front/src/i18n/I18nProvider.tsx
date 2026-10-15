import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { I18nContext, initialLang, setCurrentLang, storeLang, type I18nValue } from './i18n'
import { translate, type Lang } from './messages'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  useEffect(() => {
    setCurrentLang(lang)
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    storeLang(next)
    setLangState(next)
  }, [])

  const value = useMemo<I18nValue>(
    () => ({ lang, setLang, t: (key, vars) => translate(lang, key, vars) }),
    [lang, setLang],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
