const cothority = require("@dedis/cothority");
const { net } = cothority;
const fs = require("fs");
const http = require("http");
const _ = require("lodash");

const rosterFile = fs.readFileSync("/etc/conode/roster.toml", "utf-8");

const rosterSocket = new net.LeaderSocket(cothority.Roster.fromTOML(rosterFile), "evoting");

http.get("http://auth-service.dedis.svc.k8s.iccluster.epfl.ch/auth/verify?sciper=294116",
// http.get("http://auth-service.default.svc.cluster.local/auth/verify?sciper=294116",
  response => {
    let data = ""
    response.setEncoding("utf-8");
    response.on("data", chunk => data += chunk);
    response.on("end", () => {
      let { signature, masterKey } = JSON.parse(data)
      console.log(signature, masterKey);
      signature = Uint8Array.from(signature);
      masterkey = Uint8Array.from(masterKey);
      // Create an election
      const now = Math.floor(Date.now() / 1000);
      const users = _.range(10001);
      const candidates = _.range(8);

      rosterSocket.send("Open", "OpenReply", {
        id: masterKey,
        election: {
          name: "Test Election",
          creator: 294116,
          users,
          candidates,
          maxChoices: 4,
          subtitle: "Test Election Subtitle",
          moreInfo: "https://dedis.epfl.ch",
          start: now,
          end: now + 86400,
          theme: "ic",
          footer: {
            text: "Test",
            contactTitle: "Jane Doe",
            contactPhone: "+41999999999",
            contactEmail: "jane.doe@epfl.ch"
          }
        },
        user: 294116,
        signature
      }).catch(error => {
        console.error(error);
      });
    });
  }
);
