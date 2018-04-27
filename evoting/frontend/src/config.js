import { hexToUint8Array } from './utils'

export default {
  tequila: {
    hostname: 'tequila.epfl.ch'
  },
  ldap: {
    hostname: 'ldap.epfl.ch'
  },
  //  masterKey: new Uint8Array([84, 185, 18, 159, 67, 167, 151, 153, 235, 4, 231, 254, 81, 207, 164, 41, 214, 224, 204, 141, 237, 223, 155, 156, 93, 236, 68, 101, 97, 244, 138, 89]),
  // masterKey: new Uint8Array([227, 73, 58, 6, 35, 194, 131, 140, 217, 9, 73, 174, 73, 20, 8, 149, 176, 37, 165, 49, 219, 243, 99, 40, 37, 82, 84, 48, 242, 255, 192, 160]),
  // masterKey: new Uint8Array([166, 105, 214, 108, 220, 197, 199, 9, 163, 170, 208, 174, 219, 254, 191, 14, 237, 157, 67, 53, 223, 97, 43, 134, 249, 244, 130, 171, 220, 189, 106, 174]),
  // masterKey: new Uint8Array([252, 170, 181, 240, 158, 26, 101, 73, 208, 184, 238, 98, 197, 70, 188, 35, 174, 89, 195, 244, 71, 190, 187, 126, 17, 43, 22, 220, 34, 46, 125, 114]),
  // masterID: new Uint8Array([153, 109, 158, 91, 233, 128, 86, 97, 189, 44, 192, 200, 73, 43, 125, 221, 51, 88, 22, 105, 226, 240, 77, 143, 117, 252, 207, 72, 11, 215, 236, 184]),
  breadcrumbs: [
    { text: 'epfl', href: 'https://epfl.ch' },
    { text: 'epflAssembly', href: 'https://ae.epfl.ch' },
    { text: 'elections2018', href: 'https://ae.epfl.ch/elections' }
  ],
  masterID: hexToUint8Array('b920e6ace04b1bbfcfabb9e127bf8bab22ba77b19cc2f8c2ed7e6c182cc3b309')
}
