import kyber from '@dedis/kyber'
import rosterTOML from 'raw-loader!./public.toml'
import { Reconstruct, ReconstructReply } from '@/proto'
import { Roster } from '@dedis/cothority/network'
import { LeaderConnection } from '@dedis/cothority/network/websocket'

console.log('worker imported')

export const Uint8ArrayToScipers = bytes => {
  if (bytes.length % 3 !== 0) {
    // invalid ballot
    return []
  }
  const res = []
  for (let i = 0; i < bytes.length; i += 3) {
    const sciper = bytes[i] + bytes[i + 1] * (1 << 8) + bytes[i + 2] * (1 << 16)
    res.push(sciper)
  }
  // return unique scipers
  return Array.from(new Set(res))
}

const curve = new kyber.curve.edwards25519.Curve()
const roster = Roster.fromTOML(rosterTOML)
const socket = new LeaderConnection(roster, 'evoting')

self.addEventListener('message', event => {
  const { election } = event.data
  socket.send(new Reconstruct({ id: election.id }), ReconstructReply).then(data => {
    let additionalpoints = []
    const { points } = data
    if ('additionalpoints' in data) {
      additionalpoints = data.additionalpoints;
    }
    let invalidCount = 0
    let invalidBallots = []
    const counts = {}
    const votes = []
    let totalCount = 0
    for (let i = 0; i < election.candidates.length; i++) {
      counts[election.candidates[i]] = 0
    }
    for (let i = 0; i < points.length; i++) {

      // Start with concatenating all points we have for this vote
      var results = [points[i].subarray(8)]
      if (additionalpoints.length > 0) {
        additionalpoints[i].additionalpoints.forEach((p) => results.push(p.subarray(8)));
      }
      const prevInvalid = invalidCount;
      const scipers = results.map((pointBuf) => {
        const point = curve.point()
        point.unmarshalBinary(pointBuf)
        try {
          const d = point.data()
          const s = Uint8ArrayToScipers(d);
          if (s.length !== d.length / 3){
            invalidCount++
            const ballot = [i + 1, 'invalid ballot']
            invalidBallots.push(ballot)
          }
          return s;
        } catch (e) {
          invalidCount++
          const ballot = [i + 1, 'invalid ballot']
          invalidBallots.push(ballot)
          return []
        }
      }).flat();

      if (invalidCount > prevInvalid){
        continue;
      }

      // Then test if the votes are valid, and proceed if yes
      const { candidates, maxChoices } = election
      const filtered = scipers.filter(x => candidates.includes(x))
      if (filtered.length !== scipers.length) {
        invalidCount++
        scipers.unshift(i + 1)
        scipers.push('invalid candidate')
        invalidBallots.push(scipers)
        return
      }
      if (filtered.length > maxChoices) {
        invalidCount++
        scipers.unshift(i + 1)
        scipers.push('too many candidates')
        invalidBallots.push(scipers)
        return
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
