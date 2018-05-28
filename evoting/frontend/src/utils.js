export const scipersToUint8Array = scipers => {
  return Uint8Array.from([].concat(...scipers.map(sciper => {
    const ret = []
    let tmp = parseInt(sciper)
    for (let i = 0; i < 3; i++) {
      ret.push(tmp & 0xff)
      tmp = tmp >> 8
    }
    return ret
  })))
}

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

/**
 * This assumes that the encoded data was indeed a byte array initially
 */
export const b64ToUint8Array = data => {
  const b64String = data.replace('/-/g', '/')
  return Uint8Array.from(atob(b64String).split(',').map(x => parseInt(x)))
}

export const Uint8ArrayToHex = data => {
  return Array.from(data, b => {
    return ('0' + (b & 0xff).toString(16)).slice(-2)
  }).join('')
}

export const hexToUint8Array = hex => {
  const result = []
  let hexString = hex
  while (hexString.length >= 2) {
    result.push(parseInt(hexString.substring(0, 2), 16))
    hexString = hexString.substring(2, hexString.length)
  }
  return Uint8Array.from(result)
}

export const timestampToString = (timestamp, withTime) => {
  const d = new Date(timestamp * 1000)
  let date = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
  if (withTime) {
    date += ` ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }
  return date
}

function getCookie (name) {
  var nameEQ = name + '='
  var ca = document.cookie.split(';')
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i]
    while (c.charAt(0) === ' ') c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length)
    }
  }
  return null
}

export function getSig () {
  var sig = getCookie('signature')
  if (sig === null || sig === '') {
    return null
  }
  return hexToUint8Array(sig)
}
