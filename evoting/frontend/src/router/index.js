import Vue from 'vue'
import Router from 'vue-router'
import store from '../store'
import Index from '../components/Index'
import Logout from '../components/Logout'
import NewElection from '../components/NewElection'
import CastVote from '../components/CastVote'
import ElectionResult from '../components/ElectionResult'
import Unsupported from '../components/Unsupported'
import { getSig } from '../utils'
import config from '../config'
import { GetElections, GetElectionsReply } from '@/proto'

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
  /* eslint-disable no-new-func */
  if (document.getElementById('ie') || (Function('/*@cc_on return document.documentMode===10@*/')())) {
    next('/unsupported')
    return
  }
  if (to.path === '/logout') {
    next()
    return
  }
  if (getSig() === null) {
    // we do not use next('/auth/login') here because it redirects inside the spa
    const authUrl = '/auth/login'
    window.location.replace(authUrl)
    next()
    return
  }

  // Workaround for Safari font rendering bug. It strikes when
  // downloading the Material Icons font is interrupted by the redirect to get
  // authenticated. The workaround is that after we are sure we won't be redirecting to
  // auth, then we add the CSS into the page header.
  const head = document.head
  const link = document.createElement('link')
  link.type = 'text/css'
  link.rel = 'stylesheet'
  link.href = 'static/material-icons.css'
  head.appendChild(link)

  if (store.getters.hasElections) {
    next()
    return
  }
  let { user, voted } = store.state
  voted = voted || {}
  const checkVoted = Object.keys(voted).length === 0
  var u
  try {
    u = parseInt(user.sciper)
  } catch (e) {
    u = 0
  }
  const ge = new GetElections({
    user: u,
    master: config.masterID,
    stage: 0,
    signature: getSig(),
    checkVoted
  })
  const { socket } = store.state
  socket
    .send(ge, GetElectionsReply)
    .then(data => {
      store.commit('SET_ELECTIONS', data.elections)
      store.commit('SET_ISADMIN', data.isadmin)
      if (checkVoted) {
        const votedElections = data.elections.filter(e => e.voted.length > 0)
        store.commit('SET_VOTED', votedElections)
      }
      next()
    })
    .catch(err => {
      // probably a stale signature
      console.error(err)
      // next('/logout')
    })
})

export default router
