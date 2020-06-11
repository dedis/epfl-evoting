import { hexToUint8Array } from './utils'

export default {
  // Set this to true to put up a "system is unavailable" message.
  maintenance: false,
  tequila: {
    hostname: 'tequila.epfl.ch'
  },
  ldap: {
    hostname: 'ldap.epfl.ch'
  },
  explorerUrl: 'http://voting-web-prod.epfl.ch/',
  breadcrumbs: [
    { text: 'epfl', href: 'https://epfl.ch' },
    { text: 'epflAssembly', href: 'https://ae.epfl.ch' },
    { text: 'elections', href: 'https://ae.epfl.ch/elections' }
  ],
  masterID: hexToUint8Array('6b1cde648f427d1c4ea4d3e4a3df4270b82663ca9e514700597ee3ad64464f65'),
  // Put election IDs in here that you want the UI to not show. (They are still
  // visible in the skipchain!)
  electionsToHide: [ '3af224cb3980fe1ce5052122548811d2f3d268749ef100a59fd60a8e38fd45af' ],
  // Sometimes, candidates drop out of the race. This hides them from the ballot, but not from
  // the counting process (since they are on the election list and it cannot be changed during
  // and election). It is a list of integers, which are the SCIPERs of the candidates to hide.
  candidatesToHide: [ ]
}
