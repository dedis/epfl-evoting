const util = require('./util')
const { hexToUint8Array } = util

module.exports = {
  tequila: {
    hostname: 'tequila.epfl.ch'
  },
  ldap: {
    hostname: 'ldap.epfl.ch'
  },
  masterID: hexToUint8Array('4c55d13264f30b9d607631cfe50f970ad81c9f1df9d064bc04e932224e1d99f6')
}
