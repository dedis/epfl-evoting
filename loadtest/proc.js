const _ = require("lodash");
const kyber = require("@dedis/kyber-js");
const http = require("http");
const debug = require("debug")("proc");
const curve = kyber.curve.newCurve("edwards25519");

// shuffles the array using Fisher Yates algorithm
// https://bost.ocks.org/mike/shuffle/
function shuffle(array) {
  let m = array.length,
    t,
    i;

  // While there remain elements to shuffle…
  while (m) {
    // Pick a remaining element…
    i = Math.floor(Math.random() * m--);

    // And swap it with the current element.
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}

function scipersToUint8Array(scipers) {
  return Uint8Array.from(
    [].concat(
      ...scipers.map(sciper => {
        const ret = [];
        let tmp = parseInt(sciper);
        for (let i = 0; i < 3; i++) {
          ret.push(tmp & 0xff);
          tmp = tmp >> 8;
        }
        return ret;
      })
    )
  );
}

// Sets the current user sciper randomly and gets the appropriate signature
// for it from the auth server
function getSignatureAndMasterKey(config, context, ee, next) {
  context.vars["sciper"] = Math.floor(
    Math.random() * parseInt(config.cothority.maxVoters)
  );
  const { authHost } = config;
  // send a request to target/auth/verify?sciper=$userid
  http.get(
    `${authHost}/auth/verify?sciper=${context.vars.sciper}`,
    response => {
      let data = "";
      response.setEncoding("utf-8");
      response.on("data", chunk => (data += chunk));
      response.on("end", () => {
        const { signature, masterKey } = JSON.parse(data);
        context.vars["signature"] = Uint8Array.from(signature);
        context.vars["master"] = Uint8Array.from(masterKey);
        next();
      });
    }
  );
}

function $getLastElectionId(context) {
  const { elections } = context.vars;
  return Uint8Array.from(elections[elections.length - 1].id);
}

function createRandomBallot(data, context, ee, next) {
  const arr = _.range(1, context.candidateCount + 1);
  const { elections } = context.vars;
  const { key } = elections[elections.length - 1];
  shuffle(arr);
  const ballot = arr.slice(0, context.maxCount);
  const embedMsg = scipersToUint8Array(ballot);
  const m = curve.point().embed(embedMsg);
  const r = curve.scalar().pick();
  // u = gr
  const u = curve.point().mul(r, null);
  // v = m + yr
  const y = curve.point();
  y.unmarshalBinary(key);
  const yr = curve.point().mul(r, y);
  const v = curve.point().add(m, yr);
  context.vars["alpha"] = u.marshalBinary();
  context.vars["beta"] = v.marshalBinary();
  return next();
}

module.exports = {
  createRandomBallot,
  getSignatureAndMasterKey,
  $getLastElectionId
};
