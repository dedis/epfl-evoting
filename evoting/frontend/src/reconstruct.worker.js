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
    let invalidBallots = []
    const counts = {}
    const votes = []
    let totalCount = 0
    for (let i = 0; i < election.candidates.length; i++) {
      counts[election.candidates[i]] = 0
    }
    for (let i = 0; i < points.length; i++) {
      const point = curve.point()
	  // v3 point marshaling has the point type in the first 8 characters
      point.unmarshalBinary(points[i].subarray(8))
      var d
      try {
        d = point.data()
      } catch (e) {
        console.log(`iteration ${i} invalid ballot: ` + e.toString())
        invalidCount++
        const ballot = [ i + 1, 'ballot empty' ]
        invalidBallots.push(ballot)
        continue
      }
      const scipers = Uint8ArrayToScipers(d)
      if (scipers.length !== d.length / 3) {
        console.log(`iteration ${i} invalid ballot: duplicate candidates`)
        invalidCount++
        scipers.unshift(i + 1)
        scipers.push('duplicate candidate')
        invalidBallots.push(scipers)
        continue
      }
      const { candidates, maxChoices } = election
      const filtered = scipers.filter(x => candidates.includes(x))
      if (filtered.length !== scipers.length) {
        invalidCount++
        console.log(`iteration ${i} invalid ballot: invalid candidate`)
        scipers.unshift(i + 1)
        scipers.push('invalid candidate')
        invalidBallots.push(scipers)
        continue
      }
      if (filtered.length > maxChoices) {
        console.log(`iteration ${i} invalid ballot: too many candidates`)
        invalidCount++
        scipers.unshift(i + 1)
        scipers.push('too many candidates')
        invalidBallots.push(scipers)
        continue
      }
      let row = [i + 1]
      for (let j = 0; j < scipers.length; j++) {
        const sciper = scipers[j]
        counts[sciper] += 1
        let col = candidates.indexOf(sciper)
        if (col !== -1) {
          row[col + 1] = 1
        }
      }
      votes.push(row.join(','))
      totalCount += scipers.length
    }
    postMessage({
      invalidCount,
      counts,
      votes,
      totalCount,
      invalidBallots
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
