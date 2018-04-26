// import from util.js does not work, don't know why.
const hexToUint8Array = hex => {
  const result = []
  let hexString = hex
  while (hexString.length >= 2) {
    result.push(parseInt(hexString.substring(0, 2), 16))
    hexString = hexString.substring(2, hexString.length)
  }
  return Uint8Array.from(result)
}

module.exports = {
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
  masterID: hexToUint8Array('8cfefc9f269a79c8d5a792ee327fc8ed1b01e51655f7a86770ca258ebd080ba4')
}
