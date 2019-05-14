const protobuf = require("protobufjs");
const fs = require("fs");

const root = new protobuf.Root();
root.loadSync('./scripts/evoting.proto');
fs.writeFileSync("./src/models.json", JSON.stringify(root.toJSON()));

