import { useContext } from 'react'
import { I18nContext, type I18nValue } from './i18n'

export function useI18n(): I18nValue {
  const value = useContext(I18nContext)
  if (value === null) {
    throw new Error('useI18n doit être utilisé sous <I18nProvider>')
  }
  return value
}
