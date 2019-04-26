import kyber from '@dedis/kyber-js'
import cothority from '@dedis/cothority'
import rosterTOML from './public.toml'
import { Uint8ArrayToScipers } from '@/utils'

self.addEventListener('message', event => {
  if (!event.data.request) {
    // Not ours, keep processing it.
    return false
  }    
  console.log('worker request', event)
  const { election, wss } = event.data

  const roster = cothority.Roster.fromTOML(rosterTOML, wss)
  const socket = new cothority.net.LeaderSocket(roster, 'evoting')
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

    const curve = new kyber.curve.edwards25519.Curve()

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
      reply: true,
      invalidCount,
      counts,
      votes,
      totalCount,
      invalidBallots
    })
  }).catch(e => {
    postMessage({
      reply: true,
      error: e.message
    })
    setTimeout(() => {
      throw e
    })
  })
})

const send = r => {
  self.postMessage({  'request': true,  ...r })
  // return the worker instance so that the caller can set event listeners
  return self
}

export default {
  send
}
