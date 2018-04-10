// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import VueI18n from 'vue-i18n'
import App from './App'
import router from './router'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css'
import store from './store'
import messages from './translations'

Vue.use(Vuetify)
Vue.use(VueI18n)

Vue.config.productionTip = false

const getLang = () => {
  const navLangs = window.navigator.languages || [window.navigator.userLanguage]
  const fallback = 'en'
  return navLangs.length > 0 ? navLangs[0] : fallback
}

const i18n = new VueI18n({
  locale: getLang(),
  fallbackLocale: 'en',
  messages
})

/* eslint-disable no-new */
new Vue({
  i18n,
  el: '#app',
  router,
  store,
  components: { App },
  template: '<App/>'
})
