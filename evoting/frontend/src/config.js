import { hexToUint8Array } from './utils'

export default {
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
  version: '1.1.0',
  masterID: hexToUint8Array('4c55d13264f30b9d607631cfe50f970ad81c9f1df9d064bc04e932224e1d99f6')
}
