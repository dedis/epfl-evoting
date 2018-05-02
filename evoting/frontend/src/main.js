// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import 'babel-polyfill'
import Vue from 'vue'
import App from './App'
import router from './router'
import Vuetify from 'vuetify'
import VueMaterial from 'vue-material'
import 'vue-material/dist/vue-material.min.css'
import 'vuetify/dist/vuetify.min.css'
import { store, i18n } from './store'

Vue.use(VueMaterial)
Vue.use(Vuetify)

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  i18n,
  el: '#app',
  router,
  store,
  components: { App },
  template: '<App/>'
})
