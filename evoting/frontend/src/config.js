module.exports = {
  tequila: {
    hostname: 'tequila.epfl.ch'
  },
  ldap: {
    hostname: 'ldap.epfl.ch'
  },
  //  masterKey: new Uint8Array([84, 185, 18, 159, 67, 167, 151, 153, 235, 4, 231, 254, 81, 207, 164, 41, 214, 224, 204, 141, 237, 223, 155, 156, 93, 236, 68, 101, 97, 244, 138, 89]),
  // masterKey: new Uint8Array([227, 73, 58, 6, 35, 194, 131, 140, 217, 9, 73, 174, 73, 20, 8, 149, 176, 37, 165, 49, 219, 243, 99, 40, 37, 82, 84, 48, 242, 255, 192, 160]),
  masterKey: new Uint8Array([166, 105, 214, 108, 220, 197, 199, 9, 163, 170, 208, 174, 219, 254, 191, 14, 237, 157, 67, 53, 223, 97, 43, 134, 249, 244, 130, 171, 220, 189, 106, 174]),
  breadcrumbs: [
    { text: 'epfl', href: 'https://epfl.ch' },
    { text: 'epflAssembly', href: 'https://ae.epfl.ch' },
    { text: 'elections2018', href: 'https://ae.epfl.ch/elections' }
  ]
}
