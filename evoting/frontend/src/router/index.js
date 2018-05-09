import Vue from 'vue'
import Router from 'vue-router'
import store from '../store'
import Index from '@/components/Index'
import Logout from '@/components/Logout'
import NewElection from '@/components/NewElection'
import CastVote from '@/components/CastVote'
import ElectionResult from '@/components/ElectionResult'
import Unsupported from '@/components/Unsupported'
import config from '../config'

Vue.use(Router)

const router = new Router({
  routes: [
    {
      path: '/',
      name: 'Index',
      component: Index
    },
    {
      path: '/logout',
      name: 'Logout',
      component: Logout
    },
    {
      path: '/election/new',
      name: 'NewElection',
      component: NewElection
    },
    {
      path: '/election/:id/vote',
      name: 'CastVote',
      component: CastVote
    },
    {
      path: '/election/:id/results',
      name: 'ElectionResult',
      component: ElectionResult
    },
    {
      path: '/unsupported',
      name: 'Unsupported',
      component: Unsupported
    }
  ]
})

router.beforeEach((to, from, next) => {
  if (to.path === '/unsupported') {
    next()
    return
  }
  // IE <= 10 is not supported. https://stackoverflow.com/a/17076008
  if (document.getElementById('ie') || (Function('/*@cc_on return document.documentMode===10@*/')())) {
    next('/unsupported')
    return
  }
  if (to.path === '/logout') {
    next()
    return
  }
  if (!store.getters.isAuthenticated) {
    const authUrl = '/auth/login'
    // we do not use next('/auth/login') here because it redirects inside the spa
    window.location.replace(authUrl)
    next()
    return
  }
  if (store.getters.hasElections) {
    next()
    return
  }
  let { user, voted } = store.state
  voted = voted || {}
  const checkVoted = Object.keys(voted).length === 0
  const deviceMessage = {
    user: parseInt(user.sciper),
    master: config.masterID,
    stage: 0,
    signature: Uint8Array.from(user.signature),
    checkVoted
  }
  const sendingMessageName = 'GetElections'
  const expectedMessageName = 'GetElectionsReply'
  const { socket } = store.state
  socket
    .send(sendingMessageName, expectedMessageName, deviceMessage)
    .then(data => {
      store.commit('SET_ELECTIONS', data.elections)
      store.commit('SET_ISADMIN', data.isAdmin)
      if (checkVoted) {
        const votedElections = data.elections.filter(e => e.voted.length > 0)
        store.commit('SET_VOTED', votedElections)
      }
      next()
    })
    .catch(err => {
      // probably a stale signature
      console.error(err)
      next('/logout')
    })
})

export default router
