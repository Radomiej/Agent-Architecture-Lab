import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import HttpBackend from 'i18next-http-backend'

const savedLang = typeof localStorage !== 'undefined'
  ? (localStorage.getItem('acV32_lang') ?? 'pl')
  : 'pl'

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: savedLang,
    fallbackLng: 'pl',
    supportedLngs: ['pl', 'en'],
    ns: ['common', 'agents', 'presets'],
    defaultNS: 'common',
    backend: {
      loadPath: './locales/{{lng}}/{{ns}}.json',
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: true,
    },
  })

export default i18n
