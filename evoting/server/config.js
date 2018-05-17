const util = require('./util')
const { hexToUint8Array } = util

module.exports = {
  tequila: {
    hostname: 'tequila.epfl.ch'
  },
  ldap: {
    hostname: 'ldap.epfl.ch'
  },
  masterID: hexToUint8Array('6b1cde648f427d1c4ea4d3e4a3df4270b82663ca9e514700597ee3ad64464f65')
}
