import Vue from 'vue'
import VueI18n from 'vue-i18n'

Vue.use(VueI18n)

function loadLocaleMessages() {
  const locales = require.context('./locales', true, /[A-Za-z0-9-_,\s]+\.json$/i)
  const messages = {}
  locales.keys().forEach(key => {
    const matched = key.match(/([A-Za-z0-9-_]+)\./i)
    if (matched && matched.length > 1) {
      const locale = matched[1]
      messages[locale] = locales(key)
    }
  })

  // Set the year in the messages
  let year = (new Date()).getFullYear()
  for (let lang in messages) {
    for (let msg in messages[lang]['message']) {
      messages[lang]['message'][msg] = messages[lang]['message'][msg].replace('YYYY', year)
    }
  }

  return messages
}

const getLang = () => {
  const navLangs = window.navigator.languages || [window.navigator.userLanguage]
  const fallback = 'en'
  return navLangs.length > 0 ? navLangs[0].replace(/-.*/, '') : fallback
}

export default new VueI18n({
  locale: getLang(),
  fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || 'en',
  messages: loadLocaleMessages()
})
