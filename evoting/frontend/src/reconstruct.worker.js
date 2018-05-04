import 'babel-polyfill'
import kyber from '@dedis/kyber-js'
import cothority from '@dedis/cothority'
import rosterTOML from './public.toml'
import { Uint8ArrayToScipers } from '@/utils'

const curve = new kyber.curve.edwards25519.Curve()
const net = cothority.net

var path = 'evoting'

self.addEventListener('message', event => {
  const { election, wss } = event.data
  const roster = cothority.Roster.fromTOML(rosterTOML, wss)
  if (roster.identities[0].addr.startsWith('tls://demos.epfl.ch')) {
    console.log('activating demos.epfl.ch hack')
    path = 'conode/evoting'
  }
  const socket = new net.LeaderSocket(roster, path)
  socket.send('Reconstruct', 'ReconstructReply', {
    id: election.id
  }).then(data => {
    const { points } = data
    let invalidCount = 0
    const counts = {}
    const votes = []
    let totalCount = 0
    for (let i = 0; i < election.candidates.length; i++) {
      counts[election.candidates[i]] = 0
    }
    for (let i = 0; i < points.length; i++) {
      const point = curve.point()
      point.unmarshalBinary(points[i])
      const d = point.data()
      const scipers = Uint8ArrayToScipers(d)
      if (scipers.length !== d.length / 3) {
        console.log(`iteration ${i} invalid ballot: duplicate scipers`)
        invalidCount++
        continue
      }
      const { candidates } = election
      const filtered = scipers.filter(x => candidates.includes(x))
      if (filtered.length !== scipers.length) {
        invalidCount++
        console.log(`iteration ${i} invalid ballot: invalid candidate`)
        continue
      }
      for (let j = 0; j < scipers.length; j++) {
        const sciper = scipers[j]
        counts[sciper] += 1
      }
      votes.push(scipers.join(','))
      totalCount += scipers.length
    }
    postMessage({
      invalidCount,
      counts,
      votes,
      totalCount
    })
  }).catch(e => {
    postMessage({
      error: e.message
    })
    setTimeout(() => {
      throw e
    })
  })
})
