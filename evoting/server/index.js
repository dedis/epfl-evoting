const express = require('express')
const path = require('path')
const app = express()
const config = require('./config')
const util = require('./util')
const router = require('express-promise-router')()
const axios = require('axios')
const kyber = require('@dedis/kyber-js')
const hexToArrayBuffer = require('hex-to-array-buffer')
const LdapClient = require('promised-ldap')

const PORT = process.env.PORT || 3000
const isProd = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'

const tequilaRequest = (path, data) => {
  dataStr = util.dict2txt(data)
  const target = `https://${config.tequila.hostname}${path}`
  return axios.post(target, dataStr)
}

const getLdapData = (sciper) => {
  const client = new LdapClient({ url: `ldap://${config.ldap.hostname}` })

  const opts = {
    filter: '(&(objectClass=person)(uniqueIdentifier=' + sciper + '))',
    scope: 'sub',
    attributes: ['uniqueIdentifier', 'memberOf', 'dn', 'displayName']
  }

  const base = 'o=epfl, c=ch'

  return client.search(base, opts)
}

if (!isProd) {
  router.get('/', (req, res) => res.sendFile(path.join(__dirname, '/dist/index.html')))
  router.use('/', express.static(path.join(__dirname, '/dist/')))
}

const generateSignature = (sciper, masterID) => {
  sciper = typeof sciper === 'string' ? sciper : sciper.toString()
  const message = new Uint8Array(masterID.length + sciper.length)
  message.set(masterID)
  for (let i = 0; i < sciper.length; i++) {
    message[i + masterID.length] = sciper[i] - '0'
  }
  const suite = new kyber.curve.edwards25519.Curve()
  const key = suite.scalar()
  key.unmarshalBinary(new Uint8Array(hexToArrayBuffer(process.env.PRIVATE_KEY)))
  return kyber.sign.schnorr.sign(suite,
    key,
    message
  )
}

router.get('/auth/login', (req, res) => {
  let data = {
    client: 'evoting-auth',
    urlaccess: `${req.protocol}://${req.hostname}/auth/verify`,
    service: 'Evoting App',
    request: 'uniqueid',
    forcelogin: '1'
  }
  tequilaRequest('/cgi-bin/tequila/createrequest', data)
    .then(response => {
      const data = util.txt2dict(response.data.trim())
      res.redirect(307, `https://${config.tequila.hostname}/cgi-bin/tequila/auth?requestkey=${data.key}`)
    })
    .catch(e => {
      console.error(e.message)
    })
})

router.get('/auth/login/txt', (req, res) => {
  let data = {
    client: 'evoting-auth',
    urlaccess: `${req.protocol}://${req.hostname}/auth/verify/txt`,
    service: 'Evoting App',
    request: 'uniqueid',
    forcelogin: '1'
  }
  tequilaRequest('/cgi-bin/tequila/createrequest', data)
    .then(response => {
      const data = util.txt2dict(response.data.trim())
      res.redirect(307, `https://${config.tequila.hostname}/cgi-bin/tequila/auth?requestkey=${data.key}`)
    })
    .catch(e => {
      console.error(e.message)
    })
})

router.get('/auth/verify/txt', (req, res) => {
  payload = { key: req.query.key }

  return tequilaRequest('/cgi-bin/tequila/fetchattributes', payload)
    .then(response => {
      const data = util.txt2dict(response.data.trim())
      const sciper = data.uniqueid

      // Sign the data
      signature = generateSignature(sciper, config.masterID)

      // Prepare result
      user = {
        sciper,
        signature: util.Uint8ArrayToHex(signature),
      }

      // Send it
      res.send(JSON.stringify({ user }))
    })
    .catch(e => {
      console.error(e)
      res.end()
    })
})

function fmt(user, sig) {
  var u = JSON.stringify({ user })
  return `
<html>
<head>
<script>
  localStorage.setItem('evoting', '${u}');
  document.cookie = 'signature=${sig}; path=/';
  var redirectUrl = window.location.protocol + '//' + window.location.hostname;
  if (window.location.port) {
    redirectUrl += ':' + window.location.port;
  }
  window.location.replace(redirectUrl);
</script>
</head>
</html>
`
}

router.get('/auth/verify', (req, res) => {
  payload = { key: req.query.key }
  if (isTest) {
    const { sciper } = req.query
    signature = util.Uint8ArrayToHex(generateSignature(sciper, config.masterID))
    return getLdapData(sciper).then(ldapReq => {
      const ldapData = ldapReq.entries[0].object
      const groups = ldapData.memberOf
      const name = ldapData.displayName
      const sciper = ldapData.uniqueIdentifier
      const sections = []
      let sectionRegex = /ou=(\w+)/g
      let match
      while ((match = sectionRegex.exec(ldapData.dn), match)) {
        sections.push(match[1])
      }

      user = {
        name,
        sciper,
        groups,
        sections,
      }
      signature = util.Uint8ArrayToHex(generateSignature(sciper, config.masterID))
      res.send(fmt(user, signature))
    }).catch(e => {
      console.error(e)
      res.end()
    })
  }

  return tequilaRequest('/cgi-bin/tequila/fetchattributes', payload)
    .then(response => {
      const data = util.txt2dict(response.data.trim())
      var sciper = data.uniqueid
      const override = process.env.SCIPER_OVERRIDE
      if (override !== undefined) {
        console.log("warning: override sciper " + sciper + " to " + override)
        sciper = override
      }
      return getLdapData(sciper)
    })
    .then(ldapReq => {
      const ldapData = ldapReq.entries[0].object
      const groups = ldapData.memberOf
      const name = ldapData.displayName
      const sciper = ldapData.uniqueIdentifier
      const sections = []
      let sectionRegex = /ou=(\w+)/g
      let match
      while ((match = sectionRegex.exec(ldapData.dn), match)) {
        sections.push(match[1])
      }

      user = {
        name,
        sciper,
        groups,
        sections,
      }
      signature = util.Uint8ArrayToHex(generateSignature(sciper, config.masterID))
      res.send(fmt(user, signature))
    })
    .catch(e => {
      console.error(e)
      res.end()
    })
})

app.use(router)

// req.hostname is read from X-FORWARDED-HOST header in prod
if (isProd) {
  app.enable('trust proxy')
}

app.listen(PORT, () => console.log('Running the server on port ' + PORT))
