import Vue from 'vue'
import Vuex from 'vuex'
import VueI18n from 'vue-i18n'
import createPersistedState from 'vuex-persistedstate'
import rosterTOML from './public.toml'
import cothority from '@dedis/cothority'
import messages from './translations'
import { Uint8ArrayToHex } from './utils'

Vue.use(Vuex)
Vue.use(VueI18n)

const net = cothority.net
const roster = cothority.Roster.fromTOML(rosterTOML)

console.log('Creating new store')

const getLang = () => {
  const navLangs = window.navigator.languages || [window.navigator.userLanguage]
  const fallback = 'en'
  return navLangs.length > 0 ? navLangs[0].replace(/-.*/, '') : fallback
}

const i18n = new VueI18n({
  locale: getLang(),
  fallbackLocale: 'en',
  messages
})

const store = new Vuex.Store({
  state: {
    user: null,
    elections: null,
    isAdmin: false,
    socket: new net.LeaderSocket(roster, 'evoting'),
    snackbar: {
      text: '',
      timeout: 6000,
      model: false,
      color: ''
    },
    names: {},
    now: Math.floor(new Date().getTime() / 1000),
    scipersReadFromFile: 0
  },
  getters: {
    isAuthenticated: state => {
      return state.user !== null
    },
    hasElections: state => {
      return state.elections !== null
    },
    elections: state => {
      return state.elections
    },
    snackbar: state => {
      return state.snackbar
    }
  },
  mutations: {
    SET_ELECTIONS (state, elections) {
      if (elections === null) {
        state.electiosn = null
        return
      }
      // with new elections come new translations
      let { fallbackLocale } = i18n
      let messages = {}
      const langs = ['en', 'fr', 'de', 'it']
      for (let i = 0; i < langs.length; i++) {
        const lang = langs[i]
        messages[lang] = {}
        for (let j = 0; j < elections.length; j++) {
          const e = elections[j]
          const id = `election_${Uint8ArrayToHex(e.id)}`
          messages[lang][id] = {
            name: e.name[lang] ? e.name[lang] : e.name[fallbackLocale],
            subtitle: e.subtitle[lang] ? e.subtitle[lang] : e.subtitle[fallbackLocale]
          }
        }
        i18n.mergeLocaleMessage(lang, messages[lang])
      }
      state.elections = elections
    },
    SET_USER (state, data) {
      state.user = data
    },
    SET_ISADMIN (state, isAdmin) {
      state.isAdmin = isAdmin
    },
    SET_SNACKBAR (state, snackbar) {
      state.snackbar = snackbar
    },
    SET_NOW (state, now) {
      state.now = now
    }
  },
  plugins: [createPersistedState({ key: 'evoting', paths: ['user'] })]
})

export default store

export {
  store,
  i18n
}
