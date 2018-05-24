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
  breadcrumbs: [
    { text: 'epfl', href: 'https://epfl.ch' },
    { text: 'epflAssembly', href: 'https://ae.epfl.ch' },
    { text: 'elections2018', href: 'https://ae.epfl.ch/elections' }
  ],
  version: '1.2.0',
  masterID: hexToUint8Array('6b1cde648f427d1c4ea4d3e4a3df4270b82663ca9e514700597ee3ad64464f65')
}
