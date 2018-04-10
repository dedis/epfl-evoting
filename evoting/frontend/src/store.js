import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from 'vuex-persistedstate'
import rosterTOML from './public.toml'
import cothority from '@dedis/cothority'

Vue.use(Vuex)

const net = cothority.net
const roster = cothority.Roster.fromTOML(rosterTOML)

console.log('Creating new store')

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
